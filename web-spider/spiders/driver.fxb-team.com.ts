spider = (function () {

let spider = new Spider({
    categories: [],
    questions: []
});

function main () {

    let host = 'https://driver.fxb-team.com';
    let subLists = [...document.querySelectorAll<HTMLDivElement>('.sub-list')];
    let cates: {
        kemu: string;
        licence: string;
        type: string;
        typelink: string;
        subject: string;
        typeid: string;
    }[] = [];

    subLists.forEach((el) => {
        let title = el.querySelector<HTMLDivElement>('.sub-tit .tit').innerText.trim();
        let licence = el.querySelector<HTMLDivElement>('.sub-tit .xuan').innerText.trim();

        let cateLinks = [...el.querySelectorAll<HTMLAnchorElement>('.subs a')];

        cateLinks.forEach((a) => {
            let type = a.innerText.trim();
            let typelink = a.href;

            if (/顺序|精选|分类/.test(type)) {
                let url = new URL(typelink);
                cates.push({
                    kemu: title,
                    licence: licence,
                    type: type,
                    typelink: typelink,
                    subject: url.searchParams.get('subject') || '1',
                    typeid: url.searchParams.get('id') || ''
                });
            }
        });
    });

    cates.forEach((cate) => {
        spider.addTask(cate.typelink, {}, {
            catelist: true,
            cate: cate
        });
    });

    spider.addRule({
        match: function (task) {
            return task.data.catelist;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let lists = [...doc.querySelectorAll<HTMLDivElement>('.list-box')];

            lists.forEach((el) => {
                let name = el.querySelector<HTMLDivElement>('.name').innerText.trim();
                let link = el.querySelector<HTMLAnchorElement>('.voice-box a').href;
                let id = new URL(link).searchParams.get('id');

                let category = {
                    id: id,
                    name: name,
                    link: link,
                    ...task.data.cate
                };
                console.log('category', category);

                spider.state.categories.push(category);

                spider.addTask(`https://driver.fxb-team.com/api/answer?id=${id}&rand=0`, {}, {
                    category: category,
                    questions: true
                });
            });
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.questions;
        },
        dataType: 'text',
        parse: function (spider, text, task) {

            let response = parseJSON(text);

            if (response.code !== 0) {
                throw new Error('question api result error:' + text);
            }

            response.data.forEach((q) => {
                q.category_id = task.data.category.id
            });

            spider.state.questions = spider.state.questions.concat(response.data);
        }
    });

    spider.run();
}

function filename (url) {
    return url.split('/').pop();
}

function sourcePath (url, withHost = false) {

    if (url.slice(0,4) === 'http') {

        if (withHost) {
            return url;
        }

        let parts = url.split('/');

        return '/' + parts.slice(3).join('/');
    }
    else {
        if (withHost) {
            console.log('no host', url);
            return 'https://sth5.liehuu.com' + url;
        }

        return url;
    }
}

interface TCategory {
    kemu: string;
    licence: string;
    type: string;
    typelink: string;
    subject: string;
    typeid: string;
    id: string;
    name: string;
    link: string;
}

type TOptionKey = 'A'|'B'|'C'|'D';

interface TQuestion {
    answer: string[];
    answer_rate: string;
    broadcast_voice: string;
    explain: string;
    id: number;
    options: {[key: string]: {
        key: TOptionKey;
        value: string;
        class: string;
    }};
    relation_id: number;
    skill_thumb: string;
    skill_voice: string;
    thumb: string;
    title: string;
    type: number;
    type_name: string;
}

function publicPath (path, prefix = '/public/sth5') {

    return path ? prefix + path : '';
}

function generateSql (categories, questions: TQuestion[], questionTableName = 'ims_quickpass_drivingtest_questions', categoryTableName = 'ims_quickpass_drivingtest_category') {

    let cateid = 120;
    let categorySql = 'truncate table ' + categoryTableName + ';\n';
    let cateMap = {};

    categorySql += 'insert into ' + categoryTableName + ' (`id`, `model`, `subject`, `title`, `icon`, `color`, `sort`) values \n';

    categorySql += categories.map((category) => {

        let cid = cateid++;

        cateMap[1000 + category.id] = cid + 1000;

        return '(' + [
            category.id, // cid
            JSON.stringify(category.model),
            JSON.stringify(category.subject),
            JSON.stringify(category.title),
            JSON.stringify(category.icon),
            JSON.stringify(category.color),
            category.sort
        ].join(',') + ')';
    }).join(',\n') + ';\n';

    let questionSql = 'truncate table ' + questionTableName + ';\n';
    let questionSqlHead = 'insert into ' + questionTableName + ' (' +
        [
            '`id`',
            '`id_ydt`',
            '`number`',
            '`model`',
            '`subject`',
            '`answer`',
            '`column_id`',
            '`column_id2`',
            '`column_id3`',
            '`column_id4`',
            '`issue`',
            '`opts`',
            '`explain_jq`',
            '`explain_js`',
            '`explain_mp3`',
            '`explain_gif`',
            '`image`',
            '`image_ydt`',
            '`keywordcolor`',
            '`titlekeyword`',
            '`answerkeyword`',
            '`skillkeyword`',
            '`type`',
            '`free`',
            '`highlight`'
        ] + ') values \n';

    let explainGif: string[] = [];
    let explainMp3: string[] = [];
    let image: string[] = [];
    let imageYdt: string[] = [];

    questions = questions.sort((a, b) => a.id - b.id);

    questions.forEach((question, index) => {

        question.explainGif && explainGif.push(sourcePath(question.explainGif, true));
        question.explainMp3 && explainMp3.push(sourcePath(question.explainMp3, true));
        question.image && image.push(sourcePath(question.image, true));
        question.imageYdt && imageYdt.push(sourcePath(question.imageYdt, true));

        let values = '(' + [
            question.id,
            question.idYdt,
            question.number,
            JSON.stringify(question.model),
            JSON.stringify(question.subject),
            JSON.stringify(question.answer),
            question.columnId || 0,
            question.columnId2 || 0,
            question.columnId3 || 0,
            question.columnId4 || 0,
            JSON.stringify(question.issue),
            JSON.stringify(question.opts),
            JSON.stringify(question.explainJq),
            JSON.stringify(question.explainJs),
            JSON.stringify(publicPath(sourcePath(question.explainMp3, false))),
            JSON.stringify(publicPath(sourcePath(question.explainGif, false))),
            JSON.stringify(publicPath(sourcePath(question.image, false))),
            JSON.stringify(publicPath(sourcePath(question.imageYdt, false))),
            JSON.stringify(question.keywordcolor),
            JSON.stringify(question.titlekeyword),
            JSON.stringify(question.answerkeyword),
            JSON.stringify(question.skillkeyword),
            question.type,
            0, // free
            JSON.stringify(unique([
                ...question.titlekeyword.split('-'),
                ...question.answerkeyword.split('-'),
                ...question.skillkeyword.split('-')
            ].filter(e => !!e)).join('-')) // highlight
        ].join(',') + ')';

        if (index % 100 === 0) {
            questionSql += (index !== 0 ? ';\n' : '') + questionSqlHead + values;
        }
        else {
            questionSql += ',\n' + values;
        }
    });

    questionSql += ';\n';

    let images = unique([...image, ...explainGif, ...imageYdt]).sort();

    explainMp3 = unique(explainMp3).sort();

    return {
        categorySql,
        questionSql,
        audios: explainMp3.join('\n'),
        images: images.join('\n')
    };
}

function downloadSqls (sqls, id = '1') {
    Object.keys(sqls).forEach((key, index) => {
        setTimeout(() => download(sqls[key], 'sth5-' + id + '-' + key + '.sql'), 1000 * index);
    });
}

async function sql () {
    let categories = await fetch('./data/sth5-cates.json').then(r => r.json());
    let questions = await fetch('./data/sth5-questions.json').then(r => r.json());

    let sqls = generateSql(categories, questions);

    return sqls;
}

async function genFree () {

    let questions = await fetch('./data/sth5-free-questions.json').then(r => r.json());

    let sqls = generateSql([], questions, 'ims_quickpass_drivingtest_freequestions');

    downloadSqls(sqls, 'free');
}

function gen () {
    sql().then((sqls) => {
        window.sqls = sqls;
        downloadSqls(sqls);
    });
}

// 新版题库
function generateTrainingSql (categories, questions: TQuestion[], questionTableName = 'eb_training_question', categoryTableName = 'eb_training_category') {

    let cateid = 1;
    let categorySql = 'truncate table ' + categoryTableName + ';\n';
    let cateMap = {};

    categorySql += 'insert into ' + categoryTableName + ' (`id`, `pids`, `model`, `subject`, `title`, `image`, `color`, `sort`) values \n';

    categorySql += categories.map((category) => {

        let cid = cateid++;
        let parts = category.subject.split('_');
        let subject = parts[0];
        let pids = [',', (parts[1] || 1), ','].join('');

        cateMap[category.id] = cid;

        return '(' + [
            category.id, // cid
            JSON.stringify(pids),
            JSON.stringify(category.model),
            JSON.stringify(subject),
            JSON.stringify(category.title),
            JSON.stringify(category.icon),
            JSON.stringify(category.color),
            category.sort
        ].join(',') + ')';
    }).join(',\n') + ';\n';

    let relationId = 0;
    let questionCateSql = 'truncate table eb_training_question_cates;\n';
    let questionCateSqlHead = 'insert into eb_training_question_cates (' + [
        '`id`',
        '`cid`',
        '`qid`'
    ] + ') values \n';

    let questionSql = 'truncate table ' + questionTableName + ';\n';
    let questionSqlHead = 'insert into ' + questionTableName + ' (' +
        [
            '`id`',
            '`id_ydt`',
            '`number`',
            // '`model`',
            // '`subject`',
            '`answer`',
            '`title`',
            '`opts`',
            '`explain_jq`',
            '`explain_js`',
            '`explain_mp3`',
            '`explain_gif`',
            '`image`',
            '`image_ydt`',
            '`keywordcolor`',
            '`titlekeyword`',
            '`answerkeyword`',
            '`skillkeyword`',
            '`type`',
            '`free`',
            '`highlight`'
        ] + ') values \n';

    let explainGif: string[] = [];
    let explainMp3: string[] = [];
    let image: string[] = [];
    let imageYdt: string[] = [];

    questions = questions.sort((a, b) => a.id - b.id);

    questions.forEach((question, index) => {

        question.explainGif && explainGif.push(sourcePath(question.explainGif, true));
        question.explainMp3 && explainMp3.push(sourcePath(question.explainMp3, true));
        question.image && image.push(sourcePath(question.image, true));
        question.imageYdt && imageYdt.push(sourcePath(question.imageYdt, true));

        let values = '(' + [
            question.id,
            question.idYdt,
            question.number,
            // JSON.stringify(question.model),
            // JSON.stringify(question.subject),
            JSON.stringify(question.answer),
            JSON.stringify(question.issue),
            JSON.stringify(question.opts),
            JSON.stringify(question.explainJq),
            JSON.stringify(question.explainJs),
            JSON.stringify(publicPath(sourcePath(question.explainMp3, false))),
            JSON.stringify(publicPath(sourcePath(question.explainGif, false))),
            JSON.stringify(publicPath(sourcePath(question.image, false))),
            JSON.stringify(publicPath(sourcePath(question.imageYdt, false))),
            JSON.stringify(question.keywordcolor),
            JSON.stringify(question.titlekeyword),
            JSON.stringify(question.answerkeyword),
            JSON.stringify(question.skillkeyword),
            question.type,
            0, // free
            JSON.stringify(unique([
                ...question.titlekeyword.split('-'),
                ...question.answerkeyword.split('-'),
                ...question.skillkeyword.split('-')
            ].filter(e => !!e)).join('-')) // highlight
        ].join(',') + ')';

        if (index % 100 === 0) {
            questionSql += (index !== 0 ? ';\n' : '') + questionSqlHead + values;
        }
        else {
            questionSql += ',\n' + values;
        }

        ['columnId', 'columnId2', 'columnId3', 'columnId4'].forEach((key) => {
            if (question[key]) {
                let index = relationId;

                relationId++;

                let relationValues = '(' + [
                    relationId,
                    question[key] - 1000,
                    question.id
                ].join(',') + ')';

                if (index % 100 === 0) {
                    questionCateSql += (index !== 0 ? ';\n' : '') + questionCateSqlHead + relationValues;
                }
                else {
                    questionCateSql += ',\n' + relationValues;
                }
            }
        });
    });

    questionSql += ';\n';
    questionCateSql += ';\n';

    let images = unique([...image, ...explainGif, ...imageYdt]).sort();

    explainMp3 = unique(explainMp3).sort();

    return {
        categorySql,
        questionSql,
        questionCateSql,
        audios: explainMp3.join('\n'),
        images: images.join('\n')
    };
}

async function newsql () {
    let categories = await fetch('./data/sth5-cates.json').then(r => r.json());
    let questions = await fetch('./data/sth5-questions.json').then(r => r.json());

    let sqls = generateTrainingSql(categories, questions);

    return sqls;
}

function newgen () {
    newsql().then((sqls) => {
        window.sqls = sqls;
        downloadSqls(sqls, 'new');
    });
}

interface TTargetCategory {
    id: string;
    model: 'cart' | 'mtc';
    subject: string;
    title: string;
}

interface TCategoryMap {
    [key: string]: string;
}

function mapCategories (categories: TCategory[]) {

    let map: TCategoryMap = {};

    categories.forEach((cate) => {

    });
}

return spider;

}());
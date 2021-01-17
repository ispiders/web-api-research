spider = new Spider({
    categories: [],
    questions: [],
    cateMap: {},
    questionMap: {}
});

function main () {

    let host = 'https://app.czjkxitong.cn';
    let models = ['cart', 'bus', 'truck', 'mtc'];
    let subjects = ['k1', 'k4'];

    models.forEach((model) => {
        subjects.forEach((km) => {

            ['', 2, 3, 4].forEach((type) => {
                let subject = type ? km + '_' + type : km;

                spider.addTask(
                    `${host}/skill/getColumn?model=${model}&subject=${subject}`,
                    {},
                    {
                        category: true,
                        model: model,
                        subject: subject
                    }
                );
            });
        });
    });

    spider.addRule({
        match: function (task) {
            return task.data.category;
        },
        dataType: 'text',
        parse: function (spider, text, task) {

            let response = parseJSON(text);

            spider.state.categories = spider.state.categories.concat(response.data);

            response.data.forEach((cate) => {

                if (!spider.state.cateMap[cate.id]) {
                    spider.state.cateMap[cate.id] = cate;

                    spider.addTask(
                        `${host}/question/getQuestions?model=${task.data.model}&columnid=${cate.id}&subject=${task.data.subject}`,
                        {},
                        {
                            questions: true,
                            model: task.data.model,
                            subject: task.data.subject
                        }
                    );
                }
                else {
                    console.log('cate', spider.state.cateMap[cate.id]);
                    console.log('cate1', task.data.model, task.data.subject, cate);
                }
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

            spider.state.questions = spider.state.questions.concat(response.data);

            response.data.forEach((q) => {
                spider.state.questionMap[q.id] = q;
            });
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
    id: number;
    sort: number;
    color: string;
    icon: string;
    model: string;
    subject: string;
    title: string;
}

interface TQuestion {
    id: number;
    columnId: number;
    columnId2: number;
    columnId3: number;
    columnId4: number;
    idYdt: number;
    number: number;
    type: number;
    answer: string;
    answerkeyword: string;
    explainGif: string;
    explainJq: string;
    explainJs: string;
    explainMp3: string;
    image: string;
    imageYdt: string;
    issue: string;
    keywordcolor: string;
    model: string;
    opts: string;
    skillkeyword: string;
    subject: string;
    titlekeyword: string;
}

function generateSql (categories, questions: TQuestion[]) {

    let cateid = 120;
    let categorySql = 'truncate table ims_quickpass_drivingtest_category;\n';
    let cateMap = {};

    categorySql += 'insert into ims_quickpass_drivingtest_category (`id`, `model`, `subject`, `title`, `icon`, `color`, `sort`) values \n';

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

    let questionSql = 'truncate table ims_quickpass_drivingtest_questions;\n';
    let questionSqlHead = 'insert into ims_quickpass_drivingtest_questions (' +
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
            JSON.stringify(sourcePath(question.explainMp3, false)),
            JSON.stringify(sourcePath(question.explainGif, false)),
            JSON.stringify(sourcePath(question.image, false)),
            JSON.stringify(sourcePath(question.imageYdt, false)),
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

function downloadSqls (sqls) {
    Object.keys(sqls).forEach((key, index) => {
        setTimeout(() => download(sqls[key], 'sth5-1-' + key + '.sql'), 1000 * index);
    });
}

async function sql () {
    let categories = await fetch('./data/sth5-cates.json').then(r => r.json());
    let questions = await fetch('./data/sth5-questions.json').then(r => r.json());

    let sqls = generateSql(categories, questions);

    return sqls;
}

function gen () {
    sql().then((sqls) => {
        window.sqls = sqls;
        downloadSqls(sqls);
    });
}
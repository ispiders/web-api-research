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

        let subbox = [...el.querySelectorAll<HTMLDivElement>('.sub-box')];

        subbox.forEach(sub => {
            let title = sub.previousElementSibling.querySelector('.tit').innerText.trim();
            let licence = sub.previousElementSibling.querySelector('.xuan').innerText.trim();
            let cateLinks = [...sub.querySelectorAll<HTMLAnchorElement>('.subs a')];

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

main();

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
    category_id: string;
}

function options (opts) {
    return Object.keys(opts).sort().map((key) => {
        return opts[key].value.trim();
    });
}

function answers (options, answer) {
    return answer.map((key) => {
        return options['ABCD'.indexOf(key)];
    });
}

function cateId (model: string, subject: string, id: string) {
    return [model, subject, id].join('-');
}

function licenceModel (licence) {
    return {
        '(C1C2C3)': 'cart',
        '(A1A3B1)': 'bus',
        '(A2B2)': 'truck',
        '(DEF)': 'mtc'
    }[licence];
}

function cateSubject (catetype: number, subject: number) {
    if (catetype === 1) {
        return 'k' + subject;
    }
    else if (catetype === 2 || catetype === 3) {
        return 'k' + subject + '_' + catetype;
    }
    else {
        console.error('catetype error:', catetype);
    }
}

function cateType (typeText) {
    return {
        '顺序练习': 1,
        '精选必考题': 2,
        '分类练习': 3
    }[typeText];
}

function replaceMark (text: string) {

    if (!text) {
        return text;
    }

    return text.replace(/<([a-z]+)>(.*?)<\/\1>/ig, (match, match1, match2) => {
        console.log('replaceMark', match2);
        return '{' + match2 + '}';
    });
}

function attchementPath (uri, prefix = '') {

    if (uri) {
        let url = new URL(uri);
        let path = url.pathname + url.search;

        return prefix ? prefix + path : path;
    }

    return uri;
}

let typeMap = {
    1: 1, // 判断
    0: 2, // 单选
    2: 3 // 多选
};

let subjectMap = {
    1: 'k1',
    2: 'k4'
};

function prepareData (categories: TCategory[], qs: TQuestion[]) {

    let cateIdMap = {};
    let cateUid = 1000;
    let cates: any[] = [];

    let questionMap = {};
    let questionUid = 100000;
    let questions: any[] = [];

    // let questionCateRelationUid = 100000;
    // let questionCateRelations: any[] = [];

    let cateMap = {};

    categories.forEach((cate) => {
        let model = licenceModel(cate.licence);
        let type = cateType(cate.type);
        let subject = cateSubject(type, Number(cate.subject));
        let cid = Number(cate.id);

        cateMap[cid] = cate;

        cates.push({
            id: cid,
            title: cate.name.trim().replace(/^\d+\.(?:科目(?:一|四))?|\s*\(\d+题\)$/g, ''),
            model: model,
            subject: subject
        });
    });

    let filesMap = {};

    qs.forEach((q) => {
        let type = typeMap[q.type];
        let opts = options(q.options);
        let answer = answers(opts, q.answer);
        let qid = questionUid++;
        let cid = Number(q.category_id);
        let cate: TCategory = cateMap[cid];
        let catetype = cateType(cate.type);

        let question = questionMap[q.id];

        if (question) {
            // if (catetype === 1) {
            //     question.column_id = cid;
            // }
            // else if ([2, 3].indexOf(catetype) !== -1) {
            //     question['column_id' + catetype] = cid;
            // }

            throw new Error('目标数据库不支持一道题对应多个分类，只能重复题目来存在不同分类下');
        }
        else {
            question = {
                id: qid,
                type: type,
                issue: q.title.trim(),
                answer: answer.join('-'),
                opts: opts.join('-'),
                image: attchementPath(q.thumb, '/attachment/fxb'),
                explain_gif: attchementPath(q.skill_thumb, '/attachment/fxb'),
                explain_js: q.explain.trim(),
                explain_jq: '',
                explain_mp3: attchementPath(q.skill_voice, '/attachment/fxb'),
                question_mp3: attchementPath(q.broadcast_voice, '/attachment/fxb'),
                model: licenceModel(cate.licence),
                subject: 'k' + cate.subject,
                column_id: 0,
                column_id2: 0,
                column_id3: 0,
            };

            if (catetype === 1) {
                question.column_id = cid;
            }
            else if ([2, 3].indexOf(catetype) !== -1) {
                question['column_id' + catetype] = cid;
            }

            questions.push(question);

            // 目标数据库不支持一道题对应多个分类，只能重复题目来存在不同分类下
            // questionMap[q.id] = question;

            if (q.thumb) {
                filesMap[q.thumb] = 1;
            }

            if (q.skill_thumb) {
                filesMap[q.skill_thumb] = 1;
            }

            if (q.skill_voice) {
                filesMap[q.skill_voice] = 1;
            }

            if (q.broadcast_voice) {
                filesMap[q.broadcast_voice] = 1;
            }
        }
    });

    return {
        cates,
        questions,
        files: Object.keys(filesMap)
    };
}

function generateSql (cates, qs) {

    let data = prepareData(cates, qs);

    return {
        cateSql: generateInsertSql('ims_quickpass_drivingtest_category', data.cates, {maxRow: 100}),
        questionSql: generateInsertSql('ims_quickpass_drivingtest_questions', data.questions, {maxRow: 100}),
        // questionCateSql: generateInsertSql('eb_training_question_cates', data.questionCateRelations, {maxRow: 100}),
        files: data.files.join('\n')
    };
}

function downloadSql (cates, qs) {
    let sqls = generateSql(cates, qs);

    window.downloadData = sqls;

    download(sqls.cateSql, 'fxb-cates.sql');
    download(sqls.questionSql, 'fxb-questions.sql');
    // download(sqls.questionCateSql, 'fxb-question-cates.sql');
    // download(sqls.files, 'fxb-files.csv');

    return sqls;
}

function loadAndRun () {
    return Promise.all([
        fetch('/data/driver.fxb-team.com-categories.json').then(r => r.json()),
        fetch('/data/driver.fxb-team.com-questions.json').then(r => r.json()),
        fetch('/data/fxb-free-questions-1.json').then(r => r.json()),
        fetch('/data/fxb-free-questions-4.json').then(r => r.json()),
    ]).then(([cates, qs, free1, free4]) => {
        return downloadSql(cates, qs);
    }).then((data) => {
        window.data = data;
    });
}

function downloadFreeSql (free1, free4) {

    let uniQid = 1;

    let qs1 = free1.map((q) => {
        let qid = uniQid++;
        let type = typeMap[q.type];
        let opts = options(q.options);
        let answer = answers(opts, q.answer);

        let question = {
            id: qid,
            type: type,
            issue: q.title.trim(),
            answer: answer.join('-'),
            opts: opts.join('-'),
            image: attchementPath(q.thumb, '/attachment/fxb'),
            explain_gif: attchementPath(q.skill_thumb, '/attachment/fxb'),
            explain_js: q.explain.trim(),
            explain_jq: '',
            explain_mp3: attchementPath(q.skill_voice, '/attachment/fxb'),
            question_mp3: attchementPath(q.broadcast_voice, '/attachment/fxb'),
            model: 'cart',
            subject: 'k1'
        };

        return question;
    });

    let qs4= free4.map((q) => {
        let qid = uniQid++;
        let type = typeMap[q.type];
        let opts = options(q.options);
        let answer = answers(opts, q.answer);

        let question = {
            id: qid,
            type: type,
            issue: q.title.trim(),
            answer: answer.join('-'),
            opts: opts.join('-'),
            image: attchementPath(q.thumb, '/attachment/fxb'),
            explain_gif: attchementPath(q.skill_thumb, '/attachment/fxb'),
            explain_js: q.explain.trim(),
            explain_jq: '',
            explain_mp3: attchementPath(q.skill_voice, '/attachment/fxb'),
            question_mp3: attchementPath(q.broadcast_voice, '/attachment/fxb'),
            model: 'cart',
            subject: 'k4'
        };

        return question;
    });

    let sql = generateInsertSql('ims_quickpass_drivingtest_freequestions', [...qs1, ...qs4], {maxRow: 100});

    download(sql, 'fxb-free-questions.sql');
}

function loadAndRunFree () {
    return Promise.all([
        fetch('/data/fxb-free-questions-1.json').then(r => r.json()),
        fetch('/data/fxb-free-questions-4.json').then(r => r.json()),
    ]).then(([free1, free4]) => {
        return downloadFreeSql(free1, free4);
    }).then((data) => {
        window.data = data;
    });
}

window.loadAndRun = loadAndRun;

return spider;

}());


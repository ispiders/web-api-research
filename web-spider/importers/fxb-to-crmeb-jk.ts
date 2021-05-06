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

function options (opts, answers) {
    return Object.keys(opts).sort().map((key) => {
        let option = opts[key].value.trim();
        return {
            correct: answers.indexOf(option) !== -1,
            option: option
        };
    });
}

function answers (options, answer) {
    return answer.map((key) => {
        return options[key].value.trim();
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
        '顺序练习': 3,
        '精选必考题': 2,
        '分类练习': 1
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
    let cateUid = 5000;
    let cates: any[] = [];

    let questionMap = {};
    let questionUid = 500000;
    let questions: any[] = [];

    let questionCateRelationUid = 500000;
    let questionCateRelations: any[] = [];

    let cateMap = {};

    categories.forEach((cate) => {
        let model = licenceModel(cate.licence);
        let type = cateType(cate.type);
        let subject = cateSubject(type, Number(cate.subject));
        let cid = cateUid++;

        cateMap[cate.id] = cate;
        cateIdMap[cate.id] = cid;

        cates.push({
            id: cid,
            title: cate.name.trim().replace(/^\d+\.(?:科目(?:一|四))?|\s*\(\d+题\)$/g, ''),
            model: model,
            subject: 'k' + cate.subject,
            pids: [',', type, ','].join(''),
            status: 1,
            lang: 'zh-cn'
        });
    });

    let filesMap = {};

    qs.forEach((q) => {
        let answerList = answers(q.options, q.answer);
        let opts = options(q.options, answerList);
        let answer = opts.reduce((ans, opt, index) => {
            if (opt.correct) {
                return ans | (1 << index);
            }

            return ans;
        }, 0);
        let qid = questionUid++;
        let cate: TCategory = cateMap[q.category_id];
        let cid = cateIdMap[q.category_id];
        let catetype = cateType(cate.type);
        let type = typeMap[q.type];
        let shouldBeJudge = opts.length === 2 && opts[0].option === '正确';
        let shouldBeSingle = ((answer - 1) & answer) === 0;
        let shouldBeMulti = ((answer - 1) & answer) !== 0;

        if (shouldBeJudge) {
            if (type !== 1) {
                console.log('判断题类型错误', type, opts);
                type = shouldBeSingle ? 2 : 3;
            }
        }
        else if (shouldBeSingle) {
            if (type !== 2) {
                console.log('单选题类型错误', type, opts);
                type = 2;
            }
        }
        else if (shouldBeMulti) {
            if (type !== 3) {
                console.log('多选题类型错误', type, opts);
                type = shouldBeJudge ? 1 : 3;
            }
        }
        else {
            console.error('题目错误', q);
        }

        if (!questionMap[q.id]) {

            let question = {
                id: qid,
                type: type,
                title: q.title.trim(),
                answer: type === 1 ? (answer === 1 ? 1 : 0) : answer,
                opts: JSON.stringify(opts),
                image: attchementPath(q.thumb, '/uploads/fxb'),
                explain_gif: attchementPath(q.skill_thumb, '/uploads/fxb'),
                explain_js: q.explain ? q.explain.trim() : '',
                explain_jq: '',
                explain_mp3: attchementPath(q.skill_voice, '/uploads/fxb'),
                question_mp3: attchementPath(q.broadcast_voice, '/uploads/fxb'),
                // model: licenceModel(cate.licence),
                // subject: 'k' + cate.subject
            };

            questionMap[q.id] = qid;
            questions.push(question);

            questionCateRelations.push({
                id: questionCateRelationUid++,
                qid: qid,
                cid: cid
            });
        }
        else {
            questionCateRelations.push({
                id: questionCateRelationUid++,
                qid: questionMap[q.id],
                cid: cid
            });
        }
    });

    return {
        cates,
        questions,
        questionCateRelations
    };
}

function generateSql (cates, qs) {

    let data = prepareData(cates, qs);

    return {
        cateSql: generateInsertSql('eb_training_category', data.cates, {maxRow: 100}),
        questionSql: generateInsertSql('eb_training_question', data.questions, {maxRow: 100}),
        questionCateSql: generateInsertSql('eb_training_question_cates', data.questionCateRelations, {maxRow: 100}),
        // files: data.files.join('\n')
    };
}

function downloadSql (cates, qs) {
    let sqls = generateSql(cates, qs);

    window.downloadData = sqls;

    download(sqls.cateSql, 'fxb-to-crmeb-cates.sql');
    download(sqls.questionSql, 'fxb-to-crmeb-questions.sql');
    download(sqls.questionCateSql, 'fxb-to-crmeb-question-cates.sql');
    // download(sqls.files, 'fxb-files.csv');

    return sqls;
}

function loadAndRun () {
    return Promise.all([
        fetch('/data/driver.fxb-team.com-categories.json').then(r => r.json()),
        fetch('/data/driver.fxb-team.com-questions.json').then(r => r.json())
    ]).then(([cates, qs]) => {
        return downloadSql(cates, qs);
    }).then((data) => {
        window.data = data;
    });
}

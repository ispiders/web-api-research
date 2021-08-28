interface TCategory {
    km: string;
    model: string;
    type: string;
    id: string;
    name: string;
    link: string;
}

type TOptionKey = 'A'|'B'|'C'|'D';

interface TQuestion {
    line: string;
    id: string;
    type: string;
    Question: string;
    An1: string;
    An2: string;
    An3: string;
    An4: string;
    AnswerTrue: string;
    explain: string;
    ExImg1: string;
    ExImg2: string;
    ExImg3: string;
    sinaimg: string;
    video_url: string;
    voice: string;
    voiceEx: string;
    VSid: string;
    VSvoiceEx: string;
    teacher: string;
    isJsVdoShow: boolean;
    category_id: string;
}

function options (q: TQuestion) {

    let type = Number(q.type);
    let answers = q.AnswerTrue.split('').map(i => Number(i));

    if (type === 1) {
        return '';
    }
    else {
        let opts = [{
            correct: answers.indexOf(1) !== -1,
            option: replaceMark(q.An1)
        }, {
            correct: answers.indexOf(2) !== -1,
            option: replaceMark(q.An2)
        }, {
            correct: answers.indexOf(3) !== -1,
            option: replaceMark(q.An3)
        }, {
            correct: answers.indexOf(4) !== -1,
            option: replaceMark(q.An4)
        }];

        let answerCount = opts.filter(item => item.correct).length;

        if (type === 2 && answerCount !== 1) {
            console.log('单选题类型错误', q);
        }
        else if (type === 3 && answerCount <= 1) {
            console.log('多选题类型错误', q);
        }

        return opts;
    }
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
    else if (catetype === 2 || catetype === 3 || catetype === 4) {
        return 'k' + subject + '_' + catetype;
    }
    else {
        console.error('catetype error:', catetype);
    }
}

function cateType (typeText) {
    return {
        'local': 4,
        'special': 2,
        'cate': 1
    }[typeText];
}

function replaceMark (text: string) {

    if (!text) {
        return text;
    }

    return text.replace(/【([^【】]*)】/ig, (match, match1) => {
        console.log('replaceMark', match1);
        return '{' + match1 + '}';
    });

    // return text.replace(/<([a-z]+)>(.*?)<\/\1>/ig, (match, match1, match2) => {
    //     console.log('replaceMark', match2);
    //     return '{' + match2 + '}';
    // });
}

function attchementPath (uri, prefix = '') {

    if (uri) {
        return prefix + uri;
    }

    // if (uri) {
    //     let url = new URL(uri);
    //     let path = url.pathname + url.search;

    //     return prefix ? prefix + path : path;
    // }

    return uri;
}

let typeMap = {
    1: 1, // 判断
    0: 2, // 单选
    2: 3 // 多选
};

let subjectMap = {
    '科目一': 1,
    '科目四': 4,
    '满分学习': 5
};

function prepareData (categories: TCategory[], qs: TQuestion[]) {

    let cateIdMap = {};
    let cateUid = 6000;
    let cates: any[] = [];

    let questionMap = {};
    let questionUid = 600000;
    let questions: any[] = [];

    let questionCateRelationUid = 600000;
    let questionCateRelations: any[] = [];

    let cateMap = {};

    categories.forEach((cate) => {

        let model = cate.model
        let pid = cateType(cate.type);
        let km = subjectMap[cate.km];
        let subject = 'k' + km;

        let c = cateMap[cate.id];

        if (c) {
            let pids = c.pids.split(',').map(i => Number(i));

            if (pids.indexOf(pid) === -1) {
                c.pids += pid + ',';
            }

            return;
        }

        let cid = cateUid++;

        let newCate = {
            id: cid,
            title: cate.name.trim(),
            model: model,
            subject: subject,
            pids: [',', pid, ','].join(''),
            status: 1,
            lang: 'zh-cn'
        };

        cateMap[cate.id] = newCate;
        cateIdMap[cate.id] = cid;

        cates.push(newCate);
    });

    qs.forEach((q) => {
        let answerTrue = Number(q.AnswerTrue);
        let opts = options(q);
        let answer = typeof opts === 'string' ? (answerTrue ? 1 : 0) : opts.reduce((ans, opt, index) => {
            if (opt.correct) {
                return ans | (1 << index);
            }

            return ans;
        }, 0);
        let qid = questionUid++;
        let cid = cateIdMap[q.category_id];
        let type = Number(q.type);

        if (!questionMap[q.id]) {

            let question = {
                id: qid,
                type: type,
                title: replaceMark(q.Question.trim()),
                answer: answer,
                opts: opts ? JSON.stringify(opts) : '',
                image: attchementPath(q.sinaimg, '/uploads/ydt1/'),
                explain_gif: attchementPath('skill/' + q.id + '.gif', '/uploads/ydt1/'),
                explain_js: q.explain ? replaceMark(q.explain.trim()) : '',
                explain_jq: q.voiceEx ? replaceMark(q.voiceEx.trim()) : '',
                explain_mp3: attchementPath('mp3/' + q.id + '.mp3', '/uploads/ydt1/'),
                question_mp3: attchementPath('Qmp3/' + q.id + '.mp3', '/uploads/ydt1/'),
                explain_js_mp3: attchementPath('Emp3/' + q.id + '.mp3', '/uploads/ydt1/')
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

    download(sqls.cateSql, 'ydt1-to-crmeb-cates.sql');
    download(sqls.questionSql, 'ydt1-to-crmeb-questions.sql');
    download(sqls.questionCateSql, 'ydt1-to-crmeb-question-cates.sql');
    // download(sqls.files, 'ydt1-files.csv');

    return sqls;
}

function loadAndRun () {
    return Promise.all([
        fetch('/data/ydt1-categories.json').then(r => r.json()),
        fetch('/data/ydt1-questions.json').then(r => r.json())
    ]).then(([cates, qs]) => {
        return downloadSql(cates, qs);
    }).then((data) => {
        window.data = data;
    });
}

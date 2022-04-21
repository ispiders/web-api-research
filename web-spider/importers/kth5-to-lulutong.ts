interface TCategory {
    id: number;
    sort: number;
    color: string;
    icon: string;
    model: string;
    subject: string;
    title: string;
    index: number;
}

type TOptionKey = 'A'|'B'|'C'|'D';

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
    subject: 'k1' | 'k4';
    titlekeyword: string;
    issuemp3: string;
    answermp3: string;
    explainjsmp3: string;
}

interface TTargetCategory {
    id: number;
    model: string;
    subject: string;
    title: string;
    icon?: string;
}

interface TTargetQuestion {
    id: number;
    column_id: number;
    column_id2: number;
    column_id3: number;
    column_id4: number;
    id_ydt?: number;
    number?: number;
    type: number;
    answer: string;
    answerkeyword?: string;
    explain_gif: string;
    explain_jq: string;
    explain_js: string;
    explain_mp3: string;
    image: string;
    image_ydt?: string;
    issue: string;
    keywordcolor?: string;
    model: string;
    opts: string;
    skillkeyword?: string;
    titlekeyword?: string;
    question_mp3: string;
    answer_mp3: string;
    explain_js_mp3: string;
    subject: string;
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

function replaceMark (text: string) {

    if (!text) {
        return text;
    }

    return text.replace(/<([a-z]+)>(.*?)<\/\1>/ig, (match, match1, match2) => {
        console.log('replaceMark', match2);
        return '{' + match2 + '}';
    });
}

function attchementPath (uri, prefix = '/public/kth5/statics') {

    uri = uri && uri.trim();

    if (uri) {
        let url = new URL(uri);
        let path = url.pathname + url.search;

        return prefix ? prefix + path : path;
    }

    return '';
}

function realCateId (columnId) {
    if (columnId) {
        return columnId > 1000 ? columnId : +columnId + 1000;
    }
    else {
        return 0;
    }
}

let typeMap = {
    1: 1, // 判断
    0: 2, // 单选
    2: 3 // 多选
};

// 只导入指定的分类
let filterCids = [];//[8, 42, 18, 27, 87, 224, 235, 288];

function prepareData (categories: TCategory[], qs: TQuestion[]) {

    let files: string[] = [];

    let cates = unique(categories, 'id').map((c) => {
        let item = {...c};

        // if (c.icon) {
        //     files.push(c.icon);
        // }

        delete item.index;

        return item;
    });

    let questions: TTargetQuestion[] = [];

    unique(qs, 'id').forEach((q) => {

        let t = true;

        if (filterCids.length) {
            t = false;
            filterCids.forEach((cid) => {
                if ([q.columnId, q.columnId2, q.columnId3, q.columnId4].indexOf(realCateId(cid)) !== -1) {
                    t = true;
                }
            });
        }

        if (!t) {
            return;
        }

        let question = {
            id: q.id,
            column_id: realCateId(q.columnId),
            column_id2: realCateId(q.columnId2),
            column_id3: realCateId(q.columnId3),
            column_id4: realCateId(q.columnId4),
            id_ydt: q.idYdt || 0,
            number: q.number,
            type: q.type,
            answer: q.answer,
            answerkeyword: q.answerkeyword,
            explain_gif: attchementPath(q.explainGif),
            explain_jq: q.explainJq,
            explain_js: q.explainJs,
            explain_mp3: attchementPath(q.explainMp3),
            image: attchementPath(q.image),
            image_ydt: attchementPath(q.imageYdt),
            issue: q.issue,
            keywordcolor: q.keywordcolor,
            model: q.model,
            opts: q.opts,
            skillkeyword: q.skillkeyword,
            titlekeyword: q.titlekeyword,
            question_mp3: attchementPath(q.issuemp3),
            answer_mp3: attchementPath(q.answermp3),
            explain_js_mp3: attchementPath(q.explainjsmp3),
            subject: q.subject
        };
        questions.push(question);

        if (q.explainGif) {
            files.push(q.explainGif);
        }
        if (q.explainMp3) {
            files.push(q.explainMp3);
        }
        if (q.image) {
            files.push(q.image);
        }
        if (q.imageYdt) {
            files.push(q.imageYdt);
        }
        if (q.issuemp3) {
            files.push(q.issuemp3);
        }
        if (q.answermp3) {
            files.push(q.answermp3);
        }
        if (q.explainjsmp3) {
            files.push(q.explainjsmp3);
        }
    });

    return {
        cates,
        questions,
        files: unique(files)
    };
}

function generateSql (cates, qs) {

    let data = prepareData(cates.filter(cate => {
        if (filterCids.length) {
            return filterCids.indexOf(cate.id) !== -1
        }
        else {
            return true;
        }
    }), qs);

    return {
        cateSql: generateInsertSql('ims_quickpass_drivingtest_category', data.cates, {maxRow: 100}),
        questionSql: generateInsertSql('ims_quickpass_drivingtest_questions', data.questions, {maxRow: 100}),
        files: data.files.join('\n')
    };
}

function downloadSql (cates, qs) {
    let sqls = generateSql(cates, qs);

    download(sqls.cateSql, 'kth5-to-lulutong-cates-20220412.sql');
    download(sqls.questionSql, 'kth5-to-lulutong-questions-20220412.sql');
    download(sqls.files, 'kth5-to-lulutong-files-20220412.csv');

    return sqls;
}

function loadAndRun () {
    return Promise.all([
        fetch('/data/kth5/kth5.liehuu-cates-2022-04-12.json').then(r => r.json()),
        fetch('/data/kth5/kth5.liehuu-questions-2022-04-12.json').then(r => r.json())
    ]).then(([cates, qs]) => {
        return downloadSql(cates, qs);
    });
}

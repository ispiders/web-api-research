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
    return columnId || 0;
}

let typeMap = {
    1: 1, // 判断
    0: 2, // 单选
    2: 3 // 多选
};

function prepareData (categories: TCategory[], qs: TQuestion[]) {

    let cates = categories.map((c) => {
        let item = {...c};

        delete item.index;

        return item;
    });

    let questions = unique(qs, 'id').map((q) => {
        return {
            id: q.id,
            column_id: realCateId(q.columnId),
            column_id2: realCateId(q.columnId2),
            column_id3: realCateId(q.columnId3),
            column_id4: realCateId(q.columnId4),
            id_ydt: q.idYdt,
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
            issuemp3: attchementPath(q.issuemp3),
            answermp3: attchementPath(q.answermp3),
            explainjsmp3: attchementPath(q.explainjsmp3),
            subject: q.subject
        };
    });

    return {
        cates,
        questions
    };
}

function generateSql (cates, qs) {

    let data = prepareData(cates, qs);

    return {
        cateSql: generateInsertSql('ims_quickpass_drivingtest_category', data.cates, {maxRow: 100}),
        questionSql: generateInsertSql('ims_quickpass_drivingtest_questions', data.questions, {maxRow: 100})
    };
}

function downloadSql (cates, qs) {
    let sqls = generateSql(cates, qs);

    window.downloadData = sqls;

    download(sqls.cateSql, 'kth5-to-lulutong-cates.sql');
    download(sqls.questionSql, 'kth5-to-lulutong-questions.sql');

    return sqls;
}

function loadAndRun () {
    return Promise.all([
        fetch('/data/kth5.liehuu-categories-1.json').then(r => r.json()),
        fetch('/data/kth5.liehuu-questions-1.json').then(r => r.json())
    ]).then(([cates, qs]) => {
        return downloadSql(cates, qs);
    }).then((data) => {
        window.data = data;
    });
}

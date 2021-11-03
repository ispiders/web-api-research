interface TCategory {
    id: number;
    model: string;
    subject: string;
    title: string;
    icon: string;
    color: string;
    sort: number;
}

interface TQuestion {
    id: number;
    model: string;
    subject: string;
    column_id: number;
    column_id2: number;
    column_id3: number;
    column_id4: number;
    number: number;
    type: number;
    issue: string;
    image: string;
    opts: string;
    answer: string;
    highlight: string;
    explain_gif: string;
    explain_mp3: string;
    free: number;
    id_ydt: number;
    image_ydt: string;
    keywordcolor: string;
    skillkeyword: string;
    titlekeyword: string;
    answerkeyword: string;
    explain_js: string;
    explain_jq: string;
    question_mp3: string;
    question_answer_mp3: string;
    answer_mp3: string;
    explain_js_mp3: string;
}

function options (opts, answer) {
    let answers = answer.split('-');

    return opts.split('-').map((option) => {
        return {
            correct: answers.indexOf(option) !== -1,
            option: option
        };
    });
}

function cateSubject (subjectString: string) {
    let parts = subjectString.split('_');
    let subject = parts[0];
    let pid = parts[1] || 1;

    return {
        subject,
        pid
    };
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
        let path = uri.replace(/^\/public\//, '/');

        return prefix ? prefix + path : path;
    }

    return uri;
}

function realColumnId (columnId) {
    if (columnId > 1000) {
        return columnId - 1000;
    }
    else if (columnId <= 0) {
        return 0;
    }
    else {
        return columnId;
    }
}

function prepareData (categories: TCategory[], qs: TQuestion[]) {

    // 此题库小车题库也适用于货车客车
    let commonCartQuestion = true;

    let cateIdMap = {};
    let cateUid = 8000;
    let cates: any[] = [];

    let questionMap = {};
    let questionUid = 800000;
    let questions: any[] = [];

    let questionCateRelationUid = 800000;
    let questionCateRelations: any[] = [];
    let questionCateRelationsUniqueMap: {[key: string]: 1} = {};

    let cateMap = {};

    categories.forEach((cate) => {
        let model = cate.model;
        let {subject, pid} = cateSubject(cate.subject);
        let cid = cateUid++;

        cateMap[cate.id] = cate;
        cateIdMap[cate.id] = cid;

        cates.push({
            id: cid,
            title: cate.title,
            model: model,
            subject: subject,
            pids: [',', pid, ','].join(''),
            status: 1,
            lang: 'zh-cn'
        });

        // 此题库小车题库也适用于货车客车
        if (commonCartQuestion && cate.model === 'cart') {

            cid = cateUid++;
            cates.push({
                id: cid,
                title: cate.title,
                model: 'truck',
                subject: subject,
                pids: [',', pid, ','].join(''),
                status: 1,
                lang: 'zh-cn'
            });

            cid = cateUid++;
            cates.push({
                id: cid,
                title: cate.title,
                model: 'bus',
                subject: subject,
                pids: [',', pid, ','].join(''),
                status: 1,
                lang: 'zh-cn'
            });
        }
    });

    qs.forEach((q) => {
        let opts = options(q.opts, q.answer);
        let answer = opts.reduce((ans, opt, index) => {
            if (opt.correct) {
                return ans | (1 << index);
            }

            return ans;
        }, 0);
        let type = q.type;
        let qid = questionUid++;
        let shouldBeJudge = opts.length === 2;
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

        let question = {
            id: qid,
            type: type,
            title: q.issue.trim(),
            answer: type === 1 ? (answer === 1 ? 1 : 0) : answer,
            opts: JSON.stringify(opts),
            image: attchementPath(q.image, '/uploads'),
            explain_gif: attchementPath(q.explain_gif, '/uploads'),
            explain_js: q.explain_js,
            explain_jq: q.explain_jq,
            explain_mp3: attchementPath(q.explain_mp3, '/uploads'),
            question_mp3: attchementPath(q.question_mp3, '/uploads'),
            explain_js_mp3: attchementPath(q.explain_js_mp3, '/uploads'),
        };

        questionMap[q.id] = qid;
        questions.push(question);

        let columnIds = [q.column_id, q.column_id2, q.column_id3, q.column_id4];

        columnIds.forEach((cateid) => {

            cateid = realColumnId(cateid);

            if (cateid) {
                let cate = cateMap[cateid];
                let cid = cateIdMap[cateid];

                questionCateRelations.push({
                    id: questionCateRelationUid++,
                    qid: qid,
                    cid: cid
                });

                if (commonCartQuestion && cate.model === 'cart') {
                    questionCateRelations.push({
                        id: questionCateRelationUid++,
                        qid: qid,
                        cid: cid + 1 // truck
                    });

                    questionCateRelations.push({
                        id: questionCateRelationUid++,
                        qid: qid,
                        cid: cid + 2 // bus
                    });
                }
            }
        });
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
        questionCateSql: generateInsertSql('eb_training_question_cates', data.questionCateRelations, {maxRow: 100})
    };
}

function downloadSql (cates, qs) {
    let sqls = generateSql(cates, qs);

    download(sqls.cateSql, 'weiyunsheji-to-crmeb-cates.sql');
    download(sqls.questionSql, 'weiyunsheji-to-crmeb-questions.sql');
    download(sqls.questionCateSql, 'weiyunsheji-to-crmeb-question-cates.sql');

    return sqls;
}

function loadAndRun () {
    return Promise.all([
        fetch('/data/weiyunsheji-v1-categories.json').then(r => r.json()),
        fetch('/data/weiyunsheji-v1-questions.json').then(r => r.json())
    ]).then(([cates, qs]) => {
        return downloadSql(cates, qs);
    }).then((data) => {
        window.data = data;
    });
}

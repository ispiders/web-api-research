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
    name: string;
    model: string;
    subject: string;
    lang: string;
    active: boolean;
}

interface TTargetQuestion {
    id: number;
    title: string;
    type: number;
    answer: number;
    skill: string;
    explain: string;
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

// 题目难度定级
function rating (type, failedCount) {
    let base = 40;

    if (type === 2) {
        base = 60;
    }
    else if (type === 3) {
        base = 80;
    }

    if (failedCount > 100) {
        base += 20;
    }
    else if (failedCount > 10) {
        base += 10;
    }
    else {
        base += 5;
    }

    return base;
}

function prepareData (categories: TCategory[], qs: TQuestion[], startId = 8000, failedCounts = []) {

    let failedCountMap = failedCounts.reduce((map, item) => {
        map[item.questionId] = item.c;
        return map;
    }, {});

    // 此题库小车题库也适用于货车客车
    let commonCartQuestion = true;

    let cateIdMap = {};
    let cateUid = startId;
    let cates: any[] = [];

    let questionMap = {};
    let questionUid = startId * 100;
    let questions: any[] = [];

    // let questionCateRelationUid = startId * 100;
    let questionCateRelations: any[] = [];
    let questionCateRelationsUniqueMap: {[key: string]: 1} = {};

    let cateMap = {};

    let questionOptionUid = startId * 10;
    let questionOptions: any[] = [];

    categories.forEach((cate) => {
        let model = cate.model;
        let {subject, pid} = cateSubject(cate.subject);
        let cid = cateUid++;

        cateMap[cate.id] = cate;
        cateIdMap[cate.id] = cid;

        cates.push({
            id: cid,
            name: cate.title,
            model: model,
            subject: subject,
            active: true
        });

        // 此题库小车题库也适用于货车客车
        if (commonCartQuestion && cate.model === 'cart') {

            cid = cateUid++;
            cates.push({
                id: cid,
                name: cate.title,
                model: 'truck',
                subject: subject,
                active: true
            });

            cid = cateUid++;
            cates.push({
                id: cid,
                name: cate.title,
                model: 'bus',
                subject: subject,
                active: true
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
        let type = Number(q.type);
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

        let question: TTargetQuestion = {
            id: qid,
            type: type,
            title: q.issue.trim(),
            answer: type === 1 ? (answer === 1 ? 1 : 0) : answer,
            skill: q.explainJs,
            explain: q.explainJq
        };

        if (failedCounts.length) {
            // question.rating = rating(type, failedCounts[q.id]);
        }

        questionMap[q.id] = qid;
        questions.push(question);

        if (type !== 1) {
            opts.forEach((opt) => {
                questionOptions.push({
                    id: questionOptionUid++,
                    question_id: qid,
                    option: opt.option,
                    correct: opt.correct
                });
            });
        }

        let columnIds = [q.columnId, q.columnId2, q.columnId3, q.columnId4];

        columnIds.forEach((cateid) => {

            cateid = realColumnId(cateid);

            if (cateid) {
                let cate = cateMap[cateid];
                let cid = cateIdMap[cateid];

                questionCateRelations.push({
                    // id: questionCateRelationUid++,
                    licence_training_question_id: qid,
                    licence_training_category_id: cid
                });

                if (commonCartQuestion && cate.model === 'cart') {
                    questionCateRelations.push({
                        // id: questionCateRelationUid++,
                        licence_training_question_id: qid,
                        licence_training_category_id: cid + 1 // truck
                    });

                    questionCateRelations.push({
                        // id: questionCateRelationUid++,
                        licence_training_question_id: qid,
                        licence_training_category_id: cid + 2 // bus
                    });
                }
            }
        });
    });

    return {
        cates,
        questions,
        questionOptions,
        questionCateRelations
    };
}

function generateSql (cates, qs, startId = 8000, failedCounts) {

    let data = prepareData(cates, qs, startId, failedCounts);

    return {
        cateSql: generateInsertSql('licence_training_category', data.cates, {maxRow: 100, sqlType: 'psql'}),
        questionSql: generateInsertSql('licence_training_question', data.questions, {maxRow: 100, sqlType: 'psql'}),
        questionOptionSql: generateInsertSql('licence_training_question_option', data.questionOptions, {maxRow: 100, sqlType: 'psql'}),
        questionCateSql: generateInsertSql('licence_training_category_licence_training_question_rel', data.questionCateRelations, {maxRow: 100, sqlType: 'psql'})
    };
}

function downloadSqlKth5 (cates, qs) {
    let sqls = generateSql(cates, qs, 8000);

    download(sqls.cateSql, 'kth5-to-odoo-cates.sql');
    download(sqls.questionSql, 'kth5-to-odoo-questions.sql');
    download(sqls.questionOptionSql, 'kth5-to-odoo-question-options.sql');
    download(sqls.questionCateSql, 'kth5-to-odoo-question-cates.sql');

    return sqls;
}

function loadAndRunKth5 () {
    return Promise.all([
        fetch('/data/kth5/kth5.liehuu-cates-2022-03-01.json').then(r => r.json()),
        fetch('/data/kth5/kth5.liehuu-questions-2022-03-01.json').then(r => r.json())
    ]).then(([cates, qs]) => {
        return downloadSqlKth5(cates, qs);
    }).then((data) => {
        window.data = data;
    });
}
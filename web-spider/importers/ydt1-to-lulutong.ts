interface TCategory {
    uid: number;
    km: string;
    model: string;
    type: string;
    id: string;
    name: string;
    link: string;
}

type TOptionKey = 'A'|'B'|'C'|'D';

interface TQuestion {
    uid: number;
    cuid: number;
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

function options (q: TQuestion, answerKeywords: string[]) {

    let type = Number(q.type);
    let answers = q.AnswerTrue.split('').map(i => Number(i));

    if (type === 1) {
        return '';
    }
    else {
        let opts = [{
            correct: answers.indexOf(1) !== -1,
            option: replaceMark(q.An1, answerKeywords)
        }, {
            correct: answers.indexOf(2) !== -1,
            option: replaceMark(q.An2, answerKeywords)
        }, {
            correct: answers.indexOf(3) !== -1,
            option: replaceMark(q.An3, answerKeywords)
        }, {
            correct: answers.indexOf(4) !== -1,
            option: replaceMark(q.An4, answerKeywords)
        }];

        opts.forEach((item) => {
            if (item.option.indexOf('-') !== -1) {
                console.log('option has -', q);
                item.option = item.option.replace('-', '－');
            }
        });

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
        'cate': 3
    }[typeText];
}

function replaceMark (text: string, keywords?: string[]) {

    if (!text) {
        return text;
    }

    return text.replace(/【([^【】]*)】/ig, (match, match1) => {
        if (keywords) {
            keywords.push(match1);
        }
        return match1;
    });

    // return text.replace(/<([a-z]+)>(.*?)<\/\1>/ig, (match, match1, match2) => {
    //     console.log('replaceMark', match2);
    //     return '{' + match2 + '}';
    // });
}

let missingCount = 0;
function attchementPath (uri, filenames, prefix = '/public/ydt1/') {

    if (uri) {
        let filename = uri.split('/').pop();

        if (filenames && !filenames[filename]) {
            missingCount++;
            // console.log('file missing:', uri);
            return '';
        }

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
    2: 2, // 单选
    3: 3 // 多选
};

let subjectMap = {
    '科目一': 1,
    '科目四': 4,
    '满分学习': 5
};

function realCateId (columnId) {
    columnId = Number(columnId);
    if (columnId) {
        return columnId + 1000;
    }
    else {
        return 0;
    }
}

function prepareData (categories: TCategory[], qs: TQuestion[], free: TQuestion[], sl: TQuestion[], filenames) {

    let cateUid = 1;
    let cates: TTargetCategory[] = [];
    let cateUniMap = {};
    let cateIdMap = {};
    let cateMap: {[key: string]: TCategory} = {};

    categories.forEach((c) => {
        let km = subjectMap[c.km];
        let type = cateType(c.type);
        let subject = 'k' + km;

        // 满分学习跳过
        if (km === 5) {
            return;
        }

        // 所有分类map
        let cate = cateMap[c.uid] = {
            ...c,
            km,
            type,
            subject
        };

        // 以id去重后的分类
        if (!cateUniMap[c.id]) {
            cateUniMap[c.id] = {
                ...cate,
                models: [cate.model],
                types: [cate.type],
                kms: [cate.km],
                subjects: [cate.subject]
            };
        }
        else {
            let uniCate = cateUniMap[c.id];

            if (uniCate.models.indexOf(cate.model) === -1) {
                uniCate.models.push(cate.model);
            }

            if (uniCate.types.indexOf(cate.type) === -1) {
                uniCate.types.push(cate.type);
            }

            if (uniCate.kms.indexOf(cate.km) === -1) {
                uniCate.kms.push(cate.km);
            }

            if (uniCate.subjects.indexOf(cate.subject) === -1) {
                uniCate.subjects.push(cate.subject);
            }
        }
    });

    function getModel (cate) {
        let hasCart = false;
        let hasTruck = false;
        let hasBus = false;
        let hasMtc = false;

        for (let i = 0; i < cate.models.length; i++) {
            let model = cate.models[i];

            if (model === 'mtc') {
                hasMtc = true;
            }
            else if (model === 'cart') {
                hasCart = true;
            }
            else if (model === 'truck') {
                hasTruck = true;
            }
            else if (model === 'bus') {
                hasBus = true;
            }
        }

        let models: string[] = [];

        if (hasCart) {
            models.push('cart');

            if (hasMtc) {
                models.push('mtc');
                // console.warn('cart and mtc', cate);
            }
        }
        else {
            models = [...cate.models];

            if (models.length > 1) {
                // console.warn('multi model cate', cate);
            }
        }

        return models;
    }

    function getSubject (cate) {
        if (cate.subjects.length > 1) {
            console.error('subject error', cate);
            return 'k4';
        }
        else {
            return cate.subject;
        }
    }

    function getCateType (cate) {
        if (cate.types.length > 1) {
            console.error('cate type error', cate);
            return cate.type;
        }
        else {
            return cate.type;
        }
    }

    Object.keys(cateUniMap).forEach((id) => {
        let cate = cateUniMap[id];
        let models = getModel(cate);
        let subjects = cate.subjects;
        let type = getCateType(cate);

        models.forEach((model) => {
            subjects.forEach((subject) => {
                let catename = cate.name;

                if (model === 'bus') {
                    catename = catename.replace('货车', '客车');
                }
                else if (model === 'truck') {
                    catename = catename.replace('客车', '货车');
                }

                let c: TTargetCategory = {
                    id: getCid(cate.uid, model, subject),
                    model: model,
                    subject: type === 1 ? subject : [subject, '_', type].join(''),
                    title: catename
                };
                cates.push(c);
            });
        });
    });

    let questionUid = 1;
    let questions: TTargetQuestion[] = [];
    let questionMap = {};

    let freeMap = free.reduce((map, q) => {
        map[q.id] = 1;
        return map;
    }, {});

    let freeIds = {};

    qs.forEach(q => {
        let ocate = cateMap[q.cuid];

        if (!ocate) {
            // console.warn('no cate question', q);
            return;
        }

        let cate = cateUniMap[ocate.id];

        let models = getModel(cate);
        let subjects = cate.subjects;
        let types = cate.types;

        if (questionMap[q.id]) {
            if (questionMap[q.id].models) {
                questionMap[q.id].models = unique(questionMap[q.id].models.concat(models));
            }

            if (questionMap[q.id].subjects) {
                questionMap[q.id].subjects = unique(questionMap[q.id].subjects.concat(subjects));
            }

            if (questionMap[q.id].types) {
                questionMap[q.id].types = unique(questionMap[q.id].types.concat(types));
            }
        }
        else {
            questionMap[q.id] = q;
            questionMap[q.id].models = models;
            questionMap[q.id].subjects = subjects;
            questionMap[q.id].types = types;
        }
    });

    function getCid(id, model, subject) {
        let modelIndex = ['', 'cart', 'truck', 'bus', 'mtc'].indexOf(model);
        let subjectIndex = ['', 'k1', 'k4'].indexOf(subject);

        if (modelIndex === 0 || subjectIndex === 0) {
            console.error('getCid model subject error', id, model, subject);
        }

        return id * 8 + modelIndex * subjectIndex;
    }

    Object.keys(questionMap).forEach((id) => {
        let q = questionMap[id];

        let answerKeywords: string[] = [];
        let skillKeywords: string[] = [];
        let titleKeywords: string[] = [];
        let answerTrue = Number(q.AnswerTrue);
        let opts = options(q, answerKeywords);
        let answer = typeof opts === 'string' ? (answerTrue === 1 ? '√' : '×') : opts.filter((item) => {
            return item.correct
        }).map(item => item.option).join('-');

        if (answerKeywords.length > 1) {
            // console.warn('more thant 1 answer keywords')
        }

        let questionTemp = {
            id: 0,
            column_id: 0,
            column_id2: 0,
            column_id3: 0,
            column_id4: 0,
            id_ydt: 0,
            number: Number(q.line) || 0,
            type: q.type,
            answer: answer,
            model: '',
            opts: typeof opts === 'string' ? '√-×' : opts.map(item => item.option).join('-'),
            answer_mp3: '',
            subject: '',
            explain_jq: q.voiceEx ? replaceMark(q.voiceEx.trim(), skillKeywords) : '',
            explain_js: q.explain ? replaceMark(q.explain.trim()) : '',
            issue: replaceMark(q.Question, titleKeywords),
            explain_gif: attchementPath('skill/' + q.id + '.gif', filenames),
            explain_mp3: attchementPath('mp3/' + q.id + '.mp3', filenames),
            question_mp3: attchementPath('Qmp3/' + q.id + '.mp3', filenames),
            explain_js_mp3: attchementPath('Emp3/' + q.id + '.mp3', filenames),
            image: attchementPath(q.sinaimg, filenames),
            keywordcolor: '#ff0000',
            titlekeyword: titleKeywords.join('-'),
            skillkeyword: skillKeywords.join('-'),
            answerkeyword: '' // answerKeywords.join('-')
        };

        if (q.models.length >= 4) {
            console.warn('question has all models', q.models);
            q.models = ['cart', 'mtc'];
        }
        else if (q.models.length === 3) {
            if (q.models.indexOf('cart') !== -1) {
                console.warn('question models', q.models);

                if (q.models.indexOf('mtc') === -1) {
                    q.models = ['cart'];
                }
                else {
                    q.models = ['cart', 'mtc'];
                }
            }
        }
        else if (q.models.length === 2) {
            if (q.models.indexOf('cart') !== -1 && q.models.indexOf('mtc') === -1) {
                console.warn('question models', q.models);
                q.models = ['cart'];
            }
        }

        let copys = 0;

        q.models.forEach((model) => {
            q.subjects.forEach((subject) => {
                copys++;
                let cid = realCateId(getCid(q.cuid, model, subject));
                let question = {
                    ...questionTemp,
                    id: questionUid++,
                    model,
                    subject
                };

                q.types.forEach((type) => {
                    if (type === 1) {
                        question['column_id'] = cid;
                    }
                    else {
                        question['column_id' + type] = cid;
                    }
                });

                if (freeMap[q.id] && !freeIds[q.id]) {
                    freeIds[q.id] = question.id;
                }

                questions.push(question);
            });
        });

        if (copys > 1) {
            // console.log('question copys', q.id, copys);
        }
    });

    console.log('missing count: ', missingCount)

    cates = cates.sort((a, b) => a.id - b.id);
    questions = questions.sort((a, b) => a.id - b.id);

    let slId = Number(cates[cates.length - 1].id) + 1;
    cates.push({
        id: slId,
        model: 'cart',
        subject: 'sl',
        title: '三力测试'
    });

    let qIdStart = Number(questions[questions.length - 1].id) + 1;
    sl.forEach((q) => {
        let answerKeywords: string[] = [];
        let skillKeywords: string[] = [];
        let titleKeywords: string[] = [];

        let cid = realCateId(slId);
        let qid = qIdStart++;
        let answerTrue = Number(q.AnswerTrue);
        let opts = options(q, answerKeywords);
        let answer = typeof opts === 'string' ? (answerTrue === 1 ? '√' : '×') : opts.filter((item) => {
            return item.correct
        }).map(item => item.option).join('-');

        if (answerKeywords.length > 1) {
            console.warn('more thant 1 answer keywords')
        }

        let model = 'cart';

        let question = {
            id: qid,
            column_id: 0,
            column_id2: 0,
            column_id3: 0,
            column_id4: cid,
            id_ydt: 0,
            number: 0,
            type: q.type,
            answer: answer,
            model: model === 'all' ? 'cart' : model,
            opts: typeof opts === 'string' ? '√-×' : opts.map(item => item.option).join('-'),
            answer_mp3: '',
            subject: 'sl',
            explain_jq: q.voiceEx ? replaceMark(q.voiceEx.trim(), skillKeywords) : '',
            explain_js: q.explain ? replaceMark(q.explain.trim()) : '',
            issue: replaceMark(q.Question, titleKeywords),
            explain_gif: attchementPath('skill/' + q.id + '.gif', filenames),
            explain_mp3: attchementPath('mp3/' + q.id + '.mp3', filenames),
            question_mp3: attchementPath('Qmp3/' + q.id + '.mp3', filenames),
            explain_js_mp3: attchementPath('Emp3/' + q.id + '.mp3', filenames),
            image: attchementPath(q.sinaimg, filenames),
            keywordcolor: '#ff0000',
            titlekeyword: titleKeywords.join('-'),
            skillkeyword: skillKeywords.join('-'),
            answerkeyword: '' // answerKeywords.join('-')
        };

        questions.push(question);
    });

    return {
        cates,
        questions,
        freeids: Object.keys(freeIds).map(id => freeIds[id]),
        files: unique(getFiles(qs).concat(getFiles(sl)))
    };
}

function getFiles (questions) {
    let files = [];
    let mediaUrl = "http://mbst.hzqatc.net/exam";
    let ver = Date.now();

    questions.forEach((q) => {

        if (q.sinaimg) {
            files.push(mediaUrl + '/' + q.sinaimg);
        }

        // if (q.video_url) {
        //     files.push(mediaUrl + '/mp4' + q.video_url);
        // }

        if (q.ExImg1) {
            files.push(mediaUrl + '/' + q.ExImg1);
        }

        if (q.ExImg2) {
            files.push(mediaUrl + '/' + q.ExImg2);
        }

        if (q.ExImg3) {
            files.push(mediaUrl + '/' + q.ExImg3);
        }

        files.push(mediaUrl + '/skill/' + q.id + '.gif'); // 技巧图
        files.push(mediaUrl + '/mp3/' + q.id + '.mp3'); // 技巧
        files.push(mediaUrl + '/Qmp3/' + q.id + '.mp3'); // 读题
        files.push(mediaUrl + '/Emp3/' + q.id + '.mp3'); // 官方解读
    });

    return files;
}

function generateSql (cates, qs, free, sl, filenames) {

    let data = prepareData(cates, qs, free, sl, filenames);

    window.data = data;

    return {
        cateSql: generateInsertSql('ims_quickpass_drivingtest_category', data.cates, {maxRow: 100}),
        questionSql: generateInsertSql('ims_quickpass_drivingtest_questions', data.questions, {maxRow: 100}),
        files: data.files.join('\n')
    };
}

function downloadSql (cates, qs, free, sl, filenames) {
    let sqls = generateSql(cates, qs, free, sl, filenames);

    window.downloadData = sqls;

    download(sqls.cateSql, 'ydt1-to-lulutong-cates.sql');
    download(sqls.questionSql, 'ydt1-to-lulutong-questions.sql');
    download(sqls.files, 'ydt1-files.csv');

    return sqls;
}

function loadAndRun () {
    return Promise.all([
        fetch('/data/ydt1-hzqatc/ydt1-categories-20220405.json').then(r => r.json()),
        fetch('/data/ydt1-hzqatc/ydt1-questions-20220405.json').then(r => r.json()),
        fetch('/data/ydt1-hzqatc/ydt1-free-20220405.json').then(r => r.json()),
        fetch('/data/ydt1-hzqatc/ydt1-sl-20220405.json').then(r => r.json()),
        fetch('/data/ydt1-hzqatc/ydt1-file-names-20220405.csv').then(r => r.text())
        .then(s => s.split('\n')).then((filenames) => {
            return filenames.reduce((map, name) => {
                map[name] = 1;
                return map;
            }, {});
        })
    ]).then(([cates, qs, free, sl, filenames]) => {
        return downloadSql(cates, qs, free, sl, filenames);
    });
}

function loadStateAndRun () {
    return Promise.all([
        fetch('/data/ydt1-hzqatc/ydt1-20220412.json').then(r => r.json()),
        fetch('/data/ydt1-hzqatc/ydt1-file-names-20220412.csv').then(r => r.text())
        .then(s => s.split('\n')).then((filenames) => {
            return filenames.reduce((map, name) => {
                map[name] = 1;
                return map;
            }, {});
        })
    ]).then(([state, filenames]) => {
        return downloadSql(state.categories, state.questions, state.free, state.sl, filenames);
    });
}

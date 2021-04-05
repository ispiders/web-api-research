spider = (function () {

interface TCategory {
    id: string;
    lang: string;
    model: string;
    subject: string;
    ids: string[];
    name: string;
    link: string;
}

interface TQuestion {
    A: string;
    B: string;
    C: string;
    D: string;
    answer: string;
    c_jiexia: string;
    c_jiexib: string;
    c_jximg: string;
    caid: string;
    cbid: string;
    ccid: string;
    cxid: string;
    id: string;
    image: string;
    imgtype: string;
    m_id: string;
    sound: string;
    title: string;
    tmtype: string;
}

let spider = new Spider({
    categories: [] as TCategory[],
    questions: [] as TQuestion[],
    questionMap: {}
});

function main () {

    let lang = 'hayu';
    let models = ['x', 'k', 'h', 'm'];
    let subjects = [1, 2];

    models.forEach((model) => {
        subjects.forEach((subject) => {
            spider.addTask(`http://ks.jkjdt.com/index/catelist.html?cate=ca`, {}, {
                catelist: true,
                cate: {
                    lang: lang,
                    model: model,
                    subject: subject
                },
                beforeTask: function () {
                    document.cookie = 'COOKIE_STUDENT_LANGUAGE=' + this.data.cate.lang + ';path=/;domain=.jkjdt.com';
                    document.cookie = 'COOKIE_STUDENT_CHEXING=' + this.data.cate.model + ';path=/;domain=.jkjdt.com';
                    document.cookie = 'COOKIE_STUDENT_KEMU=' + this.data.cate.subject + ';path=/;domain=.jkjdt.com';
                }
            });
        });
    });

    spider.addRule({
        match: function (task) {
            return task.data.catelist;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let lists = [...doc.querySelectorAll<HTMLDivElement>('#right_ls .ls_one')];

            lists.forEach((el) => {
                let titleEl = el.querySelector<HTMLDivElement>('.ls_text');
                let linkEl = el.querySelector<HTMLAnchorElement>('.ls_but a');
                let name = titleEl && titleEl.innerText.trim();
                let link = linkEl && linkEl.href;

                if (!link) {
                    console.error('link error', el);
                    return;
                }

                let id = new URL(link).searchParams.get('caid');

                if (!id) {
                    console.log('cate id error', link);
                    return;
                }

                let category = {
                    id: id,
                    name: name,
                    link: link,
                    ...task.data.cate
                };

                spider.state.categories.push(category);

                spider.addTask(category.link, {}, {
                    cate: category,
                    questions: true,
                    beforeTask: function () {
                        document.cookie = 'COOKIE_STUDENT_LANGUAGE=' + this.data.cate.lang + ';path=/;domain=.jkjdt.com';
                        document.cookie = 'COOKIE_STUDENT_CHEXING=' + this.data.cate.model + ';path=/;domain=.jkjdt.com';
                        document.cookie = 'COOKIE_STUDENT_KEMU=' + this.data.cate.subject + ';path=/;domain=.jkjdt.com';
                    }
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

            let match = text.match(/var +idlist *= *\[([\d,]*)\]/i);
            let ids = match ? match[1].split(',') : [];

            task.data.cate.ids = ids;

            ids.forEach((id) => {
                if (!spider.state.questionMap[id]) {
                    spider.state.questionMap[id] = 1;
                    spider.addTask(`http://file.jkjdt.com/${lang}/json/${id}.json`, {}, {
                        cate: task.data.cate,
                        question: true
                    });
                }
            });
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.question;
        },
        dataType: 'text',
        parse: function (spider, text, task) {

            let question = JSON.parse(text);

            if (!question.id || !question.caid) {
                console.error('question error', text);
            }
            else {
                spider.state.questions.push(question);
            }
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

main();

function prepareData (categories: TCategory[], qs: TQuestion[]) {

    function cateId (cate) {
        return [cate.model, cate.subject, cate.id].join('-');
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

    function attchementPath (filePath) {
        if (filePath) {
            return '/uploads/hayu/' + filePath;
        }

        return filePath;
    }

    let typeMap = {
        1: 1,
        0: 2,
        2: 3
    };

    let modelMap = {
        'x': 'cart',
        'k': 'bus',
        'h': 'truck',
        'm': 'mtc'
    };

    let subjectMap = {
        1: 'k1',
        2: 'k4'
    };

    let cateMap = {};
    let cateUid = 1000;
    let cates: any[] = [];

    let questionMap = {};
    let questionUid = 100000;
    let questions: any[] = [];

    let questionCateRelationUid = 100000;
    let questionCateRelations: any[] = [];

    let fileURL = 'http://file.jkjdt.com/' + 'hayu/';

    categories.forEach((cate) => {
        let id = cateId(cate);
        let cid = cateUid++;

        cateMap[id] = cid;

        cates.push({
            id: cid,
            title: cate.name.replace(/^\d+\.(?:科目(?:一|四))?|\s*\(\d+题\)$/g, ''),
            model: modelMap[cate.model],
            subject: subjectMap[cate.subject],
            lang: cate.lang,
            status: 1
        });

        cate.ids.forEach((qid) => {

            let questionId = questionMap[qid];

            if (!questionId) {
                questionId = questionMap[qid] = questionUid++;
            }

            questionCateRelations.push({
                id: questionCateRelationUid++,
                qid: questionId,
                cid: cid
            });
        });
    });

    let filesMap = {};

    qs.forEach((q) => {
        let type = typeMap[q.tmtype];
        let answer = type === 1 ? (q.answer == '2' ? 0 : 1) : Number(q.answer) >> 2;
        let options = type === 1 ? '' : JSON.stringify([
            {option: replaceMark(q.A), correct: Boolean(answer & 1)},
            {option: replaceMark(q.B), correct: Boolean(answer & 2)},
            {option: replaceMark(q.C), correct: Boolean(answer & 4)},
            {option: replaceMark(q.D), correct: Boolean(answer & 8)},
        ]);

        let image = '';
        let gif = '';
        let js_mp3 = '';
        let jq_mp3 = '';
        let title_mp3 = 'readtm/' + q.m_id + '.mp3';

        if (q.c_jximg) {
            gif = q.c_jximg.indexOf('gif') > 0 ? 'jximg/' + q.m_id + '.gif' : '';
        }

        // 中文
        // if (q.image) {
        //     image = 'tmimg/' + q.image.replace('.swf', '.gif');
        // }
        // js_mp3 = 'sounda/' + q.m_id + '.mp3';
        // jq_mp3 = 'soundb/' + q.m_id + '.mp3';


        // 哈维
        if (q.imgtype !== 'none') {
            if (q.imgtype.indexOf('jpg') > 0) {
                image = 'tmimg/' + q.m_id + '.gif';
            }
            else {
                image = 'tmimg/' + q.m_id + '.jpg';
            }
        }
        jq_mp3 = 'sound/' + q.m_id + '.mp3'


        if (type === 1 && ([0,1].indexOf(answer) === -1)) {
            console.error('判断题答案问题', answer, q);
        }
        else if (type === 2 && (answer & (answer - 1))) {
            console.error('单选题答案问题', answer, q);
        }
        else if (type === 3 && (answer < 1 || answer > 15 || !(answer & (answer - 1)))) {
            console.error('多选题答案问题', answer, q);
        }

        questions.push({
            id: questionMap[q.id],
            type: type,
            title: replaceMark(q.title),
            answer: answer,
            opts: options,
            image: attchementPath(image),
            explain_gif: attchementPath(gif),
            explain_js: replaceMark(q.c_jiexia || ''),
            explain_js_mp3: attchementPath(js_mp3),
            explain_jq: replaceMark(q.c_jiexib || ''),
            explain_mp3: attchementPath(jq_mp3),
            question_mp3: attchementPath(title_mp3),
        });

        if (image) {
            filesMap[image] = 1;
        }

        if (gif) {
            filesMap[gif] = 1;
        }

        if (js_mp3) {
            filesMap[js_mp3] = 1;
        }

        if (jq_mp3) {
            filesMap[jq_mp3] = 1;
        }

        if (title_mp3) {
            filesMap[title_mp3] = 1;
        }
    });

    return {
        cates,
        questions,
        questionCateRelations,
        files: Object.keys(filesMap).map(path => fileURL + path)
    };
}

function generateSql (cates, qs) {

    let data = prepareData(cates, qs);

    return {
        cateSql: generateInsertSql('eb_training_category', data.cates, {maxRow: 100}),
        questionSql: generateInsertSql('eb_training_question', data.questions, {maxRow: 100}),
        questionCateSql: generateInsertSql('eb_training_question_cates', data.questionCateRelations, {maxRow: 100}),
        files: data.files.join('\n')
    };
}

function downloadSql (cates, qs) {
    let sqls = generateSql(cates, qs);

    window.downloadData = sqls;

    download(sqls.cateSql, 'jkjdt-cates.sql');
    download(sqls.questionSql, 'jkjdt-questions.sql');
    download(sqls.questionCateSql, 'jkjdt-question-cates.sql');
    download(sqls.files, 'jkjdt-files.csv');

    return sqls;
}

function loadAndRun () {
    return Promise.all([
        fetch('/data/jkjdt-categories.json').then(r => r.json()),
        fetch('/data/jkjdt-questions.json').then(r => r.json())
    ]).then(([cates, qs]) => {
        return downloadSql(cates, qs);
    }).then((data) => {
        window.data = data;
    });
}

return spider;

}());
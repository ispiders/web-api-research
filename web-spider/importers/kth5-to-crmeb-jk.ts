var run = (function () {
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
        explainGif: string;
        explainJq: string;
        explainJs: string;
        explainMp3: string;
        image: string;
        imageYdt: string;
        issue: string;
        model: string;
        subject: 'k1' | 'k4';
        opts: string;
        keywordcolor: string;
        titlekeyword: string;
        answerkeyword: string;
        skillkeyword: string;
        issuemp3: string;
        answermp3: string;
        explainjsmp3: string;
    }

    interface TTargetCategory {
        id: number
        title: string;
        model: string;
        subject: string;
        pids: string
        status: number,
        lang: string;
    }

    interface TTargetQuestion {
        id: number;
        number: number;
        free: number;
        type: number;
        title: string;
        answer: number;
        opts: string;
        image: string;
        explain_gif: string;
        explain_js: string;
        explain_jq: string;
        explain_mp3: string;
        question_mp3: string;
        explain_js_mp3: string;
        titlekeyword?: string;
        answerkeyword?: string;
        skillkeyword?: string;
        id_ydt?: number;
        image_ydt?: string;
    }

    interface TTargetQuestionCateRel {
        id: number;
        qid: number;
        cid: number;
    }

    function subjectAndType (subjectType: string): [string, number] {
        let parts = subjectType.split('_');

        if (parts.length === 1) {
            parts[1] = '1';
        }

        return [parts[0], Number(parts[1])];
    }

    function replaceKeyword (text: string, keywords: string) {
        if (!text || !keywords) {
            return text || '';
        }

        return text.replace(new RegExp(keywords.replace('-', '|'), 'g'), (match) => {
            return ['{', match, '}'].join('');
        });
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

    interface TOption {
        correct: boolean;
        option: string;
    }

    function optionsList (q: TQuestion): TOption[] {
        let opts = q.opts.split('-');
        let answers = q.answer.split('-');

        return opts.map((opt) => {
            return {
                correct: answers.indexOf(opt) !== -1,
                option: replaceKeyword(opt, q.answerkeyword)
            };
        });
    }

    function answerNumber (options: TOption[]): number {

        return options.reduce((ret, opt, index) => {
            if (opt.correct) {
                return ret |= 1 << index;
            }

            return ret;
        }, 0);
    }

    function attchementPath (uri, prefix = '/uploads/kth5/statics') {

        uri = uri && uri.trim();

        if (uri) {
            let url = new URL(uri);
            let path = url.pathname + url.search;

            return prefix ? prefix + path : path;
        }

        return '';
    }

    function realCateId (columnId: number) {
        if (columnId > 1000) {
            return columnId - 1000;
        }

        return columnId;
    }

    function prepareData (state) {

        let categories: TCategory[] = state.categories;
        let qs: TQuestion[] = state.questions;
        let free: TQuestion[] = state.free;

        let files: string[] = [];
        let cates: TTargetCategory[] = [];
        let questionCates: TTargetQuestionCateRel[] = [];
        let cateUid = 1;
        let uid = 1;

        let cateMap: {[index: string]: TTargetCategory} = {};
        categories.forEach((c) => {
            let [subject, type] = subjectAndType(c.subject);
            let cid = cateUid;
            cateUid += 4;

            let cate: TTargetCategory = {
                id: cid,
                title: c.title,
                model: c.model,
                subject: subject,
                pids: [',', type, ','].join(''),
                status: 1,
                lang: 'zh-cn'
            };

            cateMap[c.id] = cate;

            cates.push(cate);

            if (c.model === 'cart') {
                cates.push({
                    ...cate,
                    id: cid + 1,
                    model: 'truck'
                });
                cates.push({
                    ...cate,
                    id: cid + 2,
                    model: 'bus'
                });
            }
        });

        let questions: TTargetQuestion[] = [];

        let freeMap = free.reduce((ret, q) => {
            ret[q.idYdt] = q.issue;
            return ret;
        }, {});

        qs.forEach((q) => {
            let options = optionsList(q);
            let answer = answerNumber(options);
            let question: TTargetQuestion = {
                id: q.id,
                number: q.number || 0,
                free: freeMap[q.idYdt] === q.issue ? 1 : 0,
                type: q.type,
                title: replaceKeyword(q.issue, q.titlekeyword),
                answer: answer,
                opts: q.type === 1 ? '' : JSON.stringify(options),
                image: attchementPath(q.image),
                explain_gif: attchementPath(q.explainGif),
                explain_js: q.explainJs || '',
                explain_jq: replaceKeyword(q.explainJq, q.skillkeyword),
                explain_mp3: attchementPath(q.explainMp3),
                question_mp3: attchementPath(q.issuemp3),
                explain_js_mp3: attchementPath(q.explainjsmp3),
                titlekeyword: q.titlekeyword || '',
                answerkeyword: q.answerkeyword || '',
                skillkeyword: q.skillkeyword || '',
                id_ydt: q.idYdt || 0,
                image_ydt: attchementPath(q.imageYdt)
            };
            questions.push(question);

            ['columnId', 'columnId2', 'columnId3', 'columnId4'].forEach((columnId) => {
                if (q[columnId]) {
                    let cid = realCateId(q[columnId]);
                    let cate = cateMap[cid];

                    if (!cate) {
                        return;
                    }

                    questionCates.push({
                        id: uid++,
                        cid: cate.id,
                        qid: question.id
                    });

                    if (cate.model === 'cart') {
                        questionCates.push({
                            id: uid++,
                            cid: cate.id + 1, // truck
                            qid: question.id
                        });
                        questionCates.push({
                            id: uid++,
                            cid: cate.id + 2, // bus
                            qid: question.id
                        });
                    }
                }
            });

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
            questionCates,
            files: unique(files)
        };
    }

    function generateSql (state) {

        let data = prepareData(state);

        return {
            cateSql: generateInsertSql('eb_training_category', data.cates, {maxRow: 100}),
            questionSql: generateInsertSql('eb_training_question', data.questions, {maxRow: 100}),
            questionCatesSql: generateInsertSql('eb_training_question_cates', data.questionCates, {maxRow: 100}),
            files: data.files.join('\n')
        };
    }

    function downloadSql (state) {
        let sqls = generateSql(state);

        download(sqls.cateSql, 'kth5-to-crmeb-jk-cates-20220412.sql');
        download(sqls.questionSql, 'kth5-to-crmeb-jk-questions-20220412.sql');
        download(sqls.questionCatesSql, 'kth5-to-crmeb-jk-question-cates-20220412.sql');
        download(sqls.files, 'kth5-to-crmeb-jk-files-20220412.csv');

        return sqls;
    }

    function loadAndRun () {
        return Promise.all([
            fetch('/data/kth5/kth5.liehuu-cates-2022-04-12.json').then(r => r.json()),
            fetch('/data/kth5/kth5.liehuu-questions-2022-04-12.json').then(r => r.json()),
            fetch('/data/kth5/kth5.liehuu-free-2022-04-12.json').then(r => r.json())
        ]).then(([cates, qs, free]) => {
            let state = {
                categories: unique(cates, 'id'),
                questions: unique(qs, 'id'),
                free
            };

            window.state = state;

            return downloadSql(state);
        });
    }

    function loadStateAndRun () {
        return Promise.all([
            fetch('/data/kth5/kth5.liehuu-state-20220421.json').then(r => r.json())
        ]).then(([state]) => {
            let data = {
                categories: unique(state.categories, 'id').sort((a,b) => a.id - b.id),
                questions: unique(state.questions, 'id').sort((a,b) => a.id - b.id),
                free: state.free.sort((a,b) => a.id - b.id),
            };

            window.state = data;

            return downloadSql(data);
        });
    }

    return loadStateAndRun;
}());

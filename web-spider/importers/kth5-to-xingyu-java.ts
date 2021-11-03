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

interface TTargetCategoryManage {
    id: number;
    content: string;
    number: number; // 分类数
    type: 1 | 2; // 科一， 科四
    car_type: 1 | 2 | 3 | 4; // 小车，货车，客车，摩托车
    topic_number: number; // 题目数
}

interface TTargetCategory {
    id: number;
    name: string;
    create_time: string; // datetime
    mid: number;
    number: number; // 题目数
    img?: string;
}

interface TTargetQuestion {
    id: number; // `id` bigint(20) NOT NULL AUTO_INCREMENT,
    mid: number; // `mid` bigint(20) DEFAULT NULL COMMENT '汽车题目类型',
    cat_id: number; // `cat_id` bigint(20) DEFAULT NULL COMMENT '技巧分类',
    title: string; // `title` varchar(512) DEFAULT NULL COMMENT '题目名称',
    image: string; // `image` varchar(128) DEFAULT NULL COMMENT '图片',
    content?: string; // `content` varchar(512) DEFAULT NULL,
    type: 1 | 2 | 3; // `type` int(4) DEFAULT NULL COMMENT '题目类型 1.单选题2.多选题3.判断题',
    create_time: string; // `create_time` datetime NOT NULL COMMENT '添加时间',
    update_time: string; // `update_time` datetime DEFAULT NULL COMMENT '更新时间',
    mp3: string; // `mp3` varchar(255) DEFAULT NULL COMMENT '读题',
    all_mp3: string; // `all_mp3` varchar(128) DEFAULT NULL COMMENT '读题+',
    help_content: string; // `help_content` varchar(512) DEFAULT NULL COMMENT '技巧讲解',
    help_mp3: string; // `help_mp3` varchar(255) DEFAULT NULL COMMENT '技巧讲解MP3',
    help_gif: string; // `help_gif` varchar(128) DEFAULT NULL COMMENT '技巧动图',
    help_important: string; // `help_important` varchar(128) DEFAULT NULL COMMENT '重点技巧文字',
    help_image: string; // `help_image` varchar(128) DEFAULT NULL COMMENT '帮助图片',
    free: 1 | 2; // `free` tinyint(4) NOT NULL DEFAULT '1' COMMENT '是否免费1.免费题库2.题库',
    free_time?: string; // `free_time` datetime DEFAULT NULL COMMENT '添加免费试题的时间',
}

interface TTargetOption {
    id: number;
    qid: number;
    option_content: string;
    create_time: string;
    is_right: 1 | 2; // 1 对 2 错
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

function attchementPath (uri, prefix = '/kth5/statics') {

    uri = uri && uri.trim();

    if (uri) {
        let url = new URL(uri);
        let path = url.pathname + url.search;

        return prefix ? prefix + path : path;
    }

    return '';
}

function realCateId (columnId) {
    return columnId > 1000 ? columnId - 1000 : columnId < 0 ? 0 : columnId;
}

let typeMap = {
    2: 1, // 单选
    3: 2, // 多选
    1: 3 // 判断
};

let modelMap = {
    'cart': '小车',
    'bus': '客车',
    'truck': '货车',
    'mtc': '摩托车'
};

function realSubject (subject) {
    return subject.indexOf('k1') ? '科目一' : '科目四';
}

function categoryManageTitle (model, subject) {
    return modelMap[model] + '-' + (subject.indexOf('k1') ? '科目一' : '科目四');
}

function prepareData (categories: TCategory[], qs: TQuestion[]) {

    let midUid = 1;
    let manageMap = {};
    let categoryManages: TTargetCategoryManage[] = [];

    let categoryMap = {};

    let optionUid = 1;
    let options: TTargetOption[] = [];

    let cates: TTargetCategory[] = categories.map((cate) => {

        let mkey = cate.model + '_' + realSubject(cate.subject);
        let manage = manageMap[mkey];
        let mid = manage ? manage.id : 0;

        if (!mid) {
            mid = midUid++;
            manage = manageMap[mid] = manageMap[mkey] = {
                id: mid,
                content: categoryManageTitle(cate.model, cate.subject),
                number: 0,
                type: cate.subject.indexOf('k1') !== -1 ? 1 : 2,
                car_type: ['', 'cart', 'truck', 'bus', 'mtc'].indexOf(cate.model),
                topic_number: 0
            };

            categoryManages.push(manage);
        }

        manage.number++;

        let category: TTargetCategory = {
            id: Number(cate.id),
            name: cate.title,
            create_time: '2021-10-31 19:29:30', // datetime
            mid: mid,
            number: 0, // 题目数
            img: cate.icon
        };

        categoryMap[cate.id] = category;

        return category;
    });

    let questions: TTargetQuestion[] = [];

    unique(qs, 'id').forEach((q) => {

        let cid = realCateId(q.columnId) || realCateId(q.columnId2) || realCateId(q.columnId3);

        if (!cid) {
            // console.log("地方题库", cid, q);
            return;
        }

        let category: TTargetCategory = categoryMap[cid];

        if (!category) {
            console.error('category error', cid, q);
            return;
        }

        let manage: TTargetCategoryManage = manageMap[category.mid];
        let mid = manage.id;

        category.number++;
        manage.topic_number++;

        let question: TTargetQuestion = {
            id: q.id,
            mid: mid,
            cat_id: cid,
            title: q.issue,
            image: attchementPath(q.image),
            type: typeMap[q.type],
            create_time: '2021-10-31 19:29:30',
            update_time: '2021-10-31 19:29:30',
            mp3: attchementPath(q.issuemp3),
            all_mp3: attchementPath(q.issuemp3),
            help_content: q.explainJq,
            help_mp3: attchementPath(q.explainMp3),
            help_gif: attchementPath(q.explainGif),
            help_important: q.skillkeyword,
            help_image: attchementPath(q.explainGif),
            free: 2
        };

        let hasRight = false;
        let answers = q.answer.split('-');
        q.opts.split('-').forEach((option) => {
            let isRight = answers.indexOf(option) !== -1;

            if (isRight) {
                hasRight = true;
            }

            options.push({
                id: optionUid++,
                qid: q.id,
                option_content: option,
                create_time: '2021-10-31 19:29:30',
                is_right: isRight ? 1 : 2
            });
        });

        if (!hasRight) {
            console.error('未匹配到正确答案', q);
        }

        questions.push(question);
    });

    let filterCates: TTargetCategory[] = [];

    cates.forEach((cate) => {
        if (cate.number) {
            filterCates.push(cate);
        }
        else {
            let manage = manageMap[cate.mid];
            manage.number--;
        }
    });

    return {
        categoryManages,
        cates: filterCates,
        questions,
        options
    };
}

function generateSql (cates, qs) {

    let data = prepareData(cates, qs);

    return {
        cateManageSql: generateInsertSql('t_category_manage', data.categoryManages, {maxRow: 100}),
        cateSql: generateInsertSql('t_category', data.cates, {maxRow: 100}),
        questionSql: generateInsertSql('t_question', data.questions, {maxRow: 100}),
        optionsSql: generateInsertSql('t_option', data.options, {maxRow: 100}),
    };
}

function downloadSql (cates, qs) {
    let sqls = generateSql(cates, qs);

    download(sqls.cateManageSql, 'kth5-to-xingyu-java-cate-manage.sql');
    download(sqls.cateSql, 'kth5-to-xingyu-java-cates.sql');
    download(sqls.questionSql, 'kth5-to-xingyu-java-questions.sql');
    download(sqls.optionsSql, 'kth5-to-xingyu-java-options.sql');

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

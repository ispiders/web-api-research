// CREATE TABLE `dd_question` (
//   `id` int(11) NOT NULL AUTO_INCREMENT,
//   `subject` varchar(255) DEFAULT NULL, # 科目
//   `bank` varchar(255) DEFAULT NULL, # 题库
//   `cate` varchar(255) DEFAULT NULL, # 21 多选, 26 判断, 29 单选
//   `type` varchar(255) DEFAULT NULL, # 类型
//   `vip` varchar(255) DEFAULT NULL,
//   `title` varchar(255) DEFAULT NULL,
//   `option1` varchar(255) DEFAULT NULL COMMENT '选项1',
//   `option2` varchar(255) DEFAULT NULL COMMENT '选项2',
//   `option3` varchar(255) DEFAULT NULL COMMENT '选项3',
//   `option4` varchar(255) DEFAULT NULL COMMENT '选项4',
//   `anwser` varchar(255) DEFAULT NULL COMMENT '答案', # 多选逗号分隔
//   `media` varchar(255) DEFAULT NULL COMMENT '图片或者视频',
//   `tips` text DEFAULT NULL COMMENT '技巧，提示',
//   `create_time` int(11) DEFAULT NULL,
//   `speech_content` varchar(255) DEFAULT NULL COMMENT '题目朗读内容',
//   `speech_tips` varchar(255) DEFAULT NULL COMMENT '技巧朗读内容',
//   `anwser_img` varchar(255) NOT NULL,
//   `keywords` varchar(255) NOT NULL,
//   `speech_exa` varchar(255) NOT NULL COMMENT '试题详解朗读内容',
//   PRIMARY KEY (`id`)
// ) ENGINE=MyISAM AUTO_INCREMENT=2013 DEFAULT CHARSET=utf8 COMMENT='题库'

// "id": "1537",
// "question": "动画1中有几种违法行为？",
// "an1": "一种违法行为",
// "an2": "二种违法行为",
// "an3": "三种违法行为",
// "an4": "四种违法行为",
// "answertrue": "2", # 多选无分隔
// "imageurl": "http://img.58cdn.com.cn/dist/jxedt/app/static/img/kaoshi_p/_40001.gif",
// "explain": "有2种违法行为：1、打电话；2、不系安全带！",
// "bestanswerid": "2601465",
// "type": "2", # 1 判断 ，2 单选，3 多选
// "chapterid": "1",
// "sinaimg": "",
// "sohuimg": "",
// "cateid": ""

let tags = [];
let tagMap = {};
let tagID = 10;
let subjectNames = {
    '1': '科目一',
    '4': '科目四',
    'zgz': '资格证'
};
// ky|hy|wxp|jl|czc|wyc
let carNames = {
    'a': '客车',
    'b': '货车',
    'c': '小车',
    'e': '摩托车',
    'ky': '客运',
    'hy': '货运',
    'wxp': '危险品',
    'jl': '教练',
    'czc': '出租车',
    'wyc': '网约车'
};
let groupNames = {
    'sxlx': '顺序练习',
    'zjlx': '章节练习',
    'zxlx': '专项练习'
};

interface TTag {
    pid: number;
    id: number;
    type: string;
    name: string;
}

function parseTags (car: string, km: string, group: string, chapter: string) {

    let subject = 'km' + km;
    let bank = subject + '-car' + car;
    let typeGroup = bank + '-' + group;
    let type: string | undefined = undefined;

    if (chapter) {
        type = bank + '-' + group + '-' + chapter;
    }

    let tags = {
        subject,
        bank,
        typeGroup,
        type
    };

    return tags;
}

function createTag (tags: TTag[], car: string, km: string, group: string, chapter: string, title: string) {

    let ts = parseTags(car, km, group, chapter);

    let subject = ts.subject;

    let subjectTag = tagMap[subject];

    if (!subjectTag) {
        subjectTag = tagMap[subject] = {
            pid: 0,
            id: tagID++,
            type: 'subject',
            name: subjectNames[km]
        };

        tags.push(subjectTag);
    }

    let bank = ts.bank;
    let bankTag = tagMap[bank];

    if (!bankTag) {
        bankTag = tagMap[bank] = {
            pid: subjectTag.id,
            id: tagID++,
            type: 'bank',
            name: carNames[car] + subjectTag.name
        };

        tags.push(bankTag);
    }

    let typeGroup = ts.typeGroup;
    let typeGroupTag = tagMap[typeGroup];

    if (!typeGroupTag) {
        typeGroupTag = tagMap[typeGroup] = {
            pid: bankTag.id,
            id: tagID++,
            type: 'group',
            name: groupNames[group]
        };

        tags.push(typeGroupTag);
    }

    if (chapter) {
        let type = ts.type;
        let typeTag = tagMap[type];

        if (typeTag) {
            throw new Error('tag conflict:' + type);
        }

        typeTag = tagMap[type] = {
            pid: bankTag.id,
            id: tagID++,
            type: 'type',
            name: title
        };

        tags.push(typeTag);
    }
}

let mnksReg = /\/([abce])km([14])\/(z[jx]lx)(?:\/(\d+))?/i;
let zgzksReg = /\/(ky|hy|wxp|jl|czc|wyc)\/(z[jx]lx)(?:\/(\d+))?/i;

function generateTags (state) {

    let cats = state.cats.map((item, index) => {

        let cat = {
            car: '',
            km: '',
            group: '',
            chapter: '',
            title: ''
        };

        if (mnksReg.test(item.url)) {

            let match = item.url.match(mnksReg);

            cat = {
                car: match[1],
                km: match[2],
                group: match[3],
                chapter: match[4],
                title: item.title
            };

            createTag(tags, cat.car, cat.km, cat.group, cat.chapter, cat.title);
        }
        else if (zgzksReg.test(item.url)) {

            let match = item.url.match(zgzksReg);

            cat = {
                car: match[1],
                km: 'zgz',
                group: match[2],
                chapter: match[3],
                title: item.title
            };

            createTag(tags, cat.car, cat.km, cat.group, cat.chapter, cat.title);
        }
        else {
            console.error('unmatched url: ' + item.url);
        }

        return cat;
    });

    return cats;
}

function safeSql (str) {

    str = String(str);

    return "'" + str.replace(/[\'\\]/g, (match) => '\\' + match[0]) + "'";
}

function generateTagsSql (tags) {

    let sql = 'truncate table `dd_tags`;\ninsert into `dd_tags` (`pid`, `id`, `type`, `name`) values \n';

    sql += '(0, 1, \'cate\', \'判断题\'), \n';
    sql += '(0, 2, \'cate\', \'单选题\'), \n';
    sql += '(0, 3, \'cate\', \'多选题\'), \n';

    let values = tags.map((tag) => {

        return '(' + [tag.pid, tag.id, safeSql(tag.type), safeSql(tag.name)].join(',') + ')';
    });

    return sql + values.join(',\n') + ';';
}

function parseUrl (url: string) {

    let cat = {
        car: '',
        km: '',
        group: '',
        chapter: ''
    };

    if (mnksReg.test(url)) {

        let match = url.match(mnksReg);

        cat = {
            car: match[1],
            km: match[2],
            group: match[3],
            chapter: match[4]
        };
    }
    else if (zgzksReg.test(url)) {

        let match = url.match(zgzksReg);

        cat = {
            car: match[1],
            km: 'zgz',
            group: match[2],
            chapter: match[3]
        };
    }
    else {
        console.error('unmatched url ', url);
    }

    return cat;
}

function generateQidMap (state) {

    let qids = [];
    let qidMap = {};

    state.qids.forEach((item, index) => {

        let cat = parseUrl(item.url);
        let tags = parseTags(cat.car, cat.km, cat.group, cat.chapter);
        let ids = item.ids;

        ids.forEach((qid) => {

            let q = qidMap[qid];

            if (!q) {
                q = qidMap[qid] = {
                    subject: [tags.subject],
                    bank: [tags.bank],
                    typeGroup: [tags.typeGroup],
                    type: tags.type ? [tags.type] : []
                };
            }
            else {

                if (q.subject.indexOf(tags.subject) === -1) {
                    q.subject.push(tags.subject);
                }

                if (q.bank.indexOf(tags.bank) === -1) {
                    q.bank.push(tags.bank);
                }

                if (q.typeGroup.indexOf(tags.typeGroup) === -1) {
                    q.typeGroup.push(tags.typeGroup);
                }

                if (tags.type && q.type.indexOf(tags.type) === -1) {
                    q.type.push(tags.type);
                }
            }
        });

        qids = qids.concat(ids);
    });

    qids = unique(qids).sort((a, b) => a - b);

    return {
        qids,
        qidMap
    };
}

function getQuestionTag (qid, qidMap, tagMap) {

    let tagName = qidMap[qid];

    return {
        subject: tagName.subject.map((name) => tagMap[name].id),
        bank: tagName.bank.map((name) => tagMap[name].id),
        type: tagName.type.map((name) => tagMap[name].id)
    };
}

function generateQuestionSql (questions, qidMap, tagMap) {

    let sql = 'truncate table `dd_question`;\ninsert into `dd_question`'
    + '(`id`,`cate`,`subject`,`bank`,`type`,`title`,`option1`,`option2`,`option3`,`option4`,`anwser`,`media`,`tips`,`anwser_img`,`keywords`,`speech_exa`)'
    + ' values ';
    let qids = Object.keys(questions).sort((a, b) => a - b);

    let values = questions.map((q) => {

        let tag = getQuestionTag(q.id, qidMap, tagMap);

        if (q.Type === '1') { // 判断题
            if (!q.a) {
                q.a = '正确';
            }

            if (!q.b) {
                q.b = '错误';
            }
        }

        return '(' + [
            q.id,
            safeSql(q.Type),
            safeSql(tag.subject),
            safeSql(tag.bank),
            safeSql(tag.type),
            safeSql(q.question),
            safeSql(q.a),
            safeSql(q.b),
            safeSql(q.c),
            safeSql(q.d),
            safeSql(q.ta.split('').map(n => n - 1).join(',')), // 答案 index 两边计数方式不一样
            safeSql(q.imageurl),
            safeSql(q.bestanswer),
            safeSql(''),
            safeSql(''),
            safeSql(q.bestanswer)
        ].join(',') + ')';
    });

    return sql + values.join(',\n') + ';';
}

function loadFromLocal () {

    return fetch('./data/jxedt.json').then(r => r.json()).then((state) => {

        generateTags(state);

        state.tagSql = generateTagsSql(tags);

        return state;
    }).then(state => {
        let {qids, qidMap} = generateQidMap(state);

        state.questionIds = qids;
        state.qidMap = qidMap;

        return state;
    }).then(state => {

        return fetch('./data/questions.json').then(r => r.json()).then((questions) => {

            state.questionSql = generateQuestionSql(questions, state.qidMap, tagMap);

            return state;
        });
    });
}

// let state = loadFromLocal();

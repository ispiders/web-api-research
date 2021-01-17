spider = new Spider({});

function main () {

    let host = 'https://app.kuaitongjiakao.com';
    let models = ['cart', 'bus', 'truck', 'mtc'];
    let subjects = ['k1', 'k4'];

    models.forEach((model) => {
        subjects.forEach((km) => {

            ['', 2, 3, 4].forEach((type) => {
                let subject = type ? km + '_' + type : km;

                spider.addTask(
                    `${host}/skill/getColumn?model=${model}&subject=${subject}`,
                    {},
                    {
                        category: true,
                        model: model,
                        subject: subject
                    }
                );
            });
        });
    });

    spider.addRule({
        match: function (task) {
            return task.data.category;
        },
        dataType: 'text',
        parse: function (spider, text, task) {

            let response = parseJSON(text);

            spider.state.categories = spider.state.categories.concat(response.data);

            response.data.forEach((category, index) => {
                category.index = index;
            });

            if (task.data.subject.indexOf('_') === -1) {
                response.data.forEach((category, index) => {

                    spider.addTask(
                        `${host}/question/getQuestions?model=${task.data.model}&columnid=${category.id}&subject=${task.data.subject}`,
                        {},
                        {
                            questions: true,
                            model: task.data.model,
                            subject: task.data.subject
                        }
                    );
                });
            }
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.questions;
        },
        dataType: 'text',
        parse: function (spider, text, task) {

            let response = parseJSON(text);

            spider.state.questions = spider.state.questions.concat(response.data);
        }
    });

    spider.state = {
        categories: [],
        questions: []
    };

    spider.run();
}

function filename (url) {
    return url.split('/').pop();
}

function generateSql () {

    let cateid = 120;
    let categorySql = 'delete from ims_quickpass_drivingtest_category where model="mtc";\n';
    let cateMap = {};

    categorySql += `insert into ims_quickpass_drivingtest_category (id, model, subject, title, icon, sort) values \n`;

    categorySql += spider.state.categories.map((category) => {

        let cid = cateid++;

        cateMap[1000 + category.id] = cid + 1000;

        return '(' + [
            cid,
            JSON.stringify(category.model),
            JSON.stringify(category.subject),
            JSON.stringify(category.title),
            JSON.stringify(`/addons/drivingtest_lulutong/style/mobile/icon/card${category.index + 1}.png`),
            category.index
        ].join(',') + ')';
    }).join(',\n') + ';\n';

    let questionSql = `delete from ims_quickpass_drivingtest_questions where model="mtc";\ninsert into ims_quickpass_drivingtest_questions (id, model, subject, column_id, column_id2, column_id3, column_id4, number, type, issue, image, opts, answer, highlight, explain_gif, explain_mp3, free) values \n`;
    let images = [];
    let audios = [];

    let questions = spider.state.questions.sort((a, b) => a.id - b.id);

    questionSql += questions.map((question) => {

        question.imageUrl = '';
        question.imageYdtUrl = '';
        question.explainMp3Url = '';

        if (question.image) {
            images.push(question.image);
            question.imageUrl = '/attachment/images/mtc/' + filename(question.image);
        }
        if (question.imageYdt) {
            images.push(question.imageYdt);
            question.imageYdtUrl = '/attachment/images/mtc/' + filename(question.imageYdt);
        }
        if (question.explainMp3) {
            audios.push(question.explainMp3);
            question.explainMp3Url = '/attachment/audios/mtc/' + filename(question.explainMp3);
        }

        return '(' + [
            question.id,
            JSON.stringify(question.model),
            JSON.stringify(question.subject),
            cateMap[question.columnId] || 0,
            cateMap[question.columnId2] || 0,
            cateMap[question.columnId3] || 0,
            cateMap[question.columnId4] || 0,
            1, // 排序
            question.type,
            JSON.stringify(question.issue),
            JSON.stringify(question.imageUrl),
            JSON.stringify(question.opts),
            JSON.stringify(question.answer),
            JSON.stringify(question.titlekeyword),
            JSON.stringify(question.imageYdtUrl),
            JSON.stringify(question.explainMp3Url),
            0
        ].join(',') + ')';
    }).join(',\n') + ';\n';

    console.log(images.join('\n'));
    console.log(audios.join('\n'));

    return categorySql + questionSql;
}

main();


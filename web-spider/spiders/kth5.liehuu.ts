spider = new Spider({});

function main () {

    // 直接访问以下地址
    // https://kth5.liehuu.com/h5/pages/skill/required?columnZh=%E5%88%86%E7%B1%BB%E7%BB%83%E4%B9%A0&model=cart&subject=k1_3
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

            // if (task.data.subject.indexOf('_') === -1) { // 顺序练习，包含了分类和精选
            // if (task.data.subject.indexOf('_4') !== -1) { // 地方题库不在顺序练习内
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
            // }
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

main();


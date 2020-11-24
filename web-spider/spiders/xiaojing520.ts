
spider = new Spider();

spider.addRule({
    // http://aqfykljk.ldyhxny.com/WebControls/Handler/HandlerType.ashx?lan=1&Jia=${car}&Kemu=${km}&Tid=1&YY=1
    match: (task) => {
        return task.url.indexOf('/Home/Index/chaptertest/type/all/course/') !== -1;
    },
    // dataType: 'text',
    parse: (spider, dom, task) => {

        let list = dom.querySelectorAll('.num-list');
        let qids = [];
        let course = parseInt(task.url.split('/').pop());

        for (let i = 0; i < list.length; i++) {
            let order = list[i].getAttribute('data-id');

            spider.addTask('https://tirnir.xiaojing520.club/index.php?s=/Home/Index/get_questions.html', {
                method: 'post',
                body: `order=${order}&course=${course}`,
                headers: {
                    'content-type': 'application/x-www-form-urlencoded'
                }
            }, {
                order: order,
                course: course
            });
        }
    }
});

spider.addRule({
    match: (task) => {
        return task.url.indexOf('/Home/Index/get_questions.html') !== -1;
    },

    parse: (spider, dom, task) => {

        let question = {
            id: $(dom).find('input[name=id]').get(0).value,
            title: $(dom).find('.title_test').get(0).textContent,
            pic: $(dom).find('#cover_pic').attr('src'),
            pic1: $(dom).find('body').html().match(/\$\([\"\']#cover_pic[\"\']\)\.attr\([\"\']src[\"\'],[\"\'](.*)[\"\']\);/)[1],
            audio: $(dom).find('body').html().match(/audio\.src\s*=\s*[\"\'](.*)[\"\']/)[1],
            options: $(dom).find('.option_test li').toArray().map((li) => {

                let answer = li.getAttribute('data-answer');

                if (!answer) {
                    throw new Error('data-answer is empty');
                }

                return {
                    answer: parseInt(answer),
                    text: li.textContent
                };
            }),
            course: task.data.course,
            order: task.data.order
        };

        if (!question.id) {
            console.error('failed', task.url);
            spider.state.failed.push(task.data);
            return;
        }

        if (spider.state.questions[question.id]) {
            console.error('重复题目', question);
        }

        spider.state.questions[question.id] = question;

        let host = 'https://tirnir.xiaojing520.club';
        if (question.pic && question.pic.indexOf('http') !== 0) {
            question.pic = host + question.pic;
        }
        else {
            question.pic = '';
        }

        if (question.pic1 && question.pic1.indexOf('http') !== 0) {
            question.pic1 = host + question.pic1;
        }

        if (question.audio && question.audio.indexOf('http') !== 0) {
            question.audio = host + question.audio;
        }

        let id = question.id;
        let answer = question.options[0].answer;
        spider.addTask('https://tirnir.xiaojing520.club/index.php?s=/Home/Index/set_answer.html', {
            method: 'post',
            body: `id=${id}&answer=${answer}`,
            headers: {
                'content-type': 'application/x-www-form-urlencoded'
            }
        }, {
            id: id,
            answer: answer
        });
    }
});

spider.addRule({
    match: (task) => {
        return task.url.indexOf('/Home/Index/set_answer.html') !== -1;
    },
    dataType: 'text',
    parse: (spider, text, task) => {

        let response = JSON.parse(text);
        let question = spider.state.questions[task.data.id];

        question.answer = response;

        if (response.ok && response.data_answer !== task.data.answer) {
            console.error('答案对不上拉', response, task.data);
        }
    }
});

spider.addTask('https://tirnir.xiaojing520.club/index.php?s=/Home/Index/chaptertest/type/all/course/1.html');
spider.addTask('https://tirnir.xiaojing520.club/index.php?s=/Home/Index/chaptertest/type/all/course/4.html');

spider.state = {
    questions: {},
    failed: []
};

spider.run();

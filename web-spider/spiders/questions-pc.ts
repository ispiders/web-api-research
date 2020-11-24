// let ids = [];

spider = new Spider();

spider.addRule({
    match: function () {
        return true;
    },
    dataType: 'text',
    parse: function (spider, text, url) {

        spider.state.questions.push(parseJSON(text));
    }
});

ids.forEach((id) => {

    spider.addTask(`http://mnks.jxedt.com/get_question?index=${id}`);
});

spider.state = {
    questions: []
};

spider.run();

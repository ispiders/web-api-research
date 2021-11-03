spider = (function () {

let spider = new Spider({
    categories: [],
    questions: []
});

// duti 资源规则 md5(id + 'kljk888')

function main () {
    spider.addRule({
        match: (task) => {
            return task.data.catelist;
        },
        parse: (spider, doc: Document, task) => {

        }
    });
}

return spider;

}());
spider = (function () {

interface TCategory {
    name: string;
    url: string;
    tag?: string;
}

interface TSign {
    title: string;
    desc: string;
    image: string;
}

let spider = new Spider({
    categories: [] as TCategory[],
    signs: [] as TSign[]
});

function main () {

    spider.addTask(`https://www.jiakaobaodian.com/sign/flag/`, {}, {
        signIndex: true
    });

    spider.addRule({
        match: function (task) {
            return task.data.signIndex;
        },
        dataType: 'html',
        parse: function (spider, doc, task) {

            let level1 = [...doc.querySelectorAll('.com-tree-w .level-1 > li')];
            let cates = spider.state.categories;

            level1.forEach((li) => {
                let el = li.querySelector('ul.level-2');
                let a = li.querySelector('a');

                if (!el) {
                    let cate = {
                        name: a.innerText.trim(),
                        url: a.href
                    };

                    cates.push(cate);

                    spider.addTask(a.href, {}, {
                        signList: true,
                        cate
                    });
                }
                else {
                    let level2 = [...el.querySelectorAll('li > a')];

                    level2.forEach((item) => {

                        let cate = {
                            name: item.innerText.trim(),
                            url: item.href,
                            tag: a.innerText.trim()
                        };

                        cates.push(cate);

                        spider.addTask(item.href, {}, {
                            signList: true,
                            cate
                        });
                    });
                }
            });

            spider.state.categories = cates;
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.signList;
        },
        parse: function (spider, doc, task) {
            let lis = [...doc.querySelectorAll('.com-sign-container > ul > li')];

            lis.forEach((li) => {
                let sign = {
                    title: li.querySelector('.title').innerText.trim(),
                    desc: li.querySelector('.img-div').getAttribute('data-desc'),
                    image: li.querySelector('img').src,
                    cate: task.data.cate.name
                };

                spider.state.signs.push(sign);
            });
        }
    })

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

return spider;

}());
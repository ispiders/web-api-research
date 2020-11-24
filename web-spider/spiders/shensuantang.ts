spider = new Spider({
    jmcates: [],
    jms: []
});

type Spi = typeof spider;

const jmlistApi = 'https://m.shensuantang.com/zhougongjiemeng/index/addmorezhougongjiemeng.html';

// 解梦任务入口
spider.addTask('https://m.shensuantang.com/zhougongjiemeng/', {}, {jmcate: true});

// 解梦分类入口
spider.addRule({
    match: (task) => {
        return task.data.jmcate;
    },
    parse: (spider: Spi, doc: HTMLDocument, task: Task) => {

        let links = [...doc.querySelectorAll<HTMLAnchorElement>('.sst-index_grid a[href]')];

        links.forEach((a) => {
            let match = a.href.match(/category\/(\d+)/);

            if (match) {
                let id = parseInt(match[1]);

                spider.state.jmcates.push({
                    id: id,
                    title: a.innerText.trim()
                });

                spider.addTask(`${jmlistApi}?category=${id}&page=1`, {}, {
                    cate: id,
                    page: 1,
                    jmlist: true
                });
            }
        });
    }
});

// 解梦链接列表接口
spider.addRule({
    match: (task) => {
        return task.data.jmlist;
    },
    dataType: 'text',
    parse: (spider, text, task) => {

        let json = JSON.parse(text);

        if (json && json.status === 1 && json.html) {
            let doc = parseHTML(json.html);
            let links = [...doc.querySelectorAll<HTMLAnchorElement>('a[href]')];
            let nextPage = task.data.page + 1;

            links.forEach((a) => {
                spider.addTask(a.href, {}, {
                    jmdetail: true,
                    cate: task.data.cate
                });
            });

            // 继续下一页
            spider.addTask(`${jmlistApi}?category=${task.data.cate}&page=` + nextPage, {}, {
                cate: task.data.cate,
                page: nextPage,
                jmlist: true
            });
        }
        else {
            // 没有获取到数据
        }
    }
});

// 解梦详情
spider.addRule({
    match: (task) => {
        return task.data.jmdetail;
    },
    parse: (spider: Spi, doc: HTMLDocument, task) => {

        let match = task.url.match(/cat_id\/(\d+)/);
        let article = doc.querySelector<HTMLElement>('article');
        let h1 = doc.querySelector<HTMLHeadingElement>('article h1');
        let id = match ? match[1] : '';

        if (!id) {
            throw new Error('解梦详情链接出错' + task.url);
        }

        if (!h1 || !article) {
            throw new Error('解梦详情html结构出错' + task.url);
        }

        article.removeChild(h1);

        spider.state.jms.push({
            id: id,
            title: h1.innerText.trim(),
            content: article.innerText.trim(),
            cate: task.data.cate
        });
    }
});

spider.cache = true;
spider.run();

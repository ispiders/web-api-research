spider = new Spider({
    qmcates: [],
    articles: [],
    finishedCate: {}
});

// 起名任务入口
spider.addTask('https://www.dishen.com/qm/bbqm/', {}, {qmcate: true});

// 起名分类入口
spider.addRule({
    match: (task) => {
        return task.data.qmcate;
    },
    parse: (spider: Spi, doc: HTMLDocument, task: Task) => {

        let links = [...doc.querySelectorAll<HTMLAnchorElement>('#divSectionNav a[href]')];

        links.forEach((a) => {
            let match = a.href.match(/qm\/([^\/]+)/);

            if (match) {
                let alias = match[1];

                spider.state.qmcates.push({
                    alias: alias,
                    title: a.innerText.trim(),
                    href: a.href
                });

                spider.addTask(a.href + 'list_1.html', {}, {
                    cate: alias,
                    page: 1,
                    qmlist: true,
                    url: a.href
                });
            }
        });
    }
});

// 起名链接列表接口
spider.addRule({
    match: (task) => {
        return task.data.qmlist;
    },
    parse: (spider: Spider<any>, doc: HTMLDocument, task) => {

        let links = [...doc.querySelectorAll<HTMLAnchorElement>('#listPage1 a[href]')];
        let nextPage = task.data.page + 1;

        if (links.length) {
            links.forEach((a) => {
                spider.addTask(a.href, {}, {
                    qmdetail: true,
                    cate: task.data.cate
                });
            });

            if (!spider.state.finishedCate[task.data.cate]) {
                // 继续下一页
                spider.addTask(task.data.url + `list_${nextPage}.html`, {}, {
                    cate: task.data.cate,
                    page: nextPage,
                    qmlist: true,
                    url: task.data.url
                });
            }
        }
        else {
            // 没有下一页
        }
    }
});

// 起名详情
spider.addRule({
    match: (task) => {
        return task.data.qmdetail;
    },
    parse: (spider: Spi, doc: HTMLDocument, task) => {

        let match = task.url.match(/qm\/(\d+)\.html/);
        let article = doc.querySelector<HTMLElement>('.article-detail');
        let title = article && article.querySelector<HTMLHeadingElement>('.title');
        let content = article && article.querySelector<HTMLElement>('.text');
        let info = article && article.querySelector<HTMLElement>('.info');
        let id = match ? match[1] : '';

        if (!id) {
            throw new Error('起名文章详情链接出错' + task.url);
        }

        if (!article || !title || !content || !info) {
            throw new Error('起名文章详情html结构出错' + task.url);
        }

        // 移除注入的网站信息
        if (content.lastElementChild) {
            content.removeChild(content.lastElementChild);
        }

        let img = '';
        let images = [...content.querySelectorAll<HTMLImageElement>('img')];

        images.forEach((item) => {
            let src = item.getAttribute('data-src') || item.src;

            if (!img && src) {
                img = src;
            }

            item.setAttribute('src', src);
            item.removeAttribute('onerror');
            item.removeAttribute('onclick');
            item.removeAttribute('data-src');
        });

        let dateMatch = info.innerText.match(/\d{4}-\d{1,2}-\d{1,2}/);
        let date = new Date();

        if (dateMatch) {
            date = new Date(dateMatch[0]);
        }

        spider.state.articles.push({
            id: id,
            title: title.innerText.trim(),
            content: content.innerHTML.trim(),
            cate: task.data.cate,
            img: img,
            date: date.getTime()
        });

        if (date.getFullYear() < 2020) {
            spider.state.finishedCate[task.data.cate] = 1;
        }
    }
});

spider.cache = true;
spider.run();

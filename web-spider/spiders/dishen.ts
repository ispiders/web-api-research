spider = (function () {

    interface ICate {
        alias: string;
        title: string;
        href: string;
        topcate: string;
    }

    interface IArticle {
        id: number;
        title: string;
        content: string;
        cate: string;
        img: string;
        date: number;
    }

    let spider = new Spider({
        cates: [] as ICate[],
        articles: [] as IArticle[],
        finishedCate: {}
    });

    type Spi = typeof spider;

    // 起名任务入口
    spider.addTask('https://www.dishen.com/qm/bbqm/', {}, {topcate: 'qm', root: true});

    // 星座入口
    spider.addTask('https://www.dishen.com/xz/love/', {}, {topcate: 'xz', root: true});

    // 分类入口
    spider.addRule({
        match: (task) => {
            return task.data.topcate && task.data.root;
        },
        parse: (spider: Spi, doc: HTMLDocument, task: Task) => {

            let links = [...doc.querySelectorAll<HTMLAnchorElement>('.list-hd-innerwrap a[href]')];

            links.forEach((a) => {
                let path = a.href.replace(/^\/|\/$/g, '');
                let alias = path.split('/' + task.data.topcate + '/')[1];

                if (alias) {

                    spider.state.cates.push({
                        alias: alias,
                        title: a.innerText.trim(),
                        href: a.href,
                        topcate: task.data.topcate
                    });

                    spider.addTask(a.href + 'list_1.html', {}, {
                        cate: alias,
                        topcate: task.data.topcate,
                        page: 1,
                        list: true,
                        url: a.href
                    });
                }
            });
        }
    });

    // 链接列表接口
    spider.addRule({
        match: (task) => {
            return task.data.list;
        },
        parse: (spider: Spider<any>, doc: HTMLDocument, task) => {

            let links = [...doc.querySelectorAll<HTMLAnchorElement>('.list-bd a[href]')];
            let nextPage = task.data.page + 1;

            if (links.length) {
                links.forEach((a) => {
                    spider.addTask(a.href, {}, {
                        article: true,
                        cate: task.data.cate,
                        topcate: task.data.topcate
                    });
                });

                if (!spider.state.finishedCate[task.data.topcate + '/' + task.data.cate]) {
                    // 继续下一页
                    spider.addTask(task.data.url + `list_${nextPage}.html`, {}, {
                        cate: task.data.cate,
                        topcate: task.data.topcate,
                        page: nextPage,
                        list: true,
                        url: task.data.url
                    });
                }
            }
            else {
                // 没有下一页
            }
        }
    });

    // 文章详情
    spider.addRule({
        match: (task) => {
            return task.data.article;
        },
        parse: (spider: Spi, doc: HTMLDocument, task) => {

            let match = task.url.match(/\/(\d+)\.html/);
            let article = doc.querySelector<HTMLElement>('.article-detail');
            let title = article && article.querySelector<HTMLHeadingElement>('.title');
            let content = article && article.querySelector<HTMLElement>('.text');
            let info = article && article.querySelector<HTMLElement>('.info');
            let id = match ? match[1] : '';

            if (!id) {
                throw new Error('文章详情链接出错' + task.url);
            }

            if (!article || !title || !content || !info) {
                throw new Error('文章详情html结构出错' + task.url);
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
                spider.state.finishedCate[task.data.topcate + '/' + task.data.cate] = 1;
            }
        }
    });

    spider.cache = true;
    spider.run();

    return spider;
}());

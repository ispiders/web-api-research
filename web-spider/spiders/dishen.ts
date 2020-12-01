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
    // spider.addTask('https://www.dishen.com/qm/bbqm/', {}, {topcate: 'qm', root: true});

    // 星座入口
    // spider.addTask('https://www.dishen.com/xz/love/', {}, {topcate: 'xz', root: true});

    // 解梦入口
    spider.addTask('https://www.dishen.com/jm/rw/', {}, {topcate: 'jm', root: true});

    // 分类入口
    spider.addRule({
        match: (task) => {
            return task.data.topcate && task.data.root;
        },
        parse: (spider: Spi, doc: HTMLDocument, task: Task) => {

            let links = [...doc.querySelectorAll<HTMLAnchorElement>('.list-hd-content a[href]')];

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

            if (date.getFullYear() < 2020 && task.data.topcate !== 'jm') {
                spider.state.finishedCate[task.data.topcate + '/' + task.data.cate] = 1;
            }
        }
    });

    spider.cache = true;
    spider.run();

    function genImportSql (cates: ICate[], articles: IArticle[], limit: number = 0) {
        let cateidAutoIncrement = 300;
        let articleAutoIncrement = 20000;

        const topcateIdMap = {
            'xz': 18,
            'qm': 19,
            'jm': 25,
        };

        const cateMap: {[alias: string]: ICate} = {};
        const cateIdMap = cates.reduce((ret, cate) => {

            let catid = cateidAutoIncrement++;

            ret[cate.alias] = catid;
            cateMap[cate.alias] = cate;

            return ret;
        }, {} as {[alias: string]: number});

        function mapCateData (cate: ICate) {

            let catid = cateIdMap[cate.alias];
            let parentid = topcateIdMap[cate.topcate || 'qm'];

            return {
                catid: catid,
                catname: cate.title,
                catdir: cate.alias,
                arrparentid: ['0', parentid, catid].join(','),
                arrchildid: String(catid),
                modelid: 1,
                parentid: parentid,
                category_template: 'category_article', // 'category_jm',
                list_template: 'list_article',
                show_template: 'show_article',
                pclink: '/' + cate.alias + '/'
            };
        }

        function mapCateId (alias: string) {
            return cateIdMap[alias];
        }

        function getDescription (html: string, len: number = 100) {

            let doc = parseHTML(html);

            return doc.body.innerText.slice(0, len);
        }

        function mapArticleData (article: IArticle) {

            let id = articleAutoIncrement++;
            let cate = cateMap[article.cate];
            let date = Math.floor((article.date || Date.now()) / 1000) + parseInt(article.id);

            return {
                id: id,
                catid: mapCateId(article.cate),
                articledir: cate.alias,
                url: '/' + cate.alias + '/' + id + '.html',
                userid: 1,
                username: 'admin',
                nickname: '管理员',
                title: article.title,
                description: getDescription(article.content),
                inputtime: date,
                updatetime: date,
                content: article.content,
                copyfrom: '原创',
                thumb: article.img || ''
            };
        }

        function genInsertSql (table: string, data: any[], packetLimit: number = 1000) {

            let columns = Object.keys(data[0]);
            let sqlhead = `insert into \`${table}\` ` + ' (' + columns.map((name) => '`' + name + '`').join(',') + ') values \n';
            let packet: string[] = [];

            let rows: string[] = [];

            data.forEach((row) => {

                if (packet.length >= packetLimit) {
                    rows.push(sqlhead + packet.join(',\n') + ';');
                    packet = [];
                }

                packet.push('(' + columns.map((col) => {
                    let field = row[col];
                    return JSON.stringify(field);
                }).join(',') + ')');
            });

            if (packet.length) {
                rows.push(sqlhead + packet.join(',\n') + ';');
            }

            return rows.join('\n');
        }

        function genCateSql (cates: ICate[]) {

            let categroup: {[key: string]: number[]} = {};
            let parentids = unique(cates.reduce((ret, cate) => {

                let parentid: number = topcateIdMap[cate.topcate || 'qm'];

                ret.push(parentid);

                if (!categroup[parentid]) {
                    categroup[parentid] = [mapCateId(cate.alias)];
                }
                else {
                    categroup[parentid].push(mapCateId(cate.alias));
                }

                return ret;
            }, [] as number[]));

            return [
                'delete from `yzm_category` where parentid in (' + parentids.join(',') + ');',
                genInsertSql('yzm_category', cates.map((item) => mapCateData(item))),
                parentids.map((parentid) => {
                    return [
                        'update `yzm_category` set `arrchildid` = "' + categroup[parentid].join(',') + '" where catid=' + parentid + ';',
                        'delete from `yzm_article` where `catid` in (' + categroup[parentid].join(',') + ');'
                    ].join('\n');
                })
            ].join('\n');
        }

        function genArticleSql (data: IArticle[]) {

            data = data.sort((a, b) => a.id - b.id);

            return genInsertSql('yzm_article', data.map((item) => mapArticleData(item)));
        }

        let ret = [
            genCateSql(cates),
            genArticleSql(articles),
        ].join('\n');

        download(ret, 'dishen-article-import.sql');
    }

    return spider;
}());

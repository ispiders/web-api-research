spider = (function () {

    interface JmCate {
        id: number;
        title: string;
    }

    interface Jm {
        id: number;
        title: string;
        content: string;
        cate: number;
    }

    let spider = new Spider({
        jmcates: [] as JmCate[],
        jms: [] as Jm[]
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

    function importJm (limit: number = 0) {
        let cateidAutoIncrement = 200;
        let articleAutoIncrement = 1;

        const newCatesMap = {
            1: {title: "人物", alias: 'renwu'},
            2: {title: "动物", alias: 'dongwu'},
            3: {title: "植物", alias: 'zhiwu'},
            4: {title: "物品", alias: 'wupin'},
            5: {title: "身体", alias: 'shenti'},
            6: {title: "生活", alias: 'shenghuo'},
            7: {title: "活动", alias: 'huodong'},
            8: {title: "自然", alias: 'ziran'},
            9: {title: "情爱", alias: 'qingai'},
            10: {title: "鬼神", alias: 'guishen'},
            11: {title: "建筑", alias: 'jianzhu'},
            12: {title: "其它", alias: 'qita'},
        };

        const newCates = Object.keys(newCatesMap).map((id) => {

            return newCatesMap[id];
        });

        function mapCateData (data) {

            let catid = cateidAutoIncrement++;

            data.catid = catid;

            return {
                catid: catid,
                catname: data.title,
                catdir: data.alias,
                arrparentid: '0,25,' + catid,
                arrchildid: String(catid),
                modelid: 1,
                parentid: 25,
                category_template: 'category_jm', // 'category_article',
                list_template: 'list_article',
                show_template: 'show_article',
                pclink: '/' + data.alias + '/'
            };
        }

        function mapCateId (oid: number) {
            return newCatesMap[oid].catid;
        }

        function getDescription (html: string, len: number = 100) {

            let div = document.createElement('div');
            div.innerHTML = html;
            return div.innerText.slice(0, len);
        }

        function mapArticleData (data: Jm) {

            let id = articleAutoIncrement++;
            let cate = newCatesMap[data.cate];

            return {
                id: id,
                catid: mapCateId(data.cate),
                url: '/' + cate.alias + '/' + id + '.html',
                userid: 1,
                username: 'admin',
                nickname: '管理员',
                title: data.title,
                inputtime: Math.floor(Date.now() / 1000),
                updatetime: Math.floor(Date.now() / 1000),
                description: getDescription(data.content),
                content: data.content,
                copyfrom: '原创',
                thumb: data.img || ''
            };
        }

        function genInsertSql (table: string, data: any[], limit: number = 0) {

            let columns = Object.keys(data[0]);

            if (limit) {
                data = data.slice(0, limit);
            }

            let rows = data.map((row) => {
                return '(' + columns.map((col) => {
                    let field = row[col];
                    return typeof field === 'string' ? "'" + field.replace(/\'/g, '\\\'') + "'" : field;
                }).join(',') + ')';
            }).join(',\n');

            let sql = `insert into \`${table}\` `;

            return sql + ' (' + columns.map((name) => '`' + name + '`').join(',') + ') values \n' + rows + ';';
        }

        function genCateSql (data: any[]) {

            return genInsertSql('yzm_category', data.map((item) => mapCateData(item)));
        }

        function genArticleSql (data: Jm[]) {

            return genInsertSql('yzm_article', data.map((item) => mapArticleData(item)), limit);
        }

        let ret = [
            'delete from `yzm_category` where parentid=25;',
            genCateSql(newCates),
            'update yzm_category set `arrchildid` = "' + newCates.map(cate => cate.catid).join(',') + '" where catid=25;',
            'delete from `yzm_article` where id > 0 and id < 20000;',
            genArticleSql(spider.state.jms),
        ].join('\n');

        download(ret, 'jm-import.sql');
    }

    return spider;
}());


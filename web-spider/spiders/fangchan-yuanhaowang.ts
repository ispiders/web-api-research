// 新房列表页 https://su.yuanhaowang.com/loupan/pg664/

spider = (function () {

let spider = new Spider({
    loupan: [],
    loupanMap: {},
    xiaoqu: [],
    xiaoqus: [],
    ershoufang: [],
    ershoufangs: [],
    newsCates: [],
    news: [],
    zufangs: []
});

let host = 'https://su.yuanhaowang.com';

function filterInfo ({getDetail, currentCity}) {
    delete getDetail.houseNews;
    delete getDetail.peripheralMatching;
    delete getDetail.residentialQuarters.aroundDeviceInfo;

    return {
        getDetail,
        currentCity
    };
}

function getInfoJSON (doc: Document) {

    let scripts = [...doc.querySelectorAll<HTMLScriptElement>('script')];
    let jsonReg = /window\.ReactDOM\.render\(window\.React\.createElement\(window\.RApp\.default,([\s\S]+)\), ?document.getElementById\('container-box'\)\);/;
    let info: any = null;

    for (let i = 0; i < scripts.length; i++) {
        let text = scripts[i].innerHTML;
        if (text) {
            let match = text.match(jsonReg);

            if (match && match[1]) {
                info = JSON.parse(match[1].trim());
                break;
            }
        }
    }

    return info;
}

function newsTask () {
    spider.addTask(`${host}/zixun/`, {}, {zixunIndex: true});

    spider.addRule({
        match: function (task) {
            return task.data.zixunIndex;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let info = getInfoJSON(doc);
            let cates = info.getDetail.categoryList;

            spider.state.newsCates = cates;

            cates.forEach((cate) => {
                cate.childs.forEach((c) => {
                    let link = `${host}/zixun/00${c.id}/`;
                    spider.addTask(link, {}, {
                        zixunList: true,
                        link: link,
                        cate: c
                    });
                });
            });
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.zixunList;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let info = getInfoJSON(doc);
            let newsList = info.getDetail.newBaikeList.data;

            newsList.forEach((item) => {
                let link = `${host}/zixun/${item.id}.html`;
                spider.addTask(link, {}, {
                    zixunDetail: true,
                    link: link,
                    news: item
                });
            });

            let nextPageLink = doc.querySelector<HTMLAnchorElement>('[title="Next Page"] a');

            if (nextPageLink && nextPageLink.href) {
                spider.addTask(nextPageLink.href, {}, {
                    zixunList: true,
                    link: nextPageLink,
                    cate: task.data.cate
                });
            }
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.zixunDetail;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let info = getInfoJSON(doc);

            if (info) {
                spider.state.news.push(info.getDetail.detailBaike.detail);
            }
            else {
                throw new Error('资讯详情获取失败:' + task.data.link);
            }
        }
    });
}

function loupanTask () {
    spider.addTask(`${host}/loupan/`, {}, {loupanList: true });

    spider.addRule({
        match: function (task) {
            return task.data.loupanList;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let info = getInfoJSON(doc);
            let lists = info.getDetail.getList.data;

            lists.forEach((item) => {
                let pinyin = item.id.slice(2);

                spider.addTask(`https://xf-${pinyin}.yuanhaowang.com/`, {}, {
                    loupanDetail: true,
                    pinyin: pinyin
                });
            });

            let nextPageLink = doc.querySelector<HTMLAnchorElement>('[title="Next Page"] a');

            if (nextPageLink && nextPageLink.href) {
                spider.addTask(nextPageLink.href, {}, {
                    loupanList: true
                });
            }
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.loupanDetail;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {
            let info = getInfoJSON(doc);

            if (info) {
                info = filterInfo(info);
                info.pinyin = task.data.pinyin;
                spider.state.loupans.push(info);
            }
            else {
                throw new Error('楼盘详情获取失败:' + task.data.pinyin);
            }
        }
    });
}

function ershoufangTask () {
    spider.addTask(`${host}/ershoufang/`, {}, {ershoufangList: true});

    spider.addRule({
        match: function (task) {
            return task.data.ershoufangList;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let info = getInfoJSON(doc);
            let lists = info.getDetail.getList.data;

            lists.forEach((item) => {

                let link = `${host}/ershoufang/${item.id}.html`;
                spider.addTask(link, {}, {
                    ershoufangDetail: true,
                    link: link
                });
            });

            let nextPageLink = doc.querySelector<HTMLAnchorElement>('[title="Next Page"] a');

            if (nextPageLink && nextPageLink.href) {
                spider.addTask(nextPageLink.href, {}, {
                    ershoufangList: true
                });
            }
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.ershoufangDetail;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {
            let info = getInfoJSON(doc);

            if (info) {
                let {getDetail, currentCity} = info;

                delete getDetail.residentialQuarters.aroundDeviceInfo;
                delete getDetail.aroundResidentialQuarter;

                spider.state.ershoufangs.push({
                    getDetail,
                    currentCity
                });
            }
            else {
                throw new Error('二手房详情获取失败:' + task.data.link);
            }
        }
    });
}

function zufangTask () {
    spider.addTask(`https://m.yuanhaowang.com/su/zufang/pg1/`, {}, {zufangList: true, page: 1});

    spider.addRule({
        match: function (task) {
            return task.data.zufangList;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let info = getInfoJSON(doc);
            let lists = info.getDetail.getList.data;
            let totalPage = info.getDetail.getList.totalPage;

            lists.forEach((item) => {

                let link = `https://m.yuanhaowang.com/su/zufang/${item.id}.html`;
                spider.addTask(link, {}, {
                    zufangDetail: true,
                    link: link
                });
            });

            if (task.data.page === 1) {
                for (let i = 2; i <= totalPage; i++) {
                    spider.addTask(`https://m.yuanhaowang.com/su/zufang/pg${i}/`, {}, {zufangList: true, page: i});
                }
            }
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.zufangDetail;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {
            let info = getInfoJSON(doc);

            if (info) {
                let {getDetail, currentCity} = info;

                delete getDetail.residentialQuarters.aroundDeviceInfo;
                delete getDetail.aroundResidentialQuarter;
                delete getDetail.aroundRecommendSecondHouse;
                delete getDetail.sameNewHouse;
                delete getDetail.sameResidentialQuarterSecondHouse;

                spider.state.zufangs.push({
                    getDetail,
                    currentCity
                });
            }
            else {
                throw new Error('租房详情获取失败:' + task.data.link);
            }
        }
    });
}

function xiaoquTask () {
    spider.addTask(`${host}/xiaoqu/`, {}, {xiaoquList: true});

    spider.addRule({
        match: function (task) {
            return task.data.xiaoquList;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let info = getInfoJSON(doc);
            let lists = info.getDetail.getList.data;

            lists.forEach((item) => {
                let pinyin = item.id.slice(2);

                spider.addTask(`https://xq-${pinyin}.yuanhaowang.com/`, {}, {
                    xiaoquDetail: true,
                    pinyin: pinyin
                });
            });

            let nextPageLink = doc.querySelector<HTMLAnchorElement>('[title="Next Page"] a');

            if (nextPageLink && nextPageLink.href) {
                spider.addTask(nextPageLink.href, {}, {
                    xiaoquList: true
                });
            }
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.xiaoquDetail;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {
            let info = getInfoJSON(doc);

            if (info) {
                let {getDetail, currentCity} = info;

                delete getDetail.schoolInfo;
                delete getDetail.roomLayout;
                delete getDetail.aroundDeviceInfo;

                spider.state.xiaoqus.push({
                    getDetail,
                    currentCity
                });
            }
            else {
                throw new Error('小区详情获取失败:' + task.data.pinyin);
            }
        }
    });
}

function main () {

    // xiaoquTask();

    // loupanTask();

    // ershoufangTask();

    zufangTask();

    // newsTask();

    spider.run();
}

main();

return spider;

}());

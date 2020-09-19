
spider = new Spider();


spider.addRule({
    // http://aqfykljk.ldyhxny.com/WebControls/Handler/HandlerType.ashx?lan=1&Jia=${car}&Kemu=${km}&Tid=1&YY=1
    match: (url) => {
        return url.indexOf('HandlerType.ashx') !== -1;
    },
    dataType: 'text',
    parse: (spider: Spider, text: string, url: string) => {

        let data = JSON.parse(eval('(' + text + ')'));
        let u = new URL(url);
        let car = u.searchParams.get('Jia');
        let km = u.searchParams.get('Kemu');

        data.forEach((cate) => {

            let taskUrl = `http://aqfykljk.ldyhxny.com/WebControls/Handler/HandlerTiKa.ashx?lan=1&Bian=-1&Kemu=${km}&Jia=${car}&Tid=${cate.id}`;

            spider.addTask(taskUrl);

            cate.url = taskUrl;
            cate.km = km;
            cate.car = car;

            let mapid = [km, car, cate.id].join('-');
            if (!spider.state.cateMap[mapid]) {
                spider.state.cateMap[mapid] = cate;
            }
            else {
                console.error('cate conflict', cate, spider.state.cateMap[mapid]);
            }

            spider.state.cats.push(cate);
        });
    }
});

let qidMap = {};
let qids = {};

spider.addRule({
    match: function (url) {
        return url.indexOf('HandlerTiKa.ashx') !== -1;
    },
    dataType: 'text',
    parse: function (spider, text, url) {

        let u = new URL(url);
        let km = u.searchParams.get('Kemu');
        let mapid = [km, u.searchParams.get('Jia'), u.searchParams.get('Tid')].join('-');
        let data = JSON.parse(eval('(' + text + ')'));

        spider.state.cateMap[mapid].qids = data.map(item => item.id);
        spider.state.qids = spider.state.qids.concat(spider.state.cateMap[mapid].qids);

        data.forEach((q) => {

            let qmapid = [km, q.id].join('-');

            if (!qidMap[qmapid]) {
                if (qids[q.id]) {
                    console.error('qid exists', q.id, km, qids[q.id])
                }
                qids[q.id] = km;
                spider.addTask(`http://aqfykljk.ldyhxny.com/WebControls/Handler/HandlerGetTi.ashx?curId=${q.id}&lan=1&km=${km}&bian=-1`);
                qidMap[qmapid] = 1;
            }
        });
    }
});

spider.addRule({
    match: function (url) {
        return url.indexOf('HandlerGetTi.ashx') !== -1;
    },
    dataType: 'text',
    parse: function (spider, text, url) {
        let data = JSON.parse(eval('(' + text + ')'));

        spider.state.questions.push(data);
    }
});

'1234'.split('').forEach((car) => {

    ['1', '4'].forEach((km) => {
        spider.addTask(`http://aqfykljk.ldyhxny.com/WebControls/Handler/HandlerType.ashx?lan=1&Jia=${car}&Kemu=${km}&Tid=1&YY=1`);
    });
});

spider.state = {
    qids: [],
    cats: [],
    cateMap: {},
    questions: []
};

spider.run();

function uq () {
    qs = spider.state.questions.slice();
    qids = qs.map(q => q[0]).map(q => q ? q.id : '0');

    let uqids = unique(qids);

    let ids = [];

    console.log(qids.length, uqids.length);
    if (qids.length !== uqids.length) {
        for (let i = 0, j = i; j < uqids.length; i++) {
            let id = uqids[j];

            if (id === qids[i]) {
                j++;
            }
            else {
                ids.push(qids[i]);
            }
        }
    }

    return ids;
}

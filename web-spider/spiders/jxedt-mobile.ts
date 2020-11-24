
spider = new Spider();

// 顺序练习应该不用单独获取
// spider.addRule({
//     match: /\/[abce]km[14]\/sxlx\/?$/i,
//     parse: (spider: Spider, doc: HTMLDocument, url: string) => {

//         let reg = /ids\s*=\s*(['"])([\d,]+)\1/;
//         let scripts = doc.querySelectorAll('script');
//         let ids = '';

//         for (let i = 0; i < scripts.length; i++) {
//             let s = scripts[i];

//             let m = s.innerHTML.match(reg);

//             if (m) {
//                 ids = m[2];
//                 break;
//             }
//         }

//         let data = {
//             url: url,
//             ids: ids.split(',')
//         };

//         spider.state.qids.push(data);
//     }
// });

spider.addRule({
    match: /\/(?:[abce]km[14]|ky|hy|wxp|jl|czc|wyc)\/z[jx]lx\/\d+\/?$/i,
    parse: (spider: Spider, doc: HTMLDocument, url: string) => {

        let reg = /arrnowids\s*=\s*([\[\],\d+'"]+)/;
        let scripts = doc.querySelectorAll('script');
        let ids = '';

        for (let i = 0; i < scripts.length; i++) {
            let s = scripts[i];

            let m = s.innerHTML.match(reg);

            if (m) {
                ids = m[1];
                break;
            }
        }

        let arr = JSON.parse(ids.replace(/'/g, '"'));

        let data = {
            url: url,
            ids: arr.reduce((ret, a) => {
                return ret.concat(a);
            }, [])
        };

        spider.state.qids.push(data);
    }
});

spider.addRule({
    match: /\/[abce]km[14]\/z[jx]lx\/?$/i,
    parse: (spider: Spider, doc: HTMLDocument, url: string) => {

        let links = doc.querySelectorAll('a[href]');

        let ls = [];

        for (let i = 0; i < links.length; i++) {
            let a = links[i];

            if (/\/[abce]km[14]\/z[jx]lx\/\d+\/?$/i.test(a.href)) {
                ls.push(a);
            }
        }

        let data = ls.map((a) => {

            spider.addTask(a.href);

            return {
                url: a.href,
                title: a.querySelector('.title').textContent
            };
        });

        spider.state.cats.push(data);
    }
});

['a', 'b', 'c', 'e'].forEach((car) => {

    ['1', '4'].forEach((km) => {
        spider.addTask(`http://m.jxedt.com/mnks/${car}km${km}/sxlx/`);
        spider.addTask(`http://m.jxedt.com/mnks/${car}km${km}/zjlx/`);
        spider.addTask(`http://m.jxedt.com/mnks/${car}km${km}/zxlx/`);
    });
});

spider.state = {
    qids: [],
    cats: []
};

spider.run();

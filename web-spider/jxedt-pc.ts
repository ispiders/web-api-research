var spider = new Spider();

function parseSectionList (sectionList: [number, number, number][]) {

    let ids = [];

    sectionList.forEach(function(item) {

        for (var i = item[0]; i <= item[1]; i++) {
            // if (item.length === 3) {
            //     if (item[2] === 0) {
            //         ids.push(i.toString());
            //     }
            //     else {
            //         ids.push(item[2].toString() + i);
            //     }
            // }

            3 == item.length && 0 != item[2] ?
                ids.push(item[2].toString() + i) :
                3 == item.length && 0 == item[2] && ids.push(i.toString());
        }
    });

    return ids;
}

spider.addRule({
    match: /\/(?:[abce]km[14]|ky|hy|wxp|jl|czc|wyc)\/z[jx]lx\/\d+\/?$/i,
    parse: (spider: Spider, doc: HTMLDocument, url: string) => {

        setBaseUrl(doc, url, false);

        let reg = /sectionList\s*=\s*(\[[\[\],\d\s]+\])/;
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

        let sectionList = JSON.parse(ids);

        let data = {
            url: url,
            ids: parseSectionList(sectionList)
        };

        spider.state.qids.push(data);
    }
});

spider.addRule({
    match: /\/(?:[abce]km[14]|ky|hy|wxp|jl|czc|wyc)\/z[jx]lx\/?$/i,
    parse: (spider: Spider, doc: HTMLDocument, url: string) => {

        setBaseUrl(doc, url, false);

        let links: NodeListOf<HTMLAnchorElement> = doc.querySelectorAll('a[href]');
        let ls: HTMLAnchorElement[] = [];

        for (let i = 0; i < links.length; i++) {
            let a = links[i];
            let isZjLink = /(?:[abce]km[14]|ky|hy|wxp|jl|czc|wyc)\/zjlx\/\d+\/?$/i.test(a.href);
            let isZxLink = /(?:[abce]km[14]|ky|hy|wxp|jl|czc|wyc)\/zxlx\/\d+\/?$/i.test(a.href);

            if (isZjLink) {
                console.log('zjlx', a.href);
                spider.addTask(a.href);

                spider.state.cats.push({
                    url: a.href,
                    title: a.parentElement.parentElement
                            .querySelector('.title').textContent.match(/第.*?章\s*(.*)\s*（/)[1]
                });
            }
            else if (isZxLink) {
                console.log('zxlx', a.href);
                spider.addTask(a.href);

                spider.state.cats.push({
                    url: a.href,
                    title: a.querySelector('.des').textContent
                });
            }
        }
    }
});

['a', 'b', 'c', 'e'].forEach((car) => {

    ['1', '4'].forEach((km) => {
        // spider.addTask(`http://mnks.jxedt.com/${car}km${km}/sxlx/`);
        spider.addTask(`http://mnks.jxedt.com/${car}km${km}/zjlx/`);
        spider.addTask(`http://mnks.jxedt.com/${car}km${km}/zxlx/`);
    });
});

// 'ky|hy|wxp|jl|czc|wyc'.split('|').forEach((cat) => {

//     spider.addTask(`http://zgzks.jxedt.com/${cat}/zjlx/`);
// });

spider.state = {
    qids: [],
    cats: []
};

spider.run();

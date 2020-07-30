function unique<T> (arr: T[]): T[] {

    let map = new Map();

    return arr.reduce((ret, item) => {

        if (!map.get(item)) {
            map.set(item, true);
            ret.push(item);
        }

        return ret;
    }, []);
}

function download (text: string | object, name: string = 'download.txt') {

    if (typeof text !== 'string') {
        text = JSON.stringify(text, null, 4);
    }

    let file = new File([text], name);
    let a = document.createElement('a');

    a.download = name;
    a.href = URL.createObjectURL(file);
    a.click();
}

function readURL (url: string, encoding: string = 'utf-8'): Promise<string> {

    return fetch(url).then((response) => {

        return response.blob().then((blob) => {

            return readBlobText(blob, encoding);
        });
    });
}

function readBlobText (blob: Blob, encoding: string): Promise<string> {

    let fr = new FileReader;

    return new Promise((resolve, reject) => {

        fr.onload = function () {
            resolve(fr.result as string);
        };

        fr.onerror = function (e) {
            reject(e);
        };

        fr.readAsText(blob, encoding);
    });
}

function parseHTML (text: string): HTMLDocument {

    let parser = new DOMParser;

    return parser.parseFromString(text, 'text/html');
}

interface TMatchFunction {
    (url: string): boolean;
}

interface Rule {
    match: RegExp | TMatchFunction;
    parse: (spider: Spider, doc: HTMLDocument, task: string) => void;
}

class Spider {

    rules: Rule[];
    tasks: string[];
    state: object;
    index: number = 0;
    interval: number = 200;
    paused: boolean = false;

    constructor () {
        this.rules = [];
        this.tasks = [];
        this.state = {};
    }

    addTask (task: string): void {

        this.tasks.push(task);
    }

    currentTask (): string | undefined {

        return this.tasks[this.index];
    }

    next () {

        let len = this.tasks.length;

        this.index++;

        if (this.index < len) {

            return true;
        }

        return false;
    }

    getDocument (url: string, encoding: string = 'utf-8'): Promise<HTMLDocument> {
        return readURL(url, encoding)
            .then((text) => {
                return parseHTML(text);
            });
    }

    pause () {
        this.paused = true;
    }

    addRule (rule: Rule) {

        this.rules.push(rule);
    }

    parse (doc: HTMLDocument, task: string) {

        this.rules.forEach((rule) => {

            if (rule.match instanceof RegExp && rule.match.test(task)
                    || typeof rule.match === 'function' && rule.match(task)) {

                if (rule.parse) {
                    rule.parse(this, doc, task);
                }
            }
        });
    }

    run (force?: boolean): void {

        const task = this.currentTask();

        if (force) {
            this.paused = false;
        }

        if (task) {

            this.getDocument(task).then((doc) => {

                this.parse(doc, task);
            }).then(() => {

                if (this.next() && !this.paused) {
                    setTimeout(() => {
                        this.run();
                    }, this.interval);
                }
            });
        }
    }
}

/* =========================================================================== */

let spider = new Spider();

spider.addRule({
    match: /\/mnks\/[abce]km[14]\/sxlx\/?$/i,
    parse: (spider: Spider, doc: HTMLDocument, url: string) => {

        let reg = /ids\s*=\s*(['"])([\d,]+)\1/;
        let scripts = doc.querySelectorAll('script');
        let ids = '';

        for (let i = 0; i < scripts.length; i++) {
            let s = scripts[i];

            let m = s.innerHTML.match(reg);

            if (m) {
                ids = m[2];
                break;
            }
        }

        let data = {
            url: url,
            ids: ids
        };

        spider.state.qids.push(data);
    }
});

spider.addRule({
    match: /\/mnks\/[abce]km[14]\/z[jx]lx\/\d+\/?$/i,
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
    match: /\/mnks\/[abce]km[14]\/z[jx]lx\/?$/i,
    parse: (spider: Spider, doc: HTMLDocument, url: string) => {

        let links = doc.querySelectorAll('a[href]');

        let ls = [];

        for (let i = 0; i < links.length; i++) {
            let a = links[i];

            if (/\/mnks\/[abce]km[14]\/z[jx]lx\/\d+\/?$/i.test(a.href)) {
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

// spider.run();

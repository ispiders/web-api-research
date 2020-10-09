function diff (arr1, arr2) {

    let map = arr1.reduce((m, item) => {

        if (!m.has(item)) {
            m.set(item, 1);
        }

        return m;
    }, new Map());

    let diffArr = [];

    arr2.forEach((item) => {

        if (!map.has(item)) {
            diffArr.push(item);
        }
    });

    return diffArr;
}

function unique<T> (arr: T[]): T[] {

    let map = new Map();

    return arr.reduce((ret, item) => {

        if (!map.get(item)) {
            map.set(item, true);
            ret.push(item);
        }

        return ret;
    }, [] as T[]);
}

function parseJSON (text: string) {
    let json;

    try {
        json = JSON.parse(text);
    }
    catch (e) {
        json = eval('(' + text + ')');
    }

    return json;
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

function readURL (url: string, options: RequestInit = {}, encoding: string = 'utf-8'): Promise<string> {

    return fetch(url, options).then((response) => {

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

function setBaseUrl (doc: HTMLDocument, baseUrl: string, force: boolean = false) {

    let base = doc.querySelector('base');

    if (base && !force) {
        return;
    }

    if (baseUrl[baseUrl.length - 1] !== '/') {
        baseUrl += '/';
    }

    if (!base) {
        base = doc.createElement('base');

        let head = doc.querySelector('head');

        if (head) {
            head.appendChild(base);
        }
        else {
            doc.appendChild(base);
            console.error('doc does not have a head element');
        }
    }

    base.href= baseUrl;
}

interface TMatchFunction {
    (url: Task): boolean;
}

interface TextRule {
    match: RegExp | TMatchFunction;
    dataType: 'text';
    parse: (spider: Spider, doc: string, task: Task) => void;
}

interface HTMLRule {
    match: RegExp | TMatchFunction;
    dataType?: 'html';
    parse: (spider: Spider, doc: HTMLDocument, task: Task) => void;
}

type Rule = TextRule | HTMLRule;
type Task = {
    url: string;
    options: RequestInit;
    data?: any;
};

class Spider<S = any> {

    rules: Rule[];
    tasks: Task[];
    state: S;
    index: number = 0;
    interval: number = 500;
    paused: boolean = false;

    constructor (state: S) {
        this.rules = [];
        this.tasks = [];
        this.state = state;

        this.preventUnload();
    }

    reset () {
        this.rules = [];
        this.tasks = [];
        this.state = {};
        this.index = 0;
        this.paused = false;
    }

    preventUnload () {

        window.onbeforeunload = () => true;
    }

    addTask (url: string, options: RequestInit = {}, data?: any): void {

        this.tasks.push({
            url: url,
            options: options,
            data: data
        });
    }

    currentTask (): Task | undefined {

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

    getText (task: Task, encoding: string = 'utf-8'): Promise<string> {

        return readURL(task.url, task.options, encoding);
    }

    getJSON (task: Task, encoding: string = 'utf-8'): Promise<any> {

        return readURL(task.url, task.options, encoding).then((text) => {

            return parseJSON(text);
        });
    }

    getDocument (task: Task, encoding: string = 'utf-8'): Promise<HTMLDocument> {
        return readURL(task.url, task.options, encoding)
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

    parse (text: string, task: Task) {

        this.rules.forEach((rule) => {

            if (rule.match instanceof RegExp && rule.match.test(task.url)
                    || typeof rule.match === 'function' && rule.match(task)) {

                if (rule.parse) {

                    if (rule.dataType === 'text') {
                        rule.parse(this, text, task);
                    }
                    else {
                        rule.parse(this, parseHTML(text), task);
                    }
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

            this.getText(task).then((text) => {

                this.parse(text, task);
            }, (err) => {
                setTimeout(() => {
                    this.run();
                }, this.interval * 10);
            }).then(() => {
                this.runNext();
            });
        }
        else {
            this.finished();
        }
    }

    runNext () {
        let hasNext = this.next();

        if (hasNext && !this.paused) {
            setTimeout(() => {
                this.run();
            }, this.interval);
        }
        else if (!hasNext) {
            this.finished();
        }
    }

    finished (): boolean {

        console.log('finished ' + this.index + '/' + this.tasks.length + ' tasks');

        return this.index >= this.tasks.length;
    }
}


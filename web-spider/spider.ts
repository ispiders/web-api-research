function diff (arr1, arr2) {

    let map = arr1.reduce((m, item) => {

        if (!m.has(item)) {
            m.set(item, 1);
        }

        return m;
    }, new Map());

    let diffArr: any[] = [];

    arr2.forEach((item) => {

        if (!map.has(item)) {
            diffArr.push(item);
        }
    });

    return diffArr;
}

function unique<T> (arr: T[], key?: string): T[] {

    let map = new Map();

    return arr.reduce((ret, item) => {

        let index = item;

        if (typeof key !== 'undefined') {
            index = item[key];
        }

        if (!map.get(index)) {
            map.set(index, true);
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

function readURL (url: string, options: RequestInit = {}): Promise<Blob> {

    return fetch(url, options).then((response) => {

        if (response.status >= 200 && response.status < 300 || response.status === 304) {
            return response.blob();
        }
        else {
            return Promise.reject(response.status + ' ' + url);
        }
    });
}

function getText (url: string, options: RequestInit = {}, encoding: string = 'utf-8'): Promise<string> {

    return readURL(url, options).then((blob) => {

        return readBlobText(blob, encoding);
    });
}

function getJSON (url: string, options: RequestInit = {}, encoding: string = 'utf-8'): Promise<any> {

    return getText(url, options, encoding).then((text) => {

        return parseJSON(text);
    });
}

function getDocument (url: string, options: RequestInit = {}, encoding: string = 'utf-8'): Promise<HTMLDocument> {

    return readURL(url, options).then((blob) => {

        return readBlobDocument(blob, encoding);
    });
}

function readBlobText (blob: Blob, encoding: string = 'utf-8'): Promise<string> {

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

function readBlobDocument (blob: Blob, encoding: string = 'utf-8'): Promise<HTMLDocument> {

    return readBlobText(blob, encoding).then((text) => {

        let doc = parseHTML(text);
        let charset = getEncoding(doc);

        if (encoding && charset !== encoding || !encoding && charset !== 'utf-8') {

            return readBlobText(blob, charset).then((text) => {
                return parseHTML(text);
            });
        }
        else {
            return doc;
        }
    });
}

function getEncoding (doc: HTMLDocument) {

    let charsetMeta = doc.querySelector('meta[charset]');
    let charset = 'utf-8';

    if (charsetMeta) {
        charset = charsetMeta.getAttribute('charset') || charset;
    }
    else {
        let contentType = '';
        let metaElements = doc.querySelectorAll('meta');

        for (let i = 0; i < metaElements.length; i++) {
            let el = metaElements[i];
            let equiv = el.getAttribute('http-equiv') || el.getAttribute('https-equiv');

            equiv = equiv ? equiv.toLowerCase() : '';

            if (equiv === 'content-type') {
                contentType = el.getAttribute('content') || '';
                break;
            }
        }

        if (contentType) {
            let matches = contentType.match(/charset=(\S*)/);

            if (matches && matches[1]) {
                charset = matches[1];
            }
        }
    }

    return charset.toLowerCase();
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

function validUrl (url: string) {

    try {
        new URL(url);
        return true;
    }
    catch (e) {
        console.error('invalid url: ' + url);
        return false;
    }
}

interface TMatchFunction {
    (url: Task): boolean;
}

interface TextRule {
    match: RegExp | TMatchFunction;
    dataType: 'text';
    parse: (spider: Spider<any>, doc: string, task: Task) => void;
}

interface HTMLRule {
    match: RegExp | TMatchFunction;
    dataType?: 'html';
    parse: (spider: Spider<any>, doc: HTMLDocument, task: Task) => void;
}

type Rule = TextRule | HTMLRule;
type Task = {
    url: string;
    options: RequestInit;
    encoding?: string;
    data?: any;
    cache?: Blob;
};

class Spider<S extends {}> {

    rules: Rule[];
    tasks: Task[];
    state: S;
    retryMap: {[index: string]: number;};
    failedIndexes: number[];

    index: number = 0;
    interval: number = 500;
    paused: boolean = false;
    cache: boolean = false;
    maxRetry: number = 3;

    constructor (state: S) {
        this.rules = [];
        this.tasks = [];
        this.state = state;
        this.failedIndexes = [];
        this.retryMap = {};

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

    addTask (url: string, options: RequestInit = {}, data?: any, encoding?: string): void {

        if (!validUrl(url)) {
            return;
        }

        this.tasks.push({
            url: url,
            options: options,
            data: data,
            encoding: encoding
        });
    }

    hasTask (url: string): boolean {
        return !!this.tasks.find((item) => {
            return item.url === url;
        });
    }

    insertAfterTask (task: Task, url: string, options: RequestInit = {}, data?: any, encoding?: string) {

        if (!validUrl(url)) {
            return;
        }

        let index = this.tasks.indexOf(task);

        this.tasks.splice(index + 1, 0, {
            url: url,
            options: options,
            data: data,
            encoding: encoding
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

    pause () {
        this.paused = true;
    }

    addRule (rule: Rule) {

        this.rules.push(rule);
    }

    parse (blob: Blob, task: Task) {

        let all: Promise<any>[] = [];

        this.rules.forEach((rule) => {

            if (rule.match instanceof RegExp && rule.match.test(task.url)
                    || typeof rule.match === 'function' && rule.match(task)) {

                if (rule.parse) {

                    if (rule.dataType === 'text') {
                        all.push(readBlobText(blob, task.encoding).then((text) => {
                            return rule.parse(this, text, task);
                        }));
                    }
                    else {
                        all.push(readBlobDocument(blob, task.encoding).then((doc) => {
                            return rule.parse(this, doc, task);
                        }));
                    }
                }
            }
        });

        return Promise.all(all);
    }

    fetch (task: Task) {

        if (this.cache && task.cache) {

            return Promise.resolve(task.cache);
        }

        return readURL(task.url, task.options).then((blob) => {

            if (this.cache) {
                task.cache = blob;
            }

            return blob;
        });
    }

    run (force?: boolean): void {

        const task = this.currentTask();

        if (force) {
            this.paused = false;
        }

        if (task) {

            if (task.data && typeof task.data.beforeTask === 'function') {
                task.data.beforeTask.call(task, this);
            }

            // readURL(task.url, task.options).then((blob) => {
            this.fetch(task).then((blob) => {

                return this.parse(blob, task);
            }, (err) => {

                if (!this.paused) {
                    this.retry();
                }

                return Promise.reject(err);
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

    retry () {

        let count = this.retryMap[this.index] || 0;

        count = this.retryMap[this.index] = count + 1;

        if (count <= this.maxRetry) {

            setTimeout(() => {
                this.run();
            }, this.interval * 10);
        }
        else {
            this.failedIndexes.push(this.index);
            this.runNext();
        }
    }

    finished (): boolean {

        console.log('finished ' + this.index + '/' + this.tasks.length + ' tasks');

        return this.index >= this.tasks.length;
    }
}

var spider: Spider<any>;

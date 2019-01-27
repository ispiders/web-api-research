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

function download (text: string, name: string = 'download.txt'): void {

    let file = new File([text], name);
    let a = document.createElement('a');

    a.download = name;
    a.href = URL.createObjectURL(file);

    a.click();
}

interface TTaskParser<T=any> {
    <T1 extends T>(spider: Spider, doc: HTMLDocument, task: T1): void;
}

interface Task {

    url: string;
    encoding?: string;

    [key: string]: any;

    parse: (spider: Spider, doc: HTMLDocument) => void;
}

class Spider {

    tasks: Task[];
    state: any[];
    finished: number = 0;
    interval: number = 100;
    paused: boolean = false;

    constructor (tasks: Task[]) {
        this.tasks = tasks;
        this.state = [];
    }

    addTask (task: Task): void {

        this.tasks.push(task);
    }

    currentTask (): Task | undefined {

        return this.tasks[0];
    }

    next (): Task | undefined {

        let len = this.tasks.length;

        if (len) {
            return this.tasks.shift();
        }

        return undefined;
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

    run (force?: boolean): void {

        const task = this.currentTask();

        if (force) {
            this.paused = false;
        }

        if (task) {

            this.getDocument(task.url, task.encoding).then((doc) => {

                task.parse(this, doc);
                this.finished++;
            }).then(() => {

                this.next();

                if (!this.paused) {
                    setTimeout(() => {
                        this.run();
                    }, this.interval);
                }
            });
        }
    }

    download (fn: (item: any, index: number) => string) {

        download(this.state.reduce((text, item, index) => {

            text += fn(item, index);

            return text;
        }, ''));
    }
}

interface TMenuTask extends Task {
    menuSelector: string | Element;
    contentSelector: string | ((doc: Document) => string);
}

function parseMenu (this: TMenuTask, spider: Spider, doc: HTMLDocument): void {

    let elems: NodeListOf<HTMLAnchorElement>;

    if (typeof this.menuSelector === 'string') {
        elems = doc.querySelectorAll(this.menuSelector);
    }
    else {
        elems = this.menuSelector.querySelectorAll('a[href]');
    }

    for (let i = 0; i < elems.length; ++i) {

        let item: HTMLAnchorElement = elems[i];

        spider.addTask({
            url: item.href,
            encoding: this.encoding,
            title: item.innerText,
            contentSelector: this.contentSelector,
            parse: parseContent
        });
    }
}

function parseContent (this: TMenuTask, spider: Spider, doc: HTMLDocument) {

    let content = '';

    if (typeof this.contentSelector === 'string') {
        let el = doc.querySelector(this.contentSelector) as HTMLElement;
        content = el.innerText;
    }
    else {
        content = this.contentSelector(doc)
    }

    spider.state.push({
        url: this.url,
        title: this.title,
        content: content
    });
}

function getEncoding () {

    let charsetMeta = document.querySelector('meta[charset]');
    let charset = 'utf-8';

    if (charsetMeta) {
        charset = charsetMeta.getAttribute('charset') || charset;
    }
    else {
        let contentType = '';
        let metaElements = document.querySelectorAll('meta');

        for (let i = 0; i < metaElements.length; i++) {
            let el = metaElements[i];
            let equiv = el.getAttribute('http-equiv');

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

function analyseMenu (boundary: number = 100) {
    let links = document.querySelectorAll('a[href]');
    let elementsMap = new WeakMap<Element, number>();
    let elements: Element[] = [];

    for (let i = 0; i < links.length; i++) {

        let el = links[i].parentElement;

        while (el && el.parentElement !== document.body) {
            let count = elementsMap.get(el);

            if (count) {
                elementsMap.set(el, count + 1);
                if (count === 1) {
                    elements.push(el);
                }
            }
            else {
                elementsMap.set(el, 1);
            }

            el = el.parentElement;
        }
    }

    let min = 0;
    let ret: Element | undefined;

    elements.forEach((el) => {
        let count = elementsMap.get(el) || 0;

        if (count > boundary) {
            if (min) {
                if (min > count) {
                    min = count;
                    ret = el;
                }
            }
            else {
                min = count;
                ret = el;
            }
        }
    });

    console.log('possible menus', elements.map((el) => {
        return [elementsMap.get(el), el];
    }));

    console.log('analized menu', ret);

    return ret;
}

function analyseContent (doc: HTMLDocument): string {

    let boundary = 1000;
    let els = doc.body.querySelectorAll<HTMLElement>('*');
    let container: HTMLElement | null = null;
    let tmp = 0;

    for (let i = 0; i < els.length; i++) {
        let el = els[i];
        let text = el.innerText;

        if (text.length > boundary && (!tmp || text.length < tmp)) {
            tmp = text.length;
            container = el;
        }
    }

    if (container) {
        return container.innerText;
    }
    else {
        return '';
    }
}

let tasks: Task[] = [{
    url: '',
    encoding: getEncoding(),
    menuSelector: analyseMenu(),
    contentSelector: analyseContent,
    parse: parseMenu
}];

let spider = new Spider(tasks);

window.onbeforeunload = function () {
    return 'spider downloading';
}

//
spider.run();

let d = () => spider.download((item) => {
    return item.title + '\n' + item.content + '\n';
});

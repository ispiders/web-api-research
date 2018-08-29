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
            resolve(fr.result);
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

        let task = this.currentTask();

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
    menuSelector: string;
    contentSelector: string;
}

function parseMenu (this: TMenuTask, spider: Spider, doc: HTMLDocument): void {

    let elems: NodeListOf<HTMLLinkElement> = doc.querySelectorAll(this.menuSelector);

    for (let i = 0; i < elems.length; ++i) {

        let item: HTMLLinkElement = elems[i];

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

    let el = doc.querySelector(this.contentSelector) as HTMLElement;

    spider.state.push({
        url: this.url,
        title: this.title,
        content: el.innerText
    });
}

let tasks: Task[] = [{
    url: './',
    encoding: 'gbk',
    menuSelector: '#list a',
    contentSelector: '#content',
    parse: parseMenu
}];

let spider = new Spider(tasks);

window.onbeforeunload = function () {
    return 'spider downloading';
}

//
spider.run();

spider.download((item) => {
    return item.title + '\n' + item.content + '\n';
});

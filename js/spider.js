"use strict";
function progress(done, left) {
    let currentTime = Date.now();
    if (!progress.startTime) {
        progress.startTime = currentTime;
        progress.lastTime = currentTime;
    }
    else {
        let timeLeft = (currentTime - progress.lastTime) * left;
        let timeLeft1 = (currentTime - progress.startTime) / done * left;
        progress.lastTime = currentTime;
        console.log(done, '/', left, 'timeleft:', Math.round(timeLeft / 1000), Math.round(timeLeft1 / 1000));
    }
}
function readURL(url, encoding = 'utf-8') {
    return fetch(url).then((response) => {
        return response.blob().then((blob) => {
            return readBlobText(blob, encoding);
        });
    });
}
function readBlobText(blob, encoding) {
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
function parseHTML(text) {
    let parser = new DOMParser;
    return parser.parseFromString(text, 'text/html');
}
function download(text, name = 'download.txt') {
    let file = new File([text], name);
    let a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(file);
    a.click();
}
class Spider {
    constructor(tasks) {
        this.finished = 0;
        this.interval = 100;
        this.paused = false;
        this.tasks = tasks;
        this.state = [];
    }
    addTask(task) {
        this.tasks.push(task);
    }
    currentTask() {
        return this.tasks[0];
    }
    next() {
        let len = this.tasks.length;
        if (len) {
            return this.tasks.shift();
        }
        return undefined;
    }
    getDocument(url, encoding = 'utf-8') {
        return readURL(url, encoding)
            .then((text) => {
            return parseHTML(text);
        });
    }
    pause() {
        this.paused = true;
    }
    run(force) {
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
    download(fn) {
        download(this.state.reduce((text, item, index) => {
            text += fn(item, index);
            return text;
        }, ''));
    }
}
function parseMenu(spider, doc) {
    let elems;
    if (typeof this.menuSelector === 'string') {
        elems = doc.querySelectorAll(this.menuSelector);
    }
    else {
        elems = this.menuSelector.querySelectorAll('a[href]');
    }
    for (let i = 0; i < elems.length; ++i) {
        let item = elems[i];
        spider.addTask({
            url: item.href,
            encoding: this.encoding,
            title: item.innerText,
            contentSelector: this.contentSelector,
            parse: parseContent
        });
    }
}
function parseContent(spider, doc) {
    let content = '';
    if (typeof this.contentSelector === 'string') {
        let el = doc.querySelector(this.contentSelector);
        content = el.innerText;
    }
    else {
        content = this.contentSelector(doc);
    }
    spider.state.push({
        url: this.url,
        title: this.title,
        content: content
    });
    progress(spider.state.length, spider.tasks.length);
}
function getEncoding() {
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
function analyseMenu(boundary = 100) {
    let links = document.querySelectorAll('a[href]');
    let elementsMap = new WeakMap();
    let elements = [];
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
    let ret;
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
function analyseContent(doc) {
    let boundary = 1000;
    let els = doc.body.querySelectorAll('*');
    let container = null;
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
let tasks = [{
        url: '',
        encoding: getEncoding(),
        menuSelector: analyseMenu(),
        contentSelector: analyseContent,
        parse: parseMenu
    }];
let spider = new Spider(tasks);
window.onbeforeunload = function () {
    return 'spider downloading';
};
//
spider.run();
let d = () => spider.download((item, index) => {
    return '第' + (index + 1) + '章' + item.title + '\n' + item.content + '\n';
});

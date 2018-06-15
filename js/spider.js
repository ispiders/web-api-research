"use strict";
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
        this.index = -1;
        this.interval = 100;
        this.paused = false;
        this.tasks = tasks;
        this.state = [];
    }
    addTask(task) {
        this.tasks.push(task);
    }
    next() {
        let len = this.tasks.length;
        if (len) {
            this.index++;
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
    run() {
        let task = this.next();
        if (task) {
            this.getDocument(task.url, task.encoding).then((doc) => {
                if (task) {
                    task.parse(this, doc);
                }
                if (!this.paused) {
                    setTimeout(() => {
                        this.run();
                    }, this.interval);
                }
            });
        }
    }
}
function parseMenu(spider, doc) {
    let elems = doc.querySelectorAll(this.menuSelector);
    for (let i = 0; i < elems.length; ++i) {
        let item = elems[i];
        spider.addTask({
            url: item.href,
            title: item.innerText,
            contentSelector: this.contentSelector,
            parse: parseContent
        });
    }
}
function parseContent(spider, doc) {
    let el = doc.querySelector(this.contentSelector);
    spider.state.push({
        url: this.url,
        title: this.title,
        content: el.innerText
    });
}
let tasks = [{
        url: './',
        menuSelector: '#list a',
        contentSelector: '#content',
        parse: parseMenu
    }];
let spider = new Spider(tasks);
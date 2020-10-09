function diff(arr1, arr2) {
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
function unique(arr) {
    let map = new Map();
    return arr.reduce((ret, item) => {
        if (!map.get(item)) {
            map.set(item, true);
            ret.push(item);
        }
        return ret;
    }, []);
}
function parseJSON(text) {
    let json;
    try {
        json = JSON.parse(text);
    }
    catch (e) {
        json = eval('(' + text + ')');
    }
    return json;
}
function download(text, name = 'download.txt') {
    if (typeof text !== 'string') {
        text = JSON.stringify(text, null, 4);
    }
    let file = new File([text], name);
    let a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(file);
    a.click();
}
function readURL(url, options = {}, encoding = 'utf-8') {
    return fetch(url, options).then((response) => {
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
function setBaseUrl(doc, baseUrl, force = false) {
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
    base.href = baseUrl;
}
class Spider {
    constructor(state) {
        this.index = 0;
        this.interval = 500;
        this.paused = false;
        this.rules = [];
        this.tasks = [];
        this.state = state;
        this.preventUnload();
    }
    reset() {
        this.rules = [];
        this.tasks = [];
        this.state = {};
        this.index = 0;
        this.paused = false;
    }
    preventUnload() {
        window.onbeforeunload = () => true;
    }
    addTask(url, options = {}, data) {
        this.tasks.push({
            url: url,
            options: options,
            data: data
        });
    }
    currentTask() {
        return this.tasks[this.index];
    }
    next() {
        let len = this.tasks.length;
        this.index++;
        if (this.index < len) {
            return true;
        }
        return false;
    }
    getText(task, encoding = 'utf-8') {
        return readURL(task.url, task.options, encoding);
    }
    getJSON(task, encoding = 'utf-8') {
        return readURL(task.url, task.options, encoding).then((text) => {
            return parseJSON(text);
        });
    }
    getDocument(task, encoding = 'utf-8') {
        return readURL(task.url, task.options, encoding)
            .then((text) => {
            return parseHTML(text);
        });
    }
    pause() {
        this.paused = true;
    }
    addRule(rule) {
        this.rules.push(rule);
    }
    parse(text, task) {
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
    run(force) {
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
    runNext() {
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
    finished() {
        console.log('finished ' + this.index + '/' + this.tasks.length + ' tasks');
        return this.index >= this.tasks.length;
    }
}
var progress = (function () {
    let startTime = 0;
    let lastTime = 0;
    return (done, left) => {
        let currentTime = Date.now();
        if (!startTime) {
            startTime = currentTime;
            lastTime = currentTime;
        }
        else {
            let timeLeft = (currentTime - lastTime) * left;
            let timeLeft1 = (currentTime - startTime) / done * left;
            lastTime = currentTime;
            console.log(done, '/', left, 'timeleft:', Math.round(timeLeft / 1000), Math.round(timeLeft1 / 1000));
        }
    };
}());
function parseMenu(menuSelector, spider, doc) {
    let elems;
    if (typeof menuSelector === 'string') {
        elems = doc.querySelectorAll(menuSelector);
    }
    else {
        elems = menuSelector.querySelectorAll('a[href]');
    }
    return elems;
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
function analyseContent(doc, boundary = 1000) {
    let excludeElements = doc.body.querySelectorAll('script,style,textarea');
    for (let i = 0; i < excludeElements.length; i++) {
        let el = excludeElements[i];
        // @ts-ignore
        el.parentElement.removeChild(el);
    }
    let els = doc.body.querySelectorAll('*');
    let container = null;
    let tmp = 0;
    for (let i = 0; i < els.length; i++) {
        let el = els[i];
        if (['script', 'style', 'textarea'].indexOf(el.nodeName.toLowerCase()) !== -1) {
            continue;
        }
        let text = el.innerText;
        if (text.length > boundary && (!tmp || text.length < tmp)) {
            tmp = text.length;
            container = el;
        }
    }
    return container;
}
function main(spider) {
    let menu = analyseMenu();
    if (!menu) {
        console.error('menu element not found');
        return;
    }
    let links = parseMenu(menu, spider, document);
    for (let i = 0; i < links.length; ++i) {
        let item = links[i];
        spider.addTask(item.href, {}, {
            title: item.innerText,
            isChapter: true
        });
    }
}
//
spider = new Spider({
    chapters: []
});
spider.addRule({
    match: (task) => {
        return task.data.isChapter === true;
    },
    parse: (spider, doc, task) => {
        let container = analyseContent(doc);
        if (container) {
            spider.state.chapters.push({
                url: task.url,
                title: task.data.title,
                content: container.innerText
            });
        }
        else {
            console.warn('chapter empty', task);
        }
        progress(spider.state.chapters.length, spider.tasks.length);
    }
});
main(spider);
spider.run();
let d = () => {
    download(spider.state.chapters.reduce((text, item, index) => {
        text += '第' + (index + 1) + '章 ' + item.title + '\n' + item.content + '\n';
        return text;
    }, ''), document.title);
};

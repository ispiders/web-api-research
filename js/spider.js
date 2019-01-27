function readURL(url, encoding) {
    if (encoding === void 0) { encoding = 'utf-8'; }
    return fetch(url).then(function (response) {
        return response.blob().then(function (blob) {
            return readBlobText(blob, encoding);
        });
    });
}
function readBlobText(blob, encoding) {
    var fr = new FileReader;
    return new Promise(function (resolve, reject) {
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
    var parser = new DOMParser;
    return parser.parseFromString(text, 'text/html');
}
function download(text, name) {
    if (name === void 0) { name = 'download.txt'; }
    var file = new File([text], name);
    var a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(file);
    a.click();
}
var Spider = /** @class */ (function () {
    function Spider(tasks) {
        this.finished = 0;
        this.interval = 100;
        this.paused = false;
        this.tasks = tasks;
        this.state = [];
    }
    Spider.prototype.addTask = function (task) {
        this.tasks.push(task);
    };
    Spider.prototype.currentTask = function () {
        return this.tasks[0];
    };
    Spider.prototype.next = function () {
        var len = this.tasks.length;
        if (len) {
            return this.tasks.shift();
        }
        return undefined;
    };
    Spider.prototype.getDocument = function (url, encoding) {
        if (encoding === void 0) { encoding = 'utf-8'; }
        return readURL(url, encoding)
            .then(function (text) {
            return parseHTML(text);
        });
    };
    Spider.prototype.pause = function () {
        this.paused = true;
    };
    Spider.prototype.run = function (force) {
        var _this = this;
        var task = this.currentTask();
        if (force) {
            this.paused = false;
        }
        if (task) {
            this.getDocument(task.url, task.encoding).then(function (doc) {
                task.parse(_this, doc);
                _this.finished++;
            }).then(function () {
                _this.next();
                if (!_this.paused) {
                    setTimeout(function () {
                        _this.run();
                    }, _this.interval);
                }
            });
        }
    };
    Spider.prototype.download = function (fn) {
        download(this.state.reduce(function (text, item, index) {
            text += fn(item, index);
            return text;
        }, ''));
    };
    return Spider;
}());
function parseMenu(spider, doc) {
    var elems;
    if (typeof this.menuSelector === 'string') {
        elems = doc.querySelectorAll(this.menuSelector);
    }
    else {
        elems = this.menuSelector.querySelectorAll('a[href]');
    }
    for (var i = 0; i < elems.length; ++i) {
        var item = elems[i];
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
    var content = '';
    if (typeof this.contentSelector === 'string') {
        var el = doc.querySelector(this.contentSelector);
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
}
function getEncoding() {
    var charsetMeta = document.querySelector('meta[charset]');
    var charset = 'utf-8';
    if (charsetMeta) {
        charset = charsetMeta.getAttribute('charset') || charset;
    }
    else {
        var contentType = '';
        var metaElements = document.querySelectorAll('meta');
        for (var i = 0; i < metaElements.length; i++) {
            var el = metaElements[i];
            var equiv = el.getAttribute('http-equiv');
            equiv = equiv ? equiv.toLowerCase() : '';
            if (equiv === 'content-type') {
                contentType = el.getAttribute('content') || '';
                break;
            }
        }
        if (contentType) {
            var matches = contentType.match(/charset=(\S*)/);
            if (matches && matches[1]) {
                charset = matches[1];
            }
        }
    }
    return charset.toLowerCase();
}
function analyseMenu(boundary) {
    if (boundary === void 0) { boundary = 100; }
    var links = document.querySelectorAll('a[href]');
    var elementsMap = new WeakMap();
    var elements = [];
    for (var i = 0; i < links.length; i++) {
        var el = links[i].parentElement;
        while (el && el.parentElement !== document.body) {
            var count = elementsMap.get(el);
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
    var min = 0;
    var ret;
    elements.forEach(function (el) {
        var count = elementsMap.get(el) || 0;
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
    console.log('possible menus', elements.map(function (el) {
        return [elementsMap.get(el), el];
    }));
    console.log('analized menu', ret);
    return ret;
}
function analyseContent(doc) {
    var boundary = 1000;
    var els = doc.body.querySelectorAll('*');
    var container = null;
    var tmp = 0;
    for (var i = 0; i < els.length; i++) {
        var el = els[i];
        var text = el.innerText;
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
var tasks = [{
        url: '',
        encoding: getEncoding(),
        menuSelector: analyseMenu(),
        contentSelector: analyseContent,
        parse: parseMenu
    }];
var spider = new Spider(tasks);
window.onbeforeunload = function () {
    return 'spider downloading';
};
//
spider.run();
var d = function () { return spider.download(function (item) {
    return item.title + '\n' + item.content + '\n';
}); };

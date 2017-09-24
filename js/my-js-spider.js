/**
 * 利用浏览器从目录页自动抓取内容并下载的脚本
 * 比如可以用来下载小说
 * 用最新的chrome浏览器
 * @author ispiders
 */
function Downloader (options) {

    this.options = options || {};
    this.running = false;
}

Downloader.prototype = {

    getMenu: function getMenu (selector) {

        var tags = document.querySelectorAll(selector);
        var menu = [];

        for (var i = 0; i < tags.length; ++i) {
            menu.push({
                title: tags[i].innerText,
                href: tags[i].href
            });
        }

        return menu;
    },

    fetchChapter: function fetchChapter (href, charset) {

        var that = this;

        return fetch(href).then(function (response) {

            return response.blob().then(function (blob) {

                return that.readText(blob, charset)
            });
        });
    },

    readText: function readText (blob, charset) {

        var fr = this.fr || new FileReader;

        this.fr = fr;

        return new Promise(function (resolve, reject) {

            fr.onload = function () {
                resolve(fr.result);
            };

            fr.onerror = function (e) {
                console.error(e);
            };

            fr.readAsText(blob, charset);
        });
    },

    evalHtml: function evalHtml (html) {

        var div = document.createElement('div');

        div.innerHTML = html;

        return div;
    },

    fetchAll: function fetchAll (options) {

        var that = this,
            index = options.index,
            menu = options.menu;

        if (index < (options.end || menu.length)) {

            return this.fetchOne(menu[index].href).then(function (text) {

                console.log(index + 1, menu[index].title, menu[index].href);

                if (options.appendTitle) {
                    options.text += '\n' + menu[index].title + '\n';
                }

                options.text += text;
                options.index++;

                return that.fetchAll(options);
            }, function (error) {
                options.error = error;
                return Promise.reject(options);
            });
        }
        else {
            return Promise.resolve(options);
        }
    },

    fetchOne: function fetchOne (url) {

        var that = this;

        return this.fetchChapter(url, that.options.charset)
        .then(function (html) {

            html = html.match(/<body.*>([\s\S]*)<\/body>/)[1];

            var doc = that.evalHtml(html);

            return doc.querySelector(that.options.contentSelector).innerText;
        });
    },

    makeObjectURL: function makeObjectURL () {

        var file = new File([this.options.text], this.options.title + '.txt');
        return URL.createObjectURL(file);
    },

    download: function download (url, name) {

        var a = document.createElement('a');

        a.download = name || 'download.txt';
        a.href = url;

        a.click();

        // a.innerHTML = 'download.txt';
        // document.body.appendChild(a);
    },

    start: function start (ops) {

        var that = this,
            options = this.options;

        if (ops) {
            Object.assign(options, ops);
        }

        options.index = options.index || 0;
        options.menu = options.menu || that.getMenu(options.menuItem);

        if (!this.running) {

            this.running = true;

            this.fetchAll(options).then(function (ret) {

                console.info('done');

                that.running = false;

                that.download(that.makeObjectURL(), options.title + '.txt');
            }).catch(function (e) {

                that.running = false;
                console.error(e);
            });
        }

        return options;
    }
};

var d = new Downloader();

// 如果中途由于网络请求失败而终止，重新调用一次 d.start(/*不用参数哦*/); 可以继续下载
d.start({
    menuItem: '#readerlist a', // 目录链接 selector
    contentSelector: '#chapterContent', // 详情页需要获取内容的标签 selector
    title: '末世为王',
    text: '末世为王\n',
    charset: 'gbk', // 页面编码
    // index: 0, // 目录起始值
    // end: 0, // 目录终止值
    appendTitle: false // 是否将目录名添加到详情内容前
});

/**
 * 利用浏览器从目录页自动抓取内容并下载的脚本
 * 比如可以用来下载小说
 * 用最新的chrome浏览器
 * @author ispiders
 */
function Downloader (state) {

    this.state = state || {};
    this.running = false;

    if (!this.state.contents) {
        this.state.contents = [];
    }
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

    fetchAll: function fetchAll (state) {

        var that = this,
            index = state.index,
            menu = state.menu;

        if (index < (state.end || menu.length)) {

            return this.fetchOne(menu[index].href).then(function (text) {

                console.log(index + 1, menu[index].title, menu[index].href);

                state.contents.push(text);
                state.index++;

                return that.fetchAll(state);
            }, function (error) {
                state.error = error;
                return Promise.reject(state);
            });
        }
        else {
            return Promise.resolve(state);
        }
    },

    fetchOne: function fetchOne (url) {

        var that = this;

        return this.fetchChapter(url, that.state.charset)
        .then(function (html) {

            html = html.match(/<body.*>([\s\S]*)<\/body>/)[1];

            var doc = that.evalHtml(html);

            return doc.querySelector(that.state.contentSelector).innerText;
        });
    },

    makeContent: function () {

        var
            state = this.state,
            menu = state.menu,
            contents = [state.title];

        if (menu.length !== state.contents.length) {
            console.warn('menu length and content length not match');
        }

        if (state.appendTitle) {
            for (var i = 0; i < menu.length; ++i) {
                contents.push(this.makeTitle(menu[i].title, i));
                contents.push(state.contents[i]);
            }
        }
        else {
            contents = contents.concat(state.contents);
        }

        return contents;
    },

    makeTitle: function (title, index) {

        return '\n' + title + '\n';
    },

    makeObjectURL: function makeObjectURL () {

        var file = new File(this.makeContent(), this.state.title + '.txt');

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
            state = this.state;

        if (ops) {
            Object.assign(state, ops);
        }

        state.index = state.index || 0;
        state.menu = state.menu || that.getMenu(state.menuItem);

        if (!this.running) {

            this.running = true;

            this.fetchAll(state).then(function (ret) {

                console.info('done');

                that.running = false;

                that.download(that.makeObjectURL(), state.title + '.txt');
            }).catch(function (e) {

                that.running = false;
                console.error(e);
            });
        }

        return state;
    }
};

var d = new Downloader();

// 如果中途由于网络请求失败而终止，重新调用一次 d.start(/*不用参数哦*/); 可以继续下载
d.start({
    menuItem: '#list a', // 目录链接 selector
    contentSelector: '#content', // 详情页需要获取内容的标签 selector
    title: '',
    charset: 'gbk', // 页面编码
    // index: 0, // 目录起始值
    // end: 0, // 目录终止值
    appendTitle: true // 是否将目录名添加到详情内容前
});

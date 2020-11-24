var progress = (function () {

    let startTime = 0;
    let lastTime = 0;

    return (done: number, left: number) => {
        let currentTime = Date.now();

        if (!startTime) {
            startTime = currentTime;
            lastTime = currentTime;
        }
        else {
            let timeLeft = (currentTime - lastTime) * left;
            let timeLeft1 = (currentTime - startTime) / done * left;

            lastTime = currentTime;

            console.log(
                done,
                '/',
                left,
                'timeleft:',
                Math.round(timeLeft / 1000),
                Math.round(timeLeft1 / 1000)
            );
        }
    };
}());

function parseMenu (menuSelector: string | HTMLElement, spider: Spider<any>, doc: HTMLDocument) {

    let elems: NodeListOf<HTMLAnchorElement>;

    if (typeof menuSelector === 'string') {
        elems = doc.querySelectorAll(menuSelector);
    }
    else {
        elems = menuSelector.querySelectorAll('a[href]');
    }

    return elems;
}

function analyseMenu (doc: HTMLDocument, boundary: number = 100) {
    let links = doc.querySelectorAll('a[href]');
    let elementsMap = new WeakMap<HTMLElement, number>();
    let elements: HTMLElement[] = [];

    for (let i = 0; i < links.length; i++) {

        let el = links[i].parentElement;

        while (el && el !== doc.body) {
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
    let ret: HTMLElement | undefined;

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

function analyseContent (doc: HTMLDocument, boundary: number = 1000) {

    let excludeElements = doc.body.querySelectorAll('script,style,textarea');

    for (let i = 0; i < excludeElements.length; i++) {

        let el = excludeElements[i];

        // @ts-ignore
        el.parentElement.removeChild(el);
    }

    let els = doc.body.querySelectorAll<HTMLElement>('*');
    let container: HTMLElement | null = null;
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

function analyseNextLink (doc: HTMLDocument, regexp: RegExp = /^下\s*一\s*页$|^下\s*一\s*章$/) {

    let links = doc.querySelectorAll<HTMLAnchorElement>('a[href]');

    for (let i = 0; i < links.length; i++) {
        let el = links[i];

        if (el.textContent && regexp.test(el.textContent.trim())) {
            return el.href;
        }
    }

    return '';
}

function main (spider: Spider<any>) {

    let encoding = getEncoding(document);
    let menu = analyseMenu(document);

    if (!menu) {
        console.error('menu element not found');
        return;
    }

    let links = parseMenu(menu, spider, document);

    for (let i = 0; i < links.length; ++i) {

        let item: HTMLAnchorElement = links[i];

        spider.addTask(item.href, {}, {
            encoding: encoding,
            title: item.innerText,
            isChapter: true
        }, encoding);
    }
}

//
spider = new Spider({
    chapters: [] as any[]
});

spider.addRule({
    match: (task) => {
        return task.data.isChapter === true;
    },
    parse: (spider: Spider<any>, doc: HTMLDocument, task: Task) => {

        let container = analyseContent(doc);
        let nextLink = analyseNextLink(doc);
        let nextTaskUrl = spider.tasks[spider.index + 1] && spider.tasks[spider.index + 1].url;

        if (container) {
            spider.state.chapters.push({
                url: task.url,
                title: task.data.title,
                content: container.innerText
            });

            // 如果下一页的链接地址跟下一个任务的链接地址不一样，可能是章节被分页
            if (nextLink && nextLink !== nextTaskUrl) {
                spider.insertAfterTask(task, nextLink, {}, {
                    encoding: task.data.encoding,
                    title: task.data.title,
                    isChapter: true,
                    isMorePage: true
                }, task.encoding);
            }
        }
        else {
            console.warn('chapter empty', task);
        }

        progress(spider.state.chapters.length, spider.tasks.length - spider.index - 1);
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

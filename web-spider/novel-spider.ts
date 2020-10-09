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

function parseMenu (menuSelector: string | HTMLElement, spider: Spider, doc: HTMLDocument) {

    let elems: NodeListOf<HTMLAnchorElement>;

    if (typeof menuSelector === 'string') {
        elems = doc.querySelectorAll(menuSelector);
    }
    else {
        elems = menuSelector.querySelectorAll('a[href]');
    }

    return elems;
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

function analyseMenu (boundary: number = 100) {
    let links = document.querySelectorAll('a[href]');
    let elementsMap = new WeakMap<HTMLElement, number>();
    let elements: HTMLElement[] = [];

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

function main (spider: Spider) {

    let menu = analyseMenu();

    if (!menu) {
        console.error('menu element not found');
        return;
    }

    let links = parseMenu(menu, spider, document);

    for (let i = 0; i < links.length; ++i) {

        let item: HTMLAnchorElement = links[i];

        spider.addTask(item.href, {}, {
            title: item.innerText,
            isChapter: true
        });
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
    parse: (spider: Spider, doc: HTMLDocument, task: Task) => {

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

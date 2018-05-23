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

function parseHTML (text: string): Document {

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

///////////////////////////////////////

interface StepSetting {
    selector: string;
    type: 'url' | 'text';
    url: string;
    encoding: string;
}

class Step {

    setting: StepSetting;

    constructor (setting: StepSetting) {
        this.setting = setting;
    }

    run () {

        let {url, encoding, selector, type} = this.setting;

        return readURL(url, encoding)
            .then((text) => {
                let doc = parseHTML(text);

                return Array.prototype.slice.call(doc.querySelectorAll(selector));
            })
            .then((elements) => {
                if (type === 'url') {
                    return elements.map((elem) => {
                        return {
                            title: elem.innerText,
                            href: elem.href
                        };
                    });
                }
                else if (type === 'text') {

                    return elements.map((elem) => {
                        return elem.innerText;
                    });
                }
                else {
                    return elements;
                }
            });
    }
}

interface SpiderSetting {
    steps: StepSetting[];
}

class Spider {

    setting: SpiderSetting;

    constructor (setting: SpiderSetting) {
        this.setting = setting;
    }

    run (state): void {

    }
}

// tests
let s = new Spider({
    steps: [
        {
            selector: '#list a',
            type: 'url'
        },
        {
            selector: '#content',
            type: 'text'
        }
    ]
});

s.run({
    entry: location.href
});

spider.entry(location.href)
    .findAll('#list a')
    .readEach()
    .findAll('#list a')
    .readEach()
    .find('#content')

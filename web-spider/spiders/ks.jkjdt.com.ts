spider = (function () {

interface TCategory {
    id: string;
    lang: string;
    model: string;
    subject: string;
    ids: string[];
    name: string;
    link: string;
}

interface TQuestion {
    A: string;
    B: string;
    C: string;
    D: string;
    answer: string;
    c_jiexia: string;
    c_jiexib: string;
    c_jximg: string;
    caid: string;
    cbid: string;
    ccid: string;
    cxid: string;
    id: string;
    image: string;
    imgtype: string;
    m_id: string;
    sound: string;
    title: string;
    tmtype: string;
}

let spider = new Spider({
    categories: [] as TCategory[],
    questions: [] as TQuestion[],
    questionMap: {}
});

function main () {

    let lang = 'weiyu';
    let models = ['x', 'k', 'h', 'm'];
    let subjects = [1, 2];

    models.forEach((model) => {
        subjects.forEach((subject) => {

            // 临时筛选
            // if (model === 'x') {
            //     return;
            // }
            // if (model === 'h' || model === 'k') {
            //     if (subject === 2) {
            //         return;
            //     }
            // }

            spider.addTask(`http://ks.jkjdt.com/index/catelist.html?cate=ca`, {}, {
                catelist: true,
                cate: {
                    lang: lang,
                    model: model,
                    subject: subject
                },
                beforeTask: function () {
                    document.cookie = 'COOKIE_STUDENT_LANGUAGE=' + this.data.cate.lang + ';path=/;domain=.jkjdt.com';
                    document.cookie = 'COOKIE_STUDENT_CHEXING=' + this.data.cate.model + ';path=/;domain=.jkjdt.com';
                    document.cookie = 'COOKIE_STUDENT_KEMU=' + this.data.cate.subject + ';path=/;domain=.jkjdt.com';
                }
            });
        });
    });

    spider.addRule({
        match: function (task) {
            return task.data.catelist;
        },
        dataType: 'html',
        parse: function (spider, doc: Document, task) {

            let lists = [...doc.querySelectorAll<HTMLDivElement>('#right_ls .ls_one')];

            lists.forEach((el) => {
                let titleEl = el.querySelector<HTMLDivElement>('.ls_text');
                let linkEl = el.querySelector<HTMLAnchorElement>('.ls_but a');
                let name = titleEl && titleEl.innerText.trim() || '';
                let link = linkEl && linkEl.href;

                if (!link) {
                    console.error('link error', el);
                    return;
                }

                let id = new URL(link).searchParams.get('caid');

                if (!id) {
                    console.log('cate id error', link);
                    return;
                }

                let category = {
                    id: id,
                    name: name,
                    link: link,
                    ...task.data.cate
                };

                // 临时筛选
                // if (['k', 'h'].indexOf(task.data.cate.model) !== -1 && name.indexOf('专用') === -1) {
                //     return;
                // }

                spider.state.categories.push(category);

                spider.addTask(category.link, {}, {
                    cate: category,
                    questions: true,
                    beforeTask: function () {
                        document.cookie = 'COOKIE_STUDENT_LANGUAGE=' + this.data.cate.lang + ';path=/;domain=.jkjdt.com';
                        document.cookie = 'COOKIE_STUDENT_CHEXING=' + this.data.cate.model + ';path=/;domain=.jkjdt.com';
                        document.cookie = 'COOKIE_STUDENT_KEMU=' + this.data.cate.subject + ';path=/;domain=.jkjdt.com';
                    }
                });
            });
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.questions;
        },
        dataType: 'text',
        parse: function (spider, text, task) {

            let match = text.match(/var +idlist *= *\[([\d,]*)\]/i);
            let ids = match ? match[1].split(',') : [];

            task.data.cate.ids = ids;

            ids.forEach((id) => {
                if (!spider.state.questionMap[id]) {
                    spider.state.questionMap[id] = 1;
                    spider.addTask(`http://file.jkjdt.com/${lang}/json/${id}.json`, {}, {
                        cate: task.data.cate,
                        question: true
                    });
                }
            });
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.question;
        },
        dataType: 'text',
        parse: function (spider, text, task) {

            let question = JSON.parse(text);

            if (!question.id || !question.caid) {
                console.error('question error', text);
            }
            else {
                spider.state.questions.push(question);
            }
        }
    });

    spider.run();
}

function filename (url) {
    return url.split('/').pop();
}

function sourcePath (url, withHost = false) {

    if (url.slice(0,4) === 'http') {

        if (withHost) {
            return url;
        }

        let parts = url.split('/');

        return '/' + parts.slice(3).join('/');
    }
    else {
        if (withHost) {
            console.log('no host', url);
            return 'https://sth5.liehuu.com' + url;
        }

        return url;
    }
}

main();

return spider;

}());
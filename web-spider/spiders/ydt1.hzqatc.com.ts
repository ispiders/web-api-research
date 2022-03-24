
// http://ydt1.hzqatc.com/qaydt/app/exam/ChapterKmWellcom.aspx?km=0&car=3

// 精选题库分类列表
// http://ydt1.hzqatc.com/qaydt/app/exam/k.aspx?km=0&car=2
// document.querySelectorAll('.divContent a') 可能的链接类型
// 地方题库 http://ydt1.hzqatc.com/qaydt/app/exam/k400k1.aspx
// 地方题库页面下又是普通分类类型获取tid
// 普通分类 http://ydt1.hzqatc.com/qaydt/app/exam/rec.aspx?tid=10124

// 满分学习 http://ydt1.hzqatc.com/qaydt/app/exam/ChapterKm.aspx?km=2&car=2

// 分类练习列表 http://ydt1.hzqatc.com/qaydt/app/exam/ChapterKm.aspx?km=0&car=3
// document.querySelectorAll('.divCh a')
// 普通分类 http://ydt1.hzqatc.com/qaydt/app/exam/rec.aspx?tid=50301

// 题库列表接口 http://ydt1.hzqatc.com/qaydt/app/exam/rec.ashx?tid=10123
// {count: 0, err: 0, rec: []}

spider = (function () {

let spider = new Spider({
    categories: [],
    questions: []
});

function main () {

    let KMs = {
        0: '科目一',
        1: '科目四',
        2: '满分学习'
    };

    let MODELs = {
        0: 'cart',
        1: 'truck',
        2: 'bus',
        3: 'mtc'
    };

    let uid = 1;

    let host = 'http://ydt1.hzqatc.com';

    Object.keys(KMs).forEach((km) => {
        Object.keys(MODELs).forEach((model) => {
            spider.addTask(`${host}/qaydt/app/exam/ChapterKm.aspx?km=${km}&car=${model}`, {

            }, {
                catelist: true,
                cate: {
                    km: KMs[km],
                    model: MODELs[model],
                    type: 'cate'
                }
            });

            spider.addTask(`${host}/qaydt/app/exam/k.aspx?km=${km}&car=${model}`, {

            }, {
                catelist: true,
                cate: {
                    km: KMs[km],
                    model: MODELs[model],
                    type: 'special'
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

            let lists = [...doc.querySelectorAll<HTMLDivElement>('.divContent a')];

            lists.forEach((el) => {
                let name = el.innerText.trim();
                let link = el.href;
                let id = new URL(link).searchParams.get('tid');

                if (id) {
                    let category = {
                        uid: uid++,
                        id: id,
                        name: name,
                        link: link,
                        ...task.data.cate
                    };
                    // console.log('category', category);

                    spider.state.categories.push(category);

                    let url = `${host}/qaydt/app/exam/rec.ashx?tid=${id}`;

                    if (!spider.hasTask(url)) {
                        spider.addTask(url, {}, {
                            questions: true,
                            uid: category.uid,
                            tid: id
                        });
                    }
                }
                else if (name === '地方题库') {
                    if (!spider.hasTask(link)) {
                        spider.addTask(link, {}, {
                            catelist: true,
                            cate: {
                                ...task.data.cate,
                                type: 'local'
                            }
                        });
                    }
                }
                else {
                    console.error('未处理的分类链接', name, link);
                }
            });
        }
    });

    spider.addRule({
        match: function (task) {
            return task.data.questions;
        },
        dataType: 'text',
        parse: function (spider, text, task) {

            let response = parseJSON(text);

            if (response.err !== 0) {
                throw new Error('question api result error:' + text);
            }

            response.rec.forEach((q) => {
                q.uid = uid++;
                q.cuid = task.data.uid;
                q.category_id = task.data.tid;
            });

            spider.state.questions = spider.state.questions.concat(response.rec);
        }
    });

    spider.run();
}

main();

return spider;

function getFiles (questions) {
    let files = [];
    let mediaUrl = "http://mbst.hzqatc.net/exam";
    let ver = Date.now();

    questions.forEach((q) => {

        if (q.sinaimg) {
            files.push(mediaUrl + '/' + q.sinaimg);
        }

        // if (q.video_url) {
        //     files.push(mediaUrl + '/mp4' + q.video_url);
        // }

        if (q.ExImg1) {
            files.push(mediaUrl + '/' + q.ExImg1);
        }

        if (q.ExImg2) {
            files.push(mediaUrl + '/' + q.ExImg2);
        }

        if (q.ExImg3) {
            files.push(mediaUrl + '/' + q.ExImg3);
        }

        files.push(mediaUrl + '/skill/' + q.id + '.gif'); // 技巧图
        files.push(mediaUrl + '/mp3/' + q.id + '.mp3'); // 技巧
        files.push(mediaUrl + '/Qmp3/' + q.id + '.mp3'); // 读题
        files.push(mediaUrl + '/Emp3/' + q.id + '.mp3'); // 官方解读
    });

    return files;
}

}());

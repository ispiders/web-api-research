interface TSign {
    title: string;
    desc: string;
    image: string;
    cate: string;
    tag: string;
}

interface TTargetCategory {
    id: number;
    title: string;
    intr?: string;
    image?: string;
    status?: number;
    sort?: number;
    add_time?: number;
}

interface TTargetSign {
    id: number;
    cid: number;
    title: string;
    intr?: string;
    image?: string;
    status?: number;
    sort?: number;
    add_time?: number;
}

function prepareData (data: TSign[]) {

    let cateMap = {};
    let cateUid = 1000;
    let cates: TTargetCategory[] = [];

    let signMap = {};
    let signUid = 10000;
    let signs: TTargetSign[] = [];

    data.forEach((sign) => {
        let cid = cateMap[sign.cate];

        if (!cid) {
            cid = cateMap[sign.cate] = cateUid++;
            cates.push({
                id: cid,
                title: sign.cate,
                status: 1,
                add_time: Math.floor(Date.now() / 1000)
            });
        }

        signs.push({
            id: signUid++,
            cid: cid,
            title: sign.title,
            intr: sign.desc,
            image: sign.image.replace('//', '/'),
            status: 1,
            add_time: Math.floor(Date.now() / 1000)
        });
    });

    return {
        signs,
        cates
    };
}

function generateSql (signs) {

    let data = prepareData(signs);

    return {
        cateSql: generateInsertSql('eb_training_sign_category', data.cates, {maxRow: 100}),
        signSql: generateInsertSql('eb_training_sign', data.signs, {maxRow: 100})
    };
}


function downloadSql (data) {
    let sqls = generateSql(data);

    download(sqls.cateSql, 'jiakaobaodian-signs-to-crmeb-jk-cates.sql');
    download(sqls.signSql, 'jiakaobaodian-signs-to-crmeb-jk-signs.sql');

    return sqls;
}

function loadAndRun () {
    return Promise.all([
        fetch('/data/jiakaobaodian-signs-1.json').then(r => r.json())
    ]).then(([data]) => {
        return downloadSql(data);
    }).then((data) => {
        window.data = data;
    });
}

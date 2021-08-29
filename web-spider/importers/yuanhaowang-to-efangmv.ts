interface TPhotoImage {
    id: string;
    imageInfo: {
        uid: number;
        createTime: number;
        src: string;
    }[];
    name: string;
}

interface TXiaoqu {
    id: string;
    communityId: number;
    alias: string[];
    homePage: string; // 封面图
    title: string;
    xAxis: string;
    yAxis: string;
    photoImage: TPhotoImage[];
    averagePrice: number;
    cityCode: string;
    cityName: string;
    cityFirstLetters: string;
    areaCode: string;
    areaName: string;
    businessCode: string;
    businessName: string;
    detailedAddress: string;
    propertyCompany: string;
}

interface TTargetXiaoqu {
  id: number; // int(10) unsigned NOT NULL AUTO_INCREMENT,
  create_time: number; // int(11) NOT NULL,
  update_time: number; // int(11) NOT NULL,
  user_id: number; // int(11) NOT NULL,
  admin_id: number; // int(11) NOT NULL,
  status?: number; // tinyint(4) NOT NULL DEFAULT 0,
  title: string; // varchar(255) NOT NULL DEFAULT ' ',
  myorder?: number; // int(11) NOT NULL DEFAULT 0,
  address: string; // varchar(255) NOT NULL,
  area_id: number; // int(11) NOT NULL COMMENT '区域',
  hots: string; // varchar(255) NOT NULL COMMENT '热度指数',
  is_jy: number; // tinyint(1) NOT NULL COMMENT '禁言',
  point: string; // varchar(255) NOT NULL,
  onclick: number; // int(255) NOT NULL,
  lng: string; // text NOT NULL,
  lat: string; // text NOT NULL,
  pic: string; // text NOT NULL,
  seo_tit?: string; // varchar(255) DEFAULT NULL,
  seo_kw?: string; // varchar(255) DEFAULT NULL,
  seo_des?: string; // varchar(255) DEFAULT NULL,
}

interface TArea {
    id: number;
    title: string;
    pid: number;
    level: number;
    myorder: number;
}

let globalPhoneNumber = '0512-67542676';

let areaMap = {
    "吴江": 100,
    "姑苏": 101,
    "吴中": 102,
    "相城": 103,
    "金阊": 104,
    "工业园区": 105,
    "工业园": 106,
    "平江": 107,
    "沧浪": 108,
    "高新区": 109,
    "虎丘": 110,
    "常熟": 111,
    "张家港": 112
};

function trimParams (url: string) {
    if (url) {
        return url.replace(/\?.*$/, '');
    }

    return ''
}

function prepareXiaoquData (xiaoqus: {getDetail: TXiaoqu}[]) {

    let areaMap = {};
    let areaUid = 100;
    let areaData: TArea[] = [];

    let xiaoquData =  xiaoqus.map(({getDetail}, index) => {

        let xiaoqu = getDetail;
        let areaName = xiaoqu.areaName;
        let areaId = areaMap[areaName] || '';

        if (!areaId && areaName) {
            areaId = areaMap[areaName] = areaUid++;
            areaData.push({
                id: areaId,
                title: areaName,
                pid: 0,
                level: 0,
                myorder: 0
            });
        }

        let data: TTargetXiaoqu = {
            id: xiaoqu.communityId,
            create_time: Math.floor(Date.now() / 1000),
            update_time: Math.floor(Date.now() / 1000),
            user_id: 0,
            admin_id: 20,
            title: xiaoqu.title,
            address: xiaoqu.detailedAddress,
            area_id: areaId,
            hots: '',
            is_jy: 0,
            point: '',
            onclick: 0,
            lng: xiaoqu.xAxis,
            lat: xiaoqu.yAxis,
            pic: trimParams(xiaoqu.homePage)
        };

        return data;
    });

    return {
        xiaoquData,
        areaData
    };
}

function generateXiaoquSql (doDownload = false) {

    return fetch('/data/yuanhaowang-xiaoqus.json').then(r => r.json()).then((data) => {

        let {xiaoquData, areaData} = prepareXiaoquData(data);

        let xiaoquSql = generateInsertSql('cqz_plot', xiaoquData, {maxRow: 100});
        let areaSql = generateInsertSql('cqz_area', areaData, {maxRow: 100});

        if (doDownload) {
            download(xiaoquSql, 'yuanhaowang-to-efangmv-xiaoqus.sql');
            download(areaSql, 'yuanhaowang-to-efangmv-areas.sql');
        }

        return {
            xiaoquSql,
            areaSql
        };
    });
}

interface TNews {
    id: number;
    parentCode: string;
    code: string;
    categoryCode?: string;
    cityCode: string;
    cityName: string;
    title: string;
    voteUp: string;
    visitCount: string;
    summary: string;
    content: string;
    source: string;
    sourceSite?: string;
    author: string;
    imagePath: string;
    status: number;
    companyId: string;
    departmentId: string;
    departmentName: string;
    publishTime: string;
    createTime: string;
    newHouseIds: string;
    secondHouseIds: string;
    keywords: string;
    synAssociationId?: string;
    sync: number;
    parentName: string;
}

interface TTargetNews {
    id: number; // int(10) unsigned NOT NULL AUTO_INCREMENT,
    create_time: number; // int(11) DEFAULT NULL,
    update_time: number; // int(11) DEFAULT NULL,
    user_id: number; // int(11) DEFAULT NULL,
    admin_id: number; // int(11) DEFAULT NULL,
    status?: number; // tinyint(4) NOT NULL DEFAULT 0,
    title: string; // varchar(255) NOT NULL DEFAULT ' ',
    myorder?: number; // int(11) NOT NULL DEFAULT 0,
    is_toped: number; // tinyint(4) NOT NULL COMMENT '固顶',
    text: string; // longtext NOT NULL,
    pic: string; // varchar(255) NOT NULL,
    level: number; // tinyint(4) NOT NULL COMMENT '1 头条 2首页轮播 3首页突出 4首页滚动快讯',
    build_id: number; // int(11) NOT NULL COMMENT '楼盘ID',
    news_cate_id: number; // int(11) NOT NULL COMMENT '隶属分类',
    onclick: number; // int(11) NOT NULL,
    news_tag_id: number; // int(11) NOT NULL,
    is_top: number; // tinyint(4) NOT NULL,
    is_good: number; // tinyint(4) NOT NULL,
    is_open: number; // tinyint(1) NOT NULL COMMENT '是否开盘通知',
}

interface TNewsCate {
    id: number;
    parentId: string;
    childs?: TNewsCate[];
    code: string;
    name: string;
    cityCode: string;
}

interface TTargetNewsCate {
    id: number; // int(10) unsigned NOT NULL AUTO_INCREMENT,
    create_time?: number; // int(11) DEFAULT NULL,
    update_time?: number; // int(11) DEFAULT NULL,
    user_id?: number; // int(11) DEFAULT NULL,
    admin_id?: number; // int(11) DEFAULT NULL,
    status?: number; // tinyint(4) NOT NULL DEFAULT 0,
    title: string; // varchar(255) NOT NULL DEFAULT ' ',
    myorder?: number; // int(11) NOT NULL DEFAULT 0,
}

function prepareNewsCateData (cates: TNewsCate[]) {

    let data: TTargetNewsCate[] = [];

    cates.forEach((item) => {
        if (item.childs) {
            item.childs.forEach((cate) => {
                data.push({
                    id: cate.id,
                    title: cate.name
                });
            });
        }
    });

    return data;
}

function trimLinks (html: string) {
    let el = document.createElement('div');

    el.innerHTML = html;
    let links = [...el.querySelectorAll<HTMLAnchorElement>('a[href]')];

    links.forEach((a) => {
        let textNode = document.createTextNode(a.innerText);
        let parentElement = a.parentElement;

        if (parentElement) {
            parentElement.insertBefore(textNode, a);
            parentElement.removeChild(a);
        }
    });

    return el.innerHTML;
}

function prepareNewsData (news: TNews[]) {

    let data = news.map((item) => {

        let targetNews: TTargetNews = {
            id: item.id,
            create_time: Math.floor(new Date(item.createTime).getTime() / 1000),
            update_time: Math.floor(new Date(item.publishTime).getTime() / 1000),
            user_id: 0,
            admin_id: 20,
            title: item.title,
            is_toped: 0,
            text: trimLinks(item.content),
            pic: item.imagePath,
            level: 0,
            build_id: 0,
            news_cate_id: Number(item.code),
            onclick: 0,
            news_tag_id: 0,
            is_top: 0,
            is_good: 0,
            is_open: 0
        };

        return targetNews;
    });

    return data;
}

function generateNewsSql (doDownload = false) {

    return Promise.all([
        fetch('/data/yuanhaowang-news.json').then(r => r.json()),
        fetch('/data/yuanhaowang-news-cates.json').then(r => r.json()),
    ]).then(([news, cates]) => {

        let catesData = prepareNewsCateData(cates);
        let newsData = prepareNewsData(news);

        let newsSql = generateInsertSql('cqz_news', newsData, {maxRow: 100});
        let newsCateSql = generateInsertSql('cqz_news_cate', catesData, {maxRow: 100});

        if (doDownload) {
            download(newsSql, 'yuanhaowang-to-efangmv-news.sql');
            download(newsCateSql, 'yuanhaowang-to-efangmv-news-cates.sql');
        }

        return {
            newsSql,
            newsCateSql
        };
    });
}

interface TFile {
    uid: string;
    url: string;
    name: string;
    status: string;
}

interface TRoomlayout {
    id: string;
    room: string;
    board: string;
    isTop: string;
    notes: string;
    toilet: string;
    fileList: TFile[];
    model_area: string;
    model_high: string;
    model_tags: string[];
    model_design: string;
    model_status: string;
    model_standard: string;
    model_give_area: string;
    model_orientation: string;
    model_give_position: string;
    model_standard_amount: string;
    referencePrice: string;
    model_status_key: string;
}

interface TTargetFile {
    id: number; // int(10) unsigned NOT NULL AUTO_INCREMENT,
    create_time?: number; // int(11) NOT NULL DEFAULT 0,
    update_time?: number; // int(11) NOT NULL DEFAULT 0,
    user_id?: number; // int(11) DEFAULT NULL,
    admin_id?: number; // int(11) DEFAULT NULL,
    status?: number; // tinyint(4) NOT NULL DEFAULT 0,
    title?: string; // varchar(255) NOT NULL DEFAULT ' ',
    myorder?: number; // int(11) NOT NULL DEFAULT 0,
    table_name: string; // text NOT NULL,
    data_id?: number; // int(11) DEFAULT NULL,
    basename: string; // text NOT NULL,
    extension: string; // text NOT NULL,
    field: string; // text NOT NULL,
    filename: string; // text NOT NULL,
    name: string; // text NOT NULL,
    size: string; // text NOT NULL,
    type: string; // text NOT NULL,
    url: string; // text NOT NULL,
    ges: string; // text NOT NULL COMMENT '格式',
    is_cancel?: number; // tinyint(1) NOT NULL DEFAULT 0,
    shi: number; // tinyint(4) NOT NULL,
    tin: number; // tinyint(4) NOT NULL,
    wei: number; // tinyint(4) NOT NULL,
    place: number; // int(10) NOT NULL,
    sell_id: number; // int(11) NOT NULL,
    is_face: number; // tinyint(1) NOT NULL COMMENT '是否封面',
    chaox: string; // varchar(255) NOT NULL,
}

interface TResidentialQuarters {
    communityId: number; // 1270305,
    residentialQuartersId: string; // "RD829355178452832256284",
    residentialQuartersName: string; // "合景绿城·朗月滨河",
    alias: string[]; // [],
    aliasAbbreviation: string[]; // [],
    residentialQuartersAbbreviation: string; // "gylclybh,gjlclybh,hylclybh,hjlclybh",
    detailedAddress: string; // "城南街道澄湖中路1号",
    propertyCompany: string; // "绿城服务集团有限公司苏州分公司",
    propertyFee: string; // null,
    advanceSaleNo: string; // "苏房预吴中2020288号",
    electricType: string; // "",
    supplyType: string; // "",
    gasFee: string; // null,
    updateTime: string; // "2021-04-14T11:26:26.000+0800",
    bathroomWaterFee: string; // null,
    renovationType: string[]; // ["毛坯"],
    renovationTypeKv: string; // "KV601790216600027136263",
    parkingNum: string; // "956",
    parkingFee: string; // null,
    volumeRate: number; // 2.5,
    greenRate: string; // "37",
    parkingRate: string; // "1:1.2",
    constructionYear: string; // "",
    propertyType: string[]; // ["住宅"],
    propertyTypeKv: string; // "KV602182943145721856282",
    // subwayCodeInfo: string; // [],
    developers: string; // "苏州市卓誉房地产开发有限公司",
    landNum: string[]; // [],
    // advanceSaleNum: string; // [],
    // ownershipCode: string; // [],
    totalRoom: number; // 776,
    remarks: string; // null,
    buildPropertyRight: string[]; // ["70年"],
    // decorateType: string[]; // [],
    buildStructure: string[]; // [],
    buildHeight: string[]; // [],
    // exteriorWall: string; // [],
    buildArea: number; // 90000,
    coveredArea: number; // 37000
}

interface TRightCardInfo {
    title: string; // "蔚然锦绣花园",
    totalPrice: string; // "",
    mainLayout: string; // "3室/4室",
    housePhone: string; // "1310539",
    residentialQuartersStatus: string; // "在售",
    referenceAveragePrice: number; // 18000,
    detailedAddress: string; // "吴中区太湖度假区孙武路与香山路交汇处",
    houseArea: string; // "96-128",
    marketTime: string; // "2021-07-13T11:20:12.000+0800",
    deliverTime: string; // "2022-01-01T00:00:00.000+0800"
}

interface TLoupan {
    id: string;
    mainKeyId: number;
    searchIndex: string;
    alias: string[];
    homePage: string;
    title: string;
    xAxis: string;
    yAxis: string;
    residentialQuartersStatusKv: string;
    photoImage: TPhotoImage[];
    roomLayout: TRoomlayout[];
    // activityInfo: string;
    houseTitleTags: string[];
    totalPrice: number;
    referencePrice: string;
    referenceAveragePrice: number;
    mainLayout: string;
    houseArea: string;
    cityCode: string;
    cityName: string;
    cityFirstLetters: string;
    areaCode: string;
    areaFirstLetters: string;
    areaName: string;
    businessCode: string;
    businessName: string;
    businessFirstLetters: string;
    marketTime: string;
    deliverTime: string;
    housePhone: string;
    domain: string;
    detailedAddress: string;
    originDomain: string;
    residentialQuartersStatus: string;
    promotionStatusName: string[];
    promotionStatus: string;
    companyId: string;
    originCompanyId: string;
    isFollow: string;
    projectRemarkJson: {
        matching: string;
        advantage: string;
        weaknesses: string;
    };
    // buyerShowJson: array;
    // specialHouseJson: array;
    // evaluationScoreJson: array;
    sellingPointsJson: {
        text: string;
    };
    viewExperienceJson: string;
    houseBuildPriceDetails: string;
    residentialQuarters: TResidentialQuarters;
    seoImage: string[];
    // recommendHotHouse: string;
    // nearResidentialQuarters: string;
    // samePriceNewHouse: string;
    // activeInfo: string;
    // wendaList: string;
    // pinglunList: string;
    // frame: string;
    // qrCode: string;
    rightCardInfo: TRightCardInfo
}

interface TTargetLoupan {
    id: number; // int(10) unsigned NOT NULL AUTO_INCREMENT,
    create_time: number; // int(11) DEFAULT NULL COMMENT '新增时间',
    update_time: number; // int(11) DEFAULT NULL COMMENT '更新时间',
    user_id?: number; // int(11) DEFAULT NULL,
    admin_id?: number; // int(11) DEFAULT NULL COMMENT '管理员id',
    status?: number; // tinyint(4) NOT NULL DEFAULT 0 COMMENT '0=未审核 1=已审核',
    title: string; // varchar(255) NOT NULL DEFAULT ' ' COMMENT '名称',
    myorder?: number; // int(11) NOT NULL DEFAULT 0 COMMENT '排序',
    onclick1: number; // int(11) NOT NULL COMMENT '浏览量',
    text: string; // varchar(255) NOT NULL COMMENT '详情',
    tags: string; // varchar(255) NOT NULL COMMENT '标签build_tags  ids  用逗号隔开',
    name: string; // varchar(255) NOT NULL COMMENT '名称',
    address: string; // varchar(255) NOT NULL COMMENT '详细地址',
    types: string; // varchar(255) NOT NULL COMMENT '楼盘类型ids',
    sell_id: number; // int(11) NOT NULL COMMENT '销售状态id',
    price_type: string; // varchar(255) NOT NULL COMMENT '均价',
    price: number; // int(11) NOT NULL COMMENT '均价',
    price_unit: string; // varchar(255) NOT NULL COMMENT '单位',
    is_show_list: number; // tinyint(1) NOT NULL COMMENT '是否显示',
    price1: string; // varchar(255) NOT NULL COMMENT '价格1',
    price2: string; // varchar(255) NOT NULL COMMENT '自定义价格2',
    price3: string; // varchar(255) NOT NULL COMMENT '自定义价格3',
    year: string; // varchar(255) NOT NULL COMMENT '年限',
    code: string; // varchar(255) NOT NULL COMMENT '楼盘代号',
    area_id: number; // int(11) NOT NULL COMMENT '地区ID',
    lon_lat: string; // varchar(255) NOT NULL COMMENT '经纬度',
    time_rz: string; // text NOT NULL COMMENT '认证时间',
    kws: string; // varchar(255) NOT NULL COMMENT '关键词 逗号隔开',
    kaifs: string; // varchar(255) NOT NULL COMMENT '开发商',
    progress: string; // varchar(255) NOT NULL COMMENT '楼盘进度',
    yous: string; // varchar(255) NOT NULL COMMENT '优势',
    lies: string; // varchar(255) NOT NULL COMMENT '劣势',
    sell_address: string; // varchar(255) NOT NULL COMMENT '售楼地址',
    call_code: string; // varchar(255) NOT NULL COMMENT '手机代号',
    call: string; // varchar(255) NOT NULL COMMENT '联系电话',
    touzs: string; // varchar(255) NOT NULL COMMENT '投资商',
    xukz: string; // varchar(255) NOT NULL COMMENT '许可证',
    time_kp: string; // text NOT NULL COMMENT '开盘时间',
    finish: string; // varchar(255) NOT NULL COMMENT '交房标准',
    market: string; // varchar(255) NOT NULL COMMENT '营销策划',
    wuy_tag: string; // varchar(255) NOT NULL COMMENT '物业特色',
    youh: string; // varchar(255) NOT NULL COMMENT '优惠信息',
    youh_link: string; // varchar(255) NOT NULL COMMENT '优惠链接',
    group: string; // varchar(255) NOT NULL COMMENT '初始团购人数',
    hot: string; // varchar(255) NOT NULL COMMENT '热度指数',
    vr: string; // varchar(255) NOT NULL COMMENT 'VR链接',
    price_text: string; // varchar(255) NOT NULL COMMENT '自定义参考总价',
    place_text: string; // varchar(255) NOT NULL COMMENT '自定义参考建面范围',
    zd_place: string; // varchar(255) NOT NULL COMMENT '占地面积',
    jz_place: string; // varchar(255) NOT NULL COMMENT '建筑面积',
    lvh: string; // varchar(255) NOT NULL COMMENT '绿化率',
    rongj: string; // varchar(255) NOT NULL COMMENT '容积率',
    wuy: string; // varchar(255) NOT NULL COMMENT '物业公司',
    parking: string; // varchar(255) NOT NULL COMMENT '停车位',
    houses: string; // varchar(255) NOT NULL COMMENT '总户数',
    wuyf: string; // varchar(255) NOT NULL COMMENT '物业费',
    wuyf_text: string; // varchar(255) NOT NULL COMMENT 'wuyf_text',
    floors: string; // varchar(255) NOT NULL COMMENT 'floors',
    seo_tit: string; // varchar(255) NOT NULL COMMENT 'SEO标题',
    seo_kw: string; // varchar(255) NOT NULL COMMENT 'SEO关键词',
    seo_des: string; // varchar(255) NOT NULL COMMENT 'SEO描述',
    is_gw: string; // varchar(255) NOT NULL COMMENT '是否置业顾问',
    is_mid: number; // int(11) NOT NULL COMMENT '是否中介',
    is_yh_box: string; // varchar(255) NOT NULL,
    is_zxs: string; // varchar(255) NOT NULL,
    group_remark: string; // varchar(255) NOT NULL COMMENT '团购备注',
    is_call: string; // varchar(255) NOT NULL,
    is_toped: string; // varchar(255) NOT NULL COMMENT '固顶',
    is_top: string; // varchar(255) NOT NULL COMMENT '置顶',
    is_good: string; // varchar(255) NOT NULL COMMENT '推荐',
    re_time: number; // int(11) NOT NULL COMMENT '刷新时间',
    pic: string; // varchar(255) NOT NULL COMMENT '封面图片',
    point: string; // varchar(255) NOT NULL,
    lng: string; // text NOT NULL COMMENT '经度',
    lat: string; // text NOT NULL COMMENT '纬度',
    onclick: number; // int(255) NOT NULL COMMENT '点击量',
}

function timestamp (date: string) {

    return date ? Math.floor(new Date(date).getTime() / 1000) : 0;
}

function prepareLoupanData (loupans: TLoupan[]) {

    //
    let tagsMap: {[tag: string]: number} = {};
    let tagsData: {id: number; title: string;}[] = [];
    let tagUid = 100;

    //
    let sellStatusMap = {
        '待售': 1,
        '在售': 2,
        '尾盘': 3,
        '售馨': 4
    };

    //
    let fileData: TTargetFile[] = [];
    // let roomLayoutMap: {[id: string]: number} = {};
    let fileUid = 10000;

    //
    let piccateData: {id: number; title: string;}[] = [];
    let piccateUid = 100;
    let piccateMap: {[name: string]: number;} = {};

    //
    let typeData: {id: number; title: string;}[] = [];
    let typeUid = 100;
    let typeMap: {[type: string]: number;} = {};

    let loupanData = loupans.map((loupan) => {

        let tags: number[] = [];

        loupan.houseTitleTags.forEach((tag) => {
            if (!tagsMap[tag]) {
                let tagId = tagUid++;
                tagsMap[tag] = tagUid;
                tagsData.push({
                    id: tagId,
                    title: tag
                });
            }

            tags.push(tagsMap[tag]);
        });

        // roomLayout
        loupan.roomLayout.forEach((layout) => {
            if (layout.fileList.length) {
                fileData.push({
                    id: fileUid++,
                    table_name: 'build', // text NOT NULL,
                    data_id: loupan.mainKeyId,
                    basename: '', // text NOT NULL,
                    extension: '', // text NOT NULL,
                    field: 'hx', // text NOT NULL,
                    filename: '', // text NOT NULL,
                    name: layout.fileList[0].name, // text NOT NULL,
                    size: '', // text NOT NULL,
                    type: '', // text NOT NULL,
                    url: trimParams(layout.fileList[0].url), // text NOT NULL,
                    ges: '', // text NOT NULL COMMENT '格式',
                    shi: Number(layout.room) || 0, // tinyint(4) NOT NULL,
                    tin: Number(layout.board) || 0, // tinyint(4) NOT NULL,
                    wei: Number(layout.toilet) || 0, // tinyint(4) NOT NULL,
                    place: Number(layout.model_area) || 0, // int(10) NOT NULL,
                    sell_id: 0, // int(11) NOT NULL,
                    is_face: 0, // tinyint(1) NOT NULL COMMENT '是否封面',
                    chaox: '', // varchar(255) NOT NULL,
                });
            }
        });

        loupan.photoImage.forEach((photo) => {
            if (photo.name === '视频') {
                photo.imageInfo.forEach((image) => {
                    fileData.push({
                        id: fileUid++,
                        table_name: 'build', // text NOT NULL,
                        data_id: loupan.mainKeyId,
                        basename: '', // text NOT NULL,
                        extension: '', // text NOT NULL,
                        field: 'video', // text NOT NULL,
                        filename: '', // text NOT NULL,
                        name: '', // text NOT NULL,
                        size: '', // text NOT NULL,
                        type: '', // text NOT NULL,
                        url: trimParams(image.src), // text NOT NULL,
                        ges: '', // text NOT NULL COMMENT '格式',
                        shi: 0, // tinyint(4) NOT NULL,
                        tin: 0, // tinyint(4) NOT NULL,
                        wei: 0, // tinyint(4) NOT NULL,
                        place: 0, // int(10) NOT NULL,
                        sell_id: 0, // int(11) NOT NULL,
                        is_face: 0, // tinyint(1) NOT NULL COMMENT '是否封面',
                        chaox: '', // varchar(255) NOT NULL,
                    });
                });
            }
            else {
                let id = piccateMap[photo.name];

                if (!id) {
                    id = piccateUid++;
                    piccateData.push({
                        id: id,
                        title: photo.name
                    });
                    piccateMap[photo.name] = id;
                }

                photo.imageInfo.forEach((image) => {
                    fileData.push({
                        id: fileUid++,
                        table_name: 'build', // text NOT NULL,
                        data_id: loupan.mainKeyId,
                        basename: '', // text NOT NULL,
                        extension: '', // text NOT NULL,
                        field: 'field_' + id, // text NOT NULL,
                        filename: '', // text NOT NULL,
                        name: '', // text NOT NULL,
                        size: '', // text NOT NULL,
                        type: '', // text NOT NULL,
                        url: trimParams(image.src), // text NOT NULL,
                        ges: '', // text NOT NULL COMMENT '格式',
                        shi: 0, // tinyint(4) NOT NULL,
                        tin: 0, // tinyint(4) NOT NULL,
                        wei: 0, // tinyint(4) NOT NULL,
                        place: 0, // int(10) NOT NULL,
                        sell_id: 0, // int(11) NOT NULL,
                        is_face: 0, // tinyint(1) NOT NULL COMMENT '是否封面',
                        chaox: '', // varchar(255) NOT NULL,
                    });
                });
            }
        });

        // build_cate
        let typeIds: number[] = [];

        loupan.residentialQuarters.propertyType.forEach((type) => {
            let id = typeMap[type];

            if (!id) {
                id = typeUid++;
                typeMap[type] = id;
            }

            typeIds.push(id);
            typeData.push({
                id: id,
                title: type
            });
        });

        loupan.residentialQuarters.buildHeight.forEach((type) => {
            let id = typeMap[type];

            if (!id) {
                id = typeUid++;
                typeMap[type] = id;
            }

            typeIds.push(id);
            typeData.push({
                id: id,
                title: type
            });
        });

        let targetNews: TTargetLoupan = {
            id: loupan.mainKeyId,
            create_time: timestamp(loupan.marketTime), // int(11) DEFAULT NULL COMMENT '新增时间',
            update_time: timestamp(loupan.deliverTime), // int(11) DEFAULT NULL COMMENT '更新时间',
            user_id: 0, // int(11) DEFAULT NULL,
            admin_id: 0, // int(11) DEFAULT NULL COMMENT '管理员id',
            status: 1, // tinyint(4) NOT NULL DEFAULT 0 COMMENT '0=未审核 1=已审核',
            title: loupan.title, // varchar(255) NOT NULL DEFAULT ' ' COMMENT '名称',
            myorder: 0, // int(11) NOT NULL DEFAULT 0 COMMENT '排序',
            onclick1: 0, // int(11) NOT NULL COMMENT '浏览量',
            text: loupan.projectRemarkJson.matching, // varchar(255) NOT NULL COMMENT '详情',
            tags: tags.join(','), // varchar(255) NOT NULL COMMENT '标签build_tags  ids  用逗号隔开',
            name: loupan.alias[0], // varchar(255) NOT NULL COMMENT '名称',
            address: loupan.detailedAddress, // varchar(255) NOT NULL COMMENT '详细地址',
            types: typeIds.join(','), // varchar(255) NOT NULL COMMENT '楼盘类型ids',
            sell_id: sellStatusMap[loupan.residentialQuartersStatus] || 0, // int(11) NOT NULL COMMENT '销售状态id',
            price_type: loupan.referencePrice, // varchar(255) NOT NULL COMMENT '均价',
            price: loupan.referenceAveragePrice, // int(11) NOT NULL COMMENT '均价',
            price_unit: '', // varchar(255) NOT NULL COMMENT '单位',
            is_show_list: 0, // tinyint(1) NOT NULL COMMENT '是否显示',
            price1: '', // varchar(255) NOT NULL COMMENT '价格1',
            price2: '', // varchar(255) NOT NULL COMMENT '自定义价格2',
            price3: '', // varchar(255) NOT NULL COMMENT '自定义价格3',
            year: String(parseInt(loupan.residentialQuarters.buildPropertyRight[0]) || ''), // varchar(255) NOT NULL COMMENT '年限',
            code: '', // varchar(255) NOT NULL COMMENT '楼盘代号',
            area_id: areaMap[loupan.areaName] || 0, // int(11) NOT NULL COMMENT '地区ID',
            lon_lat: '', // varchar(255) NOT NULL COMMENT '经纬度',
            time_rz: '', // text NOT NULL COMMENT '认证时间',
            kws: '', // varchar(255) NOT NULL COMMENT '关键词 逗号隔开',
            kaifs: loupan.residentialQuarters.developers, // varchar(255) NOT NULL COMMENT '开发商',
            progress: '', // varchar(255) NOT NULL COMMENT '楼盘进度',
            yous: loupan.projectRemarkJson.advantage, // varchar(255) NOT NULL COMMENT '优势',
            lies: loupan.projectRemarkJson.weaknesses, // varchar(255) NOT NULL COMMENT '劣势',
            sell_address: loupan.detailedAddress, // varchar(255) NOT NULL COMMENT '售楼地址',
            call_code: '', // varchar(255) NOT NULL COMMENT '手机代号',
            call: globalPhoneNumber, // varchar(255) NOT NULL COMMENT '联系电话',
            touzs: '', // varchar(255) NOT NULL COMMENT '投资商',
            xukz: loupan.residentialQuarters.advanceSaleNo, // varchar(255) NOT NULL COMMENT '许可证',
            time_kp: loupan.marketTime ? loupan.marketTime.split('T')[0] : '', // text NOT NULL COMMENT '开盘时间',
            finish: loupan.residentialQuarters.renovationType[0] || '', // varchar(255) NOT NULL COMMENT '交房标准',
            market: '', // varchar(255) NOT NULL COMMENT '营销策划',
            wuy_tag: '', // varchar(255) NOT NULL COMMENT '物业特色',
            youh: '', // varchar(255) NOT NULL COMMENT '优惠信息',
            youh_link: '', // varchar(255) NOT NULL COMMENT '优惠链接',
            group: '', // varchar(255) NOT NULL COMMENT '初始团购人数',
            hot: '', // varchar(255) NOT NULL COMMENT '热度指数',
            vr: '', // varchar(255) NOT NULL COMMENT 'VR链接',
            price_text: '', // varchar(255) NOT NULL COMMENT '自定义参考总价',
            place_text: '', // varchar(255) NOT NULL COMMENT '自定义参考建面范围',
            zd_place: loupan.residentialQuarters.coveredArea + '㎡', // varchar(255) NOT NULL COMMENT '占地面积',
            jz_place: loupan.residentialQuarters.buildArea + '㎡', // varchar(255) NOT NULL COMMENT '建筑面积',
            lvh: loupan.residentialQuarters.greenRate + '%', // varchar(255) NOT NULL COMMENT '绿化率',
            rongj: loupan.residentialQuarters.volumeRate + '%', // varchar(255) NOT NULL COMMENT '容积率',
            wuy: loupan.residentialQuarters.propertyCompany, // varchar(255) NOT NULL COMMENT '物业公司',
            parking: loupan.residentialQuarters.parkingNum, // varchar(255) NOT NULL COMMENT '停车位',
            houses: loupan.residentialQuarters.totalRoom + '', // varchar(255) NOT NULL COMMENT '总户数',
            wuyf: loupan.residentialQuarters.propertyFee + '元/平/月', // varchar(255) NOT NULL COMMENT '物业费',
            wuyf_text: '', // varchar(255) NOT NULL COMMENT 'wuyf_text',
            floors: '', // varchar(255) NOT NULL COMMENT 'floors',
            seo_tit: '', // varchar(255) NOT NULL COMMENT 'SEO标题',
            seo_kw: '', // varchar(255) NOT NULL COMMENT 'SEO关键词',
            seo_des: '', // varchar(255) NOT NULL COMMENT 'SEO描述',
            is_gw: '', // varchar(255) NOT NULL COMMENT '是否置业顾问',
            is_mid: 0, // int(11) NOT NULL COMMENT '是否中介',
            is_yh_box: '', // varchar(255) NOT NULL,
            is_zxs: '', // varchar(255) NOT NULL,
            group_remark: '', // varchar(255) NOT NULL COMMENT '团购备注',
            is_call: '', // varchar(255) NOT NULL,
            is_toped: '', // varchar(255) NOT NULL COMMENT '固顶',
            is_top: '', // varchar(255) NOT NULL COMMENT '置顶',
            is_good: '', // varchar(255) NOT NULL COMMENT '推荐',
            re_time: 0, // int(11) NOT NULL COMMENT '刷新时间',
            pic: trimParams(loupan.homePage), // varchar(255) NOT NULL COMMENT '封面图片',
            point: '', // varchar(255) NOT NULL,
            lng: loupan.xAxis, // text NOT NULL COMMENT '经度',
            lat: loupan.yAxis, // text NOT NULL COMMENT '纬度',
            onclick: 0, // int(255) NOT NULL COMMENT '点击量',
        };

        return targetNews;
    });

    return {
        loupanData,
        tagsData,
        fileData,
        piccateData
    };
}

function generateLoupanSql (doDownload = false) {

    return Promise.all([
        fetch('/data/yuanhaowang-loupans.json').then(r => r.json())
    ]).then(([loupanList]) => {

        let {loupanData, tagsData, fileData, piccateData} = prepareLoupanData(loupanList.map((item) => item.getDetail));

        let loupanSql = generateInsertSql('cqz_build', loupanData, {maxRow: 100});
        let tagsSql = generateInsertSql('cqz_build_tag', tagsData, {maxRow: 100});
        let fileSql = generateInsertSql('cqz_file', fileData, {maxRow: 100});
        let piccateSql = generateInsertSql('cqz_piccate', piccateData, {maxRow: 100});

        if (doDownload) {
            download(loupanSql, 'yuanhaowang-to-efangmv-loupans.sql');
            download(tagsSql, 'yuanhaowang-to-efangmv-build-tags.sql');
            download(fileSql, 'yuanhaowang-to-efangmv-files.sql');
            download(piccateSql, 'yuanhaowang-to-efangmv-piccates.sql');
        }

        return {
            loupanSql
        };
    });
}

interface TErshoufang {
    id: string; // "p_SH811956913377583104740";
    title: string; // "苏州樾府 出售 135m² 4室2厅2卫 精装";
    alias: string[]; // [];
    houseStatus: string; // "有效";
    isParking: string; // "有";
    parkingExplain: string; // "买的车位有发票";
    floorType: string; // "中层";
    floorTotal: number; // 6;
    homePage: string; // "https://cdn1.xunkyz.com/tocConsul/Cardioid/20210218132157821_667091.png?x-oss-process=style/small-yuanhaowang-com";
    rentTimeCondition: string; // "";
    rentType: string; // "";
    payRequire: string; // "";
    rentalPriceSum: string; // null;
    houseSituationId: string; // "有匙";
    rentRemarks: string; // null;
    cityCode: string; // "320500";
    cityName: string; // "苏州";
    cityFirstLetters: string; // "su";
    areaCode: string; // "320506";
    areaFirstLetters: string; // "wuzhongqu";
    areaName: string; // "吴中";
    businessCode: string; // "659125";
    businessName: string; // "木渎";
    businessFirstLetters: string; // "muduzhen";
    domain: string; // null;
    isFollow: string; // "0";
    availablePriceSum: number; // 375;
    availablePriceSumAvg: number; // 27778;
    originDomain: string; // "";
    houseArea: number; // 135;
    shelvesTime: string; // "2021-08-25T15:30:02";
    houseIntroduce: string; // null;
    label: string[]; // [];
    houseOrientationType: string; // "东南";
    photoImage: TPhotoImage[]; //
    entrustDate: string; // "2021-02-18T13:46:53";
    mortgageSituation: string; // "";
    secondPropertyType: string[]; // string[];
    remarks: string; // string;
    hasElevator: string; // "无";
    liftNum: number; // 2;
    unitHouseholdNum: number; // 24;
    residentialQuartersId: string; // "RD811943228445761536448";
    renovationType: string; // "精装";
    renovationTypeKv: string; // "KV60177994217842278456";
    roomLayoutInfo: {"room": string; "livingRoom": string; "toilet": string; }; //
    transactionType: string; // "出售";
    collectCount: string; // null;
    platformCount: string; // null;
    residentialQuartersPhonetic: string; // "suzhouyuefu";
    attribution: string; // [];
    xAxis: string; // "120.50707087055099";
    yAxis: string; // "31.29275916177798";
    residentialQuarters: TResidentialQuarters; // ;
    roomLayout: string; // "4室2厅2卫;
}

interface TTargetInfo {
    id: number; // int(10) unsigned NOT NULL AUTO_INCREMENT,
    create_time?: number; // int(11) DEFAULT NULL,
    update_time?: number; // int(11) DEFAULT NULL,
    user_id?: number; // int(11) DEFAULT NULL,
    admin_id?: number; // int(11) DEFAULT NULL,
    status?: number; // tinyint(4) NOT NULL DEFAULT 0,
    title?: string; // varchar(255) NOT NULL DEFAULT ' ',
    myorder?: number; // int(11) NOT NULL DEFAULT 0,
    isvideo: string; // varchar(255) NOT NULL,
    info_level: string; // varchar(255) NOT NULL COMMENT '2 精选',
    zhongjie: string; // varchar(255) NOT NULL,
    type: number; // tinyint(4) NOT NULL COMMENT '1 二手 2租房  4求购',
    phone: string; // varchar(255) NOT NULL COMMENT '联系方式',
    user_type: number; // tinyint(4) NOT NULL COMMENT '发布者类型',
    name: string; // varchar(255) NOT NULL,
    is_top: number; // tinyint(1) NOT NULL,
    area_id: number; // int(11) NOT NULL,
    ip: string; // varchar(255) NOT NULL,
    cate_id: number; // int(11) NOT NULL COMMENT 'cate_id',
    plot_id: number; // int(11) NOT NULL COMMENT '小区id',
    address: string; // varchar(255) NOT NULL COMMENT '地址',
    shi: number; // tinyint(2) NOT NULL COMMENT '室',
    tin: number; // tinyint(2) NOT NULL COMMENT '厅',
    wei: number; // tinyint(2) NOT NULL COMMENT '卫',
    floor: string; // varchar(255) NOT NULL COMMENT '楼',
    floors: string; // varchar(255) NOT NULL COMMENT '总楼层',
    chaox?: string; // varchar(255) DEFAULT NULL COMMENT '朝向',
    faci: string; // varchar(255) NOT NULL COMMENT '设备',
    price: number; // int(11) NOT NULL COMMENT '价格',
    peit: string; // varchar(255) NOT NULL COMMENT '配套',
    place: string; // varchar(255) NOT NULL COMMENT '面积',
    youxq?: string; // varchar(255) DEFAULT NULL,
    text: string; // varchar(255) NOT NULL,
    video?: string; // varchar(255) DEFAULT NULL,
    is_sale?: number; // tinyint(1) NOT NULL DEFAULT 1 COMMENT '上下架',
    tags: string; // varchar(255) NOT NULL,
    finish: string; // varchar(255) NOT NULL COMMENT '装修',
    re_time: number; // int(12) NOT NULL,
    onclick: number; // int(11) NOT NULL,
    is_toped: string; // varchar(255) NOT NULL,
    is_good: string; // varchar(255) NOT NULL,
    top_time: number; // int(11) NOT NULL COMMENT '置顶到期时间',
    re_num: number; // int(11) NOT NULL COMMENT '刷新次数',
    pic: string; // varchar(255) NOT NULL,
    is_red: number; // tinyint(1) NOT NULL,
    is_bold?: number; // tinyint(1) DEFAULT NULL,
    point: string; // varchar(255) NOT NULL,
    lng: string; // text NOT NULL,
    lat: string; // text NOT NULL,
}

let infoUid = 10000;
let infoTagUid = 200;
let infoTagMap: {[type: string]: number;} = {};

function prepareErshoufangData (ershoufangs: TErshoufang[]) {

    let ershoufangData: TTargetInfo[] = [];

    //
    let infoTagData: {id: number; title: string;}[] = [];

    //
    let fileData: TTargetFile[] = [];
    let fileUid = 200000;

    ershoufangs.forEach((ershou) => {

        let infoId = infoUid++;

        // build_cate
        let typeIds: number[] = [];

        ershou.residentialQuarters.propertyType.forEach((type) => {
            let id = infoTagMap[type];

            if (!id) {
                id = infoTagUid++;
                infoTagMap[type] = id;
                infoTagData.push({
                    id: id,
                    title: type
                });
            }

            typeIds.push(id);
        });

        ershou.residentialQuarters.buildHeight.forEach((type) => {
            let id = infoTagMap[type];

            if (!id) {
                id = infoTagUid++;
                infoTagMap[type] = id;
                infoTagData.push({
                    id: id,
                    title: type
                });
            }

            typeIds.push(id);
        });

        ershou.photoImage.forEach((photo) => {
            if (photo.name === '视频') {

            }
            else {
                photo.imageInfo.forEach((image) => {
                    fileData.push({
                        id: fileUid++,
                        table_name: 'info', // text NOT NULL,
                        data_id: infoId,
                        basename: '', // text NOT NULL,
                        extension: '', // text NOT NULL,
                        field: '', // text NOT NULL,
                        filename: '', // text NOT NULL,
                        name: '', // text NOT NULL,
                        size: '', // text NOT NULL,
                        type: '', // text NOT NULL,
                        url: trimParams(image.src), // text NOT NULL,
                        ges: '', // text NOT NULL COMMENT '格式',
                        shi: 0, // tinyint(4) NOT NULL,
                        tin: 0, // tinyint(4) NOT NULL,
                        wei: 0, // tinyint(4) NOT NULL,
                        place: 0, // int(10) NOT NULL,
                        sell_id: 0, // int(11) NOT NULL,
                        is_face: 0, // tinyint(1) NOT NULL COMMENT '是否封面',
                        chaox: '', // varchar(255) NOT NULL,
                    });
                });
            }
        });

        let data: TTargetInfo = {
            id: infoId, // int(10) unsigned NOT NULL AUTO_INCREMENT,
            create_time: timestamp(ershou.shelvesTime), // int(11) DEFAULT NULL,
            update_time: timestamp(ershou.shelvesTime), // int(11) DEFAULT NULL,
            user_id: 0, // int(11) DEFAULT NULL,
            admin_id: 0, // int(11) DEFAULT NULL,
            status: 1, // tinyint(4) NOT NULL DEFAULT 0,
            title: ershou.title, // varchar(255) NOT NULL DEFAULT ' ',
            // myorder: 0, // int(11) NOT NULL DEFAULT 0,
            isvideo: '', // varchar(255) NOT NULL,
            info_level: '', // varchar(255) NOT NULL COMMENT '2 精选',
            zhongjie: '', // varchar(255) NOT NULL,
            type: 1, // tinyint(4) NOT NULL COMMENT '1 二手 2租房  4求购',
            phone: globalPhoneNumber, // varchar(255) NOT NULL COMMENT '联系方式',
            user_type: 0, // tinyint(4) NOT NULL COMMENT '发布者类型',
            name: '', // varchar(255) NOT NULL,
            is_top: 0, // tinyint(1) NOT NULL,
            area_id: areaMap[ershou.areaName] || 0, // int(11) NOT NULL,
            ip: '', // varchar(255) NOT NULL,
            cate_id: 0, // int(11) NOT NULL COMMENT 'cate_id',
            plot_id: ershou.residentialQuarters.communityId, // int(11) NOT NULL COMMENT '小区id',
            address: ershou.residentialQuarters.detailedAddress, // varchar(255) NOT NULL COMMENT '地址',
            shi: Number(ershou.roomLayoutInfo.room) || 0, // tinyint(2) NOT NULL COMMENT '室',
            tin: Number(ershou.roomLayoutInfo.livingRoom) || 0, // tinyint(2) NOT NULL COMMENT '厅',
            wei: Number(ershou.roomLayoutInfo.toilet) || 0, // tinyint(2) NOT NULL COMMENT '卫',
            floor: ershou.floorType, // varchar(255) NOT NULL COMMENT '楼',
            floors: String(ershou.floorTotal), // varchar(255) NOT NULL COMMENT '总楼层',
            chaox: ershou.houseOrientationType, // varchar(255) DEFAULT NULL COMMENT '朝向',
            faci: '', // varchar(255) NOT NULL COMMENT '设备',
            price: ershou.availablePriceSum, // int(11) NOT NULL COMMENT '价格',
            peit: '', // varchar(255) NOT NULL COMMENT '配套',
            place: ershou.houseArea + '㎡', // varchar(255) NOT NULL COMMENT '面积',
            // youxq: '', // varchar(255) DEFAULT NULL,
            text: ershou.remarks, // varchar(255) NOT NULL,
            video: '', // varchar(255) DEFAULT NULL,
            // is_sale: 1, // tinyint(1) NOT NULL DEFAULT 1 COMMENT '上下架',
            tags: typeIds.join(','), // varchar(255) NOT NULL,
            finish: ershou.renovationType, // varchar(255) NOT NULL COMMENT '装修',
            re_time: 0, // int(12) NOT NULL,
            onclick: 0, // int(11) NOT NULL,
            is_toped: '', // varchar(255) NOT NULL,
            is_good: '', // varchar(255) NOT NULL,
            top_time: 0, // int(11) NOT NULL COMMENT '置顶到期时间',
            re_num: 0, // int(11) NOT NULL COMMENT '刷新次数',
            pic: trimParams(ershou.homePage), // varchar(255) NOT NULL,
            is_red: 0, // tinyint(1) NOT NULL,
            // is_bold: 0, // tinyint(1) DEFAULT NULL,
            point: '', // varchar(255) NOT NULL,
            lng: ershou.xAxis, // text NOT NULL,
            lat: ershou.yAxis, // text NOT NULL,
        };

        ershoufangData.push(data);
    });

    return {
        ershoufangData,
        infoTagData,
        fileData
    };
}

interface TZufang {
    id: string; // "p_F0193304",
    title: string; // "招商依云华苑 出租 110m² 3室2厅1卫 精装",
    alias: string[]; // string[],
    houseStatus: string; // "有效",
    isParking: string; // "无",
    parkingExplain: string; // null,
    floorType: string; // "",
    floorTotal: number; // 27,
    homePage: string; // "https://cdn3.xunkyz.com/110-7fa9-47af-abdc-884ec583509a.jpg?x-oss-process=style/small-yuanhaowang-com",
    rentTimeCondition: string; // "",
    rentType: string; // "",
    payRequire: string; // "",
    rentalPriceSum: number; // null,
    houseSituationId: string; // "",
    rentRemarks: string; // null,
    cityCode: string; // "320500",
    cityName: string; // "苏州",
    cityFirstLetters: string; // "su",
    areaCode: string; // "320507",
    areaFirstLetters: string; // "xiangchengquxiangchengqu2",
    areaName: string; // "相城",
    businessCode: string; // "659102",
    businessName: string; // "元和",
    businessFirstLetters: string; // "yuanhejiedaoyuanhejiedao2",
    domain: string; // "www.yuanhaowang.com",
    isFollow: string; // "0",
    availablePriceSum: string; // "",
    availablePriceSumAvg: string; // 0,
    houseArea: number; // 110,
    shelvesTime: string; // "2020-01-02T14:23:33",
    houseIntroduce: string; // null,
    label: string[]; // [],
    houseOrientationType: string; // null,
    photoImage: TPhotoImage[]; // TPhotoImage[],
    entrustDate: string; // "2018-06-30T00:00:00",
    mortgageSituation: string; // "",
    secondPropertyType: string[]; // string[],
    remarks: string; // "",
    hasElevator: string; // "无",
    liftNum: number; // 2,
    unitHouseholdNum: number; // 216,
    residentialQuartersId: string; // "RD636595916916129792446",
    renovationType: string; // "精装",
    renovationTypeKv: string; // "KV60177994217842278456",
    roomLayoutInfo: {toilet: number; livingRoom: number; room: number; }; // {"toilet": number; "livingRoom": number; "room": number; },
    transactionType: string; // "出租",
    collectCount: string; // null,
    platformCount: string; // null,
    residentialQuartersPhonetic: string; // "zhaoshangyiyunhuayuan",
    attribution: string[]; // [],
    xAxis: string; // "120.605786",
    yAxis: string; // "31.397251",
    residentialQuarters: TResidentialQuarters; // TResidentialQuarters,
    roomLayout: string; // "3室2厅1卫",
}

function prepareZufangData (zufangs: TZufang[]) {

    let zufangData: TTargetInfo[] = [];

    //
    let infoTagData: {id: number; title: string;}[] = [];//
    let fileData: TTargetFile[] = [];
    let fileUid = 500000;

    zufangs.forEach((zufang) => {

        let infoId = infoUid++;

        // build_cate
        let typeIds: number[] = [];

        zufang.residentialQuarters.propertyType.forEach((type) => {
            let id = infoTagMap[type];

            if (!id) {
                id = infoTagUid++;
                infoTagMap[type] = id;
                infoTagData.push({
                    id: id,
                    title: type
                });
            }

            typeIds.push(id);
        });

        zufang.residentialQuarters.buildHeight.forEach((type) => {
            let id = infoTagMap[type];

            if (!id) {
                id = infoTagUid++;
                infoTagMap[type] = id;
                infoTagData.push({
                    id: id,
                    title: type
                });
            }

            typeIds.push(id);
        });

        zufang.photoImage.forEach((photo) => {
            if (photo.name === '视频') {

            }
            else {
                photo.imageInfo.forEach((image) => {
                    fileData.push({
                        id: fileUid++,
                        table_name: 'info', // text NOT NULL,
                        data_id: infoId,
                        basename: '', // text NOT NULL,
                        extension: '', // text NOT NULL,
                        field: '', // text NOT NULL,
                        filename: '', // text NOT NULL,
                        name: '', // text NOT NULL,
                        size: '', // text NOT NULL,
                        type: '', // text NOT NULL,
                        url: trimParams(image.src), // text NOT NULL,
                        ges: '', // text NOT NULL COMMENT '格式',
                        shi: 0, // tinyint(4) NOT NULL,
                        tin: 0, // tinyint(4) NOT NULL,
                        wei: 0, // tinyint(4) NOT NULL,
                        place: 0, // int(10) NOT NULL,
                        sell_id: 0, // int(11) NOT NULL,
                        is_face: 0, // tinyint(1) NOT NULL COMMENT '是否封面',
                        chaox: '', // varchar(255) NOT NULL,
                    });
                });
            }
        });

        let data: TTargetInfo = {
            id: infoId, // int(10) unsigned NOT NULL AUTO_INCREMENT,
            create_time: timestamp(zufang.shelvesTime), // int(11) DEFAULT NULL,
            update_time: timestamp(zufang.shelvesTime), // int(11) DEFAULT NULL,
            user_id: 0, // int(11) DEFAULT NULL,
            admin_id: 0, // int(11) DEFAULT NULL,
            status: 1, // tinyint(4) NOT NULL DEFAULT 0,
            title: zufang.title, // varchar(255) NOT NULL DEFAULT ' ',
            // myorder: 0, // int(11) NOT NULL DEFAULT 0,
            isvideo: '', // varchar(255) NOT NULL,
            info_level: '', // varchar(255) NOT NULL COMMENT '2 精选',
            zhongjie: '', // varchar(255) NOT NULL,
            type: 2, // tinyint(4) NOT NULL COMMENT '1 二手 2租房  4求购',
            phone: globalPhoneNumber, // varchar(255) NOT NULL COMMENT '联系方式',
            user_type: 0, // tinyint(4) NOT NULL COMMENT '发布者类型',
            name: '', // varchar(255) NOT NULL,
            is_top: 0, // tinyint(1) NOT NULL,
            area_id: areaMap[zufang.areaName] || 0, // int(11) NOT NULL,
            ip: '', // varchar(255) NOT NULL,
            cate_id: 0, // int(11) NOT NULL COMMENT 'cate_id',
            plot_id: zufang.residentialQuarters.communityId, // int(11) NOT NULL COMMENT '小区id',
            address: zufang.residentialQuarters.detailedAddress, // varchar(255) NOT NULL COMMENT '地址',
            shi: Number(zufang.roomLayoutInfo.room) || 0, // tinyint(2) NOT NULL COMMENT '室',
            tin: Number(zufang.roomLayoutInfo.livingRoom) || 0, // tinyint(2) NOT NULL COMMENT '厅',
            wei: Number(zufang.roomLayoutInfo.toilet) || 0, // tinyint(2) NOT NULL COMMENT '卫',
            floor: zufang.floorType, // varchar(255) NOT NULL COMMENT '楼',
            floors: String(zufang.floorTotal), // varchar(255) NOT NULL COMMENT '总楼层',
            chaox: zufang.houseOrientationType, // varchar(255) DEFAULT NULL COMMENT '朝向',
            faci: '', // varchar(255) NOT NULL COMMENT '设备',
            price: zufang.rentalPriceSum || 0, // int(11) NOT NULL COMMENT '价格',
            peit: '', // varchar(255) NOT NULL COMMENT '配套',
            place: zufang.houseArea + '㎡', // varchar(255) NOT NULL COMMENT '面积',
            // youxq: '', // varchar(255) DEFAULT NULL,
            text: zufang.remarks, // varchar(255) NOT NULL,
            video: '', // varchar(255) DEFAULT NULL,
            // is_sale: 1, // tinyint(1) NOT NULL DEFAULT 1 COMMENT '上下架',
            tags: typeIds.join(','), // varchar(255) NOT NULL,
            finish: zufang.renovationType, // varchar(255) NOT NULL COMMENT '装修',
            re_time: 0, // int(12) NOT NULL,
            onclick: 0, // int(11) NOT NULL,
            is_toped: '', // varchar(255) NOT NULL,
            is_good: '', // varchar(255) NOT NULL,
            top_time: 0, // int(11) NOT NULL COMMENT '置顶到期时间',
            re_num: 0, // int(11) NOT NULL COMMENT '刷新次数',
            pic: trimParams(zufang.homePage), // varchar(255) NOT NULL,
            is_red: 0, // tinyint(1) NOT NULL,
            // is_bold: 0, // tinyint(1) DEFAULT NULL,
            point: '', // varchar(255) NOT NULL,
            lng: zufang.xAxis, // text NOT NULL,
            lat: zufang.yAxis, // text NOT NULL,
        };

        zufangData.push(data);
    });

    return {
        zufangData,
        infoTagData,
        fileData
    };
}

function generateErshoufangSql (doDownload = false) {

    return Promise.all([
        fetch('/data/yuanhaowang-ershoufangs-1.json').then(r => r.json()),
        fetch('/data/yuanhaowang-ershoufangs-2.json').then(r => r.json())
    ]).then(([ershoufangs1, ershoufangs2]) => {

        let ershoufangs = ershoufangs1.concat(ershoufangs2);
        let {ershoufangData, infoTagData, fileData} = prepareErshoufangData(ershoufangs.map((item) => item.getDetail));

        let ershouSql = generateInsertSql('cqz_info', ershoufangData, {maxRow: 100});
        let tagsSql = generateInsertSql('cqz_info_tag', infoTagData, {maxRow: 100});
        let fileSql = generateInsertSql('cqz_file', fileData, {maxRow: 100});

        if (doDownload) {
            download(ershouSql, 'yuanhaowang-to-efangmv-ershoufangs.sql');
            download(tagsSql, 'yuanhaowang-to-efangmv-ershoufangs-tags.sql');
            download(fileSql, 'yuanhaowang-to-efangmv-ershoufangs-files.sql');
        }

        return {
            ershouSql,
            tagsSql,
            fileSql
        };
    });
}

function generateZufangSql (doDownload = false) {

    return Promise.all([
        fetch('/data/yuanhaowang-zufangs.json').then(r => r.json())
    ]).then(([zufangs]) => {

        let {zufangData, infoTagData, fileData} = prepareZufangData(zufangs.map((item) => item.getDetail));

        let zufangSql = generateInsertSql('cqz_info', zufangData, {maxRow: 100});
        let tagsSql = generateInsertSql('cqz_info_tag', infoTagData, {maxRow: 100});
        let fileSql = generateInsertSql('cqz_file', fileData, {maxRow: 100});

        if (doDownload) {
            download(zufangSql, 'yuanhaowang-to-efangmv-zufangs.sql');
            download(tagsSql, 'yuanhaowang-to-efangmv-zufangs-tags.sql');
            download(fileSql, 'yuanhaowang-to-efangmv-zufangs-files.sql');
        }

        return {
            zufangSql,
            tagsSql,
            fileSql
        };
    });
}

//

generateXiaoquSql(true);

// generateNewsSql(true);

// generateLoupanSql(true);

// generateErshoufangSql(true);
// generateZufangSql(true);
function getChapterList(id) {
    let api = `/home/api/chapter_list/tp/${id}-1-1-1000`;

    return fetch(api)
        .then(res => res.json())
        .then((json) => {

            if (json.code === 1) {
                json.result.list.forEach((item) => {
                    item.imagelist = item.imagelist.split(',');
                    item.imagelist = item.imagelist.map((item) => {
                        return item.replace(/^\./, '');
                    });
                });
                return json.result;
            }
        })
}

function loadImage (url) {
    let img = new Image;

    img.src = url;
}

function showLoading () {
    document.getElementById('loading').innerHTML = 'loading';
}

function hideLoading () {
    document.getElementById('loading').innerHTML = '';
}

function renderChapter (result, i) {

    let chapter = result.list[i];
    let content = document.getElementById('content');

    content.innerHTML = '';

    let loading = 0;

    chapter.imagelist.forEach((url) => {

        let img = document.createElement('img');

        img.src = url;
        img.style.width = '100%';

        content.appendChild(img);
        loading += 1;

        img.onload = () => {
            loading -= 1;

            if (loading === 0) {
                hideLoading();
            }

            img.onload = null;
        };
    });

    document.getElementById('scrollWrapper').scrollTop = 0;
    document.getElementById('imgNum').value = i;
    document.getElementById('info').innerText = i + '/' + result.list.length;
    showLoading();
}

function renderList (result, i, renderMethod) {

    let page = i;

    document.querySelector('#nextImage').onclick = function () {
        let imgNum = parseInt(document.getElementById('imgNum').value) || 0;

        if (imgNum !== page) {
            page = imgNum;
        }
        else {
            page = page + 1;
        }

        renderMethod(result, page);
    };

    document.querySelector('#prevImage').onclick = function () {
        let imgNum = parseInt(document.getElementById('imgNum').value) || 0;

        if (imgNum !== page) {
            page = imgNum;
        }
        else {
            page = page - 1;
        }

        renderMethod(result, page);
    };

    renderMethod(result, page);
}

function renderImage(result, i) {
    let imagelist = [];

    result.list.forEach((item) => {
        imagelist = imagelist.concat(item.imagelist);
    });

    let img = document.getElementById('img');

    img.style = 'width: 100%;';

    img.src = imagelist[i];

    img.onload = hideLoading;

    loadImage(imagelist[i - 1]);
}


function render (id) {

    getChapterList(id)
    .then((r) => {
        renderList(r, 0, renderChapter);
    });
}

document.body.style = "overflow: hidden";
document.body.innerHTML = `<div id="scrollWrapper" style="position: fixed; left:0;top:0;width:100%;height:100%;overflow:scroll;">
    <img id="img" />
    <div id="content"></div>
    <div style="position: fixed; right: 0; bottom:0; font-size: xx-large;">
        <input id="id" value="" />
        <input id="imgNum" value="0" />
        <a id="prevImage">prev</a>
        <span id="loading"></span><span id="info"></span>
        <a id="nextImage">next</a>
    </div>
</div>`;


let id = '';
document.getElementById('id').onchange = function (e) {

    let newID = parseInt(e.target.value) || '';

    if (newID && newID !== id) {
        id = newID;
        render(id);
    }
}

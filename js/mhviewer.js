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

function renderPage(result) {
    let imagelist = [];

    result.list.forEach((item) => {
        imagelist = imagelist.concat(item.imagelist);
    });

    document.body.innerHTML = `<div style="position: fixed; right: 0; bottom:0; font-size: xx-large;">
        <input id="imgNum" value="" />
        <span id="info"></span><a id="nextImage">next</a>
    </div>`;

    let img = document.createElement('img');

    document.body.appendChild(img);0

    document.body.style = "overflow: scroll";
    img.style = 'width: 100%;';

    img.src = imagelist[0];

    let i = 0;
    document.querySelector('#nextImage')
        .onclick = function () {
            let imgNum = document.getElementById('imgNum').value;

            if (imgNum) {
                i = parseInt(imgNum) || 0;
            }

            img.src = imagelist[++i];

            document.getElementById('info').innerText = i + '/' + imagelist.length;

            loadImage(imagelist[i + 1]);
        };

}

getChapterList(1098)
.then((r) => {
    renderPage(r)
});

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

    let img = document.getElementById('img');

    document.body.appendChild(img);0

    document.body.style = "overflow: scroll";
    img.style = 'width: 100%;';

    img.src = imagelist[0];

    img.onload = function () {
        document.getElementById('loading').innerHTML = '';
    };

    let i = 0;
    document.querySelector('#nextImage')
        .onclick = function () {
            let imgNum = parseInt(document.getElementById('imgNum').value) || 0;

            if (imgNum !== i) {
                i = imgNum;
            }
            else {
                i = i + 1;
            }

            img.src = imagelist[i];

            document.getElementById('loading').innerHTML = 'loading';
            document.body.scrollTop = 0;
            document.getElementById('imgNum').value = i;
            document.getElementById('info').innerText = i + '/' + imagelist.length;

            loadImage(imagelist[i + 1]);
        };

    document.querySelector('#prevImage').onclick = function () {
        let imgNum = parseInt(document.getElementById('imgNum').value) || 0;

        if (imgNum !== i) {
            i = imgNum;
        }
        else {
            i = i - 1;
        }

        img.src = imagelist[i];

        document.getElementById('loading').innerHTML = 'loading';
        document.body.scrollTop = 0;
        document.getElementById('imgNum').value = i;
        document.getElementById('info').innerText = i + '/' + imagelist.length;

        loadImage(imagelist[i - 1]);
    };

}


function render (id) {

    getChapterList(id)
    .then((r) => {
        renderPage(r)
    });
}

document.body.innerHTML = `<img id="img" /><div style="position: fixed; right: 0; bottom:0; font-size: xx-large;">
        <input id="id" value="" />
        <input id="imgNum" value="0" />
        <a id="prevImage">prev</a>
        <span id="loading"></span><span id="info"></span>
        <a id="nextImage">next</a>
    </div>`;


let id = '';
document.getElementById('id').onchange = function (e) {

    let newID = parseInt(e.target.value) || '';

    if (newID && newID !== id) {
        id = newID;
        render(id);
    }
}

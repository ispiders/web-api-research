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

function renderPage(result) {
    let imagelist = [];

    result.list.forEach((item) => {
        imagelist = imagelist.concat(item.imagelist);
    });

    document.body.innerHTML = '<a id="nextImage" style="position: fixed; right: 0; bottom:0;">next</a>';

    let img = document.createElement('img');

    document.body.appendChild(img);0

    document.body.style = "overflow: scroll";
    img.style = 'width: 100%;';

    img.src = imagelist[0];

    let i = 0;
    document.querySelector('#nextImage')
        .onclick = function () {
            img.src = imagelist[++i];
        };

}

getChapterList(1098)
.then((r) => {
    renderPage(r)
});

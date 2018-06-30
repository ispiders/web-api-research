window.isExtension = true;

function dispatchEvent (type, data) {

    var e = new Event(type);

    e.data = data;

    document.dispatchEvent(e);
}

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {

    if (request.action === 'print') {
        dispatchEvent('get-excel-data');
    }

    sendResponse('received');
});

function loadScript (src, callback) {

    var script = document.createElement('script');

    script.src = src;

    document.body.appendChild(script);

    script.onload = callback;
}

window.addEventListener('load', function () {

    var common = 'https://ispiders.github.io/web-api-research/chrome-extension-demo/common.js';
    var excel = 'https://ispiders.github.io/web-api-research/chrome-extension-demo/qq.excel.js';

    loadScript(common, function () {
        loadScript(excel);
    });
});

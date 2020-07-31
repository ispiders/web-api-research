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

function loadScript (src, callback, onError) {

    var script = document.createElement('script');

    script.src = src;

    document.body.appendChild(script);

    script.onload = callback;
    script.onerror = onError;
}

// content_scripts 只能访问 DOM 但是没法访问 window 对象
// 于是通过动态插入js来访问 window
window.addEventListener('load', function () {

    var common = chrome.extension.getURL('common.js');
    var excel = chrome.extension.getURL('qq.excel.js');

    loadScript(common, function () {
        loadScript(excel);
    });
});

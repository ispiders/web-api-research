// https://github.com/zenorocha/select
function select(element) {
    var selectedText;
    if (element.nodeName === 'SELECT') {
        element.focus();
        selectedText = element.value;
    }
    else if (element.nodeName === 'INPUT' || element.nodeName === 'TEXTAREA') {
        var isReadOnly = element.hasAttribute('readonly');
        if (!isReadOnly) {
            element.setAttribute('readonly', '');
        }
        element.select();
        element.setSelectionRange(0, element.value.length);
        if (!isReadOnly) {
            element.removeAttribute('readonly');
        }
        selectedText = element.value;
    }
    else {
        if (element.hasAttribute('contenteditable')) {
            element.focus();
        }
        var selection = window.getSelection();
        var range = document.createRange();
        range.selectNodeContents(element);
        selection.removeAllRanges();
        selection.addRange(range);
        selectedText = selection.toString();
    }
    return selectedText;
}
function createClipboardElement(text, type) {
    let nodeName = 'textarea';
    let elem;
    if (type === 'html') {
        nodeName = 'div';
    }
    elem = document.createElement(nodeName);
    elem.style.border = '0';
    elem.style.padding = '0';
    elem.style.margin = '0';
    elem.style.position = 'fixed';
    elem.style.left = '-1px';
    elem.style.top = '-1px';
    elem.style.width = '1px';
    elem.style.height = '1px';
    elem.style.opacity = '0';
    elem.setAttribute('readonly', '');
    if (type === 'html') {
        elem.innerHTML = text;
    }
    else {
        elem.value = text;
    }
    return elem;
}
function copyFromElement(elem) {
    document.body.appendChild(elem);
    select(elem);
    let succeeded;
    try {
        succeeded = document.execCommand('copy');
    }
    catch (err) {
        succeeded = false;
    }
    document.body.removeChild(elem);
    return succeeded;
}
// Dispatch the copy event synchronously, or it could fail https://w3c.github.io/clipboard-apis/#the-copy-action
function copy(text, callback) {
    let elem = createClipboardElement(text);
    let succeeded = copyFromElement(elem);
    if (callback) {
        callback(succeeded);
    }
}
function copyHTML(html, callback) {
    let elem = createClipboardElement(html, 'html');
    let succeeded = copyFromElement(elem);
    if (callback) {
        callback(succeeded);
    }
}

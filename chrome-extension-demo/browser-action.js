
document.getElementById('print').addEventListener('click', function () {

    chrome.tabs.getSelected(null, function (tab) {
        chrome.tabs.sendRequest(tab.id, {action: 'print'}, function (response) {

            //
        });
    });
}, false);

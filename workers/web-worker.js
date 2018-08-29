/**
 * webworker is not shared over contexts
 */

function testRequest (event) {

    console.info(event.data);

    var xhr = new XMLHttpRequest();

    xhr.open('get', './worker.html');

    xhr.onload = function () {

        // postMessage(xhr.responseText);
    };

    xhr.send();

    fetch('./worker.html', {
        method: 'GET'
    }).then(function (response) {
        console.log(response)
    });
};

console.log('web-worker is on');

this.addEventListener('message', testRequest, false);

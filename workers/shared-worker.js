onconnect = (e) => {

    let port = e.ports[0];

    port.start();

    port.onmessage = function (e) {

        port.postMessage(['onmessage', e.ports.length]);
    };

    port.postMessage(['hello', e.ports.length, !!WebSocket]);
};

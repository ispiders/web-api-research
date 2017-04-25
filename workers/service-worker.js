var config = {
    skipWaiting: true
};

function clearCache () {

    return caches.keys().then(function (keys) {

        return Promise.all(keys.map(function (key) {
            console.info('delete cache ' + key);
            return caches.delete(key);
        }));
    });
}

// message
function message (event) {

    if (event.data === 'clear cache') {

        caches.keys().then(function (keys) {

            keys.forEach(function (key) {
                caches.delete(key);
            });
        });
    }
    else if (event.data === 'no-cors') {
        config.mode = 'no-cors';
    }
    else if (event.data === 'cors') {
        config.mode = 'cors';
    }
}
function hijackedFetch (request) {

    if (request.url.indexOf('cache') !== -1) {

        return new Response('this is a cache at ' + new Date, {
            headers: {
                'Content-Type': 'text/html'
            }
        });
    }
    else if (request.url.slice(-3) === 'jpg') {

        return fetch('https://timgsa.baidu.com/timg?image&quality=80&size=b9999_10000&sec=1492280403458&di=d6dc2a51ad73a2d31f0321df8e3873c2&imgtype=0&src=http%3A%2F%2Fpic65.nipic.com%2Ffile%2F20150419%2F8684504_205612692746_2.jpg', {
            mode: config.mode || 'no-cors'
        });
    }
    else {
        return fetch(request);
    }
}

function fetchFromNetwork (request) {

    return hijackedFetch(request).then(createCache(request));
}

function createCache (request) {

    return function (response) {
        return caches.open('v1').then(function (cache) {

            if (request.url.indexOf('chrome-extension') !== 0) {
                cache.put(request, response.clone());
            }

            return response;
        });
    };
}

this.addEventListener('message', message, false);

// fetch
this.addEventListener('fetch', function (event) {

    var res = caches.match(event.request).then(function (cachedResponse) {

        console.log(event.request.method, event.request.url, cachedResponse);

        return cachedResponse || fetchFromNetwork(event.request);
    });

    event.respondWith(res);
});

// install
this.addEventListener('install', function (installEvent) {

    console.log('service worker installed');
    installEvent.waitUntil(self.skipWaiting());
}, false);

// activate
this.addEventListener('activate', function (activateEvent) {

    console.log('service worker activated', arguments);
    activateEvent.waitUntil(Promise.all([
        clearCache(),
        self.clients.claim()
    ]));
}, false);

console.log('service worker in on', this);

var VERSION = 'v1';

var staticResources = [
    '^https?:[^?]+\\.js',
    '^https?:[^?]+\\.css'
];

var noCacheResources = [];

this.addEventListener('fetch', onFetch);

this.addEventListener('install', onInstall);

this.addEventListener('activate', onActivate);

this.addEventListener('message', onMessage);

function updateResources (resources) {

    staticResources = resources;
}

function updateNoCachable (resources) {

    noCacheResources = resources;
}

function handleMessage (message, e) {

    if (message.version && message.version !== VERSION) {
        clearCache();
        VERSION = message.version;
    }

    if (message.doNotCache) {
        updateNoCachable(message.doNotCache);
    }

    if (message.resources) {
        updateResources(message.resources);
    }
}

function onMessage (e) {

    if (e.data.slice(0, 3) === 'sw:') {

        var json = e.data.slice(3);

        try {
            json = JSON.parse(json);
        }
        catch (e) {
            console.log('sw: message error', e);
            json = null;
        }

        if (json) {
            handleMessage(json, e);
        }
    }
}

function onActivate (activateEvent) {

    activateEvent.waitUntil(Promise.all([
        clearCache(),
        this.clients.claim()
    ]));
}

function onInstall (installEvent) {

    installEvent.waitUntil(this.skipWaiting());
}

function onFetch (fetchEvent: FetchEvent) {

    if (isCachable(fetchEvent.request)) {

        fetchEvent.respondWith(tryLoadFromCache(fetchEvent.request));
    }
}

function isStaticResource (url) {

    return staticResources.find(function (resource) {

        return new RegExp(resource).test(url);
    });
}

function isNotCachable (url) {

    return (-1 !== url.indexOf('agent-cache-service-worker.js')) || noCacheResources.find(function (resource) {

        return new RegExp(resource).test(url);
    });
}

function isCachable (request) {

    return request.method === 'GET' && !isNotCachable(request.url) && isStaticResource(request.url);
}

function tryLoadFromCache (request) {

    return caches.match(request).then(function (response) {

        return response || fetchAndCache(request);
    });
}

function fetchAndCache (request) {

    return fetch(request).then(function (response) {

        return caches.open(VERSION).then(function (cache) {

            cache.put(request, response.clone());

            return response;
        });
    });
}

function clearCache () {

    return caches.keys().then(function (keys) {

        return Promise.all(keys.map(function (key) {

            return caches.delete(key);
        }));
    });
}

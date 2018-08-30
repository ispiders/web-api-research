function log (...args) {
    // let p = document.createElement('p');
    // p.innerHTML = args.join(' - ');
    // document.querySelector('#log').appendChild(p);

    document.querySelector('#log').innerHTML = args.join('-');
}

let points = [];

function getPoint (n) {

    let point = points[n];

    if (!point) {
        point = points[n] = document.createElement('div');
        point.className = 'point';
        point.innerText = n;
        document.body.appendChild(point);
    }

    return point;
}

function renderPoint(x, y, n) {

    let point = getPoint(n);

    point.style.left = x + 'px';
    point.style.top = y + 'px';
}

function onTouchEvent (e: TouchEvent) {

    e.preventDefault();

    let touches = e.touches;
    let logs = [];

    for (let i = 0; i < touches.length; ++i) {
        let touch = touches[i];
        logs.push(Math.floor(touch.pageX) + ',' + Math.floor(touch.pageY));

        renderPoint(touch.pageX, touch.pageY, i);
    }

    log(logs.join('<br />'));
}

document.addEventListener('touchstart', onTouchEvent, false);
document.addEventListener('touchmove', onTouchEvent, false);
document.addEventListener('touchend', onTouchEvent, false);

document.title = new Date();

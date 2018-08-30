function log() {
    // let p = document.createElement('p');
    // p.innerHTML = args.join(' - ');
    // document.querySelector('#log').appendChild(p);
    var args = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        args[_i] = arguments[_i];
    }
    document.querySelector('#log').innerHTML = args.join('-');
}
var points = [];
function getPoint(n) {
    var point = points[n];
    if (!point) {
        point = points[n] = document.createElement('div');
        point.className = 'point';
        point.innerText = n;
        document.body.appendChild(point);
    }
    return point;
}
function renderPoint(x, y, n) {
    var point = getPoint(n);
    point.style.left = x + 'px';
    point.style.top = y + 'px';
}
function onTouchEvent(e) {
    e.preventDefault();
    var touches = e.touches;
    var logs = [];
    for (var i = 0; i < touches.length; ++i) {
        var touch = touches[i];
        logs.push(Math.floor(touch.pageX) + ',' + Math.floor(touch.pageY));
        renderPoint(touch.pageX, touch.pageY, i);
    }
    log(logs.join('<br />'));
}
document.addEventListener('touchstart', onTouchEvent, false);
document.addEventListener('touchmove', onTouchEvent, false);
document.addEventListener('touchend', onTouchEvent, false);
document.title = new Date();

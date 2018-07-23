let canvas = document.querySelector('canvas');
let context = canvas.getContext('2d');

function drawCircle (ctx: CanvasRenderingContext2D, radius: number, endAngle: number) {

    ctx.beginPath();
    ctx.arc(0, 0, radius, -0.5 * Math.PI, Math.PI * 2 * endAngle - 0.5 * Math.PI, false);

    ctx.stroke();
}

function setStrokeStyle (ctx: CanvasRenderingContext2D, style) {

    Object.keys(style).forEach(key => {
        ctx[key] = style[key];
    });
}

function getSetting () {

    let setting = {
        size: parseInt(document.querySelector('#size').value) || 80,
        width: parseInt(document.querySelector('#width').value) || 10,
        color: document.querySelector('#color').value || '#f00',
        background: document.querySelector('#background').value || '#ddd',
        lineCap: document.querySelector('#roundLine').checked ? 'round' : 'normal',
        frames: parseInt(document.querySelector('#frames').value) || 4;
    };

    return setting;
}

function clear () {
    context.clearRect(0, 0, canvas.width, canvas.height);
}

function renderFrame (percent: number) {

    let setting = getSetting();
    let radius = (setting.size - setting.width) / 2;

    canvas.width = setting.size;
    canvas.height = setting.size;

    clear();

    context.translate(canvas.width / 2, canvas.height / 2);

    // background
    setStrokeStyle(context, {
        lineWidth: setting.width,
        lineCap: setting.lineCap,
        strokeStyle: setting.background
    });
    drawCircle(context, radius, 1);

    //
    setStrokeStyle(context, {
        strokeStyle: setting.color
    });
    drawCircle(context, radius, percent);
}

function downloadCanvas (canvas: HTMLCanvasElement, name: string) {

    let url = canvas.toDataURL();
    let a = document.createElement('a');

    a.href= url;
    a.download = name;

    a.click();
}

let initialAngle = 0.25;

renderFrame(initialAngle);

document.querySelector('#submit').onclick = function () {
    initialAngle += 0.05;
    initialAngle = initialAngle >= 1 ? 0.05 : initialAngle;
    renderFrame(initialAngle);
};

document.querySelector('#download').onclick = function () {

    let setting = getSetting();

    for (let i = 1; i <= setting.frames; ++i) {

        renderFrame(i / setting.frames);

        downloadCanvas(canvas, i + '.png');
    }
};

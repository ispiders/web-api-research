/**
 * @param {number} width 原始宽度
 * @param {number} height 原始高度
 * @param {number} targetWidth 目标宽
 * @param {number} targetHeight 目标高
 * @return {object} 变形后属性
 */
function ratio (width: number, height: number, targetWidth: number, targetHeight: number) {
    let ratio = width / height;
    let targetRatio = targetWidth / targetHeight;
    let resultWidth = 0;
    let resultHeight = 0;
    let left = 0;
    let top = 0;

    if (ratio > targetRatio) {
        resultWidth = targetWidth;
        resultHeight = height * targetWidth / width;
        top = (targetHeight - resultHeight) / 2;
    }
    else {
        resultHeight = targetHeight;
        resultWidth = width * targetHeight / height;
        left = (targetWidth - resultWidth) / 2;
    }

    return {
        width: resultWidth,
        height: resultHeight,
        left: left,
        top: top
    };
}

(function () {
"use strict";

var APIS = {

    // 后端根据中奖概率给出中奖信息
    getPrize: {
        method: 'GET',
        url: 'apis/prizes.json',
        mockData: function () {

            var rand = Math.random();
            var value = 4;

            if (rand <= 0.1) { // 理财金5200 0.1
                value = 0;
            }
            else if (rand <= 0.3) { // 理财金2000 0.2
                value = 1;
            }
            else if (rand <= 0.5) { // 理财金1000 0.2
                value = 2;
            }
            else if (rand <= 0.6) { // 京东e卡 0.1
                value = 3;
            }
            else { // 谢谢参与
                value = 4;
            }

            return {
                prize: {
                    id: 'turntable-prize-token1',
                    value: value
                }
            };
        }
    },

    // 转盘停止后，将中奖信息跟后端确认
    confirmPrize: {
        method: 'POST',
        url: 'apis/confirm-prize.json',
        mockData: function (params) {

            if (!params.prizeID) {

                throw new Error('中奖信息验证失败');
            }

            return {
                confirmed: true
            };
        }
    }
};

// 统一处理 ajax
function request (apiName, params) {

    var api = APIS[apiName];
    var url = api.url;
    var options = {
        method: api.method || 'GET'
    };

    if (params) {
        if (options.method === 'GET' || options.method === 'HEAD') {
            url = url + '?' + encodeParams(params);
        }
        else if (params) {
            options.headers = {
                'Content-Type': 'application/x-www-form-urlencoded'
            };
            options.body = encodeParams(params);
        }
    }

    return fetch(api.url, options).then(function (response) {

        var status = response.status;

        if (200 <= status && status < 300 || status === 304) {
            return response.json();
        }
        else {
            return response.json().then(function (payload) {

                throw new Error(payload);
            });
        }
    });
}

function encodeParams (obj) {

    var ret = [];

    for (var key in obj) {
        if (obj.hasOwnProperty(key)) {
            ret.push(encodeURIComponent(key) + '=' + encodeURIComponent(obj[key]));
        }
    }

    return ret.join('&');
}

var easing = {
    'linear': function (percent) {

        return percent;
    },
    'ease-in': function (percent) {

        return percent * percent;
    },
    'ease-out': function (percent) {

        return 1 - (1 - percent) * (1 - percent);
    }
};

function applyAnimation (elem, from, to, progress) {

    var toValue;

    for (var key in to) {
        if (to.hasOwnProperty(key)) {
            toValue = to[key];

            if (typeof toValue === 'function') {
                toValue = toValue(from[key], progress);
            }
            else {
                toValue = (from[key] + (toValue - from[key]) * progress) + 'px';
            }

            elem.style[key] = toValue;
        }
    }
}

function animate (elem, from, to, options) {

    var duration = options.duration || 500;
    var tStart = Date.now(),
        percent = 0,
        timer = setInterval(function () {
            percent = (Date.now() - tStart) / duration;
            percent = percent > 1 ? 1 : percent;

            var progress = easing[options.easing || 'linear'](percent);

            if (percent < 1) {
                applyAnimation(elem, from, to, progress);
            }
            else {
                _finishAnimation();
            }
        }, 1000 / 60);


    function _finishAnimation () {
        clearInterval(timer);
        timer = null;

        applyAnimation(elem, from, to, 1);

        if (typeof options.callback === 'function') {
            options.callback.call(elem);
        }

        elem._finishAnimation = null;
    }

    elem._finishAnimation = _finishAnimation;
}

function rotateAnimation (target, options) {

    return new Promise(function (resolve) {

        animate(target, {
            transform: {rotateZ: 0}
        }, {
            transform: function (from, percent) {

                return 'rotateZ(' + (from.rotateZ + (options.rotateZ - from.rotateZ) * percent) + 'deg)';
            }
        }, {
            duration: options.duration,
            easing: options.easing,
            callback: resolve
        });
    });
}

// 转盘类
function Turntable (setting) {

    this.setting = setting || {};
}

Turntable.defaultSetting = {
    prizeTable: [
        {name: '理财金5200', tips: '恭喜您抽中 理财金5200', sections: [30, 90]},
        {name: '理财金2000', tips: '恭喜您抽中 理财金2000', sections: [150, 210]},
        {name: '理财金1000', tips: '恭喜您抽中 理财金1000', sections: [210, 270]},
        {name: '京东e卡', tips: '恭喜您抽中 京东e卡', sections: [0, 30, 330, 360]}, // 题目中没有此项的概率
        {name: '谢谢参与', tips: '谢谢参与', sections: [90, 150, 270, 330]}
    ]
};

Turntable.prototype = {

    getSetting: function (key) {

        if (key in this.setting) {

            return this.setting[key];
        }

        return Turntable.defaultSetting[key];
    },

    getPrizeTarget: function () {

        var prizeTable = this.getSetting('prizeTable');

        return prizeTable[this.prize.value];
    },

    getTargetRotation: function () {

        var prizeTarget = this.getPrizeTarget();
        var sections = prizeTarget.sections;

        if (sections.length > 2) {

            // sections.length should be even
            var index = Math.floor(Math.random() * (sections.length / 2));

            sections = sections.slice(index * 2, index * 2 + 2);
        }

        return sections[0] + (sections[1] - sections[0]) * Math.random();
    },

    reset: function () {

        this.prize = null;
        this.showMessage('');
    },

    start: function () {

        var that = this;

        if (this.turning) {
            return;
        }

        this.reset();

        this.turning = true;
        Promise.all([
            this.startTurning(), // 让转盘转起来
            this.requestForPrize() // 同时从后端获取中奖信息
        ]).then(function () {

            return that.slowDown(); // 转盘减速停止到指定的奖项
        }).then(function () {

            return that.confirmPrize(); // 向后端确认中奖
        }).then(function () {

            that.turning = false;
        }, function (e) {

            that.turning = false;

            throw e;
        });
    },

    requestForPrize: function () {

        var that = this;

        return request('getPrize', {}).then(function (response) {

            that.prize = response.prize;

            return response.prize;
        });
    },

    startTurning: function () {

        var that = this;
        var target = this.getSetting('target');

        return rotateAnimation(target, {
            rotateZ: 360,
            duration: 500,
            easing: 'ease-in'
        }).then(function () {

            return rotateAnimation(target, {
                rotateZ: 3600,
                duration: 3000,
                easing: 'linear'
            });
        });
    },

    slowDown: function () {

        var target = this.getSetting('target');
        var targetRotation = this.getTargetRotation();

        return rotateAnimation(target, {
            rotateZ: 360 * 3 + targetRotation, // 最后的减速先经过三圈，然后停到指定的奖项
            duration: 3000,
            easing: 'ease-out'
        });
    },

    confirmPrize: function () {

        var that = this;

        return request('confirmPrize', {
            prizeID: this.prize.id
        }).then(function () {

            var prize = that.getPrizeTarget();

            that.showMessage(prize.tips);
        }, function (e) {

            that.showMessage(e.message);
        });
    },

    showMessage: function (message) {

        if (message) {
            console.log(message);
        }
    }
};

window.Turntable = Turntable;

// for test
function request (api, params) {

    return new Promise(function (resolve, reject) {

        var response;

        try {
            response = APIS[api].mockData(params);
        }
        catch (e) {
            reject(e);
        }

        if (response) {
            resolve(response);
        }
    });
}

if (!window.fetch) {
    console.error('need fetch polyfill');
}

if (!window.Promise) {
    console.error('need Promise polyfill');
}
}());

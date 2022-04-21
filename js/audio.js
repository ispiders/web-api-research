let globalAudio;
let playList = [];
let callbacks = [];
const audioStop = () => {
    if (globalAudio) {
        playList = [];
        globalAudio.pause();
        globalAudio.src = '';
        if (callbacks.length) {
            callbacks.forEach((cb) => {
                globalAudio.offEnded(cb);
            });
        }
    }
};
const audioPlay = function (src, queue, callback) {
    console.log('audioPlay', src);
    if (!globalAudio) {
        globalAudio = uni.createInnerAudioContext();
        function next(e) {
            if (playList.length) {
                let item = playList.shift();
                globalAudio.src = item[0];
                globalAudio.play();
                let callback = item[1];
                if (callback) {
                    let cb = function () {
                        callbacks = callbacks.filter(item => item !== cb);
                        globalAudio.offEnded(cb);
                        return callback();
                    };
                    callbacks.push(cb);
                    globalAudio.onEnded(cb);
                }
            }
        }
        globalAudio.autoplay = true;
        globalAudio.onEnded(next);
        globalAudio.onError(next);
    }
    let audio = globalAudio;
    if (queue && audio.src) {
        playList.push([src, callback]);
    }
    else {
        audioStop();
        playList = [];
        audio.src = src;
        audio.play();
        if (callback) {
            let cb = function () {
                callbacks = callbacks.filter(item => item !== cb);
                audio.offEnded(cb);
                return callback();
            };
            callbacks.push(cb);
            audio.onEnded(cb);
        }
    }
    return audioStop;
};

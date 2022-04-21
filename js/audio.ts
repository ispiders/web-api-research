interface TCallback {
    (): void;
}
let globalAudio: HTMLAudioElement;
let playList: ([string, TCallback] | [string])[] = [];
let callbacks: TCallback[] = [];

export const audioStop = () => {

    if (globalAudio) {
        playList = [];
        globalAudio.pause();
        globalAudio.src = '';
        if (callbacks.length) {
            callbacks.forEach((cb) => {
                globalAudio.removeEventListener('ended', cb);
            });
        }
    }
};

export const audioPlay = function (src: string, queue: boolean, callback: TCallback) {
console.log('audioPlay', src)
    if (!globalAudio) {
        globalAudio = document.createElement('audio');

        function next (e) {
            if (playList.length) {
                let item = playList.shift();
                globalAudio.src = item[0];
                globalAudio.play();

                let callback = item[1];
                if (callback) {
                    let cb = function () {
                        callbacks = callbacks.filter(item => item !== cb);
                        globalAudio.removeEventListener('ended', cb);
                        return callback();
                    };
                    callbacks.push(cb);
                    globalAudio.addEventListener('ended', cb);
                }
            }
        }

        globalAudio.autoplay = true;
        globalAudio.addEventListener('ended', next);
        globalAudio.addEventListener('error', next);
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
                audio.removeEventListener('ended', cb);
                return callback();
            };
            callbacks.push(cb);
            audio.addEventListener('ended', cb);
        }
    }

    return audioStop;
};
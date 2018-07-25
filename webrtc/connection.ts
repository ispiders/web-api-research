var connection1 = new RTCPeerConnection(null);
var connection2 = new RTCPeerConnection(null);
var offerOptions = {
    offerToReceiveVideo: 1,
    offerToReceiveAudio: 0
};

connection1.onicecandidate = (e) => {

    if (e.candidate) {
        connection2.addIceCandidate(e.candidate);
    }
};

connection2.onicecandidate = (e) => {
    if (e.candidate) {
        connection1.addIceCandidate(e.candidate);
    }
};

getStream(connection1);

function getStream (connection) {

    navigator.getUserMedia({
        video: true
    }, (stream) => {

        window.stream = stream;

        console.log('add stream', stream);

        // stream.getVideoTracks().forEach(track => {
        //     connection1.addTrack(track, stream);
        // });
        connection.addStream(stream);
        // connection.addTrack(stream.getVideoTracks()[0], stream);
        video1.srcObject = stream;

        // start connection after addStream
        connect();
    }, (e) => {
        console.error(e);
    });
}

function connect () {
    connection1.createOffer(offerOptions).then(function(offer){

        return connection1.setLocalDescription(offer).then(() => offer);
    }).then((offer) => {

        connection2.setRemoteDescription(new RTCSessionDescription(offer));

        console.log(offer);

        return connection2.createAnswer(offerOptions).then(function(answer){

            return connection2.setLocalDescription(answer).then(() => {

                return answer;
            });
        });
    }).then((answer) => {

        console.log(answer);

        connection1.setRemoteDescription(new RTCSessionDescription(answer));
    });
}

let video1 = document.querySelector('video#v1');
let video2 = document.querySelector('video#v2');

connection2.onaddstream = (e) => {

    console.error('onaddstream', e);
    video2.srcObject = e.stream;
};

connection1.oniceconnectionstatechange = (e) => {

    console.log('oniceconnectionstatechange', connection1.iceConnectionState);
}

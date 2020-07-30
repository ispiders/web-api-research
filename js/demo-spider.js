
function fetchOne(id, ret, failed) {

    return fetch(`http://m.jxedt.com/mnksnew/g.asp?id=${id}`)
        .then(q => q.text())
        .then(t => {

            let r;

            try {
                r = JSON.parse(t);
            }
            catch (e) {
                try {
                    r = JSON.parse(t.replace(/\\/g, '\\\\'));
                }
                catch (e) {
                    e.text = t;
                    throw e;
                }
            }

            return r;
        })
        // .then(r => r.json())
        .then(q => ret[id] = q)
        .catch(e => {
            console.log('failed', id, e);
            failed.push(id);
        });
}

let qustions = {};
let failed = [];
let interval = 500;

function fetchAll (qids) {

    let id = qids.pop();

    if (id) {
        fetchOne(id, qustions, failed).then(() => {

            setTimeout(() => {
                fetchAll(qids);
            }, interval);
        });
    }
    else {
        console.log('done');
    }
}

function download(text, name = 'download.txt') {
    let file = new File([text], name);
    let a = document.createElement('a');
    a.download = name;
    a.href = URL.createObjectURL(file);
    a.click();
}

function d (name) {

    download(JSON.stringify(qustions, null, 4), name);
}

window.onbeforeunload = function () {
    return true
};

fetchAll(qids);

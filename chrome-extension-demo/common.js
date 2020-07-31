var dollarUnit = '$';

var ticketTable = {
    thead: [
        {width: '20%', name: 'Shipper/Exporter'},
        {width: '30%', name: 'Jen Zhang'},
        {width: '20%', name: 'Consignee'},
        {width: '30%', name: 'Carlo de Cillis'},
    ],
    tbody: [
        ["Company Name:", "A-assistant Co.Ltd",
            "Company Name:", "2ME style"],
        ["Tel:", "+86 13631668463",
            "Tel:", "+39 02 39663300"],
        ["Email:", "jen@a-assistant.com",
            "Email:", "c.decillis@2mestyle.com"],
        ["Address:", "F/1st, Office building, Liju 13th Tech Park, Zhongxin Industrial area, Shipai Town",
            "Address:", "2ME STYLE S.R.L. <br />VIA RISORGIMENTO 44"],
        ["City, State Zip Code:", "Dongguan City 523332, China",
            "City, State Zip Code:", "20017 - RHO (FRAZ.MAZZO)"],
        ["Date:", dateString,
            "Terms: ", "EXW"]
    ]
};

function dateString () {

    return new Date().toDateString();
}

function ticketTableHTML () {

    var html = '';

    html += '<thead>';

    for (var i = 0, item; i < ticketTable.thead.length; ++i) {

        item = ticketTable.thead[i];
        html += '<th width="' + item.width + '">' + item.name + '</th>';
    }

    html += '</thead>';

    html += '<tbody>';

    for (var i = 0, item; i < ticketTable.tbody.length; ++i) {

        item = ticketTable.tbody[i];

        html += '<tr>';
        for (var j = 0; j < item.length; ++j) {
            html += '<td>' + (typeof item[j] === 'function' ? item[j]() : item[j]) + '</td>';
        }
        html += '</tr>';
    }

    html += '</tbody>';

    return html;
}

var template = '';

if (window.isExtension) {
    fetch(chrome.extension.getURL('template.html')).then((r) => r.text()).then((html) => {
        template = html;
    });
}

function openWindow (data) {

    if (!template) {
        alert('请等待模板加载');
        return;
    }

    var win = window.open('', '', 'width=1280,height=800');

    win.document.write(template);
    win.document.close();
    win.focus();
    win.document.querySelector('.order-detail').innerHTML = makeTable(data);

    var logo = win.document.querySelector('.logo img');
    logo.src = chrome.extension.getURL('logo.svg');

    var sn = win.document.querySelector('#sn');
    sn.value = getSN();

    win.document.querySelector('.ticket-detail').innerHTML = ticketTableHTML();

    // var printDate = win.document.querySelector('#print-date');
    // printDate.innerHTML = new Date().toDateString();

    var templateStyle = win.document.querySelector('#template-style');
    templateStyle.href = chrome.extension.getURL('template.css');

    templateStyle.onload = function () {
        allReady(2, function () {
            win.print();
        });
    };

    logo.onload = function () {
        allReady(2, function () {
            win.print();
        });
    };
}

function allReady (n, callback) {

    allReady.finished = (allReady.finished || 0) + 1;

    if (allReady.finished === n) {
        callback();
    }
}

function getSN () {
    var date = new Date();
    var dLock = localStorage.getItem('print-sn-date');

    if (dLock !== date.toDateString()) {
        localStorage.setItem('print-sn-date', date.toDateString());
        localStorage.setItem('print-sn-number', 1);
    }

    var n = parseInt(localStorage.getItem('print-sn-number') || 1);

    localStorage.setItem('print-sn-number', n + 1);

    return 'NO.01' +
            date.getFullYear() +
            prefix(date.getMonth() + 1, 2, '00') +
            prefix(date.getDate(), 2, '00') +
            '-' + n;
}

function prefix (str, len, pre) {

    return (pre + str).slice(-len);
}

function toNumber (string) {

    var ret = string.match(/\d+(?:\.\d+)?/);

    return ret ? parseFloat(ret[0]) : 0;
}

function preview (data) {
    openWindow(data || getTableData());
}

window.addEventListener('keydown', function (event) {

    if (window.isExtension) {
        return;
    }

    if (event.key === 'p' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();

        dispatchEvent('get-excel-data');
    }
}, false);

document.addEventListener('print-excel', function (event) {

    var data = localStorage.getItem('excel-to-print');

    data = data && JSON.parse(data);

    // localStorage.removeItem('excel-to-print');

    if (!window.isExtension) {
        return;
    }

    preview(data);
});

function dispatchEvent (type, data) {

    var e = new Event(type);

    e.data = data;

    document.dispatchEvent(e);
}

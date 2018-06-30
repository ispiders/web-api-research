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

var template = `
<!DOCTYPE html>
<html>
<head>
    <title></title>
    <meta charset="utf-8" />
    <link id="template-style" rel="stylesheet" type="text/css" href="template.css"></link>
</head>
<body>

<p class="logo"><img src="logo.svg" width="30%"></p>

<h1>Commercial Invoice</h1>

<p><input id="sn" type="text" value="" /></p>

<p></p>

<div>
    <table class="ticket-detail" border>
        <thead>
            <tr>
                <th width="20%">Shipper/Exporter</th>
                <th width="30%">Jen Zhang</th>
                <th width="20%">Consignee</th>
                <th width="30%">Carlo de Cillis</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Company Name:</td>
                <td>A-assistant Co.Ltd</td>
                <td>Company Name:</td>
                <td>2ME style</td>
            </tr>
            <tr>
                <td>Tel:</td>
                <td>+86 13631668463</td>
                <td>Tel:</td>
                <td>+39 02 39663300</td>
            </tr>
            <tr>
                <td>Email:</td>
                <td>jen@a-assistant.com</td>
                <td>Email:</td>
                <td>c.decillis@2mestyle.com</td>
            </tr>
            <tr>
                <td>Address:</td>
                <td>F/1st, Office building, Liju 13th Tech Park, Zhongxin Industrial area, Shipai Town</td>
                <td>Address:</td>
                <td>2ME STYLE S.R.L. VIA RISORGIMENTO 44</td>
            </tr>
            <tr>
                <td>City, State Zip Code:</td>
                <td>Dongguan City 523332, China</td>
                <td>City, State Zip Code:</td>
                <td>20017 - RHO (FRAZ.MAZZO)</td>
            </tr>
            <tr>
                <td>Date:</td>
                <td id="print-date"></td>
                <td>Terms: </td>
                <td>EXW</td>
            </tr>
        </tbody>
    </table>
</div>

<p></p>

<div class="order-detail">
    <table>
        <tr>
            <th>Name</th>
            <th>HS code</th>
            <th>Price</th>
            <th>QTY</th>
        </tr>

        <tr>
            <td>2ME handle case 4.7</td>
            <td>420291</td>
            <td>5.3</td>
            <td>13</td>
        </tr>
        <tr>
            <td>2ME handle case 5.5</td>
            <td>420291</td>
            <td>5.4</td>
            <td>11</td>
        </tr>
        <tr>
            <td>Pa Poster women Pink</td>
            <td>420291</td>
            <td>5.8</td>
            <td>30</td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td></td>
            <td>43</td>
        </tr>
    </table>
</div>

<p>Sincerely yours,</p>

<p>A-assistant Company Ltd.</p>

</body>
</html>
`;

function openWindow (data) {

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

    if (event.key === 'p' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();

        preview();
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
var colsName = {
    'column_1': 'Date',
    'column_2': 'Tracking',
    'column_3': 'Description',
    'column_4': 'HS code',
    'column_5': 'Unit Price',
    'column_6': 'QTY',
    'column_7': 'Remark',
    'cost': 'Cost'
};

var template = `
<!DOCTYPE html>
<html>
<head>
    <title></title>
    <meta charset="utf-8" />
    <style media="print">
        @page {
          size: auto;  /* auto is the initial value */
          margin: 0; /* this affects the margin in the printer settings */
        }
    </style>
    <style type="text/css">
        body {
            padding: 50px; margin: 0;
        }
        table {
            width: 100%;
            text-align: left;
            border: none;
            border-collapse: collapse;
            color: #496291;
        }
        tr {
            border: none;
        }
        td, th {
            border: solid 1px #bacbdb;
        }
        tr input {
            width: 100%; height: 100%;
            border: none;
            outline: none;
        }
        th input {
            font-weight: bold;
        }
        .logo {
            text-align: right;
        }

        table tr:first-child th {
            border-top: none;
        }

        table tr:last-child td {
            border-bottom: none;
        }

        .order-detail tr:last-child td {
            border-top: solid 2px;
            border-left: none;
            border-right: none;
        }

        tr td:first-child, tr th:first-child {
            border-left: none;
        }

        tr td:last-child, tr th:last-child {
            border-right: none;
        }

        .order-detail tr:nth-child(2n) td {
            background-color: #f3f6f7;
        }
    </style>
</head>
<body>
<p class="logo"><img src="logo.png"></p>
<h1>Commercial Invoice</h1>
<p>NO.012070908-1</p>
<p></p>
<div>
    <table class="ticket-detail" border>
        <thead>
            <tr>
                <th>Shipper/Exporter</th>
                <th>Jen Zhang</th>
                <th>Consignee</th>
                <th>Carlo de Cillis</th>
            </tr>
        </thead>
        <tbody>
            <tr>
                <td>Company Name:</td>
                <td>A-assistant Co.Ltd</td>
                <td>Company Name</td>
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
                <td>Address: </td>
                <td>2Me Style s.r.l. Via Agostino Bertani, 2</td>
            </tr>
            <tr>
                <td>City, State Zip Code:</td>
                <td>Dongguan City 523332, China</td>
                <td>City, State Zip Code:</td>
                <td>20154 Milano IT</td>
            </tr>
            <tr>
                <td>Date:</td>
                <td>Sep 8th, 2017</td>
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
            <th>Date</th>
            <th>Tracking</th>
            <th>Name</th>
            <th>HS code</th>
            <th>QTY</th>
            <th>Price</th>
            <th>Remark</th>
        </tr>

        <tr>
            <td>Aug 05</td>
            <td>8456269393</td>
            <td>2ME handle case 4.7</td>
            <td>420291</td>
            <td>5.3</td>
            <td>13</td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td>2ME handle case 5.5</td>
            <td>420291</td>
            <td>5.4</td>
            <td>11</td>
            <td></td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td>Pa Poster women Pink</td>
            <td>420291</td>
            <td>5.8</td>
            <td>30</td>
            <td>粉色9 21</td>
        </tr>
        <tr>
            <td></td>
            <td></td>
            <td>Pa Poster women Blue</td>
            <td>420291</td>
            <td>5.8</td>
            <td>43</td>
            <td>蓝色13 30</td>
        </tr>
    </table>
</div>
<p>Sincerely yours,</p>
<p>A-assistant Company Ltd.</p>

</body>
</html>

`;

function getTableData () {
    var selected = document.querySelectorAll('td[isselect=true]');
    var data = [];
    var cols = [];
    var row;

    selected.forEach(function (td) {
        var fieldid = td.getAttribute('fieldid');

        if (cols.indexOf(fieldid) === -1) {
            cols.push(fieldid);
        }

        if (cols.indexOf(fieldid) === 0 || cols.length === 0) {
            row = {};
            data.push(row);
        }

        row[fieldid] = td.innerText;
    });

    return {
        cols: cols,
        data: data
    };
}

function makeTable (table) {

    var cols = ['column_3', 'column_4', 'column_5', 'column_6', 'cost'];
    var str = '<table>';

    str += '<tr>';
    cols.forEach(function (col) {
        str += '<th>';
        str += colsName[col];
        str += '</th>';
    });
    str += '</tr>';

    table.data.forEach(function (tr, index) {

        tr.cost = tr.cost || (toNumber(tr.column_5) * toNumber(tr.column_6)).toFixed(2);

        str += '<tr>';
        cols.forEach(function (col) {
            str += '<td>';
            str += tr[col];
            str += '</td>';
        });
        str += '</tr>';
    });

    str += '<tr>';
    cols.forEach(function (col) {
        str += '<td>';
        if (col === 'cost') {
            str += table.data.reduce((a, b) => (a + toNumber(b['cost'])), 0).toFixed(2);
        }
        str += '</td>';
    });
    str += '</tr>';

    str += '</table>';

    return str;
}

function openWindow (data) {

    var win = window.open('', '', 'width=1280,height=800');

    win.document.write(template);
    win.document.close();
    win.focus();
    win.document.querySelector('.order-detail').innerHTML = makeTable(data);

    var logo = win.document.querySelector('.logo img');
    logo.src = chrome.extension.getURL('logo.png');

    logo.onload = function () {
        win.print();
    };
}

function toNumber (string) {

    var ret = string.match(/\d+(?:\.\d+)?/);

    return ret ? parseFloat(ret[0]) : 0;
}

window.addEventListener('keydown', function (event) {

    if (event.key === 'p' && (event.ctrlKey || event.metaKey)) {
        event.preventDefault();

        openWindow(getTableData());
    }
}, false);

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {

    if (request.action === 'print') {
        openWindow(getTableData());
    }

    sendResponse('received');
});

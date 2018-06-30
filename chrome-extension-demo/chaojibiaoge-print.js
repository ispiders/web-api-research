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

function isDollar (fieldid) {

    return -1 !== ['Unit Price', 'Cost'].indexOf(colsName[fieldid]);
}

function isNumber (fieldid) {

    return isDollar(fieldid) || colsName[fieldid] === 'QTY';
}

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

        if (isNumber(fieldid)) {
            row[fieldid] = toNumber(td.innerText) || 0;
        }
        else {
            row[fieldid] = td.innerText;
        }
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
        str += '<th' + (isNumber(col) ? ' class="text-right"' : '') + '>';
        str += colsName[col];
        str += '</th>';
    });
    str += '</tr>';

    table.data.forEach(function (tr, index) {

        tr.cost = tr.cost || (tr.column_5 * tr.column_6).toFixed(2);

        str += '<tr>';
        cols.forEach(function (col) {
            str += '<td' + (isNumber(col) ? ' class="text-right"' : '') + '>';
            str += (isDollar(col) ? dollarUnit : '') + tr[col];
            str += '</td>';
        });
        str += '</tr>';
    });

    str += '<tr>';
    cols.forEach(function (col) {
        str += '<td' + (isNumber(col) ? ' class="text-right"' : '') + '>';
        if (col === 'column_4') {
            str += 'Total';
        }
        else if (col === 'column_6') {
            str += table.data.reduce((a, b) => (a + b['column_6']), 0);
        }
        else if (col === 'cost') {
            str += dollarUnit + table.data.reduce((a, b) => (a + toNumber(b['cost'])), 0).toFixed(2);
        }
        str += '</td>';
    });
    str += '</tr>';

    str += '</table>';

    return str;
}

chrome.extension.onRequest.addListener(function (request, sender, sendResponse) {

    if (request.action === 'print') {
        preview();
    }

    sendResponse('received');
});

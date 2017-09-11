var colsName = {
    'column_1': 'Date',
    'column_2': 'Tracking',
    'column_3': 'Name',
    'column_4': 'HS code',
    'column_5': 'Price',
    'column_6': 'QTY',
    'column_7': 'Remark',
    'SYS_string1': 'Cost'
};

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
            row = [];
            data.push(row);
        }

        row.push(td.innerText);
    });

    data.unshift(cols.map((name) => colsName[name]));

    return data;
}

function makeTable (data) {

    var str = '<table>';

    data.forEach(function (tr) {

        str += '<tr>';
        tr.forEach(function (td) {
            str += '<td>';
            str += td;
            str += '</td>';
        });
        str += '</tr>';
    });

    str += '</table>';

    return str;
}

function openWindow (data) {

    console.log('open', data);

    var win = window.open('', '', 'width=1280,height=800');

    win.document.write(makeTable(data));
    win.document.close();
    win.focus();
    win.print();
}

window.addEventListener('keydown', function (event) {

    if (event.key === 'p' && event.ctrlKey) {
        event.preventDefault();

        var data = getTableData();

        openWindow(data);

        console.log(data);
    }
}, false);
var tableColumns = [
    {index: 0, name: 'Date', label: "Date 日期", type: 'string'},
    {index: 1, name: 'Tracking', label: "Tracking 单号", type: 'string'},
    {index: 2, name: 'Description', label: "Project 名称", type: 'string'},
    {index: 3, name: 'HS code', label: "HS code", type: 'string'},
    {index: 4, name: 'Unit Price', label: "Unit Price", type: 'dollar', parser: function (value) {
        return parseFloat(toNumber(value)) || 0;
    }},
    {index: 5, name: 'QTY', label: "QTY 数量", type: 'int', parser: function (value) {
        return parseInt(value) || 0;
    }},
    {index: 6, name: 'Remark', label: "Remarks 备注", type: 'string'},
    {index: 7, name: 'Cost', label: "Cost 金额", type: 'dollar', parser: calcCost},
];

var tableColumnsMap = tableColumns.reduce(function (map, item) {

    map[item.name] = item;

    return map;
}, {});

function calcCost (value, row) {

    return (parseFloat(row[4]) * parseFloat(row[5]));
}

function isNumber (col) {

    return col.type === 'float' || col.type === 'int' || isDollar(col);
}

function isFloat (col) {

    return col.type === 'dollar' || col.type === 'float';
}

function isDollar (col) {

    return col.type === 'dollar';
}

function mapColumns (colNames) {

    return colNames.map(function (col) {

        return tableColumnsMap[col];
    });
}

function getSelectedRanges () {

    if (window.immTableSheet) {
        var ranges = window.immTableSheet.sheetHot.canvasView.excel.selectData.getSelect()[0];

        return {
            startColIndex: ranges.xRange[0],
            endColIndex: ranges.xRange[1],

            startRowIndex: ranges.yRange[0],
            endRowIndex: ranges.yRange[1],
        };
    }
    else if (window.SpreadsheetApp) {
        return window.SpreadsheetApp.view.getSelection().rangeSelections[0];
    }
    else {
        throw new Error('can not getSelectedRanges');
    }
}

function getFullTableData () {

    if (window.immTableSheet) {
        return window.immTableSheet.sheetHot.getStore().getState().get('dataSource').toJSON();
    }
    else if (window.SpreadsheetApp) {

        // return SpreadsheetApp.spreadsheet.sheets[0].data.rowData.map((row) => {
        return SpreadsheetApp.spreadsheet.sheetManager.activeSheet.data.rowData.map((row) => {
            return row.values.map((cell) => {
                return cell.editValue;
            });
        });
    }
    else {
        throw new Error('can not getFullTableData');
    }
}

function getQQDocsSelectedData () {

    return intersect(getFullTableData(), getSelectedRanges());
}

function intersect (state, ranges) {

    var ret = [];

    for (var i = ranges.startRowIndex; i <= ranges.endRowIndex; ++i) {

        var row = state[i];

        ret.push(row.slice(ranges.startColIndex, ranges.endColIndex + 1))
    }

    return ret;
}

function getTableData () {

    var ranges = getSelectedRanges();
    var tableData = getFullTableData();

    var data = [];
    var totalQTY = 0;
    var totalCost = 0;

    for (var i = Math.max(1, ranges.startRowIndex); i <= ranges.endRowIndex; ++i) {

        var row = tableData[i];

        data.push(row);

        row.forEach(function (value, index) {

            var col = tableColumns[index];

            if (col && col.parser) {
                row[index] = col.parser(value, row);
            }
        });

        totalQTY += row[tableColumnsMap['QTY'].index];
        totalCost += row[tableColumnsMap['Cost'].index];
    }

    data.push(['', '', 'Total', '', '', totalQTY, '', totalCost])

    return data;
}

function makeTableHead (cols) {

    var str = '<tr>';

    cols.forEach(function (col) {
        str += '<th' + (isNumber(col) ? ' class="text-right"' : '') + '>';
        str += col.name;
        str += '</th>';
    });

    str += '</tr>';

    return str;
}

function makeTableRow (cols, rowData) {

    var str = '<tr>';

    cols.forEach(function (col) {
        var value = rowData[col.index];

        str += '<td' + (isNumber(col) ? ' class="text-right"' : '') + '>';

        if (isDollar(col) && typeof value === 'number') {

            str += dollarUnit + value.toFixed(2);
        }
        else {
            str += value;
        }

        str += '</td>';
    });
    str += '</tr>';

    return str;
}

function makeTable (tableData) {

    var cols = mapColumns(['Description', 'HS code', 'Unit Price', 'QTY', 'Cost']);
    var str = '<table>';

    str += makeTableHead(cols);

    tableData.forEach(function (rowData) {
        str += makeTableRow(cols, rowData);
    });

    str += '</table>';

    return str;
}

document.addEventListener('get-excel-data', function () {

    if (window.isExtension) {
        return;
    }

    var data = getTableData();

    console.error('get-excel-data', window.isExtension, data);

    localStorage.removeItem('excel-to-print');
    localStorage.setItem('excel-to-print', JSON.stringify(data));

    dispatchEvent('print-excel', data);
});

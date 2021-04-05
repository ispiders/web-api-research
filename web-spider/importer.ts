interface TGenerateOptions {
    maxRow?: number;
    autoId?: number;
}

function generateInsertSql (tableName: string, data: any[], options: TGenerateOptions = {}) {

    if (!data.length) {
        return '';
    }

    if (options.maxRow && data.length > options.maxRow) {
        let sql = '';
        for (let i = 0; i < data.length; i += options.maxRow) {
            let newOptions = {...options};
            if (options.autoId) {
                newOptions.autoId = options.autoId + i;
            }
            sql += generateInsertSql(tableName, data.slice(i, i + options.maxRow), newOptions) + '\n';
        }
        return sql;
    }

    let columns = Object.keys(data[0]);

    if (options.autoId) {
        columns.unshift('id');
    }

    let sql = 'insert into `' + tableName + '` ('
        + columns.map(key => ['`', key, '`'].join('')).join(',')
        + ') values \n';

    sql += data.map((row, index) => {

        return '(' + columns.map((key) => {
            let value = row[key];
            let type = typeof value;

            if (key === 'id' && options.autoId) {
                return index + options.autoId;
            }

            if (value === null) {
                return 'null';
            }
            else if (type === 'number') {
                return value;
            }
            else if (type === 'boolean') {
                return Number(value);
            }
            else if (type === 'string') {
                return '\'' + value.replace(/[\\\']/g, (match) => '\\' + match) + '\'';
            }
            else if (type === 'undefined') {
                return null;
            }
            else {
                console.log('insert value error', type, value);
                return value;
            }
        }).join(',') + ')';
    }).join(',\n') + ';';

    return sql;
}
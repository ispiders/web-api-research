interface TUniquePpredicate<T> {
    (item: T): any;
}

function unique<T> (arr: T[], key?: string | TUniquePpredicate<T>): T[] {

    let map = new Map();

    return arr.reduce((ret, item) => {

        let index = item;

        if (typeof key === 'string') {
            index = item[key];
        }
        else if (typeof key === 'function') {
            index = key(item);
        }

        if (!map.get(index)) {
            map.set(index, true);
            ret.push(item);
        }

        return ret;
    }, [] as T[]);
}


type TSql = 'sql' | 'psql';

interface TGenerateOptions {
    maxRow?: number;
    autoId?: number;
    sqlType?: TSql;
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

    let table = tableName;
    let quote = options.sqlType === 'psql' ? '"' : '`';

    let sql = 'insert into ' + table + ' ('
        + columns.map(key => [quote, key, quote].join('')).join(',')
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

                if (options.sqlType === 'psql') {
                    return String(value);
                }

                return Number(value);
            }
            else if (type === 'string') {
                // return '\'' + value.replace(/[\\\']/g, (match) => '\\' + match).replace(/\n/g, '\\n') + '\'';
                let valueStr = JSON.stringify(value);

                if (options.sqlType === 'psql') {
                    valueStr = valueStr.replace(/'/g, function (match) {
                        return "''";
                    }).replace(/^"|"$/g, function (match) {
                        return "'";
                    });
                }

                return valueStr;
            }
            else if (type === 'undefined') {
                return JSON.stringify('');
            }
            else {
                console.log('insert value error', type, value);
                return value;
            }
        }).join(',') + ')';
    }).join(',\n') + ';';

    return sql;
}

function download (text: string | object, name: string = 'download.txt') {

    if (typeof text !== 'string') {
        text = JSON.stringify(text, null, 4);
    }

    let file = new File([text], name);
    let a = document.createElement('a');

    a.download = name;
    a.href = URL.createObjectURL(file);
    a.click();
}
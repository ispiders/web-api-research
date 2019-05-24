function lexicalAnalysis (json: string) {

    json = String(json);

    let line = 1, column = 0;
    let len = json.length;
    let pos = 0;
    let token = '';
    let tokenValue = undefined;

    function next () {

        while (pos < len) {
            let c = json[pos];

            if (c === '"') {
                token = 'string';
                tokenValue = '';

                while (++pos < len) {
                    c = json[pos];
                    column++;

                    if (c === '\\') {
                        c = '\\' + json[++pos];
                        column++;
                    }

                    if (c === '\n') {
                        throw new SyntaxError('unexpected \\n at line: ' + line + ' column: ' + column);
                    }
                    else if (c === '"') {
                        ++pos;
                        column++;
                        return token;
                    }
                    else {
                        tokenValue += c;
                    }
                }

                throw new SyntaxError('expect to close string at line: ' + line + ' column: ' + column);
            }
            else if (c === ' ') {
                pos++;
                column++;
                continue;
            }
            else if (c === '\n') {
                pos++;
                line++;
                column = 0;
                continue;
            }
            else if (c === '{') {
                token = 'object';
                tokenValue = c;
                pos++;
                column++;
                return token;
            }
            else if (c === ':' || c === ',' || c === '}' || c === ']') {
                token = c;
                tokenValue = c;
                pos++;
                column++;
                return token;
            }
            else if (c === '[') {
                token = 'array';
                tokenValue = c;
                pos++;
                column++;
                return token;
            }
            else if (/^[0-9-]$/.test(c)) { // number
                token = 'number';

                tokenValue = c;
                while (++pos < len) {
                    c = json[pos];

                    if (/^[-0-9\.eE]$/.test(c)) {
                        tokenValue += c;
                    }
                    else {
                        break;
                    }
                }

                let reg = /^-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?$/;

                if (reg.test(tokenValue)) {
                    column += tokenValue.length;

                    return token;
                }
                else {
                    throw new SyntaxError('unexpected token ' + c + ' at position ' + pos);
                }
            }
            else if (['t', 'f', 'n'].indexOf(c) !== -1) { // true false null

                tokenValue = c;
                while (++pos < len) {
                    c = json[pos];
                    if ('truefalsn'.split('').indexOf(c) !== -1) {
                        tokenValue += c;
                        if (tokenValue.length > 5) {
                            throw new SyntaxError('unexpected token ' + c + ' at position ' + pos);
                        }
                    }
                    else {
                        break;
                    }
                }

                if (tokenValue === 'true' || tokenValue === 'false') {
                    token = 'boolean';
                }
                else if (tokenValue === 'null') {
                    token = 'null';
                }
                else {
                    throw new SyntaxError('unexpected token ' + c + ' at position ' + pos);
                }

                return token;
            }
            else {
                throw new SyntaxError('unexpected token ' + c + ' at position ' + pos);
            }
        }

        return null;
    }

    while (next()) {
        console.log(token, '=', tokenValue, pos, 'of', len);
        if (pos > 1 << 53) {
            throw new Error('loop error');
            break;
        }
    }
}

function parse (json: string) {

    lexicalAnalysis(json);

    return eval('(' + json + ');');
}

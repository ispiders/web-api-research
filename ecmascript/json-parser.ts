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
                let reg = /-?(?:0|[1-9][0-9]*)(?:\.[0-9]+)?(?:[eE][+-]?[0-9]+)?/g;
                reg.lastIndex = pos;
                let match = reg.exec(json);

                if (match && match.index === pos) {
                    tokenValue = match[0];
                    column += tokenValue.length;
                    pos = reg.lastIndex;

                    return token;
                }
                else {
                    throw new SyntaxError('unexpected token ' + c);
                }
            }
            else if (c === 't') { // true
                token = 'true';
                if (json.slice(pos, pos + 4) === 'true') {
                    pos += 4;
                    tokenValue = 'true';
                }
                else {
                    throw new SyntaxError('unexpected token ' + c);
                }
                return token;
            }
            else if (c === 'f') { // false
                token = 'false';
                if (json.slice(pos, pos + 5) === 'false') {
                    pos += 5;
                    tokenValue = 'false';
                }
                else {
                    throw new SyntaxError('unexpected token ' + c);
                }
                return token;
            }
            else if (c === 'n') { // null
                token = 'null';
                if (json.slice(pos, pos + 4) === 'null') {
                    pos += 4;
                    tokenValue = 'null';
                }
                else {
                    throw new SyntaxError('unexpected token ' + c);
                }
                return token;
            }
            else {
                throw new SyntaxError('unexpected token ' + c);
            }
        }

        return null;
    }

    while (next()) {
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

const stringify = function (
    value: any,
    replacer?: ((key: string, value: any) => any) | (string | number | Number | String)[] | null,
    space?: string | number | Number | String
): string | undefined {

    let stack: any[] = [];
    let indent = '',
        gap = '';
    let propList: any[] | undefined,
        replacerFn: ((key: string, value: any) => any) | undefined;

    if (replacer) {
        if (typeof replacer === 'function') {
            replacerFn = replacer
        }
        else {
            let isArray = Array.isArray(replacer);

            if (isArray) {
                propList = [];
                let len = replacer.length;
                let k = 0;

                while (k < len) {
                    let v = replacer[k];
                    let item: string | undefined = undefined;

                    if (typeof v === 'string') {
                        item = v;
                    }
                    else if (typeof v === 'number') {
                        item = String(v);
                    }
                    else if (typeof v !== undefined && v !== null) {
                        item = String(v);
                    }

                    if (typeof item !== 'undefined' && propList.indexOf(item) === -1) {
                        propList.push(item);
                    }

                    k = k + 1;
                }
            }
        }
    }

    if (typeof space === 'object') {
        if (space instanceof Number) {
            space = space.valueOf();
        }
        else if (space instanceof String) {
            space = space.toString();
        }
    }

    if (typeof space === 'number') {
        space = Math.min(10, Math.floor(space));
        gap = new Array(Number(space) + 1).join(' ');
    }
    else if (typeof space === 'string') {
        gap = space.length > 10 ? space.slice(0, 10) : space;
    }
    else {
        gap = '';
    }

    let wrapper = {};
    Object.defineProperty(wrapper, '', {value: value});

    function quoteJSONString (value: string): string {
        let product = '"';

        for (let i = 0; i < value.length; i++) {
            let c = value[i];
            let code: number = c.charCodeAt(0);

            if (c === '"' || c === '\\') {
                product = product + '\\' + c;
            }
            else if (0x08 === code) {
                product = product + '\\b';
            }
            else if (0x0c === code) {
                product = product + '\\f';
            }
            else if (0x0a === code) {
                product = product + '\\n';
            }
            else if (0x0d === code) {
                product = product + '\\r';
            }
            else if (0x09 === code) {
                product = product + '\\t';
            }
            else if (code < 0x20) {
                product = product + '\\' + 'u' + ('0000' + code.toString(16)).slice(-4);
            }
            else {
                product = product + c;
            }
        }

        product = product + '"';

        return product;
    }

    function serializeJSONArray (value: any[]): string {
        if (stack.indexOf(value) !== -1) {
            throw new TypeError('structure cyclical');
        }
        stack.push(value);

        let stepback = indent;
        indent = indent + gap;
        let partial: string[] = [];
        let len = value.length;

        let index = 0;

        while (index < len) {
            let strP = serializeJSONProperty(String(index), value);

            if (strP === undefined) {
                partial.push('null');
            }
            else {
                partial.push(strP);
            }

            index += 1;
        }

        let final: string;
        if (partial.length === 0) {
            final = '[]';
        }
        else {
            if (!gap) {
                final = '[' + partial.join(',') + ']';
            }
            else {
                final = '[\n' + indent + partial.join(',\n' + indent) + '\n' + stepback + ']';
            }
        }

        stack.pop();
        indent = stepback;

        return final;
    }

    function serializeJSONObject (value: object): string {

        if (stack.indexOf(value) !== -1) {
            throw new TypeError('structure cyclical');
        }

        stack.push(value);

        let stepback = indent;
        indent = indent + gap;
        let keys = propList || Object.keys(value);
        let partial: string[] = [];

        keys.forEach((key) => {
            let strP = serializeJSONProperty(key, value);

            if (strP !== undefined) {
                let member = '"' + key + '":';

                if (gap) {
                    member = member + ' ';

                }
                member = member + strP;
                partial.push(member);
            }
        });

        let final: string;
        if (!partial.length) {
            final = '{}';
        }
        else {
            if (gap) {
                final = '{\n' + indent + partial.join(',\n' + indent) + '\n' + stepback + '}';
            }
            else {
                final = '{' + partial.join(',') + '}';
            }
        }

        stack.pop();
        indent = stepback;

        return final;
    }

    function serializeJSONProperty (key: string, holder: any): string | undefined {

        let value = holder[key];

        if (typeof value === 'object' && value !== null) {
            if (typeof value.toJSON === 'function') {
                value = value.toJSON();
            }
        }

        if (replacerFn) {
            value = replacerFn.call(holder, key, value);
        }

        if (typeof value === 'object' && value !== null) {
            if (value instanceof Number) {
                value = value.valueOf();
            }
            else if (value instanceof String) {
                value = value.toString();
            }
            else if (value instanceof Boolean) {
                value = value.valueOf();
            }
        }

        if (value === null) {
            return 'null';
        }
        else if (value === true) {
            return 'true';
        }
        else if (value === false) {
            return 'false';
        }
        else if (typeof value === 'string') {
            return quoteJSONString(value);
        }
        else if (typeof value === 'number') {

            if (isFinite(value)) {
                return String(value);
            }
            else {
                return 'null';
            }
        }
        else if (typeof value === 'object') {
            if (Array.isArray(value)) {
                return serializeJSONArray(value);
            }
            else {
                return serializeJSONObject(value);
            }
        }
        else {
            return undefined;
        }
    }

    return serializeJSONProperty('', wrapper);
}

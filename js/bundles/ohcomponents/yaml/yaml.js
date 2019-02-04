
// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS206: Consider reworking classes to avoid initClass
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

// Pattern is a zero-conflict wrapper extending RegExp features
// in order to make YAML parsing regex more expressive.
//
class Pattern {
    static initClass() {

        // @property [RegExp] The RegExp instance
        this.prototype.regex = null;

        // @property [String] The raw regex string
        this.prototype.rawRegex = null;

        // @property [String] The cleaned regex string (used to create the RegExp instance)
        this.prototype.cleanedRegex = null;

        // @property [Object] The dictionary mapping names to capturing bracket numbers
        this.prototype.mapping = null;
    }

    // Constructor
    //
    // @param [String] rawRegex The raw regex string defining the pattern
    //
    constructor(rawRegex, modifiers) {
        if (modifiers == null) { modifiers = ''; }
        let cleanedRegex = '';
        const len = rawRegex.length;
        let mapping = null;

        // Cleanup raw regex and compute mapping
        let capturingBracketNumber = 0;
        let i = 0;
        while (i < len) {
            const _char = rawRegex.charAt(i);
            if (_char === '\\') {
                // Ignore next character
                cleanedRegex += rawRegex.slice(i, +(i + 1) + 1 || undefined);
                i++;
            } else if (_char === '(') {
                // Increase bracket number, only if it is capturing
                if (i < (len - 2)) {
                    const part = rawRegex.slice(i, +(i + 2) + 1 || undefined);
                    if (part === '(?:') {
                        // Non-capturing bracket
                        i += 2;
                        cleanedRegex += part;
                    } else if (part === '(?<') {
                        // Capturing bracket with possibly a name
                        capturingBracketNumber++;
                        i += 2;
                        let name = '';
                        while ((i + 1) < len) {
                            const subChar = rawRegex.charAt(i + 1);
                            if (subChar === '>') {
                                cleanedRegex += '(';
                                i++;
                                if (name.length > 0) {
                                    // Associate a name with a capturing bracket number
                                    if (mapping == null) { mapping = {}; }
                                    mapping[name] = capturingBracketNumber;
                                }
                                break;
                            } else {
                                name += subChar;
                            }

                            i++;
                        }
                    } else {
                        cleanedRegex += _char;
                        capturingBracketNumber++;
                    }
                } else {
                    cleanedRegex += _char;
                }
            } else {
                cleanedRegex += _char;
            }

            i++;
        }

        this.rawRegex = rawRegex;
        this.cleanedRegex = cleanedRegex;
        this.regex = new RegExp(this.cleanedRegex, `g${modifiers.replace('g', '')}`);
        this.mapping = mapping;
    }


    // Executes the pattern's regex and returns the matching values
    //
    // @param [String] str The string to use to execute the pattern
    //
    // @return [Array] The matching values extracted from capturing brackets or null if nothing matched
    //
    exec(str) {
        this.regex.lastIndex = 0;
        const matches = this.regex.exec(str);

        if ((matches == null)) {
            return null;
        }

        if (this.mapping != null) {
            for (let name in this.mapping) {
                const index = this.mapping[name];
                matches[name] = matches[index];
            }
        }

        return matches;
    }


    // Tests the pattern's regex
    //
    // @param [String] str The string to use to test the pattern
    //
    // @return [Boolean] true if the string matched
    //
    test(str) {
        this.regex.lastIndex = 0;
        return this.regex.test(str);
    }


    // Replaces occurences matching with the pattern's regex with replacement
    //
    // @param [String] str The source string to perform replacements
    // @param [String] replacement The string to use in place of each replaced occurence.
    //
    // @return [String] The replaced string
    //
    replace(str, replacement) {
        this.regex.lastIndex = 0;
        return str.replace(this.regex, replacement);
    }


    // Replaces occurences matching with the pattern's regex with replacement and
    // get both the replaced string and the number of replaced occurences in the string.
    //
    // @param [String] str The source string to perform replacements
    // @param [String] replacement The string to use in place of each replaced occurence.
    // @param [Integer] limit The maximum number of occurences to replace (0 means infinite number of occurences)
    //
    // @return [Array] A destructurable array containing the replaced string and the number of replaced occurences. For instance: ["my replaced string", 2]
    //
    replaceAll(str, replacement, limit) {
        if (limit == null) { limit = 0; }
        this.regex.lastIndex = 0;
        let count = 0;
        while (this.regex.test(str) && ((limit === 0) || (count < limit))) {
            this.regex.lastIndex = 0;
            str = str.replace(this.regex, replacement);
            count++;
        }

        return [str, count];
    }
}
Pattern.initClass();



// A bunch of utility methods
//
class Utils {
    static initClass() {

        this.REGEX_LEFT_TRIM_BY_CHAR = {};
        this.REGEX_RIGHT_TRIM_BY_CHAR = {};
        this.REGEX_SPACES = /\s+/g;
        this.REGEX_DIGITS = /^\d+$/;
        this.REGEX_OCTAL = /[^0-7]/gi;
        this.REGEX_HEXADECIMAL = /[^a-f0-9]/gi;

        // Precompiled date pattern
        this.PATTERN_DATE = new Pattern('^' +
            '(?<year>[0-9][0-9][0-9][0-9])' +
            '-(?<month>[0-9][0-9]?)' +
            '-(?<day>[0-9][0-9]?)' +
            '(?:(?:[Tt]|[ \t]+)' +
            '(?<hour>[0-9][0-9]?)' +
            ':(?<minute>[0-9][0-9])' +
            ':(?<second>[0-9][0-9])' +
            '(?:\.(?<fraction>[0-9]*))?' +
            '(?:[ \t]*(?<tz>Z|(?<tz_sign>[-+])(?<tz_hour>[0-9][0-9]?)' +
            '(?::(?<tz_minute>[0-9][0-9]))?))?)?' +
            '$', 'i');

        // Local timezone offset in ms
        this.LOCAL_TIMEZONE_OFFSET = new Date().getTimezoneOffset() * 60 * 1000;
    }

    // Trims the given string on both sides
    //
    // @param [String] str The string to trim
    // @param [String] _char The character to use for trimming (default: '\\s')
    //
    // @return [String] A trimmed string
    //
    static trim(str, _char) {
        if (_char == null) { _char = '\\s'; }
        let regexLeft = this.REGEX_LEFT_TRIM_BY_CHAR[_char];
        if (regexLeft == null) {
            this.REGEX_LEFT_TRIM_BY_CHAR[_char] = (regexLeft = new RegExp(`^${_char}${_char}*`));
        }
        regexLeft.lastIndex = 0;
        let regexRight = this.REGEX_RIGHT_TRIM_BY_CHAR[_char];
        if (regexRight == null) {
            this.REGEX_RIGHT_TRIM_BY_CHAR[_char] = (regexRight = new RegExp(_char + '' + _char + '*$'));
        }
        regexRight.lastIndex = 0;
        return str.replace(regexLeft, '').replace(regexRight, '');
    }


    // Trims the given string on the left side
    //
    // @param [String] str The string to trim
    // @param [String] _char The character to use for trimming (default: '\\s')
    //
    // @return [String] A trimmed string
    //
    static ltrim(str, _char) {
        if (_char == null) { _char = '\\s'; }
        let regexLeft = this.REGEX_LEFT_TRIM_BY_CHAR[_char];
        if (regexLeft == null) {
            this.REGEX_LEFT_TRIM_BY_CHAR[_char] = (regexLeft = new RegExp(`^${_char}${_char}*`));
        }
        regexLeft.lastIndex = 0;
        return str.replace(regexLeft, '');
    }


    // Trims the given string on the right side
    //
    // @param [String] str The string to trim
    // @param [String] _char The character to use for trimming (default: '\\s')
    //
    // @return [String] A trimmed string
    //
    static rtrim(str, _char) {
        if (_char == null) { _char = '\\s'; }
        let regexRight = this.REGEX_RIGHT_TRIM_BY_CHAR[_char];
        if (regexRight == null) {
            this.REGEX_RIGHT_TRIM_BY_CHAR[_char] = (regexRight = new RegExp(_char + '' + _char + '*$'));
        }
        regexRight.lastIndex = 0;
        return str.replace(regexRight, '');
    }


    // Checks if the given value is empty (null, undefined, empty string, string '0', empty Array, empty Object)
    //
    // @param [Object] value The value to check
    //
    // @return [Boolean] true if the value is empty
    //
    static isEmpty(value) {
        return !(value) || (value === '') || (value === '0') || (value instanceof Array && (value.length === 0)) || this.isEmptyObject(value);
    }

    // Checks if the given value is an empty object
    //
    // @param [Object] value The value to check
    //
    // @return [Boolean] true if the value is empty and is an object
    //
    static isEmptyObject(value) {
        return value instanceof Object && (((() => {
            const result = [];
            for (let k of Object.keys(value || {})) {
                result.push(k);
            }
            return result;
        })()).length === 0);
    }

    // Counts the number of occurences of subString inside string
    //
    // @param [String] string The string where to count occurences
    // @param [String] subString The subString to count
    // @param [Integer] start The start index
    // @param [Integer] length The string length until where to count
    //
    // @return [Integer] The number of occurences
    //
    static subStrCount(string, subString, start, length) {
        let c = 0;

        string = `${string}`;
        subString = `${subString}`;

        if (start != null) {
            string = string.slice(start);
        }
        if (length != null) {
            string = string.slice(0, length);
        }

        const len = string.length;
        const sublen = subString.length;
        for (let j = 0, i = j, end = len, asc = 0 <= end; asc ? j < end : j > end; asc ? j++ : j-- , i = j) {
            if (subString === string.slice(i, sublen)) {
                c++;
                i += sublen - 1;
            }
        }

        return c;
    }


    // Returns true if input is only composed of digits
    //
    // @param [Object] input The value to test
    //
    // @return [Boolean] true if input is only composed of digits
    //
    static isDigits(input) {
        this.REGEX_DIGITS.lastIndex = 0;
        return this.REGEX_DIGITS.test(input);
    }


    // Decode octal value
    //
    // @param [String] input The value to decode
    //
    // @return [Integer] The decoded value
    //
    static octDec(input) {
        this.REGEX_OCTAL.lastIndex = 0;
        return parseInt((input + '').replace(this.REGEX_OCTAL, ''), 8);
    }


    // Decode hexadecimal value
    //
    // @param [String] input The value to decode
    //
    // @return [Integer] The decoded value
    //
    static hexDec(input) {
        this.REGEX_HEXADECIMAL.lastIndex = 0;
        input = this.trim(input);
        if ((input + '').slice(0, 2) === '0x') { input = (input + '').slice(2); }
        return parseInt((input + '').replace(this.REGEX_HEXADECIMAL, ''), 16);
    }


    // Get the UTF-8 character for the given code point.
    //
    // @param [Integer] c The unicode code point
    //
    // @return [String] The corresponding UTF-8 character
    //
    static utf8chr(c) {
        const ch = String.fromCharCode;
        if (0x80 > (c %= 0x200000)) {
            return ch(c);
        }
        if (0x800 > c) {
            return ch(0xC0 | (c >> 6)) + ch(0x80 | (c & 0x3F));
        }
        if (0x10000 > c) {
            return ch(0xE0 | (c >> 12)) + ch(0x80 | ((c >> 6) & 0x3F)) + ch(0x80 | (c & 0x3F));
        }

        return ch(0xF0 | (c >> 18)) + ch(0x80 | ((c >> 12) & 0x3F)) + ch(0x80 | ((c >> 6) & 0x3F)) + ch(0x80 | (c & 0x3F));
    }


    // Returns the boolean value equivalent to the given input
    //
    // @param [String|Object]    input       The input value
    // @param [Boolean]          strict      If set to false, accept 'yes' and 'no' as boolean values
    //
    // @return [Boolean]         the boolean value
    //
    static parseBoolean(input, strict) {
        if (strict == null) { strict = true; }
        if (typeof (input) === 'string') {
            const lowerInput = input.toLowerCase();
            if (!strict) {
                if (lowerInput === 'no') { return false; }
            }
            if (lowerInput === '0') { return false; }
            if (lowerInput === 'false') { return false; }
            if (lowerInput === '') { return false; }
            return true;
        }
        return !!input;
    }



    // Returns true if input is numeric
    //
    // @param [Object] input The value to test
    //
    // @return [Boolean] true if input is numeric
    //
    static isNumeric(input) {
        this.REGEX_SPACES.lastIndex = 0;
        return (typeof (input) === 'number') || ((typeof (input) === 'string') && !isNaN(input) && (input.replace(this.REGEX_SPACES, '') !== ''));
    }


    // Returns a parsed date from the given string
    //
    // @param [String] str The date string to parse
    //
    // @return [Date] The parsed date or null if parsing failed
    //
    static stringToDate(str) {
        let date, fraction, tz_offset;
        if (!(str != null ? str.length : undefined)) {
            return null;
        }

        // Perform regular expression pattern
        const info = this.PATTERN_DATE.exec(str);
        if (!info) {
            return null;
        }

        // Extract year, month, day
        const year = parseInt(info.year, 10);
        const month = parseInt(info.month, 10) - 1; // In javascript, january is 0, february 1, etc...
        const day = parseInt(info.day, 10);

        // If no hour is given, return a date with day precision
        if (info.hour == null) {
            date = new Date(Date.UTC(year, month, day));
            return date;
        }

        // Extract hour, minute, second
        const hour = parseInt(info.hour, 10);
        const minute = parseInt(info.minute, 10);
        const second = parseInt(info.second, 10);

        // Extract fraction, if given
        if (info.fraction != null) {
            fraction = info.fraction.slice(0, 3);
            while (fraction.length < 3) {
                fraction += '0';
            }
            fraction = parseInt(fraction, 10);
        } else {
            fraction = 0;
        }

        // Compute timezone offset if given
        if (info.tz != null) {
            let tz_minute;
            const tz_hour = parseInt(info.tz_hour, 10);
            if (info.tz_minute != null) {
                tz_minute = parseInt(info.tz_minute, 10);
            } else {
                tz_minute = 0;
            }

            // Compute timezone delta in ms
            tz_offset = ((tz_hour * 60) + tz_minute) * 60000;
            if ('-' === info.tz_sign) {
                tz_offset *= -1;
            }
        }

        // Compute date
        date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
        if (tz_offset) {
            date.setTime(date.getTime() - tz_offset);
        }

        return date;
    }


    // Repeats the given string a number of times
    //
    // @param [String]   str     The string to repeat
    // @param [Integer]  number  The number of times to repeat the string
    //
    // @return [String]  The repeated string
    //
    static strRepeat(str, number) {
        let res = '';
        let i = 0;
        while (i < number) {
            res += str;
            i++;
        }
        return res;
    }


    // Reads the data from the given file path and returns the result as string
    //
    // @param [String]   path        The path to the file
    // @param [Function] callback    A callback to read file asynchronously (optional)
    //
    // @return [String]  The resulting data as string
    //
    static getStringFromFile(path, callback = null) {
        let xhr = null;
        if (typeof window !== 'undefined' && window !== null) {
            if (window.XMLHttpRequest) {
                xhr = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                for (let name of ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.3.0", "Msxml2.XMLHTTP", "Microsoft.XMLHTTP"]) {
                    try {
                        xhr = new ActiveXObject(name);
                    } catch (error) { }
                }
            }
        }

        if (xhr != null) {
            // Browser
            if (callback != null) {
                // Async
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if ((xhr.status === 200) || (xhr.status === 0)) {
                            return callback(xhr.responseText);
                        } else {
                            return callback(null);
                        }
                    }
                };
                xhr.open('GET', path, true);
                return xhr.send(null);

            } else {
                // Sync
                xhr.open('GET', path, false);
                xhr.send(null);

                if ((xhr.status === 200) || (xhr.status === 0)) {
                    return xhr.responseText;
                }

                return null;
            }
        } else {
            // Node.js-like
            const req = require;
            const fs = req('fs'); // Prevent browserify from trying to load 'fs' module
            if (callback != null) {
                // Async
                return fs.readFile(path, function (err, data) {
                    if (err) {
                        return callback(null);
                    } else {
                        return callback(String(data));
                    }
                });

            } else {
                // Sync
                const data = fs.readFileSync(path);
                if (data != null) {
                    return String(data);
                }
                return null;
            }
        }
    }
}
Utils.initClass();



// Unescaper encapsulates unescaping rules for single and double-quoted YAML strings.
//
class Unescaper {
    static initClass() {

        // Regex fragment that matches an escaped character in
        // a double quoted string.
        this.PATTERN_ESCAPED_CHARACTER = new Pattern('\\\\([0abt\tnvfre "\\/\\\\N_LP]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})');

    }


    // Unescapes a single quoted string.
    //
    // @param [String]       value A single quoted string.
    //
    // @return [String]      The unescaped string.
    //
    static unescapeSingleQuotedString(value) {
        return value.replace(/\'\'/g, '\'');
    }


    // Unescapes a double quoted string.
    //
    // @param [String]       value A double quoted string.
    //
    // @return [String]      The unescaped string.
    //
    static unescapeDoubleQuotedString(value) {
        if (this._unescapeCallback == null) {
        this._unescapeCallback = str => {
            return this.unescapeCharacter(str);
        };
        }

        // Evaluate the string
        return this.PATTERN_ESCAPED_CHARACTER.replace(value, this._unescapeCallback);
    }


    // Unescapes a character that was found in a double-quoted string
    //
    // @param [String]       value An escaped character
    //
    // @return [String]      The unescaped character
    //
    static unescapeCharacter(value) {
        const ch = String.fromCharCode;
        switch (value.charAt(1)) {
            case '0':
                return ch(0);
            case 'a':
                return ch(7);
            case 'b':
                return ch(8);
            case 't':
                return "\t";
            case "\t":
                return "\t";
            case 'n':
                return "\n";
            case 'v':
                return ch(11);
            case 'f':
                return ch(12);
            case 'r':
                return ch(13);
            case 'e':
                return ch(27);
            case ' ':
                return ' ';
            case '"':
                return '"';
            case '/':
                return '/';
            case '\\':
                return '\\';
            case 'N':
                // U+0085 NEXT LINE
                return ch(0x0085);
            case '_':
                // U+00A0 NO-BREAK SPACE
                return ch(0x00A0);
            case 'L':
                // U+2028 LINE SEPARATOR
                return ch(0x2028);
            case 'P':
                // U+2029 PARAGRAPH SEPARATOR
                return ch(0x2029);
            case 'x':
                return Utils.utf8chr(Utils.hexDec(value.substr(2, 2)));
            case 'u':
                return Utils.utf8chr(Utils.hexDec(value.substr(2, 4)));
            case 'U':
                return Utils.utf8chr(Utils.hexDec(value.substr(2, 8)));
            default:
                return '';
        }
    }
}
Unescaper.initClass();



// Escaper encapsulates escaping rules for single
// and double-quoted YAML strings.
class Escaper {
    static initClass() {

        // Mapping arrays for escaping a double quoted string. The backslash is
        // first to ensure proper escaping.
        let ch;
        this.LIST_ESCAPEES = ['\\', '\\\\', '\\"', '"',
            "\x00", "\x01", "\x02", "\x03", "\x04", "\x05", "\x06", "\x07",
            "\x08", "\x09", "\x0a", "\x0b", "\x0c", "\x0d", "\x0e", "\x0f",
            "\x10", "\x11", "\x12", "\x13", "\x14", "\x15", "\x16", "\x17",
            "\x18", "\x19", "\x1a", "\x1b", "\x1c", "\x1d", "\x1e", "\x1f",
            (ch = String.fromCharCode)(0x0085), ch(0x00A0), ch(0x2028), ch(0x2029)];
        this.LIST_ESCAPED = ['\\\\', '\\"', '\\"', '\\"',
            "\\0", "\\x01", "\\x02", "\\x03", "\\x04", "\\x05", "\\x06", "\\a",
            "\\b", "\\t", "\\n", "\\v", "\\f", "\\r", "\\x0e", "\\x0f",
            "\\x10", "\\x11", "\\x12", "\\x13", "\\x14", "\\x15", "\\x16", "\\x17",
            "\\x18", "\\x19", "\\x1a", "\\e", "\\x1c", "\\x1d", "\\x1e", "\\x1f",
            "\\N", "\\_", "\\L", "\\P"];

        this.MAPPING_ESCAPEES_TO_ESCAPED = (() => {
            const mapping = {};
            for (let i = 0, end = this.LIST_ESCAPEES.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                mapping[this.LIST_ESCAPEES[i]] = this.LIST_ESCAPED[i];
            }
            return mapping;
        })();

        // Characters that would cause a dumped string to require double quoting.
        this.PATTERN_CHARACTERS_TO_ESCAPE = new Pattern('[\\x00-\\x1f]|\xc2\x85|\xc2\xa0|\xe2\x80\xa8|\xe2\x80\xa9');

        // Other precompiled patterns
        this.PATTERN_MAPPING_ESCAPEES = new Pattern(this.LIST_ESCAPEES.join('|').split('\\').join('\\\\'));
        this.PATTERN_SINGLE_QUOTING = new Pattern('[\\s\'":{}[\\],&*#?]|^[-?|<>=!%@`]');
    }



    // Determines if a JavaScript value would require double quoting in YAML.
    //
    // @param [String]   value   A JavaScript value value
    //
    // @return [Boolean] true    if the value would require double quotes.
    //
    static requiresDoubleQuoting(value) {
        return this.PATTERN_CHARACTERS_TO_ESCAPE.test(value);
    }


    // Escapes and surrounds a JavaScript value with double quotes.
    //
    // @param [String]   value   A JavaScript value
    //
    // @return [String]  The quoted, escaped string
    //
    static escapeWithDoubleQuotes(value) {
        const result = this.PATTERN_MAPPING_ESCAPEES.replace(value, str => {
            return this.MAPPING_ESCAPEES_TO_ESCAPED[str];
        });
        return `"${result}"`;
    }


    // Determines if a JavaScript value would require single quoting in YAML.
    //
    // @param [String]   value   A JavaScript value
    //
    // @return [Boolean] true if the value would require single quotes.
    //
    static requiresSingleQuoting(value) {
        return this.PATTERN_SINGLE_QUOTING.test(value);
    }


    // Escapes and surrounds a JavaScript value with single quotes.
    //
    // @param [String]   value   A JavaScript value
    //
    // @return [String]  The quoted, escaped string
    //
    static escapeWithSingleQuotes(value) {
        return `'${value.replace(/'/g, "''")}'`;
    }
}
Escaper.initClass();


// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

class ParseException extends Error {

    constructor(message, parsedLine, snippet) {
        this.message = message;
        this.parsedLine = parsedLine;
        this.snippet = snippet;
    }

    toString() {
        if ((this.parsedLine != null) && (this.snippet != null)) {
            return `<ParseException> ${this.message} (line ${this.parsedLine}: '${this.snippet}')`;
        } else {
            return `<ParseException> ${this.message}`;
        }
    }
}


// Sanity-check the conversion and remove this comment.
/*
 * decaffeinate suggestions:
 * DS001: Remove Babel/TypeScript constructor workaround
 * DS207: Consider shorter variations of null checks
 * Full docs: https://github.com/decaffeinate/decaffeinate/blob/master/docs/suggestions.md
 */

class ParseMore extends Error {

    constructor(message, parsedLine, snippet) {
        this.message = message;
        this.parsedLine = parsedLine;
        this.snippet = snippet;
    }

    toString() {
        if ((this.parsedLine != null) && (this.snippet != null)) {
            return `<ParseMore> ${this.message} (line ${this.parsedLine}: '${this.snippet}')`;
        } else {
            return `<ParseMore> ${this.message}`;
        }
    }
}





// Inline YAML parsing and dumping
class Inline {
    static initClass() {

        // Quoted string regular expression
        this.REGEX_QUOTED_STRING = '(?:"(?:[^"\\\\]*(?:\\\\.[^"\\\\]*)*)"|\'(?:[^\']*(?:\'\'[^\']*)*)\')';

        // Pre-compiled patterns
        //
        this.PATTERN_TRAILING_COMMENTS = new Pattern('^\\s*#.*$');
        this.PATTERN_QUOTED_SCALAR = new Pattern(`^${this.REGEX_QUOTED_STRING}`);
        this.PATTERN_THOUSAND_NUMERIC_SCALAR = new Pattern('^(-|\\+)?[0-9,]+(\\.[0-9]+)?$');
        this.PATTERN_SCALAR_BY_DELIMITERS = {};

        // Settings
        this.settings = {};
    }


    // Configure YAML inline.
    //
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    static configure(exceptionOnInvalidType = null, objectDecoder = null) {
        // Update settings
        this.settings.exceptionOnInvalidType = exceptionOnInvalidType;
        this.settings.objectDecoder = objectDecoder;
    }


    // Converts a YAML string to a JavaScript object.
    //
    // @param [String]   value                   A YAML string
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object]  A JavaScript object representing the YAML string
    //
    // @throw [ParseException]
    //
    static parse(value, exceptionOnInvalidType, objectDecoder = null) {
        // Update settings from last call of Inline.parse()
        let result;
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        this.settings.exceptionOnInvalidType = exceptionOnInvalidType;
        this.settings.objectDecoder = objectDecoder;

        if ((value == null)) {
            return '';
        }

        value = Utils.trim(value);

        if (0 === value.length) {
            return '';
        }

        // Keep a context object to pass through static methods
        const context = { exceptionOnInvalidType, objectDecoder, i: 0 };

        switch (value.charAt(0)) {
            case '[':
                result = this.parseSequence(value, context);
                ++context.i;
                break;
            case '{':
                result = this.parseMapping(value, context);
                ++context.i;
                break;
            default:
                result = this.parseScalar(value, null, ['"', "'"], context);
        }

        // Some comments are allowed at the end
        if (this.PATTERN_TRAILING_COMMENTS.replace(value.slice(context.i), '') !== '') {
            throw new ParseException(`Unexpected characters near "${value.slice(context.i)}".`);
        }

        return result;
    }


    // Dumps a given JavaScript variable to a YAML string.
    //
    // @param [Object]   value                   The JavaScript variable to convert
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectEncoder           A function to serialize custom objects, null otherwise
    //
    // @return [String]  The YAML string representing the JavaScript object
    //
    // @throw [DumpException]
    //
    static dump(value, exceptionOnInvalidType, objectEncoder = null) {
        let needle;
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        if ((value == null)) {
            return 'null';
        }
        const type = typeof value;
        if (type === 'object') {
            if (value instanceof Date) {
                return value.toISOString();
            } else if (objectEncoder != null) {
                const result = objectEncoder(value);
                if ((typeof result === 'string') || (result != null)) {
                    return result;
                }
            }
            return this.dumpObject(value);
        }
        if (type === 'boolean') {
            return (value ? 'true' : 'false');
        }
        if (Utils.isDigits(value)) {
            return (type === 'string' ? `'${value}'` : String(parseInt(value)));
        }
        if (Utils.isNumeric(value)) {
            return (type === 'string' ? `'${value}'` : String(parseFloat(value)));
        }
        if (type === 'number') {
            return (value === Infinity ? '.Inf' : (value === -Infinity ? '-.Inf' : (isNaN(value) ? '.NaN' : value)));
        }
        if (Escaper.requiresDoubleQuoting(value)) {
            return Escaper.escapeWithDoubleQuotes(value);
        }
        if (Escaper.requiresSingleQuoting(value)) {
            return Escaper.escapeWithSingleQuotes(value);
        }
        if ('' === value) {
            return '""';
        }
        if (Utils.PATTERN_DATE.test(value)) {
            return `'${value}'`;
        }
        if ((needle = value.toLowerCase(), ['null', '~', 'true', 'false'].includes(needle))) {
            return `'${value}'`;
        }
        // Default
        return value;
    }


    // Dumps a JavaScript object to a YAML string.
    //
    // @param [Object]   value                   The JavaScript object to dump
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectEncoder           A function do serialize custom objects, null otherwise
    //
    // @return string The YAML string representing the JavaScript object
    //
    static dumpObject(value, exceptionOnInvalidType, objectSupport = null) {
        // Array
        let output, val;
        if (value instanceof Array) {
            output = [];
            for (val of Array.from(value)) {
                output.push(this.dump(val));
            }
            return `[${output.join(', ')}]`;

            // Mapping
        } else {
            output = [];
            for (let key in value) {
                val = value[key];
                output.push(this.dump(key) + ': ' + this.dump(val));
            }
            return `{${output.join(', ')}}`;
        }
    }


    // Parses a scalar to a YAML string.
    //
    // @param [Object]   scalar
    // @param [Array]    delimiters
    // @param [Array]    stringDelimiters
    // @param [Object]   context
    // @param [Boolean]  evaluate
    //
    // @return [String]  A YAML string
    //
    // @throw [ParseException] When malformed inline YAML string is parsed
    //
    static parseScalar(scalar, delimiters = null, stringDelimiters, context = null, evaluate) {
        let needle, output;
        if (stringDelimiters == null) { stringDelimiters = ['"', "'"]; }
        if (evaluate == null) { evaluate = true; }
        if (context == null) {
            context = { exceptionOnInvalidType: this.settings.exceptionOnInvalidType, objectDecoder: this.settings.objectDecoder, i: 0 };
        }
        let { i } = context;

        if ((needle = scalar.charAt(i), Array.from(stringDelimiters).includes(needle))) {
            // Quoted scalar
            output = this.parseQuotedScalar(scalar, context);
            ({ i } = context);

            if (delimiters != null) {
                let needle1;
                const tmp = Utils.ltrim(scalar.slice(i), ' ');
                if (!((needle1 = tmp.charAt(0), Array.from(delimiters).includes(needle1)))) {
                    throw new ParseException(`Unexpected characters (${scalar.slice(i)}).`);
                }
            }

        } else {
            // "normal" string
            if (!delimiters) {
                output = scalar.slice(i);
                i += output.length;

                // Remove comments
                const strpos = output.indexOf(' #');
                if (strpos !== -1) {
                    output = Utils.rtrim(output.slice(0, strpos));
                }

            } else {
                let match;
                const joinedDelimiters = delimiters.join('|');
                let pattern = this.PATTERN_SCALAR_BY_DELIMITERS[joinedDelimiters];
                if (pattern == null) {
                    pattern = new Pattern(`^(.+?)(${joinedDelimiters})`);
                    this.PATTERN_SCALAR_BY_DELIMITERS[joinedDelimiters] = pattern;
                }
                if (match = pattern.exec(scalar.slice(i))) {
                    output = match[1];
                    i += output.length;
                } else {
                    throw new ParseException(`Malformed inline YAML string (${scalar}).`);
                }
            }


            if (evaluate) {
                output = this.evaluateScalar(output, context);
            }
        }

        context.i = i;
        return output;
    }


    // Parses a quoted scalar to YAML.
    //
    // @param [String]   scalar
    // @param [Object]   context
    //
    // @return [String]  A YAML string
    //
    // @throw [ParseMore] When malformed inline YAML string is parsed
    //
    static parseQuotedScalar(scalar, context) {
        let match;
        let { i } = context;

        if (!(match = this.PATTERN_QUOTED_SCALAR.exec(scalar.slice(i)))) {
            throw new ParseMore(`Malformed inline YAML string (${scalar.slice(i)}).`);
        }

        let output = match[0].substr(1, match[0].length - 2);

        if ('"' === scalar.charAt(i)) {
            output = Unescaper.unescapeDoubleQuotedString(output);
        } else {
            output = Unescaper.unescapeSingleQuotedString(output);
        }

        i += match[0].length;

        context.i = i;
        return output;
    }


    // Parses a sequence to a YAML string.
    //
    // @param [String]   sequence
    // @param [Object]   context
    //
    // @return [String]  A YAML string
    //
    // @throw [ParseMore] When malformed inline YAML string is parsed
    //
    static parseSequence(sequence, context) {
        const output = [];
        const len = sequence.length;
        let { i } = context;
        i += 1;

        // [foo, bar, ...]
        while (i < len) {
            var needle;
            context.i = i;
            switch (sequence.charAt(i)) {
                case '[':
                    // Nested sequence
                    output.push(this.parseSequence(sequence, context));
                    ({ i } = context);
                    break;
                case '{':
                    // Nested mapping
                    output.push(this.parseMapping(sequence, context));
                    ({ i } = context);
                    break;
                case ']':
                    return output;
                    break;
                case ',': case ' ': case "\n":
                    break;
                // Do nothing
                default:
                    var isQuoted = ((needle = sequence.charAt(i), ['"', "'"].includes(needle)));
                    var value = this.parseScalar(sequence, [',', ']'], ['"', "'"], context);
                    ({ i } = context);

                    if (!(isQuoted) && (typeof (value) === 'string') && ((value.indexOf(': ') !== -1) || (value.indexOf(":\n") !== -1))) {
                        // Embedded mapping?
                        try {
                            value = this.parseMapping(`{${value}}`);
                        } catch (e) { }
                    }
                    // No, it's not


                    output.push(value);

                    --i;
            }

            ++i;
        }

        throw new ParseMore(`Malformed inline YAML string ${sequence}`);
    }


    // Parses a mapping to a YAML string.
    //
    // @param [String]   mapping
    // @param [Object]   context
    //
    // @return [String]  A YAML string
    //
    // @throw [ParseMore] When malformed inline YAML string is parsed
    //
    static parseMapping(mapping, context) {
        const output = {};
        const len = mapping.length;
        let { i } = context;
        i += 1;

        // {foo: bar, bar:foo, ...}
        let shouldContinueWhileLoop = false;
        while (i < len) {
            context.i = i;
            switch (mapping.charAt(i)) {
                case ' ': case ',': case "\n":
                    ++i;
                    context.i = i;
                    shouldContinueWhileLoop = true;
                    break;
                case '}':
                    return output;
                    break;
            }

            if (shouldContinueWhileLoop) {
                shouldContinueWhileLoop = false;
                continue;
            }

            // Key
            const key = this.parseScalar(mapping, [':', ' ', "\n"], ['"', "'"], context, false);
            ({ i } = context);

            // Value
            let done = false;

            while (i < len) {
                context.i = i;
                switch (mapping.charAt(i)) {
                    case '[':
                        // Nested sequence
                        var value = this.parseSequence(mapping, context);
                        ({ i } = context);
                        // Spec: Keys MUST be unique; first one wins.
                        // Parser cannot abort this mapping earlier, since lines
                        // are processed sequentially.
                        if (output[key] === undefined) {
                            output[key] = value;
                        }
                        done = true;
                        break;
                    case '{':
                        // Nested mapping
                        value = this.parseMapping(mapping, context);
                        ({ i } = context);
                        // Spec: Keys MUST be unique; first one wins.
                        // Parser cannot abort this mapping earlier, since lines
                        // are processed sequentially.
                        if (output[key] === undefined) {
                            output[key] = value;
                        }
                        done = true;
                        break;
                    case ':': case ' ': case "\n":
                        break;
                    // Do nothing
                    default:
                        value = this.parseScalar(mapping, [',', '}'], ['"', "'"], context);
                        ({ i } = context);
                        // Spec: Keys MUST be unique; first one wins.
                        // Parser cannot abort this mapping earlier, since lines
                        // are processed sequentially.
                        if (output[key] === undefined) {
                            output[key] = value;
                        }
                        done = true;
                        --i;
                }

                ++i;

                if (done) {
                    break;
                }
            }
        }

        throw new ParseMore(`Malformed inline YAML string ${mapping}`);
    }


    // Evaluates scalars and replaces magic values.
    //
    // @param [String]   scalar
    //
    // @return [String]  A YAML string
    //
    static evaluateScalar(scalar, context) {
        let cast, date, firstWord, raw;
        scalar = Utils.trim(scalar);
        const scalarLower = scalar.toLowerCase();

        switch (scalarLower) {
            case 'null': case '': case '~':
                return null;
            case 'true':
                return true;
            case 'false':
                return false;
            case '.inf':
                return Infinity;
            case '.nan':
                return NaN;
            case '-.inf':
                return Infinity;
            default:
                var firstChar = scalarLower.charAt(0);
                switch (firstChar) {
                    case '!':
                        var firstSpace = scalar.indexOf(' ');
                        if (firstSpace === -1) {
                            firstWord = scalarLower;
                        } else {
                            firstWord = scalarLower.slice(0, firstSpace);
                        }
                        switch (firstWord) {
                            case '!':
                                if (firstSpace !== -1) {
                                    return parseInt(this.parseScalar(scalar.slice(2)));
                                }
                                return null;
                            case '!str':
                                return Utils.ltrim(scalar.slice(4));
                            case '!!str':
                                return Utils.ltrim(scalar.slice(5));
                            case '!!int':
                                return parseInt(this.parseScalar(scalar.slice(5)));
                            case '!!bool':
                                return Utils.parseBoolean(this.parseScalar(scalar.slice(6)), false);
                            case '!!float':
                                return parseFloat(this.parseScalar(scalar.slice(7)));
                            case '!!timestamp':
                                return Utils.stringToDate(Utils.ltrim(scalar.slice(11)));
                            default:
                                if (context == null) {
                                    context = { exceptionOnInvalidType: this.settings.exceptionOnInvalidType, objectDecoder: this.settings.objectDecoder, i: 0 };
                                }
                                var { objectDecoder, exceptionOnInvalidType } = context;

                                if (objectDecoder) {
                                    // If objectDecoder function is given, we can do custom decoding of custom types
                                    const trimmedScalar = Utils.rtrim(scalar);
                                    firstSpace = trimmedScalar.indexOf(' ');
                                    if (firstSpace === -1) {
                                        return objectDecoder(trimmedScalar, null);
                                    } else {
                                        let subValue = Utils.ltrim(trimmedScalar.slice(firstSpace + 1));
                                        if (!(subValue.length > 0)) {
                                            subValue = null;
                                        }
                                        return objectDecoder(trimmedScalar.slice(0, firstSpace), subValue);
                                    }
                                }

                                if (exceptionOnInvalidType) {
                                    throw new ParseException('Custom object support when parsing a YAML file has been disabled.');
                                }

                                return null;
                        }
                    case '0':
                        if ('0x' === scalar.slice(0, 2)) {
                            return Utils.hexDec(scalar);
                        } else if (Utils.isDigits(scalar)) {
                            return Utils.octDec(scalar);
                        } else if (Utils.isNumeric(scalar)) {
                            return parseFloat(scalar);
                        } else {
                            return scalar;
                        }
                    case '+':
                        if (Utils.isDigits(scalar)) {
                            raw = scalar;
                            cast = parseInt(raw);
                            if (raw === String(cast)) {
                                return cast;
                            } else {
                                return raw;
                            }
                        } else if (Utils.isNumeric(scalar)) {
                            return parseFloat(scalar);
                        } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
                            return parseFloat(scalar.replace(',', ''));
                        }
                        return scalar;
                    case '-':
                        if (Utils.isDigits(scalar.slice(1))) {
                            if ('0' === scalar.charAt(1)) {
                                return -Utils.octDec(scalar.slice(1));
                            } else {
                                raw = scalar.slice(1);
                                cast = parseInt(raw);
                                if (raw === String(cast)) {
                                    return -cast;
                                } else {
                                    return -raw;
                                }
                            }
                        } else if (Utils.isNumeric(scalar)) {
                            return parseFloat(scalar);
                        } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
                            return parseFloat(scalar.replace(',', ''));
                        }
                        return scalar;
                    default:
                        if (date = Utils.stringToDate(scalar)) {
                            return date;
                        } else if (Utils.isNumeric(scalar)) {
                            return parseFloat(scalar);
                        } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
                            return parseFloat(scalar.replace(',', ''));
                        }
                        return scalar;
                }
        }
    }
}
Inline.initClass();



// Parser parses YAML strings to convert them to JavaScript objects.
//
class Parser {
    static initClass() {

        // Pre-compiled patterns
        //
        this.prototype.PATTERN_FOLDED_SCALAR_ALL = new Pattern('^(?:(?<type>![^\\|>]*)\\s+)?(?<separator>\\||>)(?<modifiers>\\+|\\-|\\d+|\\+\\d+|\\-\\d+|\\d+\\+|\\d+\\-)?(?<comments> +#.*)?$');
        this.prototype.PATTERN_FOLDED_SCALAR_END = new Pattern('(?<separator>\\||>)(?<modifiers>\\+|\\-|\\d+|\\+\\d+|\\-\\d+|\\d+\\+|\\d+\\-)?(?<comments> +#.*)?$');
        this.prototype.PATTERN_SEQUENCE_ITEM = new Pattern('^\\-((?<leadspaces>\\s+)(?<value>.+?))?\\s*$');
        this.prototype.PATTERN_ANCHOR_VALUE = new Pattern('^&(?<ref>[^ ]+) *(?<value>.*)');
        this.prototype.PATTERN_COMPACT_NOTATION = new Pattern(`^(?<key>${Inline.REGEX_QUOTED_STRING}|[^ '"\\{\\[].*?) *\\:(\\s+(?<value>.+?))?\\s*$`);
        this.prototype.PATTERN_MAPPING_ITEM = new Pattern(`^(?<key>${Inline.REGEX_QUOTED_STRING}|[^ '"\\[\\{].*?) *\\:(\\s+(?<value>.+?))?\\s*$`);
        this.prototype.PATTERN_DECIMAL = new Pattern('\\d+');
        this.prototype.PATTERN_INDENT_SPACES = new Pattern('^ +');
        this.prototype.PATTERN_TRAILING_LINES = new Pattern('(\n*)$');
        this.prototype.PATTERN_YAML_HEADER = new Pattern('^\\%YAML[: ][\\d\\.]+.*\n', 'm');
        this.prototype.PATTERN_LEADING_COMMENTS = new Pattern('^(\\#.*?\n)+', 'm');
        this.prototype.PATTERN_DOCUMENT_MARKER_START = new Pattern('^\\-\\-\\-.*?\n', 'm');
        this.prototype.PATTERN_DOCUMENT_MARKER_END = new Pattern('^\\.\\.\\.\\s*$', 'm');
        this.prototype.PATTERN_FOLDED_SCALAR_BY_INDENTATION = {};

        // Context types
        //
        this.prototype.CONTEXT_NONE = 0;
        this.prototype.CONTEXT_SEQUENCE = 1;
        this.prototype.CONTEXT_MAPPING = 2;
    }


    // Constructor
    //
    // @param [Integer]  offset  The offset of YAML document (used for line numbers in error messages)
    //
    constructor(offset) {
        if (offset == null) { offset = 0; }
        this.offset = offset;
        this.lines = [];
        this.currentLineNb = -1;
        this.currentLine = '';
        this.refs = {};
    }


    // Parses a YAML string to a JavaScript value.
    //
    // @param [String]   value                   A YAML string
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object]  A JavaScript value
    //
    // @throw [ParseException] If the YAML is not valid
    //
    parse(value, exceptionOnInvalidType, objectDecoder = null) {
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        this.currentLineNb = -1;
        this.currentLine = '';
        this.lines = this.cleanup(value).split("\n");

        let data = null;
        let context = this.CONTEXT_NONE;
        let allowOverwrite = false;
        while (this.moveToNextLine()) {
            var c, e, key, matches, mergeNode, parser, values;
            if (this.isCurrentLineEmpty()) {
                continue;
            }

            // Tab?
            if ("\t" === this.currentLine[0]) {
                throw new ParseException('A YAML file cannot contain tabs as indentation.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }

            let isRef = (mergeNode = false);
            if (values = this.PATTERN_SEQUENCE_ITEM.exec(this.currentLine)) {
                if (this.CONTEXT_MAPPING === context) {
                    throw new ParseException('You cannot define a sequence item when in a mapping');
                }
                context = this.CONTEXT_SEQUENCE;
                if (data == null) { data = []; }

                if ((values.value != null) && (matches = this.PATTERN_ANCHOR_VALUE.exec(values.value))) {
                    isRef = matches.ref;
                    values.value = matches.value;
                }

                // Array
                if ((values.value == null) || ('' === Utils.trim(values.value, ' ')) || (Utils.ltrim(values.value, ' ').indexOf('#') === 0)) {
                    if ((this.currentLineNb < (this.lines.length - 1)) && !this.isNextLineUnIndentedCollection()) {
                        c = this.getRealCurrentLineNb() + 1;
                        parser = new Parser(c);
                        parser.refs = this.refs;
                        data.push(parser.parse(this.getNextEmbedBlock(null, true), exceptionOnInvalidType, objectDecoder));
                    } else {
                        data.push(null);
                    }

                } else {
                    if ((values.leadspaces != null ? values.leadspaces.length : undefined) && (matches = this.PATTERN_COMPACT_NOTATION.exec(values.value))) {

                        // This is a compact notation element, add to next block and parse
                        c = this.getRealCurrentLineNb();
                        parser = new Parser(c);
                        parser.refs = this.refs;

                        let block = values.value;
                        const indent = this.getCurrentLineIndentation();
                        if (this.isNextLineIndented(false)) {
                            block += `\n${this.getNextEmbedBlock(indent + values.leadspaces.length + 1, true)}`;
                        }

                        data.push(parser.parse(block, exceptionOnInvalidType, objectDecoder));

                    } else {
                        data.push(this.parseValue(values.value, exceptionOnInvalidType, objectDecoder));
                    }
                }

            } else if ((values = this.PATTERN_MAPPING_ITEM.exec(this.currentLine)) && (values.key.indexOf(' #') === -1)) {
                var val;
                if (this.CONTEXT_SEQUENCE === context) {
                    throw new ParseException('You cannot define a mapping item when in a sequence');
                }
                context = this.CONTEXT_MAPPING;
                if (data == null) { data = {}; }

                // Force correct settings
                Inline.configure(exceptionOnInvalidType, objectDecoder);
                try {
                    key = Inline.parseScalar(values.key);
                } catch (error) {
                    e = error;
                    e.parsedLine = this.getRealCurrentLineNb() + 1;
                    e.snippet = this.currentLine;

                    throw e;
                }

                if ('<<' === key) {
                    var i;
                    mergeNode = true;
                    allowOverwrite = true;
                    if ((values.value != null ? values.value.indexOf('*') : undefined) === 0) {
                        const refName = values.value.slice(1);
                        if (this.refs[refName] == null) {
                            throw new ParseException(`Reference "${refName}" does not exist.`, this.getRealCurrentLineNb() + 1, this.currentLine);
                        }

                        const refValue = this.refs[refName];

                        if (typeof refValue !== 'object') {
                            throw new ParseException('YAML merge keys used with a scalar value instead of an object.', this.getRealCurrentLineNb() + 1, this.currentLine);
                        }

                        if (refValue instanceof Array) {
                            // Merge array with object
                            for (i = 0; i < refValue.length; i++) {
                                var name;
                                value = refValue[i];
                                if (data[name = String(i)] == null) { data[name] = value; }
                            }
                        } else {
                            // Merge objects
                            for (key in refValue) {
                                value = refValue[key];
                                if (data[key] == null) { data[key] = value; }
                            }
                        }

                    } else {
                        if ((values.value != null) && (values.value !== '')) {
                            ({ value } = values);
                        } else {
                            value = this.getNextEmbedBlock();
                        }

                        c = this.getRealCurrentLineNb() + 1;
                        parser = new Parser(c);
                        parser.refs = this.refs;
                        const parsed = parser.parse(value, exceptionOnInvalidType);

                        if (typeof parsed !== 'object') {
                            throw new ParseException('YAML merge keys used with a scalar value instead of an object.', this.getRealCurrentLineNb() + 1, this.currentLine);
                        }

                        if (parsed instanceof Array) {
                            // If the value associated with the merge key is a sequence, then this sequence is expected to contain mapping nodes
                            // and each of these nodes is merged in turn according to its order in the sequence. Keys in mapping nodes earlier
                            // in the sequence override keys specified in later mapping nodes.
                            for (let parsedItem of Array.from(parsed)) {
                                if (typeof parsedItem !== 'object') {
                                    throw new ParseException('Merge items must be objects.', this.getRealCurrentLineNb() + 1, parsedItem);
                                }

                                if (parsedItem instanceof Array) {
                                    // Merge array with object
                                    for (i = 0; i < parsedItem.length; i++) {
                                        value = parsedItem[i];
                                        const k = String(i);
                                        if (!data.hasOwnProperty(k)) {
                                            data[k] = value;
                                        }
                                    }
                                } else {
                                    // Merge objects
                                    for (key in parsedItem) {
                                        value = parsedItem[key];
                                        if (!data.hasOwnProperty(key)) {
                                            data[key] = value;
                                        }
                                    }
                                }
                            }

                        } else {
                            // If the value associated with the key is a single mapping node, each of its key/value pairs is inserted into the
                            // current mapping, unless the key already exists in it.
                            for (key in parsed) {
                                value = parsed[key];
                                if (!data.hasOwnProperty(key)) {
                                    data[key] = value;
                                }
                            }
                        }
                    }

                } else if ((values.value != null) && (matches = this.PATTERN_ANCHOR_VALUE.exec(values.value))) {
                    isRef = matches.ref;
                    values.value = matches.value;
                }


                if (mergeNode); else if ((values.value == null) || ('' === Utils.trim(values.value, ' ')) || (Utils.ltrim(values.value, ' ').indexOf('#') === 0)) {
                    // Hash
                    // if next line is less indented or equal, then it means that the current value is null
                    if (!(this.isNextLineIndented()) && !(this.isNextLineUnIndentedCollection())) {
                        // Spec: Keys MUST be unique; first one wins.
                        // But overwriting is allowed when a merge node is used in current block.
                        if (allowOverwrite || (data[key] === undefined)) {
                            data[key] = null;
                        }

                    } else {
                        c = this.getRealCurrentLineNb() + 1;
                        parser = new Parser(c);
                        parser.refs = this.refs;
                        val = parser.parse(this.getNextEmbedBlock(), exceptionOnInvalidType, objectDecoder);

                        // Spec: Keys MUST be unique; first one wins.
                        // But overwriting is allowed when a merge node is used in current block.
                        if (allowOverwrite || (data[key] === undefined)) {
                            data[key] = val;
                        }
                    }

                } else {
                    val = this.parseValue(values.value, exceptionOnInvalidType, objectDecoder);

                    // Spec: Keys MUST be unique; first one wins.
                    // But overwriting is allowed when a merge node is used in current block.
                    if (allowOverwrite || (data[key] === undefined)) {
                        data[key] = val;
                    }
                }

            } else {
                // 1-liner optionally followed by newline
                var needle;
                const lineCount = this.lines.length;
                if ((1 === lineCount) || ((2 === lineCount) && Utils.isEmpty(this.lines[1]))) {
                    try {
                        value = Inline.parse(this.lines[0], exceptionOnInvalidType, objectDecoder);
                    } catch (error1) {
                        e = error1;
                        e.parsedLine = this.getRealCurrentLineNb() + 1;
                        e.snippet = this.currentLine;

                        throw e;
                    }

                    if (typeof value === 'object') {
                        var first;
                        if (value instanceof Array) {
                            first = value[0];
                        } else {
                            for (key in value) {
                                first = value[key];
                                break;
                            }
                        }

                        if ((typeof first === 'string') && (first.indexOf('*') === 0)) {
                            data = [];
                            for (let alias of Array.from(value)) {
                                data.push(this.refs[alias.slice(1)]);
                            }
                            value = data;
                        }
                    }

                    return value;

                } else if ((needle = Utils.ltrim(value).charAt(0), ['[', '{'].includes(needle))) {
                    try {
                        return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
                    } catch (error2) {
                        e = error2;
                        e.parsedLine = this.getRealCurrentLineNb() + 1;
                        e.snippet = this.currentLine;

                        throw e;
                    }
                }

                throw new ParseException('Unable to parse.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }

            if (isRef) {
                if (data instanceof Array) {
                    this.refs[isRef] = data[data.length - 1];
                } else {
                    let lastKey = null;
                    for (key in data) {
                        lastKey = key;
                    }
                    this.refs[isRef] = data[lastKey];
                }
            }
        }


        if (Utils.isEmpty(data)) {
            return null;
        } else {
            return data;
        }
    }



    // Returns the current line number (takes the offset into account).
    //
    // @return [Integer]     The current line number
    //
    getRealCurrentLineNb() {
        return this.currentLineNb + this.offset;
    }


    // Returns the current line indentation.
    //
    // @return [Integer]     The current line indentation
    //
    getCurrentLineIndentation() {
        return this.currentLine.length - Utils.ltrim(this.currentLine, ' ').length;
    }


    // Returns the next embed block of YAML.
    //
    // @param [Integer]          indentation The indent level at which the block is to be read, or null for default
    //
    // @return [String]          A YAML string
    //
    // @throw [ParseException]   When indentation problem are detected
    //
    getNextEmbedBlock(indentation = null, includeUnindentedCollection) {
        let isItUnindentedCollection, newIndent;
        if (includeUnindentedCollection == null) { includeUnindentedCollection = false; }
        this.moveToNextLine();

        if ((indentation == null)) {
            newIndent = this.getCurrentLineIndentation();

            const unindentedEmbedBlock = this.isStringUnIndentedCollectionItem(this.currentLine);

            if (!(this.isCurrentLineEmpty()) && (0 === newIndent) && !(unindentedEmbedBlock)) {
                throw new ParseException('Indentation problem.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }

        } else {
            newIndent = indentation;
        }


        const data = [this.currentLine.slice(newIndent)];

        if (!includeUnindentedCollection) {
            isItUnindentedCollection = this.isStringUnIndentedCollectionItem(this.currentLine);
        }

        // Comments must not be removed inside a string block (ie. after a line ending with "|")
        // They must not be removed inside a sub-embedded block as well
        const removeCommentsPattern = this.PATTERN_FOLDED_SCALAR_END;
        let removeComments = !removeCommentsPattern.test(this.currentLine);

        while (this.moveToNextLine()) {
            const indent = this.getCurrentLineIndentation();

            if (indent === newIndent) {
                removeComments = !removeCommentsPattern.test(this.currentLine);
            }

            if (removeComments && this.isCurrentLineComment()) {
                continue;
            }

            if (this.isCurrentLineBlank()) {
                data.push(this.currentLine.slice(newIndent));
                continue;
            }

            if (isItUnindentedCollection && !this.isStringUnIndentedCollectionItem(this.currentLine) && (indent === newIndent)) {
                this.moveToPreviousLine();
                break;
            }

            if (indent >= newIndent) {
                data.push(this.currentLine.slice(newIndent));
            } else if (Utils.ltrim(this.currentLine).charAt(0) === '#'); else if (0 === indent) {
                this.moveToPreviousLine();
                break;
            } else {
                throw new ParseException('Indentation problem.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }
        }


        return data.join("\n");
    }


    // Moves the parser to the next line.
    //
    // @return [Boolean]
    //
    moveToNextLine() {
        if (this.currentLineNb >= (this.lines.length - 1)) {
            return false;
        }

        this.currentLine = this.lines[++this.currentLineNb];

        return true;
    }


    // Moves the parser to the previous line.
    //
    moveToPreviousLine() {
        this.currentLine = this.lines[--this.currentLineNb];
    }


    // Parses a YAML value.
    //
    // @param [String]   value                   A YAML value
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object] A JavaScript value
    //
    // @throw [ParseException] When reference does not exist
    //
    parseValue(value, exceptionOnInvalidType, objectDecoder) {
        let matches, needle;
        if (0 === value.indexOf('*')) {
            const pos = value.indexOf('#');
            if (pos !== -1) {
                value = value.substr(1, pos - 2);
            } else {
                value = value.slice(1);
            }

            if (this.refs[value] === undefined) {
                throw new ParseException(`Reference "${value}" does not exist.`, this.currentLine);
            }

            return this.refs[value];
        }


        if (matches = this.PATTERN_FOLDED_SCALAR_ALL.exec(value)) {
            const modifiers = matches.modifiers != null ? matches.modifiers : '';

            let foldedIndent = Math.abs(parseInt(modifiers));
            if (isNaN(foldedIndent)) { foldedIndent = 0; }
            const val = this.parseFoldedScalar(matches.separator, this.PATTERN_DECIMAL.replace(modifiers, ''), foldedIndent);
            if (matches.type != null) {
                // Force correct settings
                Inline.configure(exceptionOnInvalidType, objectDecoder);
                return Inline.parseScalar(matches.type + ' ' + val);
            } else {
                return val;
            }
        }

        // Value can be multiline compact sequence or mapping or string
        if ((needle = value.charAt(0), ['[', '{', '"', "'"].includes(needle))) {
            while (true) {
                try {
                    return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
                } catch (e) {
                    if (e instanceof ParseMore && this.moveToNextLine()) {
                        value += `\n${Utils.trim(this.currentLine, ' ')}`;
                    } else {
                        e.parsedLine = this.getRealCurrentLineNb() + 1;
                        e.snippet = this.currentLine;
                        throw e;
                    }
                }
            }
        } else {
            if (this.isNextLineIndented()) {
                value += `\n${this.getNextEmbedBlock()}`;
            }
            return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
        }

    }


    // Parses a folded scalar.
    //
    // @param [String]       separator   The separator that was used to begin this folded scalar (| or >)
    // @param [String]       indicator   The indicator that was used to begin this folded scalar (+ or -)
    // @param [Integer]      indentation The indentation that was used to begin this folded scalar
    //
    // @return [String]      The text value
    //
    parseFoldedScalar(separator, indicator, indentation) {
        let matches;
        if (indicator == null) { indicator = ''; }
        if (indentation == null) { indentation = 0; }
        let notEOF = this.moveToNextLine();
        if (!notEOF) {
            return '';
        }

        let isCurrentLineBlank = this.isCurrentLineBlank();
        let text = '';

        // Leading blank lines are consumed before determining indentation
        while (notEOF && isCurrentLineBlank) {
            // newline only if not EOF
            if (notEOF = this.moveToNextLine()) {
                text += "\n";
                isCurrentLineBlank = this.isCurrentLineBlank();
            }
        }


        // Determine indentation if not specified
        if (0 === indentation) {
            if (matches = this.PATTERN_INDENT_SPACES.exec(this.currentLine)) {
                indentation = matches[0].length;
            }
        }


        if (indentation > 0) {
            let pattern = this.PATTERN_FOLDED_SCALAR_BY_INDENTATION[indentation];
            if (pattern == null) {
                pattern = new Pattern(`^ {${indentation}}(.*)$`);
                Parser.prototype.PATTERN_FOLDED_SCALAR_BY_INDENTATION[indentation] = pattern;
            }

            while (notEOF && (isCurrentLineBlank || (matches = pattern.exec(this.currentLine)))) {
                if (isCurrentLineBlank) {
                    text += this.currentLine.slice(indentation);
                } else {
                    text += matches[1];
                }

                // newline only if not EOF
                if (notEOF = this.moveToNextLine()) {
                    text += "\n";
                    isCurrentLineBlank = this.isCurrentLineBlank();
                }
            }

        } else if (notEOF) {
            text += "\n";
        }


        if (notEOF) {
            this.moveToPreviousLine();
        }


        // Remove line breaks of each lines except the empty and more indented ones
        if ('>' === separator) {
            let newText = '';
            for (let line of Array.from(text.split("\n"))) {
                if ((line.length === 0) || (line.charAt(0) === ' ')) {
                    newText = Utils.rtrim(newText, ' ') + line + "\n";
                } else {
                    newText += line + ' ';
                }
            }
            text = newText;
        }

        if ('+' !== indicator) {
            // Remove any extra space or new line as we are adding them after
            text = Utils.rtrim(text);
        }

        // Deal with trailing newlines as indicated
        if ('' === indicator) {
            text = this.PATTERN_TRAILING_LINES.replace(text, "\n");
        } else if ('-' === indicator) {
            text = this.PATTERN_TRAILING_LINES.replace(text, '');
        }

        return text;
    }


    // Returns true if the next line is indented.
    //
    // @return [Boolean]     Returns true if the next line is indented, false otherwise
    //
    isNextLineIndented(ignoreComments) {
        if (ignoreComments == null) { ignoreComments = true; }
        const currentIndentation = this.getCurrentLineIndentation();
        let EOF = !this.moveToNextLine();

        if (ignoreComments) {
            while (!(EOF) && this.isCurrentLineEmpty()) {
                EOF = !this.moveToNextLine();
            }
        } else {
            while (!(EOF) && this.isCurrentLineBlank()) {
                EOF = !this.moveToNextLine();
            }
        }

        if (EOF) {
            return false;
        }

        let ret = false;
        if (this.getCurrentLineIndentation() > currentIndentation) {
            ret = true;
        }

        this.moveToPreviousLine();

        return ret;
    }


    // Returns true if the current line is blank or if it is a comment line.
    //
    // @return [Boolean]     Returns true if the current line is empty or if it is a comment line, false otherwise
    //
    isCurrentLineEmpty() {
        const trimmedLine = Utils.trim(this.currentLine, ' ');
        return (trimmedLine.length === 0) || (trimmedLine.charAt(0) === '#');
    }


    // Returns true if the current line is blank.
    //
    // @return [Boolean]     Returns true if the current line is blank, false otherwise
    //
    isCurrentLineBlank() {
        return '' === Utils.trim(this.currentLine, ' ');
    }


    // Returns true if the current line is a comment line.
    //
    // @return [Boolean]     Returns true if the current line is a comment line, false otherwise
    //
    isCurrentLineComment() {
        // Checking explicitly the first char of the trim is faster than loops or strpos
        const ltrimmedLine = Utils.ltrim(this.currentLine, ' ');

        return ltrimmedLine.charAt(0) === '#';
    }


    // Cleanups a YAML string to be parsed.
    //
    // @param [String]   value The input YAML string
    //
    // @return [String]  A cleaned up YAML string
    //
    cleanup(value) {
        let line, trimmedValue;
        if (value.indexOf("\r") !== -1) {
            value = value.split("\r\n").join("\n").split("\r").join("\n");
        }

        // Strip YAML header
        let count = 0;
        [value, count] = Array.from(this.PATTERN_YAML_HEADER.replaceAll(value, ''));
        this.offset += count;

        // Remove leading comments
        [trimmedValue, count] = Array.from(this.PATTERN_LEADING_COMMENTS.replaceAll(value, '', 1));
        if (count === 1) {
            // Items have been removed, update the offset
            this.offset += Utils.subStrCount(value, "\n") - Utils.subStrCount(trimmedValue, "\n");
            value = trimmedValue;
        }

        // Remove start of the document marker (---)
        [trimmedValue, count] = Array.from(this.PATTERN_DOCUMENT_MARKER_START.replaceAll(value, '', 1));
        if (count === 1) {
            // Items have been removed, update the offset
            this.offset += Utils.subStrCount(value, "\n") - Utils.subStrCount(trimmedValue, "\n");
            value = trimmedValue;

            // Remove end of the document marker (...)
            value = this.PATTERN_DOCUMENT_MARKER_END.replace(value, '');
        }

        // Ensure the block is not indented
        const lines = value.split("\n");
        let smallestIndent = -1;
        for (line of Array.from(lines)) {
            if (Utils.trim(line, ' ').length === 0) { continue; }
            const indent = line.length - Utils.ltrim(line).length;
            if ((smallestIndent === -1) || (indent < smallestIndent)) {
                smallestIndent = indent;
            }
        }
        if (smallestIndent > 0) {
            for (let i = 0; i < lines.length; i++) {
                line = lines[i];
                lines[i] = line.slice(smallestIndent);
            }
            value = lines.join("\n");
        }

        return value;
    }


    // Returns true if the next line starts unindented collection
    //
    // @return [Boolean]     Returns true if the next line starts unindented collection, false otherwise
    //
    isNextLineUnIndentedCollection(currentIndentation = null) {
        if (currentIndentation == null) { currentIndentation = this.getCurrentLineIndentation(); }
        let notEOF = this.moveToNextLine();

        while (notEOF && this.isCurrentLineEmpty()) {
            notEOF = this.moveToNextLine();
        }

        if (false === notEOF) {
            return false;
        }

        let ret = false;
        if ((this.getCurrentLineIndentation() === currentIndentation) && this.isStringUnIndentedCollectionItem(this.currentLine)) {
            ret = true;
        }

        this.moveToPreviousLine();

        return ret;
    }


    // Returns true if the string is un-indented collection item
    //
    // @return [Boolean]     Returns true if the string is un-indented collection item, false otherwise
    //
    isStringUnIndentedCollectionItem() {
        return (this.currentLine === '-') || (this.currentLine.slice(0, 2) === '- ');
    }
}
Parser.initClass();



// Dumper dumps JavaScript variables to YAML strings.
//
class Dumper {
    static initClass() {

        // The amount of spaces to use for indentation of nested nodes.
        this.indentation = 4;
    }


    // Dumps a JavaScript value to YAML.
    //
    // @param [Object]   input                   The JavaScript value
    // @param [Integer]  inline                  The level where you switch to inline YAML
    // @param [Integer]  indent                  The level of indentation (used internally)
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectEncoder           A function to serialize custom objects, null otherwise
    //
    // @return [String]  The YAML representation of the JavaScript value
    //
    dump(input, inline, indent, exceptionOnInvalidType, objectEncoder = null) {
        if (inline == null) { inline = 0; }
        if (indent == null) { indent = 0; }
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        let output = '';

        if (typeof (input) === 'function') {
            return output;
        }

        const prefix = (indent ? Utils.strRepeat(' ', indent) : '');

        if ((inline <= 0) || (typeof (input) !== 'object') || input instanceof Date || Utils.isEmpty(input)) {
            output += prefix + Inline.dump(input, exceptionOnInvalidType, objectEncoder);

        } else {
            let value, willBeInlined;
            if (input instanceof Array) {
                for (value of Array.from(input)) {
                    willBeInlined = (((inline - 1) <= 0) || (typeof (value) !== 'object') || Utils.isEmpty(value));

                    output +=
                        prefix +
                        '- ' +
                        this.dump(value, inline - 1, (willBeInlined ? 0 : indent + this.indentation), exceptionOnInvalidType, objectEncoder) +
                        (willBeInlined ? "\n" : '');
                }

            } else {
                for (let key in input) {
                    value = input[key];
                    willBeInlined = (((inline - 1) <= 0) || (typeof (value) !== 'object') || Utils.isEmpty(value));

                    output +=
                        prefix +
                        Inline.dump(key, exceptionOnInvalidType, objectEncoder) + ':' +
                        (willBeInlined ? ' ' : "\n") +
                        this.dump(value, inline - 1, (willBeInlined ? 0 : indent + this.indentation), exceptionOnInvalidType, objectEncoder) +
                        (willBeInlined ? "\n" : '');
                }
            }
        }

        return output;
    }
}
Dumper.initClass();



// Yaml offers convenience methods to load and dump YAML.
//
class Yaml {

    // Parses YAML into a JavaScript object.
    //
    // The parse method, when supplied with a YAML string,
    // will do its best to convert YAML in a file into a JavaScript object.
    //
    //  Usage:
    //     myObject = Yaml.parse('some: yaml');
    //     console.log(myObject);
    //
    // @param [String]   input                   A string containing YAML
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types, false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object]  The YAML converted to a JavaScript object
    //
    // @throw [ParseException] If the YAML is not valid
    //
    static parse(input, exceptionOnInvalidType, objectDecoder = null) {
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        return new Parser().parse(input, exceptionOnInvalidType, objectDecoder);
    }


    // Parses YAML from file path into a JavaScript object.
    //
    // The parseFile method, when supplied with a YAML file,
    // will do its best to convert YAML in a file into a JavaScript object.
    //
    //  Usage:
    //     myObject = Yaml.parseFile('config.yml');
    //     console.log(myObject);
    //
    // @param [String]   path                    A file path pointing to a valid YAML file
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types, false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object]  The YAML converted to a JavaScript object or null if the file doesn't exist.
    //
    // @throw [ParseException] If the YAML is not valid
    //
    static parseFile(path, callback = null, exceptionOnInvalidType, objectDecoder = null) {
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        if (callback != null) {
            // Async
            return Utils.getStringFromFile(path, input => {
                let result = null;
                if (input != null) {
                    result = this.parse(input, exceptionOnInvalidType, objectDecoder);
                }
                callback(result);
            });
        } else {
            // Sync
            const input = Utils.getStringFromFile(path);
            if (input != null) {
                return this.parse(input, exceptionOnInvalidType, objectDecoder);
            }
            return null;
        }
    }


    // Dumps a JavaScript object to a YAML string.
    //
    // The dump method, when supplied with an object, will do its best
    // to convert the object into friendly YAML.
    //
    // @param [Object]   input                   JavaScript object
    // @param [Integer]  inline                  The level where you switch to inline YAML
    // @param [Integer]  indent                  The amount of spaces to use for indentation of nested nodes.
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectEncoder           A function to serialize custom objects, null otherwise
    //
    // @return [String]  A YAML string representing the original JavaScript object
    //
    static dump(input, inline, indent, exceptionOnInvalidType, objectEncoder = null) {
        if (inline == null) { inline = 2; }
        if (indent == null) { indent = 4; }
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        const yaml = new Dumper();
        yaml.indentation = indent;

        return yaml.dump(input, inline, 0, exceptionOnInvalidType, objectEncoder);
    }


    // Alias of dump() method for compatibility reasons.
    //
    static stringify(input, inline, indent, exceptionOnInvalidType, objectEncoder) {
        return this.dump(input, inline, indent, exceptionOnInvalidType, objectEncoder);
    }


    // Alias of parseFile() method for compatibility reasons.
    //
    static load(path, callback, exceptionOnInvalidType, objectDecoder) {
        return this.parseFile(path, callback, exceptionOnInvalidType, objectDecoder);
    }
}

export default Yaml;

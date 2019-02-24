export class StringUtilities {
    static format(template, ...values) {
        return template.replace(/%s/g, function () {
            return values.shift();
        });
    }
    static containsAny(text, searchStrings) {
        return searchStrings.some(c => {
            return text.indexOf(c) > -1;
        });
    }
}

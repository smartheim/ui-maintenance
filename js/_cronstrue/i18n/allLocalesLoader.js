import * as allLocales from "./allLocales";
export class allLocalesLoader {
    load(availableLocales) {
        for (var property in allLocales) {
            if (allLocales.hasOwnProperty(property)) {
                availableLocales[property] = new allLocales[property]();
            }
        }
    }
}

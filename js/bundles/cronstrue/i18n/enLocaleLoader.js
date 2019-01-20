import { en } from "./locales/en";
export class enLocaleLoader {
    load(availableLocales) {
        availableLocales["en"] = new en();
    }
}

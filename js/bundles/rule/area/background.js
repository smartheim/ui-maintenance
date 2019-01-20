export class Background {
    constructor(editor) {
        const el = document.createElement('div');
        el.appendChild(document.createTextNode(' '));
        el.classList += `rete-background default`;
        editor.view.area.appendChild(el);
    }
}
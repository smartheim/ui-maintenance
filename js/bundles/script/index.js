/**
 * Embeds the VS code editor.
 * TODO: yaml/toml plugin e.g. https://github.com/pengx17/monaco-yaml for a textual
 * representation of Things, Items and Rules.
 */

import { fetchWithTimeout } from '../../common/fetch'

function importer(url) {
    return new Promise((resolve, reject) => {
        let script = document.createElement('script');
        script.type = 'text/javascript';
        script.src = url;
        script.id = url.replace("/", "_").replace(".", "_");
        script.addEventListener('load', () => resolve(script), false);
        script.addEventListener('error', () => reject(script), false);
        document.body.appendChild(script);
    });
};

class VSEditor {
    constructor() {
        this.monocoloaded = false;
        this.resizeTimer = null;
        this.loadscriptEventFunc = null;
    }

    startEditor(el) {
        this.monocoloaded = true;
        el.innerHTML = "";
        const editor = monaco.editor.create(el, {
            value: [
                'function x() {',
                '\tconsole.log("Hello world!");',
                '}'
            ].join('\n'),
            language: 'javascript'
        });
        const fn = editor.layout.bind(editor);
        let offset = { width: el.offsetWidth, height: el.offsetHeight }
        if (this.resizeTimer) clearInterval(this.resizeTimer);
        this.resizeTimer = setInterval(() => {
            let newOffset = { width: el.offsetWidth, height: el.offsetHeight }
            if (offset.height != newOffset.height || offset.width != newOffset.width) {
                offset = newOffset
                fn()
            }
        }, 2000);
    
        if (this.loadscriptEventFunc) document.removeEventListener("loadscript", this.loadscriptEventFunc);
        this.loadscriptEventFunc = (e) => {
            fetchWithTimeout(e.detail.filename).then(response => response.text())
                .then(res => editor.setModel(monaco.editor.createModel(res, 'javascript')))
                .catch(error => console.warn(error, e));
        }
        document.addEventListener("loadscript", this.loadscriptEventFunc);
    }

    start() {
        const el = document.getElementById('editorwindow');
        if (!el) return;
        console.log("start editor");
    
        if (!this.monocoloaded) {
            importer("vs/loader.js")
                .then(() => importer("vs/editor/editor.main.nls.js"))
                .then(() => importer("vs/editor/editor.main.js"))
                .then(() => this.startEditor(el));
        } else {
            this.startEditor(el);
        }
    }
}

window.require = { paths: { 'vs': './vs' } };

const vseditor = new VSEditor();

document.addEventListener("DOMContentLoaded", () => vseditor.start());
if (['interactive', 'complete'].includes(document.readyState)) vseditor.start();

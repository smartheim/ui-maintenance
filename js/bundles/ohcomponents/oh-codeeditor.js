/**
 * Embeds the VS code editor.
 * TODO: yaml/toml plugin e.g. https://github.com/pengx17/monaco-yaml for a textual
 * representation of Things, Items and Rules.
 */

import { fetchWithTimeout } from '../../common/fetch'

/**
 * A VS-Code base editor component. 
 * The VS-Code editor is unfortunately not packed as ES6 module.
 * The requirejs loader is used within this component to load 
 * the editor on-demand.
 * 
 * Properties:
 * - scriptfile: A URL to show in the editor
 * - content: A content object: {value:"text",language:"javascript|yaml",modeluri:"optional_schema_uri"}
 * - modelschema: A model schema object
 */
class OhCodeEditor extends HTMLElement {
    constructor() {
        super();
        this.resizeTimer = null;
        //this.attachShadow({ mode: 'open' });
    }

    set scriptfile(filename) {
        fetchWithTimeout(filename).then(response => response.text())
            .then(res => {
                this.content = {value:res,language:"javascript"};
            })
            .catch(error => console.warn(error, e));
    }

    get scriptfile() {
        return "";
    }

    set content(data) {
        if (this.editor) {
            this.editor.setModel(null);
            if (this.model) this.model.dispose();
            this.model = this.monaco.editor.createModel(data.value, data.language, data.modeluri);
            this.editor.setModel(this.model);
            if (data.language=="yaml") this.loadYamlHighlightSupport();
            delete this.cached;
        }
        else
            this.cached = data;
    }

    get content() {
        return "";
    }

    get modelschema() {
        return this._modelschema;
    }

    set modelschema(val) {
        this._modelschema = val;
        this.updateSchema();
    }

    updateSchema() {
        if (!this._modelschema || !this.monaco || !this.monaco.languages.yaml) return;
        this.monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
            enableSchemaRequest: false,
            validate: true,
            schemas: [
                this._modelschema
            ],
        });
    }

    loadRequireJS() {
        if (window.require) return Promise.resolve("");
        const url = "vs/loader.js";
        return new Promise((resolve, reject) => {
            let script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = url;
            script.id = url.replace("/", "_").replace(".", "_");
            script.addEventListener('load', () => resolve(script), false);
            script.addEventListener('error', () => reject(script), false);
            this.appendChild(script);
        }).then(() => {
            window.require = require;
            window.define = define;
            if (!window.define) {
                console.error("Failed to make the vs loader globally available");
            }
            require.config = { paths: { 'vs': '.', baseUrl: '.' } };
        });
    }

    loadYamlHighlightSupport() {
        if (this.yamlquickopen) return Promise.resolve("");
        return new Promise((resolve, reject) => {
            require(['vs/editor/contrib/quickOpen/quickOpen'], async quickOpen => {
                const NEVER_CANCEL_TOKEN = {
                    isCancellationRequested: false,
                    onCancellationRequested: () => Event.NONE,
                };

                let oldDecorations = [];

                async function _getSymbolForPosition(model, position) {
                    const symbols = await quickOpen.getDocumentSymbols(
                        model,
                        false,
                        NEVER_CANCEL_TOKEN
                    );

                    function _recur(symbol) {
                        let target = symbol;
                        if (symbol && symbol.children && symbol.children.length) {
                            target =
                                _recur(
                                    symbol.children.find(child =>
                                        child.range.containsPosition(position)
                                    )
                                ) || symbol;
                        }

                        return target;
                    }

                    return _recur({ children: symbols });
                }

                this.editor.onDidChangeCursorSelection(async ({ selection }) => {
                    const model = this.editor.getModel();
                    const position = selection.getPosition();
                    const symbol = await _getSymbolForPosition(model, position);

                    console.log(`${symbol.name}: ${symbol.range}`);
                    if (symbol && symbol.range) {
                        const decoration = {
                            range: symbol.range,
                            options: {
                                isWholeLine: false,
                                className: 'x-highlight-range',
                            },
                        };

                        oldDecorations = this.editor.deltaDecorations(
                            oldDecorations,
                            decoration ? [decoration] : []
                        );
                    }
                });
                resolve();
            })
        });
    }

    loadYamlSupport() {
        if (this.monaco.languages.yaml) {
            return Promise.resolve("");
        }
        return new Promise((resolve, reject) => {
            require([
                'vs/language/yaml/monaco.contribution',
            ], () => {
                this.updateSchema();
                resolve();
            })
        });
    }

    loadMonaco() {
        if (window.monaco) {
            this.monaco = window.monaco;
            return Promise.resolve("");
        }
        return new Promise((resolve, reject) => {
            require(['./vs/editor/editor.main'], () => {
                window.monaco = monaco;
                this.monaco = monaco;
                resolve();
            });
        });
    }

    connectedCallback() {
        while (this.firstChild) { this.firstChild.remove(); }
        this.innerHTML = "<div>Loading editor &hellip;<br>This can take some seconds</div>"
        if (this.hasAttribute("scriptfile")) this.scriptfile = this.getAttribute("scriptfile");
        this.loadRequireJS()
            .then(() => this.loadMonaco())
            .then(() => this.loadYamlSupport())
            .then(() => this.updateSchema())
            .then(() => this.startEditor());
    }

    disconnectedCallback() {
        if (this.resizeTimer) clearInterval(this.resizeTimer);
        delete this.resizeTimer;
        if (this.model) this.model.dispose();
        delete this.model;
        if (this.editor) this.editor.dispose();
        delete this.editor;
    }

    startEditor() {
        const el = this;
        if (this.model) this.model.dispose();
        this.model = this.monaco.editor.createModel("", "javascript");
        while (this.firstChild) { this.firstChild.remove(); }
        this.editor = this.monaco.editor.create(el, this.model);
        let offset = { width: el.offsetWidth, height: el.offsetHeight - 50 }
        this.editor.layout(offset);
        if (this.resizeTimer) clearInterval(this.resizeTimer);
        this.resizeTimer = setInterval(() => {
            let newOffset = { width: el.offsetWidth, height: el.offsetHeight - 50 }
            if (offset.height != newOffset.height || offset.width != newOffset.width) {
                offset = newOffset;
                this.editor.layout(offset);
            }
        }, 2000);

        if (this.cached) {
            this.content = this.cached;
        }
        return Promise.resolve("");
    }
}

window.MonacoEnvironment = {
    baseUrl: '.',
    getWorkerUrl: function (moduleId, label) {
        if (label === 'json') {
            return './vs/language/json/jsonWorker.js';
        }
        if (label === 'css') {
            return './vs/language/css/cssWorker.js';
        }
        if (label === 'html') {
            return './vs/language/html/htmlWorker.js';
        }
        if (label === 'typescript' || label === 'javascript') {
            return './vs/language/typescript/tsWorker.js';
        }
        return './vs/base/worker/workerMain.js';
    }
}

customElements.define('oh-codeeditor', OhCodeEditor);

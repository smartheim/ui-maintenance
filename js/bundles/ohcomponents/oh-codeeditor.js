/**
 * Embeds the VS code editor. There are some workarounds in place,
 * because the monaco editor is a no ES6-module RequireJS package.
 * 
 * That hopefully changes in the future. (Microsoft is working on it)
 */
import { fetchWithTimeout } from '../../common/fetch'
import Yaml from './yaml/yaml';

const NEVER_CANCEL_TOKEN = {
  isCancellationRequested: false,
  onCancellationRequested: () => Event.NONE,
};

/**
 * A VS-Code base editor component. 
 * 
 * Properties:
 * - scriptfile: A URL to show in the editor
 * - content: A content object: {value:"text",language:"javascript|yaml",modeluri:"optional_schema_uri"}
 * - modelschema: A model schema object
 * - haschanges: A boolean that is true if the editor content has been altered
 * 
 * Events:
 * - "state": Emited as soon as the editor content has been altered
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
        this.content = { value: res, language: "javascript" };
      })
      .catch(error => console.warn(error, e));
  }

  get scriptfile() {
    return "";
  }

  set haschanges(val) {
    if (this._haschanges == val) return;
    this._haschanges = val;
    if (!val) {
      this.removeAttribute("haschanges");
    } else {
      this.setAttribute("haschanges", "true");
      this.dispatchEvent(new Event("state"));
    }
  }

  get haschanges() {
    return this._haschanges;
  }

  /**
   * The editor content. You can always access the original content via `originalcontent`.
   * If you set data.language to "yaml", the json content will be converted internally for presentation.
   */
  set content(data) {
    if (!data) {
      return;
    }

    if (this.editor) {
      this.haschanges = false;
      this.editor.setModel(null);
      if (this.model) this.model.dispose();
      this._originalcontent = data.value;
      const editorContent = data.language == "yaml" ? Yaml.dump(data.value, 10, 4).replace(/-     /g, "-\n    ") : data.value;
      this.model = this.monaco.editor.createModel(editorContent, data.language, data.modeluri);
      this.model.onDidChangeContent(() => this.haschanges = true);
      this.editor.setModel(this.model);
      if (data.language == "yaml") this.loadYamlHighlightSupport();
      this.updateSchema();
      delete this.cached;
    }
    else
      this.cached = data;
  }

  get content() {
    if (this.model) {
      const datavalue = this.model.getValue();
      if (this.model.getModeId() == "yaml") return Yaml.parse(datavalue);
      return datavalue;
    }
    return null;
  }

  /**
   * Return the unmodifed content that was set by `content = "value"`.
   */
  get originalcontent() {
    return this._originalcontent;
  }

  showConfirmDialog(callbackID, okBtn = null, cancelBtn = null, text = "Read-only mode. Storing data &hellip;") {
    this.overlayWidget.callbackID = callbackID;
    this.overlayWidget.btnConfirmNode.style.display = okBtn ? "block" : "none";
    this.overlayWidget.btnConfirmNode.innerHTML = okBtn;
    this.overlayWidget.btnCancelNode.style.display = cancelBtn ? "block" : "none";
    this.overlayWidget.btnCancelNode.innerHTML = cancelBtn;
    this.overlayWidget.textNode.innerHTML = text;
    this.readonly = true;
  }

  confirmDialog(result) {
    this.dispatchEvent(new CustomEvent("confirmed", { detail: { result, dialogid: this.overlayWidget.callbackID } }));
    if (!result) this.readonly = false;
  }

  /**
   * Show an overlay with the text that was set in `showConfirmDialog`.
   */
  set readonly(val) {
    if (this._readonly == val) return;
    this._readonly = val;
    if (this.editor) {
      this.editor.updateOptions({ readOnly: val })
      if (val) {
        this.editor.addOverlayWidget(this.overlayWidget);
      } else {
        this.editor.removeOverlayWidget(this.overlayWidget);
      }
    }
  }

  updateSchema() {
    if (!this.modelschema || !this.monaco || !this.monaco.languages.yaml) return;
    this.monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
      enableSchemaRequest: false,
      validate: true,
      schemas: [
        this.modelschema
      ],
    });
    if (this.yamlCompletionProvider) {
      this.yamlCompletionProvider.dispose();
      delete this.yamlCompletionProvider;
    }
    this.yamlCompletionProvider = this.monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: ["-"],
      provideCompletionItems: async (model, position, context, token) => {
        const symbols = await this.getSymbolsForPosition(position);
        let suggestions = [];
        if (this.completionHelper) {
          // Must return "label","documentation","insertText"
          let prefilledArray = await this.completionHelper(symbols, context.triggerCharacter);
          for (let prefilled of prefilledArray) {
            prefilled.kind = monaco.languages.CompletionItemKind.Snippet;
            prefilled.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            suggestions.push(prefilled);
          }
        }
        return { suggestions: suggestions };
      }
    });
  }

  setCompletionHelper(helper) {
    this.completionHelper = helper;
  }

  loadRequireJS() {
    if (window.require) return Promise.resolve("");
    const url = "vs/loader.js";
    return new Promise((resolve, reject) => {
      let script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      script.id = url.replace("/", "_").replace(".", "_");
      script.addEventListener('load', () => resolve(script), { passive: true });
      script.addEventListener('error', () => reject(script), { passive: true });
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

  async getSymbolsForPosition(position) {
    if (!this.quickOpen) return null;
    let symbols = await this.quickOpen.getDocumentSymbols(
      this.model,
      true,
      NEVER_CANCEL_TOKEN
    );

    symbols = symbols.filter(symbol =>
      symbol.range.containsPosition(position)
    );
    if (symbols.length) {
      // this.model.getLineContent()
      let uidLine = null;
      for (let i = symbols[0].range.startLineNumber; i < symbols[0].range.endLineNumber; ++i) {
        let t = this.model.getLineContent(i);
        t = t.match(" thingTypeUID: [']+(.*)[']+");
        if (t && t.length > 0) {
          uidLine = t[1];
          break;
        }
      }
      if (!uidLine) return null;
      symbols[0] = { name: uidLine };
    }
    symbols = symbols.map(symbol => {
      const makeNumber = parseInt(symbol.name);
      if (makeNumber) return makeNumber;
      return symbol.name;
    });

    return symbols;
  }

  async cursorChangeListener(selection) {
    const position = selection.getPosition();
    let symbols = await this.getSymbolsForPosition(position);
    if (symbols && symbols.length) {
      this.dispatchEvent(new CustomEvent("selected", { detail: symbols }));
    }
  }

  loadYamlHighlightSupport() {
    if (this.yamlquickopen) return Promise.resolve("");
    return new Promise((resolve, reject) => {
      require(['vs/editor/contrib/quickOpen/quickOpen'], async quickOpen => {
        this.quickOpen = quickOpen;
        this.editor.onDidChangeCursorSelection(event => this.cursorChangeListener(event.selection));
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

    const that = this;
    this.overlayWidget = {
      domNode: null,
      textNode: null,
      btnConfirmNode: null,
      btnCancelNode: null,
      getId: function () {
        return 'my.overlay.widget';
      },
      getDomNode: function () {
        if (!this.domNode) {
          this.textNode = document.createElement('div');
          this.textNode.innerHTML = '&hellip;';
          this.btnConfirmNode = document.createElement('button');
          this.btnConfirmNode.classList.add("btn", "btn-success", "text-center");
          this.btnConfirmNode.innerHTML = "";
          this.btnConfirmNode.style["margin-right"] = "10px";
          this.btnConfirmNode.addEventListener("click", () => that.confirmDialog(true), { passive: true });
          this.btnCancelNode = document.createElement('button');
          this.btnCancelNode.classList.add("btn", "btn-secondary", "text-center");
          this.btnCancelNode.innerHTML = "";
          this.btnCancelNode.addEventListener("click", () => that.confirmDialog(false), { passive: true });
          this.domNode = document.createElement('div');
          this.domNode.appendChild(this.textNode);
          let btnContainer = this.domNode.appendChild(document.createElement('div'));
          btnContainer.style.display = "flex";
          btnContainer.appendChild(this.btnConfirmNode);
          btnContainer.appendChild(this.btnCancelNode);
          this.domNode.classList.add("editoroverlay");
        }
        return this.domNode;
      },
      getPosition: function () {
        return null;
      }
    };

    this.innerHTML = "<div>Loading editor &hellip;<br>This can take some seconds</div>"
    if (this.hasAttribute("scriptfile")) this.scriptfile = this.getAttribute("scriptfile");
    this.loadRequireJS()
      .then(() => this.loadMonaco())
      .then(() => this.loadYamlSupport())
      .then(() => this.updateSchema())
      .then(() => this.startEditor());
  }

  disconnectedCallback() {
    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound, { passive: true });
    if (this.debounceResizeTimer) clearInterval(this.debounceResizeTimer);
    delete this.debounceResizeTimer;

    if (this.model) this.model.dispose();
    delete this.model;
    if (this.editor) this.editor.dispose();
    delete this.editor;
  }

  startEditor() {
    const el = this;
    this.monaco.editor.setTheme(localStorage.getItem("darktheme") == "true" ? "vs-dark" : "vs");
    while (this.firstChild) { this.firstChild.remove(); }
    this.editor = this.monaco.editor.create(el);
    this.offset = { width: el.offsetWidth, height: el.offsetHeight - 50 }
    this.editor.layout(this.offset);

    // Resizing
    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound, { passive: true });
    this.resizeBound = () => {
      if (this.debounceResizeTimer) {
        clearTimeout(this.debounceResizeTimer);
        delete this.debounceResizeTimer;
      }
      this.debounceResizeTimer = setTimeout(() => {
        let newOffset = { width: el.offsetWidth, height: el.offsetHeight - 50 }
        if (this.offset.height != newOffset.height || this.offset.width != newOffset.width) {
          this.offset = newOffset;
          this.editor.layout(this.offset);
        }
      }, 500);
    }
    window.addEventListener('resize', this.resizeBound, { passive: true });

    if (this.cached) {
      this.content = this.cached;
    } else {
      this.content = { value: "", language: "javascript", modeluri: null };
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

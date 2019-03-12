/**
 * Embeds the VS code editor. There are some workarounds in place,
 * because the monaco editor is a no ES6-module RequireJS package.
 * 
 * That hopefully changes in the future. (Microsoft is working on it)
 */
import { fetchWithTimeout } from '../_common/fetch'
import Yaml from '../_yaml';

const NEVER_CANCEL_TOKEN = {
  isCancellationRequested: false,
  onCancellationRequested: () => Event.NONE,
};

/**
* @category Web Components
* @customelement ui-codeeditor
* @description A VS-Code based editor component. (Project "monaco").
*
* Events:
* - "state": Emited as soon as the editor content has been altered
 * 
 * @property {String} scriptfile A URL to show in the editor
 * @property {Object} content A content object: {value:"text",language:"javascript|yaml",modeluri:"optional_schema_uri"}
 * @property {Object} modelschema A model schema object
 * @property {Boolean} haschanges A boolean that is true if the editor content has been altered
 * @example <caption>Code editor example</caption>
 * <ui-codeeditor></ui-codeeditor>
 */
class OhCodeEditor extends HTMLElement {
  constructor() {
    super();
    this.themechangeBound = () => this.updateTheme();
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
      // Dispose old
      delete this.cached;
      this.haschanges = false;
      this.editor.setModel(null);
      if (this.model) this.model.dispose();

      // Create new model
      this._originalcontent = data.value;
      const editorContent = data.language == "yaml" ? Yaml.dump(data.value, 10, 4).replace(/-     /g, "-\n    ") : data.value;
      this.model = this.monaco.editor.createModel(editorContent, data.language, data.modeluri);
      this.model.onDidChangeContent(() => {
        this.haschanges = true;
        this.undoRedoUpdateAfterModelChange();
      });
      this.editor.setModel(this.model);
      // Load language extensions and schemas
      if (data.language == "yaml") this.loadYamlHighlightSupport();
      this.updateSchema();
      // Undo/Redo
      this.initialVersion = this.model.getAlternativeVersionId();
      this.currentVersion = this.initialVersion;
      this.lastVersion = this.initialVersion;
      this.dispatchEvent(new CustomEvent("redoavailable", { detail: false }));
      this.dispatchEvent(new CustomEvent("undoavailable", { detail: false }));

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

  addAtCursorPosition(additionalText) {
    if (!this.model) return;
    const line = this.editor.getPosition();
    const range = new this.monaco.Range(line.lineNumber, 1, line.lineNumber, 1);
    this.editor.executeEdits("my-source", [{ identifier: { major: 1, minor: 1 }, range: range, text: additionalText, forceMoveMarkers: true }]);
    this.editor.pushUndoStop();
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
            if (data.language == "yaml") {
              // Convert to yaml
              prefilled.insertText = Yaml.dump([prefilled.insertText], 10, 4).replace(/-     /g, "-\n    ");
              if (context.triggerCharacter) prefilled.insertText = prefilled.insertText.replace("-", "");
            }
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

  undoRedoUpdateAfterModelChange() {
    const versionId = this.editor.getModel().getAlternativeVersionId();
    // undoing
    if (versionId < this.currentVersion) {
      this.dispatchEvent(new CustomEvent("redoavailable", { detail: true }));
      // no more undo possible
      if (versionId === this.initialVersion) {
        this.dispatchEvent(new CustomEvent("undoavailable", { detail: false }));
      }
    } else {
      // redoing
      if (versionId <= this.lastVersion) {
        // redoing the last change
        if (versionId == this.lastVersion) {
          this.dispatchEvent(new CustomEvent("redoavailable", { detail: false }));
        }
      } else { // adding new change, disable redo when adding new changes
        this.dispatchEvent(new CustomEvent("redoavailable", { detail: false }));
        if (this.currentVersion > this.lastVersion) {
          this.lastVersion = this.currentVersion;
        }
      }
      this.dispatchEvent(new CustomEvent("undoavailable", { detail: true }));
    }
    this.currentVersion = versionId;
  }

  undo() {
    this.editor.trigger('aaaa', 'undo', 'aaaa');
    this.editor.focus();
  }

  redo() {
    this.editor.trigger('aaaa', 'redo', 'aaaa');
    this.editor.focus();
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
    if (this.hasAttribute("themechangeevent")) {
      document.addEventListener(this.getAttribute("themechangeevent"), this.themechangeBound, { passive: true });
    }

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
    if (this.hasAttribute("themechangeevent")) {
      document.removeEventListener(this.getAttribute("themechangeevent"), this.themechangeBound, { passive: true });
    }
    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound, { passive: true });
    if (this.debounceResizeTimer) clearInterval(this.debounceResizeTimer);
    delete this.debounceResizeTimer;

    if (this.model) this.model.dispose();
    delete this.model;
    if (this.editor) this.editor.dispose();
    delete this.editor;
  }

  updateTheme() {
    this.monaco.editor.setTheme(localStorage.getItem("darktheme") == "true" ? "vs-dark" : "vs");
  }

  startEditor() {
    const el = this;
    while (this.firstChild) { this.firstChild.remove(); }
    this.editor = this.monaco.editor.create(el);
    this.offset = { width: el.offsetWidth, height: el.offsetHeight - 50 }
    this.editor.layout(this.offset);
    this.updateTheme();

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

customElements.define('ui-codeeditor', OhCodeEditor);

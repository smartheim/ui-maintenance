import { createNotification } from './app.js'; // Pre-bundled, external reference

import { NodeEditor } from "../_rete";

import VueRenderPlugin from './renderer/index';
import ConnectionPlugin from './connection/index';

import { LayoutManager } from './layoutmanager';

import { ImportExport } from './importexport';
import { OHRuleComponent } from './components/ohrule'
import { OHCaptionComponent } from './components/caption';

/**
 * @category Web Components
 * @customelement oh-rule-editor
 * 
 * @description A rule editor component
 * @example <caption>An example</caption>
 * <oh-rule-editor></oh-rule-editor>
 */
class OhRuleEditor extends HTMLElement {
  constructor() {
    super();
    this._moduletypes = [];
  }

  set moduletypes(val) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      delete this.debounceTimer;
      this._moduletypes = val;
      if (this.editor) this.buildComponents();
    }, 50);
  }

  set rule(val) {
    this._rule = val;
    this.checkIfModuleTypesAndRule();
  }

  checkIfModuleTypesAndRule() {
    if (this.editor && this.componentsBuild) {
      if (this._rule) {
        console.log("IMPORT NOW", this.editor.isSilent());
        this.importExport.fromJSON(this._rule, true)
          .catch(e => {
            createNotification(null, `Rule import failed: ${this._rule.name}. ${e.toString()}`, true, 1500);
          })
      }
    }
  }

  buildComponents() {
    if (!this._moduletypes.length) return;
    for (const moduletype of this._moduletypes) {
      this.editor.register(new OHRuleComponent(moduletype));
    }
    this.componentsBuild = true;
    this.checkIfModuleTypesAndRule();
  }

  connectedCallback() {
    const editor = new NodeEditor('openhabrule@1.0.0', this);
    editor.use(ConnectionPlugin, { curvature: 0.4 });
    editor.use(VueRenderPlugin);

    editor.register(new OHCaptionComponent("trigger", "When &hellip;"));
    editor.register(new OHCaptionComponent("condition", "But only if &hellip;"));
    editor.register(new OHCaptionComponent("action", "Then &hellip;"));

    this.layoutManager = new LayoutManager(editor, { size: 32 });
    this.importExport = new ImportExport(editor, this.areaManager);

    editor.on('connectioncreated connectionremoved nodecreated noderemoved nodetranslated', (m) => {
      if (editor.isSilent()) return;
      this.dispatchEvent(new Event("input"));
    });

    editor.on('connectioncreate', ({ output, input }) => {
      const indexOut = editor.nodes.findIndex(e => e == output.node);
      const indexIn = editor.nodes.findIndex(e => e == input.node);
      console.log(indexIn, indexOut);
      if (indexIn == -1 || indexOut == -1) return true;
      return (indexIn > indexOut && !(output.node.data.type === "action" && input.node.data.type !== "action"));
    });

    editor.on("showeditor", (obj) => {
      this.dispatchEvent(new CustomEvent("showeditor", { detail: { ...obj } }));
    });

    this.boundDragover = e => this.dragover(e);
    this.boundDrop = e => this.drop(e);
    this.boundDragEnter = e => this.dragEnter(e);
    this.boundDragExit = e => this.dragExit(e);
    this.addEventListener("dragenter", this.boundDragEnter, true);
    this.addEventListener("dragleave", this.boundDragExit, true);
    this.addEventListener("dragover", this.boundDragover, true);
    this.addEventListener("drop", this.boundDrop, true);

    this.editor = editor;
    if (!this.componentsBuild) this.buildComponents();
  }

  disconnectedCallback() {
    if (this.layoutManager) this.layoutManager.dispose();
    if (!this.editor) return;
    this.editor.dispose();
    delete this.editor;
  }

  getRuleJson() {
    return this.importExport.toJSON();
  }

  dragEnter(event) {
    event.target.classList.add("haschanges");
  }

  dragExit(event) {
    event.target.classList.remove("haschanges");
  }

  dragover(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy"
  }

  async add(componentType) {
    const component = this.editor.getComponent(componentType);
    if (!component) {
      createNotification(null, `Component ${data} not known`, false, 1500);
      return;
    }
    this.editor.addNode(await component.createNode({}));
  }

  drop(event) {
    event.preventDefault();
    event.target.classList.remove("haschanges");
    const data = event.dataTransfer.getData("oh/rulecomponent");
    if (!data) return;
    this.add(data);
  }
}

customElements.define('oh-rule-editor', OhRuleEditor);

/**
 * Rule module
 * 
 * This module is used on the Rule editing page and embeds Rete.js for rendering.
 * 
 * @category Rules
 * @module rule
 */
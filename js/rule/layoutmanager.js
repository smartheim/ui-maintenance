import { NodeEditor } from "../_rete";

const captionHeight = 32;
const captionMargin = 16;
const nodeGap = 64;

/**
 * Responsible for importing OH rule json objects and exporting those objects.
 * 
 * @param {NodeEditor} editor The rete editor
 * @param {Object} Settings The settings
 * @param {Number} Settings.size The grid pattern size
 * @category Rules
 * @memberof module:rule
 */
class LayoutManager {
  constructor(editor, { size = 16 }) {
    this.editor = editor;
    this.size = size;
    this.actionY = 0;

    //  editor.on('nodetranslate', this._onTranslate.bind(this))
    editor.on('nodecreated', this._onNodeCreated.bind(this));
    editor.on('noderemoved', this._onNodeRemoved.bind(this));
    editor.on('noderemove', this._onNodeRemove.bind(this));
    editor.on('afterImport', this.relayout.bind(this));
    editor.on('nodetranslated', this.fullrelayout.bind(this));
    // editor.on('cleared', async () => await this.initEditor());

    this.initEditor();
  }

  dispose() {
    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound, { passive: true });
    if (this.debounceResizeTimer) clearInterval(this.debounceResizeTimer);
    delete this.debounceResizeTimer;
    this.editor.view.container.removeEventListener("dragover", this.boundDragover, true);
    this.editor.view.container.removeEventListener("drop", this.boundDrop, true);
  }

  /**
   * Creates the inital text nodes (labels) to show the user where the triggers, conditions and actions go.
   */
  async initEditor() {
    this.nodes = { trigger: [], condition: [], action: [] };
    this.editor.beforeImport(null, false);
    this.triggerCaption = this.editor.addNode(await this.editor.getComponent("trigger").createNode());
    this.conditionCaption = this.editor.addNode(await this.editor.getComponent("condition").createNode());
    this.actionCaption = this.editor.addNode(await this.editor.getComponent("action").createNode());
    this.editor.afterImport();

    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound, { passive: true });
    this.resizeBound = () => {
      if (this.debounceResizeTimer) {
        clearTimeout(this.debounceResizeTimer);
        delete this.debounceResizeTimer;
      }
      this.debounceResizeTimer = setTimeout(() => {
        let newOffset = { width: this.editor.view.container.offsetWidth, height: this.editor.view.container.offsetHeight - 50 }
        if (this.offset.height != newOffset.height || this.offset.width != newOffset.width) {
          this.relayout();
        }
      }, 500);
    }
    window.addEventListener('resize', this.resizeBound, { passive: true });
  }

  _onTranslate(data) {
    return false;
    // let { x, y, node } = data;
    // if (node.data.fixed) return false;
    // if (["trigger", "condition"].includes(node.data.type)) return false;

    // if (x < nodeGap) x = nodeGap;
    // if (y < this.actionY) y = this.actionY;

    // data.x = this._snap(x);
    // data.y = this._snap(y);
  }

  _snap(value) {
    return Math.round(value / this.size) * this.size;
  }

  _onNodeCreated(node) {
    if (node.data.type) this.nodes[node.data.type].push(node);
    if (!this.editor.silent) this.relayout();
  }

  _onNodeRemove(node) {
    if (node == this.triggerCaption.node ||
      node == this.conditionCaption.node ||
      node == this.actionCaption.node) return false;
    return true;
  }

  _onNodeRemoved(node) {
    if (!node.data.type) return;
    this.nodes[node.data.type] = this.nodes[node.data.type].filter(e => e !== node);
    if (!this.editor.silent) this.relayout();
  }

  _normalizeRow(nodeViews, mRowHeight) {
    if (nodeViews.length < 2) return;
    for (let nodeView of nodeViews) nodeView.el.style.minHeight = mRowHeight + "px";
  }

  _layoutNodes(nodes, pos, xStart, editorwidth) {
    let { x, y } = pos;
    let i = 0;
    let nodesInRow = [];
    let mRowHeight = 0;

    for (let item of nodes) {
      const nodeView = this.editor.view.nodes.get(item);
      const r = nodeView.el.getBoundingClientRect();

      if (x + nodeGap + r.width > editorwidth) {
        this._normalizeRow(nodesInRow, mRowHeight);
        x = xStart;
        y += mRowHeight + nodeGap;
        nodesInRow = [];
        mRowHeight = 0;
      }

      item.position = [x, y];
      nodeView.el.style.minHeight = "";
      item.vueContext.isfirst = i == 0;
      item.vueContext.islast = i == nodes.length - 1;
      nodeView.update();
      nodesInRow.push(nodeView);
      x += Math.round(r.width) + nodeGap;
      mRowHeight = Math.max(mRowHeight, r.height);
      ++i;
    }
    y += mRowHeight;
    this._normalizeRow(nodesInRow, mRowHeight);
    return { x, y };
  }

  _widthBiggerThen(nodes, remainingWidth, xStart) {
    let w = xStart;
    for (let item of nodes) {
      const nodeView = this.editor.view.nodes.get(item);
      const r = nodeView.el.getBoundingClientRect();
      w += r.width + nodeGap;
      if (w > remainingWidth) return true;
    }
    return false;
  }

  fullrelayout() {
    this.nodes = {};
    for (let node of this.editor.nodes) this.nodes[node.data.type].push(node);
    this.relayout();
  }

  relayout() {
    // Triggers first
    const editorwidth = this.editor.view.container.getBoundingClientRect().width;
    this.triggerCaption.node.position = [0, 0];
    this.triggerCaption.update();
    let pos = { x: nodeGap, y: captionHeight + captionMargin };
    pos = this._layoutNodes(this.nodes.trigger, pos, nodeGap, editorwidth);

    // Conditions either in the same row or starting in a separate one
    if (this._widthBiggerThen(this.nodes.condition, editorwidth - pos.x, nodeGap)) { // Separate row
      pos.x = nodeGap;
      this.conditionCaption.node.position = [0, pos.y + captionMargin];
      this.conditionCaption.update();
      pos.y += captionHeight + captionMargin * 2;
      pos = this._layoutNodes(this.nodes.condition, pos, nodeGap, editorwidth);
    } else { // Same row
      this.conditionCaption.node.position = [pos.x, 0];
      this.conditionCaption.update();
      pos.x += nodeGap;
      // For rendering the actions after the conditions and triggers, we need to remember the
      // y coordinate after the trigger components, reset Y and render conditions and then take
      // the maximum y of both parts.
      let triggersY = pos.y;
      pos.y = captionHeight + captionMargin;
      pos = this._layoutNodes(this.nodes.condition, pos, nodeGap, editorwidth);
      pos.y = Math.max(triggersY, pos.y);
    }

    pos.x = nodeGap;
    this.actionCaption.node.position = [0, pos.y + captionMargin];
    this.actionCaption.update();
    pos.y += captionHeight + captionMargin * 2;
    this.actionY = pos.y;
    pos = this._layoutNodes(this.nodes.action, pos, nodeGap, editorwidth);

    const view = this.editor.view;
    const rectContainer = view.container.getBoundingClientRect();
    view.area.el.style.width = (rectContainer.width - 50) + 'px';
    view.area.el.style.height = pos.y + 'px';

    this.offset = { width: view.container.offsetWidth, height: view.container.offsetHeight - 50 };

    for (let [conn, connV] of this.editor.view.connections) {
      connV.update();
    }
  }

  showDropzone(moduletype) {

  }

  removeDrop() {

  }
}

export { LayoutManager };
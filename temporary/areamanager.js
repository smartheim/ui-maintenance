import { NodeEditor } from "../_rete";

/**
 * Acts on area interaction like zooming and panning. Restricts those interactions
 * to certain limits.
 * 
 * @param {NodeEditor} editor The rete editor
 * @category Rules
 * @memberof module:rule
 */
class AreaManager {
  constructor(editor, scaleExtent = { min: 1, max: 1 }, translateExtent = { width: 5000, height: 4000 }) {
    this.editor = editor;
    this.scaleExtent = scaleExtent;
    this.translateExtent = translateExtent;

    editor.on('zoom', this.restrictZoom.bind(this));
    editor.on('translate', this.restrictTranslate.bind(this));
    editor.on('nodetranslated', this.updateAreaSize.bind(this))
    this.current = { x: 0, y: 0 };
  }

  /**
   * Updates the area dimensions, by computing the bounding box for all nodes.
   * 
   * Need to be called after a new node has been added.
   * Is called automatically when a node has been moved.
   */
  updateAreaSize() {
    const view = this.editor.view;
    let width = 0;
    let height = 0;
    const rectContainer = view.container.getBoundingClientRect();
    for (let node of this.editor.nodes) {
      const rect = node.vueContext.$el.getBoundingClientRect();
      const right = rect.left + rect.width;
      if (right > width) width = right;
      const bottom = rect.top + rect.height;
      if (bottom > height) height = bottom;
    }
    width = (width - rectContainer.left);
    height = (height - rectContainer.top);

    view.area.el.style.width = width + 'px';
    view.area.el.style.height = height + 'px';

    this.translateExtent = { width: Math.max(this.current.x, width) - 50, height: Math.max(this.current.y, height) - 50 };
  }


  restrictZoom(data) {
    const se = this.scaleExtent;
    const tr = data.transform;

    if (se.min == se.max) return false;

    if (data.zoom < se.min)
      data.zoom = se.min;
    else if (data.zoom > se.max)
      data.zoom = se.max;
  }

  restrictTranslate(data) {
    return false;
    const [kw, kh] = [this.translateExtent.width, this.translateExtent.height];

    if (data.x > 0) data.x = 0;
    else if (data.x < -kw) data.x = -kw;
    if (data.y > 0) data.y = 0;
    else if (data.y < -kh) data.y = -kh;

    this.current = { x: data.x, y: data.y };
  }
}

export { AreaManager };
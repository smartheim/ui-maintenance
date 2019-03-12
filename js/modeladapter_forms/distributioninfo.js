import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = null;
    this.runtimeKeys = [];
    this.value = {};
  }
  stores() { return { "about": "value" } };
  get(table = null, objectid = null, options = null) {
    return store.get("about", null, options)
      .then(v => this.value = Array.isArray(v) ? v[0] : {})
      .catch(e => { this.value = null; throw (e) });
  }
  dispose() {
  }
}

const AboutMixin = {
}

const mixins = [AboutMixin];

export { mixins, ModelAdapter };

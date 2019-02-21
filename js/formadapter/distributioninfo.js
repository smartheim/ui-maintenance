import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = null;
    this.runtimeKeys = [];
    this.value = [];
  }
  stores() { return { "about": "value" } };
  get(id, options = null) {
    return store.get("about", null, options)
      .then(v => this.value = Array.isArray(v) ? v[0] : {});
  }
  dispose() {
  }
}

const AboutMixin = {
}

const mixins = [AboutMixin];

export { mixins, ModelAdapter };

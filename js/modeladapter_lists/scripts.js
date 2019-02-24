import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("filename");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "scripts": "items" } };
  getall(options = null) {
    return this.get(options);
  }
  get(options = null) {
    return store.get("scripts", null, options).then(items => this.items = items);
  }
  dispose() {
  }
}

const mixins = [];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

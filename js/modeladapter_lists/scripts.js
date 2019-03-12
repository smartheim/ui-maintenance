import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("filename");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "scripts": "items" } };
  getall(options = null) {
    return this.get(null, null, options);
  }
  async get(table = null, objectid = null, options = null) {
    this.items = await store.get("scripts", null, options);
  }
  dispose() {
  }
}

const mixins = [];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

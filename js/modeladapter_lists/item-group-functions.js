import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "item-group-function-types": "items" } };
  getall(options = null) {
    return this.get(null, null, options);
  }
  async get(table = null, objectid = null, options = null) {
    this.items = await store.get("item-group-function-types", null, options);
  }
  dispose() {
  }
}

const mixins = [];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

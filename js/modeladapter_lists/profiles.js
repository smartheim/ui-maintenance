import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("UID");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "profile-types": "items" } };
  getall(options = null) {
    return this.get(options);
  }
  get(options = null) {
    return store.get("profile-types", null, options).then(items => this.items = items);
  }
  dispose() {
  }
}

const mixins = [];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

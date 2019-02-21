import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("uid");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "ruletemplates": "items" } };
  getall(options = null) {
    return this.get(options);
  }
  get(options = null) {
    return store.get("ruletemplates", null, options).then(items => this.items = items);
  }
  dispose() {
  }
}

const mixins = [];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

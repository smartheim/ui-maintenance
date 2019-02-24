import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("name");
    this.runtimeKeys = ["link", "editable", "state"];
    this.items = [];
  }
  stores() { return { "items": "items" } };
  sortStore() { return "items" };
  getall(options = null) {
    return this.get(options);
  }
  get(options = null) {
    return store.get("items", null, options).then(items => this.items = items);
  }
  dispose() {
  }
}

const ItemsMixin = {
  computed: {
    isGroup: function () {
      return this.item.type == "Group";
    },
    iconpath: function () {
      if (this.item.category) {
        return store.host + "/icon/" + this.item.category;
      }
      return null;
    }
  },
}

const mixins = [ItemsMixin];
const listmixins = [];
export { mixins, listmixins, ModelAdapter };

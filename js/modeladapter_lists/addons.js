import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "extensions": "items" } };
  getall(options = null) {
    return this.get(null, null, options);
  }
  async get(table = null, objectid = null, options = null) {
    this.items = await store.get("extensions", null, options);
  }
  dispose() {
  }
}

const AddonsMixin = {
  methods: {
    install: function () {
      this.message = null;
      this.messagetitle = "Installing...";
      this.inProgress = true;
    },
    changeVersion: function () {
      this.message = null;
      this.messagetitle = "Changing version";
      this.inProgress = true;
    },
    remove: function () {
      this.message = null;
      this.messagetitle = "Removing...";
      this.inProgress = true;
    },
  }
}

const mixins = [AddonsMixin];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

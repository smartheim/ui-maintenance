import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "extension-repositories": "items" } };
  getall(options = null) {
    return this.get(null, null, options);
  }
  async get(table = null, objectid = null, options = null) {
    this.items = await store.get("extension-repositories", null, options);
  }
  dispose() {
  }
}

const AddonsFileMixin = {
  methods: {
    enable: function () {
      this.message = null;
      this.messagetitle = "Enable...";
      this.inProgress = true;
    },
    disable: function () {
      this.message = null;
      this.messagetitle = "Disable...";
      this.inProgress = true;
    },
  }
};


const mixins = [AddonsFileMixin];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

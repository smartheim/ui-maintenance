import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "manualextensions": "items" } };
  getall(options = null) {
    return this.get(null, null, options);
  }
  async get(table = null, objectid = null, options = null) {
    this.items = store.get("manualextensions", null, options);
  }
  dispose() {
  }
}

const AddonsFileMixin = {
  methods: {
    getInstallDate: function () {
      return new Date(this.item.installed).toDateString();
    },
    remove: function () {
      this.message = null;
      this.messagetitle = "Removing...";
      this.inProgress = true;
    },
  }
};

const mixins = [AddonsFileMixin];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

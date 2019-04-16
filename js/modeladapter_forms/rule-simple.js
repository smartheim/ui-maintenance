import { store, createNotification, fetchMethodWithTimeout } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("uid");
    this.runtimeKeys = []; this.value = {};
  }
  stores() { return { "rules": "value" } };
  async get(table = null, objectid = null, options = null) {
    this.value = await store.get("rules", objectid, options);
  }
  dispose() {
  }
}

const ItemMixin = {
  computed: {
    uniqueid() {
      return this.value.uid;
    }
  },
  methods: {
    copyClipboard(event, itemid) {
      if (!itemid) return;
      const range = document.createRange();
      range.selectNode(event.target);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("copy");
      createNotification("clipboard", `Copied ${itemid} to clipboard`, false, 3000);
    },
    commontags: function () {
      return ["Switchable", "Lighting", "ColorLighting"];
    },
    save() {
      this.changed = false;
      fetchMethodWithTimeout(store.host + "/rest/rules/" + this.valuecopy.uid, "PUT", JSON.stringify(this.valuecopy))
        .then(r => {
          createNotification(null, `Saved ${this.valuecopy.name}`, false, 3000);
          document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: false }));
        }).catch(e => {
          this.changed = true;
          createNotification(null, `Failed to save ${this.valuecopy.name}: ${e}`, true, 3000);
        });
    }
  }
};

const mixins = [ItemMixin];

export { mixins, ModelAdapter };

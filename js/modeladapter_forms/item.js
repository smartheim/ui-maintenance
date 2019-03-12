import { store, createNotification, fetchMethodWithTimeout } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("name");
    this.runtimeKeys = []; this.value = {};
  }
  stores() { return { "items": "value" } };
  async get(table = null, objectid = null, options = null) {
    this.value = await store.get("items", objectid, options);
  }
  dispose() {
  }
}

const ItemMixin = {
  computed: {
    uniqueid() {
      return this.value.name;
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
      fetchMethodWithTimeout(store.host + "/rest/items/" + this.valuecopy.name, "PUT", JSON.stringify(this.valuecopy))
        .then(r => {
          createNotification(null, `Saved ${this.valuecopy.label}`, false, 3000);
          document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: false }))
        }).catch(e => {
          this.changed = true;
          createNotification(null, `Failed to save ${this.valuecopy.label}: ${e}`, true, 3000);
        })
    }
  }
}

const mixins = [ItemMixin];

export { mixins, ModelAdapter };

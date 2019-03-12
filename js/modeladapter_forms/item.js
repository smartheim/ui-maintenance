import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
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
  }
}

const mixins = [ItemMixin];

export { mixins, ModelAdapter };

import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "bindings": "items" } };
  getall(options = null) {
    return this.get(null, null, options);
  }
  async get(table = null, objectid = null, options = null) {
    this.items = await store.get("bindings", null, options);
  }
  dispose() {
  }
}

const BindingsMixin = {
  mounted: function () {
    // Small hack for custom pages. We need a hidden link that we can programatically click
    this.link = document.createElement("a");
    this.link.style.display = "none";
    this.$el.appendChild(this.link);
  },
  methods: {
    showAuxiliary: function (event) {
      let title = this.getAuxiliaries()[event.detail];
      this.link.href = "binding_custompage.html?title=" + title + "&customurl=" + encodeURIComponent(event.detail);
      this.link.dispatchEvent(new MouseEvent('click', { // programatically click link now
        view: window,
        bubbles: true,
        cancelable: true
      }));
    },
    hasCustomPages: function () {
      return this.item.custompages && this.item.custompages.length > 0;
    },
    remove: function () {
      this.message = null;
      this.messagetitle = "Removing...";
      this.inProgress = true;
    },
  },
  computed: {
    documentationlink: function () {
      const source = this.item.source;
      source = source.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("tree/master", "master");
      return source + '/README.md';
    },
    bugreportlink: function () {
      const githuburl = "https://github.com/openhab/openhab2-addons/issues/new";
      return githuburl + '?title=[' + this.item.id + '][' + this.item.version + '] Your-title';
    }
  }
}



const mixins = [BindingsMixin];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

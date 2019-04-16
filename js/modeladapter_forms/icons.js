import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = null;
    this.runtimeKeys = [];
    this.value = [];
  }
  stores() { return { "icon-set": "itemCategories" } };
  async get(table = null, objectid = null, options = null) {
    this.value = await store.get("icon-set", null, options);
  }
  dispose() {
  }
}

const Mixin = {
  data: function () {
    return {
      category: "",
      context: {}
    }
  },
  watch: {
    // Whenever the icon dialog is opened, the context is set at the same time
    context: function () {
      this.category = this.context.category || "";
    }
  },
  computed: {
    notready: function () {
      return !(this.category.trim().length > 0);
    }
  },
  methods: {
    iconpath: function (iconname) {
      if (store.host != "demo" && iconname) {
        return store.host + "/icon/" + iconname;
      } else {
        return "./img/scene_dummy.jpg";
      }
    },
    applyIcon(event) {
      this.$set(this.context, 'category', this.category);
      this.context = {};
    },
    notifyClose() {
      this.context = {};
    }
  }
};

const mixins = [Mixin];

export { mixins, ModelAdapter };

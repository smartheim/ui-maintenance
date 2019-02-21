import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("uid");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "module-types": "items" } };
  getall(options = null) {
    return this.get(options);
  }
  get(options = null) {
    return store.get("module-types", null, options).then(items => this.items = items);
  }
  dispose() {
  }
}


const ModulesMixin = {
  computed: {
    isTrigger: function () {
      return this.item.type == "trigger";
    },
    isCondition: function () {
      return this.item.type == "condition";
    },
    isAction: function () {
      return this.item.type == "action";
    },
  },
  methods: {
    dragstart: function (event) {
      event.dataTransfer.setData("oh/rulecomponent", event.target.dataset.uid);
      event.dataTransfer.dropEffect = "copy";
    }
  }
}

const mixins = [ModulesMixin];
const listmixins = [];

export { mixins, listmixins, ModelAdapter };

import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("thingUID");
    this.runtimeKeys = [];
    this.value = [];
  }
  stores() { return { "inbox": "value" } };
  get(id, options = null) {
    return store.get("inbox", null, options)
      .then(v => this.value = v);
  }
  dispose() {
  }
}

const InboxCounterMixin = {
  computed: {
    inboxcounter: function () {
      return this.value.filter(v => v.flag == "NEW").length;
    }
  }
}

const mixins = [InboxCounterMixin];

export { mixins, ModelAdapter };

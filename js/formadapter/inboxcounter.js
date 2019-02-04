import { store } from '../app.js';

const ID_KEY = "id";

class StoreView {
  constructor() { this.value = []; }
  stores() { return { "inbox": "value" } };
  async get() {
    return store.get("rest/inbox", "inbox")
      .then(v => this.value = v);
  }
  dispose() {
  }
}

const InboxCounterMixin = {
  mounted: function () {
    console.log("InboxCounterMixin started");
  },
  computed: {
    inboxcounter: function () {
      return this.value.length;
    }
  }
}

const mixins = [InboxCounterMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView, ID_KEY };

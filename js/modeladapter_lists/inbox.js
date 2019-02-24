import { store, createNotification, fetchMethodWithTimeout } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("thingUID");
    this.runtimeKeys = []; this.items = [];
  }
  stores() { return { "inbox": "items" } };
  getall(options = null) {
    return store.get("thing-types", null, { force: true })
      .then(json => this.thingtypes = json)
      .then(() => store.get("bindings", null, { force: true }))
      .then(json => this.bindings = json)
      .then(() => this.get(options));
  }
  get(options = null) {
    return store.get("inbox", null, options).then(items => this.items = items);
  }
  getThingTypeFor(uid) {
    for (const type of this.thingtypes) {
      if (type.UID == uid)
        return type;
    }
    return null;
  }
  getBindingFor(bindingid) {
    for (const binding of this.bindings) {
      if (binding.id == bindingid)
        return binding;
    }
  }
  dispose() {
  }
}

const InboxMixin = {
  methods: {
    binding() {
      const bindingid = this.item.thingTypeUID.split(":")[0];
      const bindings = this.$root.store.getBindingFor(bindingid);
      if (bindings) return bindings.name;
      return "Binding not found";
    },
    description() {
      const type = this.$root.store.getThingTypeFor(this.item.thingTypeUID);
      if (type) return type.description;
      return "No Thing description available";
    },
    hide() {
      this.message = null;
      this.messagetitle = "Hiding...";
      this.inProgress = true;
      fetchMethodWithTimeout(store.host + "/rest/inbox/" + this.item.thingUID + "/ignore", "POST", null)
        .then(r => {
          this.message = "Thing '" + this.item.label + "' ignore";
          this.inProgress = false;
        }).catch(e => {
          this.message = e.toString();
        })
    },
    accept() {
      this.message = null;
      this.messagetitle = "Accepting...";
      this.inProgress = true;
      fetchMethodWithTimeout(store.host + "/rest/inbox/" + this.item.thingUID + "/approve", "POST", null)
        .then(r => {
          this.message = "Thing '" + this.item.label + "' approved";
          this.inProgress = false;
        }).catch(e => {
          this.message = e.toString();
        })
    }
  }
}

const InboxListMixin = {
  methods: {
    clear() {
      createNotification(null, `Inbox Clear: openHAB does not support this yet`, false, 2000);
    },
  }
}

const mixins = [InboxMixin];
const listmixins = [InboxListMixin];
export { mixins, listmixins, ModelAdapter };

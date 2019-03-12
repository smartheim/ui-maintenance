import { store } from '../app.js'; // Pre-bundled, external reference

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("UID");
    this.runtimeKeys = []; this.value = {};
    this.items = []; this.thingtype = null;
    this.bindingid = null;
    this.channeltypes = {};
  }
  stores() { return { "things": "value" } };
  async getall(options = null, objectid) {
    const value = await store.get("things", objectid, options);
    this.thingtype = await store.get("thing-types-extended", value.thingTypeUID, { force: true });
    this.thingTypeChannelGroups = this.thingtype.channelGroups ? this.thingtype.channelGroups.reduce((a, cgroup) => (a.set(cgroup.id, cgroup), a), new Map) : null;
    this.extensibleChannelTypeIdSet = new Set(this.thingtype.extensibleChannelTypeIds);
    this.channeltypes = await await store.get("channel-types", null, { force: true, asmap: true });
    await this.get(null, objectid, options);
    this.bindingid = value.UID ? value.UID.split(":")[0] : null;
    this.value = value;
  }
  async get(table = null, objectid = null, options = null) {
    if (!objectid) return;

    const ngChannelGroups = await store.get("virtual-thing-channels", null, { force: true, thingUID: objectid, asmap: "group" });
    for (let [groupid, channels] of Object.entries(ngChannelGroups)) {
      const annotations = this.thingTypeChannelGroups.get(groupid);
      if (!annotations) continue;
      channels.label = annotations.label;
      channels.description = annotations.description;
    }
    this.items = ngChannelGroups;
  }
  dispose() {
  }
}

const ThingChannelMixin = {
  methods: {
    remove() {
      console.log("REMOVE CHANNEL", this.item);
      this.$list.value.channels = this.$list.value.channels.filter(c => c.id != this.item.id);
    },
    configurationParameters() {
      const type = this.$list.store.channeltypes[this.item.channelTypeUID];
      if (type) return type.parameters;
      return null;
    },
    getConfigValue(param) {
      return this.item.configuration[param.name];
    },
    setConfigValue(param, value) {
      if (!this.item.configuration) this.$set(this.item, "configuration", {});
      this.$set(this.item.configuration, param.name, value);
    },
    removeConfigValue(param) {
      this.item.configuration[param.name] = null;
      delete this.item.configuration[param.name];
    },
    channelDescription() {
      const type = this.$list.store.channeltypes[this.item.channelTypeUID];
      if (type) return type.description;
      return "No Channel description available";
    },
    technical() {
      return {
        "UID": this.item.uid,
        "Channel Type": this.item.channelTypeUID,
        "Item Type": this.item.itemType,
        "Kind": this.item.kind,
        "Item Tags": this.item.defaultTags.join(", "),
      };
    }
  },
  watch: {
    changed(val) {
      if (val) this.$list.changed = true;
    }
  }
}


const ItemListMixin = {
  data: () => {
    return {
      changed: false,
      newchannel: { channelTypeUID: null, label: "" }
    }
  },
  computed: {
    statusInfo() {
      return this.value.statusInfo.status.toLowerCase().replace(/^\w/, c => c.toUpperCase()) + " - " + this.value.statusInfo.statusDetail;
    },
    statusBadge() {
      switch (this.value.statusInfo.status) {
        case "ONLINE": return "badge badge-success";
        case "OFFLINE": return "badge badge-danger";
        case "UNINITIALIZED": return "badge badge-info";
      }
      return "badge badge-light";
    },
    isEnabled() {
      return this.value.statusInfo.statusDetail !== "DISABLED";
    },
    hasDescription() {
      const type = this.thingtype;
      return type && type.description || false;
    },
    unchanged() {
      return !this.changed;
    },
    extensibleChannelTypeIds() {
      const type = this.thingtype;
      if (!type || !type.extensibleChannelTypeIds) return [];
      return this.thingtype.extensibleChannelTypeIds.map(cid => this.channeltypes[this.bindingid + ":" + cid]);
    }
  },
  methods: {
    save() {
      const thingCopy = JSON.parse(JSON.stringify(this.valuecopy));
      delete thingCopy.properties;
      delete thingCopy.statusInfo;
      delete thingCopy.firmwareStatus;
      this.changed = false;
      console.log("SAVE THING", thingCopy);
      fetchMethodWithTimeout(store.host + "/rest/things/" + thingCopy.UID, "PUT", JSON.stringify(thingCopy))
        .then(r => {
          document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: false }))
          createNotification(null, `${thingCopy.label} saved`, false, 2000);
        }).catch(e => {
          this.changed = true;
          createNotification(null, `Failed to save ${thingCopy.label}: ${e}`, false, 4000);
        })
    },
    create() {
      const type = this.channeltypes[this.newchannel.channelTypeUID];
      const id = type.id + Math.random().toString(12).slice(2);
      const newChannel = Object.assign({
        itemType: type.itemType, kind: type.kind,
        description: type.description || "", defaultTags: type.tags || [],
        id: id, uid: thingCopy.UID + ":" + id,
        configuration: {}
      }, this.newchannel);
      console.log("CREATE CHANNEL", newChannel);
    },
    description() {
      const type = this.store.thingtype;
      if (type) return type.label + ": " + type.description;
      return "No thing description available";
    },
  }
}

const mixins = [ThingChannelMixin];
const listmixins = [ItemListMixin];

export { mixins, listmixins, ModelAdapter };

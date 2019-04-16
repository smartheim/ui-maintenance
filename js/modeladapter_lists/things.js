import { store, fetchMethodWithTimeout, createNotification, MultiRestError } from '../app.js';
import { generateTemplateForSchema, Yaml } from '../uicomponents.js';

let schema = {
  uri: 'http://openhab.org/schema/things-schema.json',
  fileMatch: ["http://openhab.org/schema/things-schema.json"],
  schema: {
    type: 'array',
    items: { "$ref": "#/definitions/item" },
    definitions: {
      item: {
        type: "object",
        description: "openHAB thing",
        required: ["UID", "thingTypeUID", "label"],
        properties: {
          UID: { type: "string", description: "A unique ID for this thing", minLength: 2 },
          label: { type: "string", description: "A friendly name", minLength: 2 },
          tags: {
            type: "array", "uniqueItems": true, description: "Tags of this thing",
            items: {
              "type": "string"
            }
          },
          thingTypeUID: { type: "string", description: "The type of this thing. Provided by a binding.", enum: [] },
          channels: {
            type: "array", uniqueItems: true, description: "Thing channels",
            items: {
              type: "object",
              properties: {
                required: ["uid", "id", "channelTypeUID"],
                uid: { type: "string", description: "A unique ID for this channel", minLength: 2 },
                id: { type: "string", description: "The id part of the unique ID. Must match with UID", minLength: 2 },
                channelTypeUID: { type: "string", description: "The channel type" },
                linkedItems: { type: "array", uniqueItems: true, description: "The items that are linked to this channel" },
                configuration: {
                  type: "object",
                  description: "A channel might have optional or required configuration",
                  properties: {}
                },
                properties: {
                  type: "object",
                  description: "Properties are runtime informations",
                  properties: {}
                },
                defaultTags: {
                  type: "array", "uniqueItems": true, description: "Tags that will be copied to a linked Item",
                  items: {
                    "type": "string"
                  }
                },
                label: { type: "string", description: "A friendly name", minLength: 2 },
                kind: { type: "string", description: "A channel can be a state channel or a trigger channel", enum: ["STATE", "TRIGGER"] },
                itemType: {
                  type: "string", description: "The item type for this channel",
                  enum: ['String', 'Number', 'Switch', 'Color', 'Contact', 'DateTime', 'Dimmer', 'Image', 'Location', 'Player',
                    'Rollershutter', 'Group']
                },
              }
            }
          },
          configuration: {
            type: "object",
            description: "A thing might have optional or required configuration",
            properties: {}
          },
        }
      }
    }
  },
};


class ModelAdapter {

  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("UID");
    this.runtimeKeys = Object.freeze(["link", "editable", "statusInfo", "properties", "actions"]);
    this.items = []; this.thingtypes = [];
  }
  stores() { return { "things": "items" } };
  sortStore() { return "things" };
  getall(options = null) {
    return store.get("thing-types", null, { force: true })
      .then(v => this.thingtypes = v)
      .then(() => this.get(null, null, options))
  }
  async get(table = null, objectid = null, options = null) {
    this.items = await store.get("things", null, options);
    this.adaptSchema();
  }
  getThingTypeFor(uid) {
    for (const thingType of this.thingtypes) {
      if (thingType.UID == uid)
        return thingType;
    }
    return null;
  }
  getExtendedThingTypeFor(uid) {
    return store.get("thing-types-extended", uid, { force: true });
  }
  getThingTypeConfigDescriptionsFor(uid) {
    return store.get("config-descriptions", "thing-type:" + uid, { force: true });
  }
  getChannelTypesConfigDescriptionsFor(bindingID) {
    return store.get("config-descriptions", null, { filter: "uri:channel-type:" + bindingID, force: true });
  }
  getChannelTypes(bindingID) {
    return store.get("channel-types", null, { filter: "UID:" + bindingID + ":", force: true });
  }
  dispose() {
  }
  adaptSchema() {
    schema.schema.definitions.item.properties.thingTypeUID.enum = this.thingtypes.map(i => i.UID);
  }
}

const ThingsMixin = {
  data: () => {
    return {
      actions: []
    }
  },
  watch: {
    listitem: {
      handler: function (newVal, oldVal) {
        // Create actions array
        this.actions = [];
        if (newVal.statusInfo.statusDetail === "DISABLED")
          this.actions.push({ id: "enable", label: "Enable", description: "Enable this Thing" });
        else
          this.actions.push({ id: "disable", label: "Disable", description: "Disable this Thing. A disabled thing will not connect to its peer device" });
        if (!this.item.actions) return null;
        for (let action of this.item.actions) this.actions.push(action);
      }, deep: false, immediate: true,
    }
  },
  computed: {
    statusInfo() {
      return this.item.statusInfo ? this.item.statusInfo.status.toLowerCase().replace(/^\w/, c => c.toUpperCase()) : "Unknown";
    },
    statusDetails() {
      return this.item.statusInfo ? this.item.statusInfo.statusDetail + " - " + this.item.statusInfo.description : "";
    },
    statusBadge() {
      const status = this.item.statusInfo ? this.item.statusInfo.status : "";
      switch (status) {
        case "ONLINE": return "badge badge-success";
        case "OFFLINE": return "badge badge-danger";
        case "UNINITIALIZED": return "badge badge-info";
      }
      return "badge badge-light";
    }
  },
  methods: {
    commontags() {
      return [];
    },
    description() {
      const thingType = this.$list.store.getThingTypeFor(this.item.thingTypeUID);
      if (thingType) return thingType.description;
      return "No Thing description available";
    },
    triggerAction(actionEvent) {
      if (actionEvent.detail == "enable") {
        this.setEnabled(actionEvent, true);
      } else if (actionEvent.detail == "disable") {
        this.setEnabled(actionEvent, false);
      } else {
        console.log("triggered", actionEvent.target.dataset.uid, actionEvent.detail);
        this.message = null;
        this.messagetitle = "Performing action...";
        this.inProgress = true;
        this.changed = false;
        setTimeout(() => {
          this.inProgress = false;
        }, 500);
      }
    },
    haschannels() {
      return this.item.channels.length > 0;
    },
    remove() {
      this.message = null;
      this.messagetitle = "Removing...";
      this.inProgress = true;
      const forceQuery = this.item.statusInfo.status == "REMOVING" ? "?force=true" : "";
      fetchMethodWithTimeout(store.host + "/rest/things/" + this.item.UID + forceQuery, "DELETE", null)
        .then(r => {
          this.message = "Thing '" + this.item.label + "' removed";
          this.inProgress = false;
        }).catch(e => {
          this.message = e.toString();
        });
    },
    setEnabled(event, value) {
      event.target.classList.add("disabled");
      fetchMethodWithTimeout(store.host + "/rest/things/" + this.item.UID + "/enable", "PUT", value)
        .then(r => {
          event.target.classList.remove("disabled");
          createNotification(null, `Thing ${this.item.label} is now ${value ? "enabled" : "disabled"}`, false, 2000);
        }).catch(e => {
          event.target.classList.remove("disabled");
          createNotification(null, `Failed to en/disable ${this.item.label}: ${e}`, false, 4000);
        });
    },
  }
};

function symbolChainEqual(chain1, chain2) {
  if (chain1.length != chain2.length) return false;
  for (let i = 0; i < chain1.length; ++i) {
    if (chain1[i] != chain2[i]) return false;
  }
  return true;
}

const ItemListMixin = {
  mounted() {
    this.modelschema = schema; // Don't freeze: The schema is adapted dynamically
  },
  methods: {
    async saveAll(updated, created, removed) {
      let errorItems = [];
      for (let item of updated) {
        await fetchMethodWithTimeout(store.host + "/rest/things/" + item.UID, "PUT", JSON.stringify(item))
          .catch(e => {
            errorItems.push(item.name + ":" + e.toString());
          });
      }
      for (let item of created) {
        await fetchMethodWithTimeout(store.host + "/rest/things", "POST", JSON.stringify(item))
          .catch(e => {
            errorItems.push(item.name + ":" + e.toString());
          });
      }
      for (let item of removed) {
        await fetchMethodWithTimeout(store.host + "/rest/things/" + item.UID, "DELETE")
          .catch(e => {
            errorItems.push(item.name + ":" + e.toString());
          });
      }
      if (errorItems.length) {
        throw new MultiRestError("Some objects failed", errorItems);
      } else {
        createNotification(null, `Updated ${updated.length}, Created ${created.length}, Removed ${removed.length} objects`, false, 1500);
      }
    },
    async editorCompletion(symbols, trigger) {
      const context = this.last.context;
      if (context && (symbols.length == 2 || symbols.length == 4) && symbols[1] == "channels") {
        let channels = generateTemplateForSchema(context.schema,
          context.thingType, context.channelConfigTypes, context.channelTypes,
          context.focus, context.focusChannelindex, true);

        let suggestions = [];
        for (let channel of channels) {
          let content = Yaml.dump([channel], 10, 4).replace(/-     /g, "-\n    ");
          if (trigger) content = content.replace("-", "");

          suggestions.push({
            label: 'New ' + channel.label + " channel",
            documentation: 'Creates a new object template',
            insertText: content,
          });
        }
        return suggestions;
      }
      return [];
    },
    // Editor symbol selected
    async symbolSelected(event) {
      const symbolChain = event.detail;
      if (this.last && symbolChainEqual(this.last.symbol, symbolChain)) return;
      if (!this.last) this.last = {};
      this.last.symbol = symbolChain;
      const thingTypeUID = symbolChain[0];
      if (thingTypeUID && thingTypeUID.includes(" ")) return; // Whitespace? Early exit
      let context;
      if (this.last.thingTypeUID != thingTypeUID) {
        this.last.thingTypeUID = thingTypeUID;
        const bindingID = thingTypeUID.split(":")[0];
        const thingType = await this.$list.store.getExtendedThingTypeFor(thingTypeUID);
        //   const configurationType = await this.$list.store.getThingTypeConfigDescriptionsFor(thingTypeUID);
        const channelConfigTypes = await this.$list.store.getChannelTypesConfigDescriptionsFor(bindingID) || [];
        const channelTypes = await this.$list.store.getChannelTypes(bindingID) || [];
        let thingSchema = JSON.parse(JSON.stringify(schema.schema.definitions.item.properties));
        thingSchema.thingTypeUID.enum = [];
        context = { thingType, channelConfigTypes, channelTypes, schema: thingSchema }; // configurationType
        this.last.context = context;
      } else {
        context = this.last.context;
      }

      if (!context.thingType) return;

      if (symbolChain.length > 1 && symbolChain[1] == "configuration") { // thing config
        context.focus = "thingconfig";
      } else if (symbolChain.length > 1 && symbolChain[1] == "channels") {
        if (symbolChain.length > 3 && symbolChain[3] == "configuration") { // channel config
          context.focus = "channelconfig";
          context.focusChannelindex = symbolChain[2];
        } else {
          context.focus = "channels";
        }
      } else {
        context.focus = null;
      }

      if (this.ohcontexthelp === undefined) {
        this.ohcontexthelp = document.querySelector("ui-context-help");
        if (!this.ohcontexthelp) {
          console.warn("Did not find context help element");
          return;
        }
      }

      this.ohcontexthelp.contenturl = null;
      this.ohcontexthelp.contextdata = context;
      this.ohcontexthelp.contenturl = "thing_type.fragment.html";

      if (!this.showcontext) {
        this.showcontext = true;
        document.querySelector('body').classList.add('showcontext');
      }
    }
  }
};

const mixins = [ThingsMixin];
const listmixins = [ItemListMixin];

export { mixins, listmixins, ModelAdapter };

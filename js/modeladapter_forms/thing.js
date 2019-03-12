import { store, createNotification, fetchMethodWithTimeout } from '../app.js'; // Pre-bundled, external reference

/**
 * 
    EnrichedThingDTO {
      label (string, optional),
      bridgeUID (string, optional),
      configuration (object, optional),
      properties (object, optional),
      UID (string, optional),
      thingTypeUID (string, optional),
      channels (Array[ChannelDTO], optional),
      location (string, optional),
      statusInfo (ThingStatusInfo, optional),
      firmwareStatus (FirmwareStatusDTO, optional),
      editable (boolean, optional)
    } 

    ThingTypeDTO {
      UID (string, optional),
      label (string, optional),
      description (string, optional),
      category (string, optional),
      listed (boolean, optional),
      supportedBridgeTypeUIDs (Array[string], optional),
      bridge (boolean, optional),
      channels (Array[ChannelDefinitionDTO], optional),
      channelGroups (Array[ChannelGroupDefinitionDTO], optional),
      configParameters (Array[ConfigDescriptionParameterDTO], optional),
      parameterGroups (Array[ConfigDescriptionParameterGroupDTO], optional),
      properties (object, optional),
      extensibleChannelTypeIds (Array[string], optional)
    }

    ChannelDTO {
      uid (string, optional),
      id (string, optional),
      channelTypeUID (string, optional),
      itemType (string, optional),
      kind (string, optional),
      label (string, optional),
      description (string, optional),
      defaultTags (Array[string], optional),
      properties (object, optional),
      configuration (object, optional)
    }

 * @private
 */
class ModelAdapter {
  stores() { return { "things": "value" } };
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("UID");
    this.events = Object.freeze(new EventTarget());
    this.runtimeKeys = [];
    this.thingtype = {};
    this.value = { label: "", thingTypeUID: null };
    this.bindingid = null;
  }
  async get(table = null, objectid = null, options = null) {
    if (!objectid) return this.value;
    const value = await store.get("things", objectid, options);
    this.thingtype = await store.get("thing-types-extended", value.thingTypeUID, { force: true });
    this.value = value;
    this.bindingid = this.value.UID.split(":")[0];
    return this.value;
  }
  async updateThingType(thingTypeUID) {
    this.thingtype = await store.get("thing-types-extended", thingTypeUID, { force: true });
  }
  dispose() {
  }
}

const ThingMixin = {
  computed: {
    configurationParameters() {
      return this.thingtype.configParameters;
    },
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
    canNotCreate() {
      return this.valuecopy.thingTypeUID == null || !this.valuecopy.label;
    },
    hasDescription() {
      const type = this.thingtype;
      return type.description || false;
    },
  },
  data: () => {
    return {
      bindingfilter: null,
      bridgeTypeFilter: null
    }
  },
  methods: {
    setBindingFilter(bindingid) {
      this.bridgeTypeFilter = null;
      this.valuecopy.thingTypeUID = null;
      this.bindingid = bindingid;
      this.bindingfilter = [{ name: "UID", value: "^" + bindingid + ":" }];
    },
    async setThingType(thingTypeUID) {
      this.$set(this.valuecopy, "thingTypeUID", thingTypeUID);
      await this.updateThingType(thingTypeUID);
      const type = this.thingtype;
      if (type.supportedBridgeTypeUIDs && type.supportedBridgeTypeUIDs.length) {
        let bridgeTypeFilter = []
        for (let supportedType of type.supportedBridgeTypeUIDs) {
          bridgeTypeFilter.push({ name: "thingTypeUID", value: "^" + supportedType + "$" });
        }
        this.bridgeTypeFilter = bridgeTypeFilter;
      }
    },
    create() {
      const thingCopy = JSON.parse(JSON.stringify(this.valuecopy));
      delete thingCopy.properties;
      delete thingCopy.statusInfo;
      delete thingCopy.firmwareStatus;

      console.log("CREATE THING", thingCopy);
      fetchMethodWithTimeout(store.host + "/rest/things", "POST", JSON.stringify(thingCopy))
        .then(r => r.json())
        .then(r => {
          document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: false }))
          createNotification(null, `${thingCopy.label} created`, false, 2000);
          this.changed = false;
          this.value = r;
          // Add UID to URL
          const url = new URL(window.location);
          url.searchParams.append("UID", r.UID);
          window.history.pushState(null, null, url);
          // Tell the controller, that we follow a specific Thing now
          this.events.dispatchEvent(new Event("created"));
        }).catch(e => {
          createNotification(null, `Failed to save ${thingCopy.label}: ${e}`, false, 4000);
        })
    },
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
    setEnabled(event) {
      event.target.classList.add("disabled");
      const value = event.target.value;
      fetchMethodWithTimeout(store.host + "/rest/things/" + this.valuecopy.UID + "/enable", "PUT", value)
        .then(r => {
          event.target.classList.remove("disabled");
          createNotification(null, `Thing ${this.valuecopy.label} is now ${value ? "enabled" : "disabled"}`, false, 2000);
        }).catch(e => {
          event.target.classList.remove("disabled");
          createNotification(null, `Failed to en/disable ${this.valuecopy.label}: ${e}`, false, 4000);
        })
    },
    getConfigValue(param) {
      return this.valuecopy.configuration ? this.valuecopy.configuration[param.name] : null;
    },
    setConfigValue(param, value) {
      if (!this.valuecopy.configuration) this.$set(this.valuecopy, "configuration", {});
      this.$set(this.valuecopy.configuration, param.name, value);
    },
    removeConfigValue(param) {
      this.valuecopy.configuration[param.name] = null;
      delete this.valuecopy.configuration[param.name];
    },
    description: function () {
      const type = this.thingtype;
      if (type) return type.description;
      return "No thing description available";
    },
  }
}

const mixins = [ThingMixin];

export { mixins, ModelAdapter };

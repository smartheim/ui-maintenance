import { store } from '../app.js';

class ModelAdapter {
  stores() { return { "things": "value" } };
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("UID");
    this.runtimeKeys = [];
    this.thingtypes = [];
    this.channeltypes = [];
    this.value = {};
  }
  async get(thinguid, options = null) {
    this.value = await store.get("things", thinguid, options);
    this.thingtype = await store.get("thing-types-extended", this.value.thingTypeUID, { force: true });
    this.channeltypes = await store.get("channel-types", null, { force: true });
    this.config = await store.get("config-descriptions", "thing-type:" + this.value.thingTypeUID, { force: true });
    return this.value;
  }
  getChannelTypeFor(uid) {
    for (const channelType of this.channeltypes) {
      if (channelType.UID == uid)
        return channelType;
    }
    return null;
  }
  /**
   * ThingTypeDTO {
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
   */
  getThingType() {
    return this.thingtype;
  }
  getConfig() {
    return this.config;
  }
  dispose() {
  }
}

const ThingChannelsMixin = {
  methods: {
    description: function () {
      const type = this.$root.store.getThingType();
      if (type) return type.description;
      return "No thing description available";
    },
    channelDescription: function (channelTypeUID) {
      const type = this.$root.store.getChannelTypeFor(channelTypeUID);
      if (type) return type.description;
      return "No Channel description available";
    },
    configuration: function () {
      return this.$root.store.getConfig();
    }
  }
}

const mixins = [ThingChannelsMixin];

export { mixins, ModelAdapter };

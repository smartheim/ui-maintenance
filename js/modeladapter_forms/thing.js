import { store } from '../app.js'; // Pre-bundled, external reference

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
 */

class ModelAdapter {
  stores() { return { "things": "value" } };
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("UID");
    this.runtimeKeys = [];
    this.thingtype = {};
    this.channeltypes = [];
    this.value = {};
  }
  async get(thinguid, options = null) {
    const value = await store.get("things", thinguid, options);
    this.thingtype = await store.get("thing-types-extended", value.thingTypeUID, { force: true });
    this.channeltypes = (await await store.get("channel-types", null, { force: true })).reduce((a, v) => { a[v.UID] = v; return a; }, {});
    this.value = value;
    return this.value;
  }
  dispose() {
  }
}

const ThingChannelsMixin = {
  computed: {
    configurationParameters() {
      return this.thingtype.configParameters;
    }
  },
  methods: {
    configValue(channel, param) {
      console.log("CONFIG VALUE", param.name, this.value.configuration);
      return channel.configuration[param.name];
    },
    channelConfigParameters(channel) {
      const type = this.$root.store.channeltypes[channel.channelTypeUID];
      if (type) return type.parameters;
      return null;
    },
    thingConfig(param) {
      return this.value.configuration ? this.value.configuration[param.name] : null;
    },
    description: function () {
      const type = this.$root.store.thingtype;
      if (type) return type.description;
      return "No thing description available";
    },
    channelDescription(channel) {
      const type = this.$root.store.channeltypes[channel.channelTypeUID];
      if (type) return type.description;
      return "No Channel description available";
    },
  }
}

const mixins = [ThingChannelsMixin];

export { mixins, ModelAdapter };

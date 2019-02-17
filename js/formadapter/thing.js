import { store } from '../app.js';

class StoreView {
    stores() { return { "things": "value" } };
    constructor() {
        this.STORE_ITEM_INDEX_PROP = "UID";
        this.runtimeKeys = [];
        this.thingtypes = [];
        this.channeltypes = [];
        this.value = {};
    }
    get(thinguid, options = null) {
        return store.get("things", thinguid, options)
            .then(v => this.value = v)
            .then(() => store.get("thing-types-extended", this.value.thingTypeUID, { force: true }))
            .then(json => this.thingtype = json)
            .then(() => store.get("channel-types", null, { force: true }))
            .then(json => this.channeltypes = json)
            .then(() => store.get("config-descriptions", "thing-type:" + this.value.thingTypeUID, { force: true }))
            .then(v => this.config = v);
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

export { mixins, StoreView };

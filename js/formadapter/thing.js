import { store } from '../app.js';

class StoreView {
    stores() { return { "things": "value" } };
    constructor() {
        this.thingtypes = [];
        this.channeltypes = [];
        this.value = {};
    }
    get(thinguid, options = null) {
        return store.get("things", thinguid, options)
            .then(v => this.value = v)
            .then(() => store.get("thing-types", this.value.thingTypeUID))
            .then(json => this.thingtype = json)
            .then(() => store.get("channel-types"))
            .then(json => this.channeltypes = json)
            .then(() => store.get("config-descriptions", "thing-type:" + this.value.thingTypeUID))
            .then(v => this.config = v);
    }
    getChannelTypeFor(uid) {
        for (const channelType of this.channeltypes) {
            if (channelType.UID == uid)
                return channelType;
        }
        return null;
    }
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

const ID_KEY = "UID";
const mixins = [ThingChannelsMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView, ID_KEY };

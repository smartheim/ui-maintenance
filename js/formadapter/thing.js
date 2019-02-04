import { store } from '../app.js';

class StoreView {
    stores() { return { "things": "value" } };
    constructor() {
        this.thingtypes = [];
        this.channeltypes = [];
        this.value = {};
    }
    async get(thinguid) {
        return store.get("rest/things/" + thinguid, "things", thinguid)
            .then(v => this.value = v)
            .then(() => store.get("rest/thing-types", "thing-types", this.value.thingTypeUID, "UID"))
            .then(json => this.thingtype = json)
            .then(() => store.get("rest/channel-types", "channel-types"))
            .then(json => this.channeltypes = json)
            .then(() => store.get("rest/config-descriptions", "config-descriptions", "thing-type:" + this.value.thingTypeUID, "uri"))
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

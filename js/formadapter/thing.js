import { store } from '../app.js';

class StoreView {
    mainStore() { return "things" };
    constructor() {
        this.thingtypes = [];
        this.channeltypes = [];
    }
    async get(thinguid) {
        return store.get("rest/thing-types", "thing-types")
            .then(json => this.thingtypes = json)
            .then(() => store.get("rest/channel-types", "channel-types"))
            .then(json => this.channeltypes = json)
            .then(() => store.get("rest/things/" + thinguid, "things", thinguid))
            .then(v => this.value = v);
    }
    getChannelTypeFor(uid) {
        for (const channelType of this.channeltypes) {
            if (channelType.UID == uid)
                return channelType;
        }
        return null;
    }
    getThingTypeFor(uid) {
        for (const thingType of this.thingtypes) {
            if (thingType.UID == uid)
                return thingType;
        }
        return null;
    }
    dispose() {
    }
}

const ThingChannelsMixin = {
    methods: {
        description: function () {
            const type = this.$root.store.getThingTypeFor(this.objectdata.thingTypeUID);
            if (type) return type.description;
            return "No thing description available";
        },
        channelDescription: function (channelTypeUID) {
            const type = this.$root.store.getChannelTypeFor(channelTypeUID);
            if (type) return type.description;
            return "No Channel description available";
        },
        configurations: function () {
            return [];
            //return this.objectdata.configuration ? this.objectdata.configuration : [];
        }
    }
}

const ID_KEY = "UID";
const mixins = [ThingChannelsMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView, ID_KEY };

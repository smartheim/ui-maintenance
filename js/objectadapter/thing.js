import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    constructor() {
        this.thingtypes = [];
        this.channeltypes = [];
    }
    async get(thinguid) {
        return fetchWithTimeout("dummydata/rest/thing-types.json")
            .then(response => response.json())
            .then(json => this.thingtypes = json)
            .then(() => fetchWithTimeout("dummydata/rest/channel-types.json"))
            .then(response => response.json())
            .then(json => this.channeltypes = json)
            .then(() => fetchWithTimeout("dummydata/rest/things.json"))
            .then(response => response.json())
            .then(json => json.find(e => e.UID == thinguid));
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

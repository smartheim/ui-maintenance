import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/channel-types.json")
            .then(response => response.json())
            .then(json => this.channeltypes = json)
            .then(() => fetchWithTimeout("dummydata/rest/things.json"))
            .then(response => response.json())
            .then(json => this.thing = json)
            .then(json => json[0].channels);
    }
    getChannelTypeFor(uid) {
        for (const channelType of this.channeltypes) {
            if (channelType.UID == uid)
                return channelType;
        }
        return null;
    }
    dispose() {
    }
}

const ThingChannelsMixin = {
    methods: {
        description: function () {
            const type = this.$root.store.getChannelTypeFor(this.item.channelTypeUID);
            if (type) return type.description;
            return "No Channel description available";
        }
    }
}

const mixins = [ThingChannelsMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView };

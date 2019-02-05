class StoreView {
    constructor() { this.items = []; }
    stores() { return {}; };
    async getall() {
        this.items = [
            { id: "Color", label: "Color", desc: "Color information" },
            { id: "Contact", label: "Contact", desc: "Read-only status of contacts, e.g. door/window contacts." },
            { id: "DateTime", label: "DateTime", desc: "Stores date and time" },
            { id: "Dimmer", label: "Dimmer", desc: "Percentage value, typically used for dimmers" },
            { id: "Image", label: "Image", desc: "Binary data of an image" },
            { id: "Location", label: "Location", desc: "GPS coordinates" },
            { id: "Number", label: "Number", desc: "Values in number format" },
            { id: "Player", label: "Player", desc: "Allows control of players (e.g. audio players)" },
            { id: "Rollershutter", label: "Rollershutter", desc: "Roller shutter Item, typically used for blinds" },
            { id: "String", label: "String", desc: "Stores texts" },
            { id: "Switch", label: "Switch", desc: "Used for anything that needs to be switched ON and OFF" },
        ];
        return this.items;
    }
    dispose() {
    }
}

const mixins = [];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = null;

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };

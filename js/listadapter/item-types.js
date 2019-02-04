class StoreView {
    constructor() { this.items = []; }
    stores() { return {}; };
    async getall() {
        this.items = [
            { id: "Color", value: "<b>Color</b><br>Color information" },
            { id: "Contact", value: "<b>Contact</b><br>Read-only status of contacts, e.g. door/window contacts." },
            { id: "DateTime", value: "<b>DateTime</b><br>Stores date and time" },
            { id: "Dimmer", value: "<b>Dimmer</b><br>Percentage value, typically used for dimmers" },
            { id: "Image", value: "<b>Image</b><br>Binary data of an image" },
            { id: "Location", value: "<b>Location</b><br>GPS coordinates" },
            { id: "Number", value: "<b>Number</b><br>Values in number format" },
            { id: "Player", value: "<b>Player</b><br>Allows control of players (e.g. audio players)" },
            { id: "Rollershutter", value: "<b>Rollershutter</b><br>Roller shutter Item, typically used for blinds" },
            { id: "String", value: "<b>String</b><br>Stores texts" },
            { id: "Switch", value: "<b>Switch</b><br>Used for anything that needs to be switched ON and OFF" },
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

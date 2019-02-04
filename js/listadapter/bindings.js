import { store } from '../app.js';

class StoreView {
    constructor() { this.items = []; }
    stores() { return { "bindings": "items" } };
    async getall() {
        return store.get("rest/bindings", "bindings").then(items => this.items = items);
    }
    dispose() {
    }
}

const BindingsMixin = {
    mounted: function () {
        // Small hack for custom pages. We need a hidden link that we can programatically click
        this.link = document.createElement("a");
        this.link.style.display = "none";
        this.$el.appendChild(this.link);
    },
    methods: {
        showAuxiliary: function (event) {
            let title = this.getAuxiliaries()[event.detail];
            this.link.href = "binding_custompage.html?title=" + title + "&customurl=" + encodeURIComponent(event.detail);
            this.link.dispatchEvent(new MouseEvent('click', { // programatically click link now
                view: window,
                bubbles: true,
                cancelable: true
            }));
        },
        getAuxiliaries: function () {
            const custom = this.item.custompages;
            let options = {};
            if (!custom) return options;
            for (let page of custom) {
                options[page.uri] = page.label;
            }
            return options;
        },
        hasCustomPages: function () {
            return this.item.custompages && this.item.custompages.length > 0;
        }
    },
    computed: {
        documentationlink: function () {
            var source = this.item.source;
            source = source.replace("https://github.com/", "https://raw.githubusercontent.com/").replace("tree/master", "master");
            return source + '/README.md';
        }
    }
}



const mixins = [BindingsMixin];
const listmixins = [];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, listmixins, schema, runtimekeys, StoreView, ID_KEY };

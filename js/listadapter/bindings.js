// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import { fetchWithTimeout } from '../ohcomponents.js';

class StoreView {
    async getall() {
        return fetchWithTimeout("dummydata/rest/bindings.json").then(response => response.json());
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
            console.log("page", event.detail);
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
            for (let page of custom) {
                console.log("page1", page);
                options[page.uri] = page.label;
            }
            return options;
        }
    }
}



const mixins = [BindingsMixin];
const runtimekeys = [];
const schema = null;

export { mixins, schema, runtimekeys, StoreView };

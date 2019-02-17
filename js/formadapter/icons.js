import { openhabHost, store } from '../app.js';

class StoreView {
    constructor() {
        this.STORE_ITEM_INDEX_PROP = null;
        this.runtimeKeys = [];
        this.value = []
    }
    stores() { return { "icon-set": "itemCategories" } };
    get(id, options = null) {
        return store.get("icon-set", null, options)
            .then(v => this.value = v);
    }
    dispose() {
    }
}

const Mixin = {
    data: function () {
        return {
            category: "",
            context: {}
        }
    },
    watch: {
        // Whenever the icon dialog is opened, the context is set at the same time
        context: function () {
            this.category = this.context.category || "";
        }
    },
    computed: {
        notready: function () {
            return !(this.category.trim().length > 0);
        }
    },
    methods: {
        iconpath: function (iconname) {
            const host = openhabHost();
            if (host != "demo" && iconname) {
                return openhabHost() + "/icon/" + iconname;
            } else {
                return "./img/scene_dummy.jpg";
            }
            return null;
        },
        applyIcon(event) {
            this.$set(this.context, 'category', this.category);
            this.context = {};
        },
        notifyClose() {
            this.context = {};
        }
    }
}

const mixins = [Mixin];
export { mixins, StoreView };

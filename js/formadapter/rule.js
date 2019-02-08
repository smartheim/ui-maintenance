import { store, fetchMethodWithTimeout, createNotification } from '../app.js';

class StoreView {
    constructor() { this.value = {}; this.moduletypes = []; }
    stores() { return { "rules": "value", "module-types": "moduletypes" } };
    get(ruleuid, options = null) {
        return store.get("rules", ruleuid, options)
            .then(v => this.value = v)
            .then(() => this.value.configDescriptions && this.value.configDescriptions.length > 0 ?
                store.get("config-descriptions", this.value.configDescriptions[0], "uri") : null)
            .then(v => this.config = v)
            .then(() => store.get("module-types"))
            .then(v => this.moduletypes = v);
    }
    dispose() {
    }
    getConfig() {
        return this.config;
    }
}

const ServiceMixin = {
    computed: {
        isNew() {
            return this.value.uid === undefined;
        },
        nextStatus() {
            return this.value.status ? this.value.status.status : "";
        }
    },
    data: function () {
        return {
            status: this.nextStatus,
        }
    },
    watch: {
        nextStatus() {
            // Add a bit of delay before changing the rule status so that the user can see the change
            if (!this.statusChangeTimer) {
                this.status = this.nextStatus;
                this.statusChangeTimer = setTimeout(() => {
                    this.status = this.nextStatus;
                    delete this.statusChangeTimer;
                }, 300);
            }
        }
    },
    // value.status ? value.status.status : ""
    methods: {
        create(target) {
            if (target.classList.contains("disabled")) return;
            target.classList.add("disabled");

            target.classList.remove("disabled");
        },
        save(target) {
            if (target.classList.contains("disabled")) return;
            target.classList.add("disabled");

            target.classList.remove("disabled");
        },
        remove(target) {
            if (target.classList.contains("disabled")) return;
            target.classList.add("disabled");

            target.classList.remove("disabled");
        },
        run(target) {
            if (target.classList.contains("disabled")) return;
            target.classList.add("disabled");
            fetchMethodWithTimeout(store.host + "/rest/rules/" + this.value.uid + "/runnow", "POST", "", null)
                .then(r => {
                    setTimeout(() => target.classList.remove("disabled"), 1000);
                    createNotification(null, `Run ${this.value.name}`, false, 1500);
                }).catch(e => {
                    setTimeout(() => target.classList.remove("disabled"), 1000);
                    createNotification(null, `Failed ${this.value.name}: ${e}`, false, 4000);
                })
        },
        copyClipboard(event, itemid) {
            if (!itemid) return;
            var range = document.createRange();
            range.selectNode(event.target);
            window.getSelection().removeAllRanges();
            window.getSelection().addRange(range);
            document.execCommand("copy");
            createNotification("clipboard", `Copied ${itemid} to clipboard`, false, 3000);
        }
    }
}

const mixins = [ServiceMixin];
const runtimekeys = [];
const schema = null;
const ID_KEY = "uid";

export { mixins, schema, runtimekeys, StoreView, ID_KEY };

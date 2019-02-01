import { store } from './app.js';
import { importModule } from "./polyfill/importModule";
import { Vue } from './vue.js';

/**
 * This is a non-visible data binding component and serves as *Controller*
 * in the MVA (Model-View-Adapter) concept.
 * 
 * It waits for the target, identified by the "for" attribute
 * to be ready and then loads the "listadapter" es6 module.
 * The helper module is expected to export:
 * - mixins: A list of mixins to apply to list-item components
 * - schema: An optional json-schema for the text-editor
 * - runtimekeys: A list of keys that should be filtered out for the text-editor
 * - StoreView: This serves as *Adapter* in our MVA architecture.
 */
class OhListBind extends HTMLElement {
    constructor() {
        super();
        this.style.display = "none";
        this.connectedBound = (e) => this.connected(e.detail);
        this.connectingBound = (e) => this.connecting(e.detail);
        this.disconnectedBound = (e) => this.disconnected(e.detail);
        this.listChangedBound = (e) => this.listChanged(e.detail);
        this.listEntryChangedBound = (e) => this.listEntryChanged(e.detail);
        this.listEntryRemovedBound = (e) => this.listEntryRemoved(e.detail);
        this.listEntryAddedBound = (e) => this.listEntryAdded(e.detail);
    }
    connectedCallback() {
        const forid = this.getAttribute("for");
        this.target = document.getElementById(forid);
        if (!this.target) {
            this.target = this.nextElementSibling;
        }
        if (!this.target.ok) {
            this.target.addEventListener("load", this.connectedCallback.bind(this), { once: true, passive: true });
            return;
        }

        const listadapter = this.getAttribute("listadapter");
        importModule('./js/listadapter/' + listadapter + '.js')
            .then(this.startList.bind(this)).catch(e => {
                console.log("list bind failed", e);
                this.target.error = e;
            });
    }
    disconnectedCallback() {
        store.removeEventListener("connectionEstablished", this.connectedBound, false);
        store.removeEventListener("connecting", this.connectingBound, false);
        store.removeEventListener("connectionLost", this.disconnectedBound, false);
        store.removeEventListener("storeChanged", this.listChangedBound, false);
        store.removeEventListener("storeItemChanged", this.listEntryChangedBound, false);
        store.removeEventListener("storeItemRemoved", this.listEntryRemovedBound, false);
        store.removeEventListener("storeItemAdded", this.listEntryAddedBound, false);
        if (this.modeladapter) {
            this.modeladapter.dispose();
            delete this.modeladapter;
        }
    }
    async startList(module) {
        this.module = module;
        if (this.modeladapter) this.modeladapter.dispose();
        this.modeladapter = new module.StoreView(this);
        this.target.start(this.modeladapter, module.listmixins, module.mixins, module.schema, module.runtimekeys);

        store.addEventListener("connectionEstablished", this.connectedBound, false);
        store.addEventListener("connecting", this.connectingBound, false);
        store.addEventListener("connectionLost", this.disconnectedBound, false);
        store.addEventListener("storeChanged", this.listChangedBound, false);
        store.addEventListener("storeItemChanged", this.listEntryChangedBound, false);
        store.addEventListener("storeItemRemoved", this.listEntryRemovedBound, false);
        store.addEventListener("storeItemAdded", this.listEntryAddedBound, false);

        if (store.connected) this.connected(); else this.disconnected();
    }
    async connected() {
        const data = await this.modeladapter.getall();
        console.debug("OhListBind", data);
        this.target.items = data;
    }
    connecting() {
        this.target.connectionState(true, store.host);
    }
    disconnected() {
        this.target.connectionState(false, store.connectionErrorMessage);
    }

    listChanged(e) {
        if (e.storename != this.modeladapter.mainStore()) return;
        this.modeladapter.list = e.value;
    }
    listEntryChanged(e) {
        if (e.storename != this.modeladapter.mainStore()) return;
        const id = e.value[this.module.ID_KEY];
        const list = this.modeladapter.list;
        // Find entry in adapters list
        for (let i = 0; i < list.length; ++i) {
            let entry = list[i];
            if (entry[this.module.ID_KEY] == id) {
                console.debug("listEntryChanged->update view", e.storename, e.value);
                Vue.set(list, i, e.value);
                return;
            }
        }
    }
    listEntryRemoved(e) {
        if (e.storename != this.modeladapter.mainStore()) return;
        const id = e.value[this.module.ID_KEY];
        const list = this.modeladapter.list;
        // Find entry in adapters list
        for (let i = 0; i < list.length; ++i) {
            const entry = list[i];
            if (entry[this.module.ID_KEY] == id) {
                console.debug("listEntryRemoved->update view", e.storename, e.value);
                this.modeladapter.list.splice(i, 1);
                return;
            }
        }
    }
    listEntryAdded(e) {
        if (e.storename != this.modeladapter.mainStore()) return;
        const id = e.value[this.module.ID_KEY];
        const list = this.modeladapter.list;
        // Find entry in adapters list
        for (let entry of list) {
            if (entry[this.module.ID_KEY] == id) {
                console.debug("listEntryChanged->update view", e.storename, e.value);
                this.modeladapter.list = e.value;
                this.target.items = e.value;
                return;
            }
        }
        // Not found in list -> add entry
        console.debug("listEntryChanged->add to view", e.storename, e.value);
        this.modeladapter.list.push(e.value);
    }
    /**
     * 
     * @param {String} criteria The sorting criteria.
     *  Need to match with a database entries property. E.g. "label" or "category".
     * @param {Enumerator<String>} direction The sorting direction. Usually ↓ or ↑.
     */
    sort(criteria, direction = "↓") {
        if (!this.modeladapter) return;
        store.sort(this.modeladapter.mainStore(), criteria, direction);
    }
}

customElements.define('oh-list-bind', OhListBind);

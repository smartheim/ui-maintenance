import { store } from './app.js';
import { importModule } from "./polyfill/importModule";

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
class OhVueFormBind extends HTMLElement {
    constructor() {
        super();
        this.connectedBound = (e) => this.connected(e.detail);
        this.connectingBound = (e) => this.connecting(e.detail);
        this.disconnectedBound = (e) => this.disconnected(e.detail);
        this.listChangedBound = (e) => this.listChanged(e.detail);
        this.listEntryChangedBound = (e) => this.listEntryChanged(e.detail);
        this.listEntryRemovedBound = (e) => this.listEntryRemoved(e.detail);
    }
    connectedCallback() {
        this.style.display = "none";
        const forid = this.getAttribute("for");
        this.target = document.getElementById(forid);
        if (!this.target) {
            this.target = this.nextElementSibling;
        }
        if (!this.target.ok) {
            this.target.addEventListener("load", this.connectedCallback.bind(this), { once: true, passive: true });
            return;
        }

        const adapter = this.getAttribute("adapter");
        importModule('./js/formadapter/' + adapter + '.js')
            .then(this.start.bind(this)).catch(e => {
                console.log("form bind failed", e);
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

        if (this.modeladapter) {
            this.modeladapter.dispose();
            delete this.modeladapter;
        }
    }
    async start(module) {
        this.module = module;
        if (this.modeladapter) this.modeladapter.dispose();
        this.modeladapter = new module.StoreView();
        this.target.start(this.modeladapter, module.mixins, module.schema, module.runtimekeys);

        store.addEventListener("connectionEstablished", this.connectedBound, false);
        store.addEventListener("connecting", this.connectingBound, false);
        store.addEventListener("connectionLost", this.disconnectedBound, false);
        store.addEventListener("storeChanged", this.listChangedBound, false);
        store.addEventListener("storeItemChanged", this.listEntryChangedBound, false);
        store.addEventListener("storeItemRemoved", this.listEntryRemovedBound, false);

        if (store.connected) this.connected(); else this.disconnected();
    }

    /**
     * A view must be able to tell the controller when a new "thing" has been created.
     * @param {String} newId 
     */
    idAssigned(newId) {
        this.objectid = newId;
        this.setAttribute("objectid", this.objectid);
        if (store.connected) this.connected(); else this.disconnected();
    }

    async connected() {
        this.objectid = this.hasAttribute("objectid") ? this.getAttribute("objectid") : this.objectid;
        if (!this.objectid && this.hasAttribute("objectFromURL")) {
            this.objectid = new URL(window.location).searchParams.get(this.module.ID_KEY);
        }

        console.log("thing id", this.objectid);
        if (this.objectid) {
            const data = await this.modeladapter.get(this.objectid);
            console.debug("OhObjectBind", data);
            this.target.objectdata = data;
        } else if (this.hasAttribute("allowNew")) {
            this.target.objectdata = {};
        } else {
            this.error = "No id set and no attribute 'allowNew'";
        }
    }
    connecting() {
        console.debug("connecting");
        this.target.connectionState(true, store.host);
    }
    disconnected() {
        console.debug("disconnected");
        this.target.connectionState(false, store.connectionErrorMessage);
    }

    listChanged(e) {
        if (e.storename == this.modeladapter.mainStore()) {
            // Find entry in list
            for (let entry of e.value) {
                if (entry[this.module.ID_KEY] == this.objectid) {
                    console.debug("listChanged->update view", e.storename, entry);
                    this.modeladapter.value = entry;
                    this.target.objectdata = entry;
                    return;
                }
            }
        }
    }

    listEntryChanged(e) {
        // If changed database entry matches the adapters store-name and
        // the id of entry itself matches the adapters objects id, we store
        // the new value and assign it to the view.
        if (e.storename == this.modeladapter.mainStore() &&
            e.value[this.module.ID_KEY] == this.objectid) {
            console.debug("listEntryChanged->update view", e.storename, entry);
            this.modeladapter.value = e.value;
            this.target.objectdata = e.value;
        }
    }

    listEntryRemoved(e) {
        // If changed database entry matches the adapters store-name and
        // the id of entry itself matches the adapters objects id, we store
        // the new value and assign it to the view.
        if (e.storename == this.modeladapter.mainStore() &&
            e.value[this.module.ID_KEY] == this.objectid) {
            console.debug("listEntryRemoved->update view", e.storename, entry);
            this.modeladapter.value = {};
            this.target.objectdata = {};
        }
    }
}

customElements.define('oh-form-bind', OhVueFormBind);

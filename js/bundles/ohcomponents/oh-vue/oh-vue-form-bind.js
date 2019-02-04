import { store } from '../app.js'; // Pre-bundled, external reference
import { importModule } from "./importModule";
import { UpdateAdapter } from './updateAdapter';
import { OhListStatus } from './oh-vue-list-status'

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
                console.warn("form bind failed", e);
                this.target.error = e;
            });
    }
    disconnectedCallback() {
        store.removeEventListener("connectionEstablished", this.connectedBound, false);
        store.removeEventListener("connecting", this.connectingBound, false);
        store.removeEventListener("connectionLost", this.disconnectedBound, false);

        if (this.modeladapter) {
            this.modeladapter.dispose();
            delete this.modeladapter;
        }

        delete this.target;
        this.disconnected();
    }
    async start(module) {
        this.module = module;
        if (this.modeladapter) this.modeladapter.dispose();
        this.modeladapter = new module.StoreView();
        this.target.start(this.modeladapter, module.mixins, module.schema, module.runtimekeys);

        store.addEventListener("connectionEstablished", this.connectedBound, false);
        store.addEventListener("connecting", this.connectingBound, false);
        store.addEventListener("connectionLost", this.disconnectedBound, false);

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
        if (this.updateAdapter) this.updateAdapter.dispose();

        this.objectid = this.hasAttribute("objectid") ? this.getAttribute("objectid") : this.objectid;
        if (!this.objectid && this.hasAttribute("objectFromURL")) {
            this.objectid = new URL(window.location).searchParams.get(this.module.ID_KEY);
        }

        this.updateAdapter = new UpdateAdapter(this.modeladapter, store, this.module.ID_KEY, this.objectid);

        if (this.objectid !== undefined) {
            await this.modeladapter.get(this.objectid);
            this.target.vue.status = OhListStatus.READY;
        } else if (!this.hasAttribute("allowNew")) {
            this.error = "No id set and no attribute 'allowNew'";
        }
    }
    connecting() {
        this.target.connectionState(true, store.host);
    }
    disconnected() {
        if (!this.updateAdapter) return;
        this.updateAdapter.dispose();
        delete this.updateAdapter;
        if (this.target) this.target.connectionState(false, store.connectionErrorMessage);
    }
}

customElements.define('oh-form-bind', OhVueFormBind);

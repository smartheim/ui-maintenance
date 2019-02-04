import { store } from './app.js'; // Pre-bundled, external reference
import { importModule } from "./oh-vue/importModule";
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
class OhDropdownBind extends HTMLElement {
    constructor() {
        super();
        this.connectedBound = (e) => this.connected(e.detail);
        this.connectingBound = (e) => this.connecting(e.detail);
        this.disconnectedBound = (e) => this.disconnected(e.detail);
    }
    connectedCallback() {
        this.style.display = "none";
        const forid = this.getAttribute("for");
        this.viewkey = this.getAttribute("viewkey");
        this.viewvalue = this.getAttribute("viewvalue");
        this.target = document.getElementById(forid);
        if (!this.target) {
            this.target = this.nextElementSibling;
        }
        if (!this.target) {
            console.warn("OhDropdownBind: Could not find target!");
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
        if (!this.modeladapter) {
            this.modeladapter.dispose();
            delete this.modeladapter;
        }
    }
    async startList(module) {
        if (this.modeladapter) this.modeladapter.dispose();
        this.modeladapter = new module.StoreView();
        store.addEventListener("connectionEstablished", this.connectedBound, false);
        store.addEventListener("connecting", this.connectingBound, false);
        store.addEventListener("connectionLost", this.disconnectedBound, false);

        if (store.connected) this.connected(); else this.disconnected();
    }

    async connected() {
        let list = await this.modeladapter.getall();
        let dropdownItems = {};
        for (let item of list) {
            dropdownItems[item[this.viewkey]] = item[this.viewvalue];
        };
        this.target.options = dropdownItems;
    }

    connecting() {
        this.target.options = {};
        this.target.label = "Connecting...";
    }
    disconnected() {
        this.target.options = {};
        this.target.label = "Not connected!";
    }
}

customElements.define('oh-dropdown-bind', OhDropdownBind);

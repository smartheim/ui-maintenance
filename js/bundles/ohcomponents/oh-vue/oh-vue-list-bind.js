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
 */
class OhListBind extends HTMLElement {
    constructor() {
        super();
        this.viewOptions = {};
        this.style.display = "none";
        this.connectedBound = (e) => this.connected(e.detail);
        this.connectingBound = (e) => this.connecting(e.detail);
        this.disconnectedBound = (e) => this.disconnected(e.detail);
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

        const maxItems = this.hasAttribute("maxItems") ? parseInt(this.getAttribute("maxItems")) : null;
        if (maxItems) {
            this.viewOptions.limit = maxItems;
        }

        this.fixedfilter = this.hasAttribute("fixedfilter") ? this.getAttribute("fixedfilter") : null;
        if (this.fixedfilter) {
            this.viewOptions.filter = this.fixedfilter;
        }

        if (this.hasAttribute("sort")) {
            this.viewOptions.sort = this.getAttribute("sort");
        }

        this.filtercriteria = this.hasAttribute("filtercriteria") ? this.getAttribute("filtercriteria") : null;

        this.filterbar = document.querySelector("ui-filter");
        if (this.filterbar) {
            this.filterBound = (event) => this.filter(event.detail.value.trim());
            this.increaseLimitBound = () => this.increaseLimit();
            this.filterbar.addEventListener("filter", this.filterBound);
            this.filterbar.addEventListener("showmore", this.increaseLimitBound);
        }


        const listadapter = this.getAttribute("listadapter");
        importModule('./js/listadapter/' + listadapter + '.js')
            .then(this.startList.bind(this)).catch(e => {
                console.log("list bind failed", e);
                this.target.error = e;
            });
    }
    disconnectedCallback() {
        if (this.filterbar) {
            this.filterbar.removeEventListener("filter", this.filterBound);
            delete this.filterbar;
        }
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
    async startList(module) {
        this.module = module;
        if (this.modeladapter) this.modeladapter.dispose();
        this.modeladapter = new module.StoreView(this);
        this.target.start(this.modeladapter, module.listmixins, module.mixins);

        store.addEventListener("connectionEstablished", this.connectedBound, false);
        store.addEventListener("connecting", this.connectingBound, false);
        store.addEventListener("connectionLost", this.disconnectedBound, false);

        if (store.connected) this.connected(); else this.disconnected();
    }
    async connected() {
        if (this.updateAdapter) this.updateAdapter.dispose();
        this.updateAdapter = new UpdateAdapter(this.modeladapter, store);

        await this.modeladapter.getall(this.viewOptions);
        this.target.vue.status = OhListStatus.READY;
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

    /**
     * 
     * @param {String} criteria The sorting criteria.
     *  Need to match with a database entries property. E.g. "label" or "category".
     * @param {Enumerator<String>} direction The sorting direction. Usually ↓ or ↑.
     */
    async sort(criteria, direction = "↓") {
        if (!this.modeladapter) return;

        this.viewOptions.sort = criteria;
        this.viewOptions.direction = direction;
        await this.modeladapter.getall(this.viewOptions);
    }

    async increaseLimit() {
        if (!this.modeladapter) return;
        if (!this.viewOptions.limit) return;

        this.viewOptions.limit += 50;
        await this.modeladapter.getall(this.viewOptions);
    }

    filter(filter) {
        if (!this.modeladapter || !this.filtercriteria) return;

        if (!filter.includes(":"))
            filter = this.filtercriteria + ":" + filter;

        if (this.filterThrottleTimer) {
            clearTimeout(this.filterThrottleTimer);
        }
        this.filterThrottleTimer = setTimeout(async () => {
            delete this.filterThrottleTimer;

            if (this.fixedfilter) {
                filter += "&&" + this.fixedfilter;
            }

            this.viewOptions.filter = filter;
            await this.modeladapter.getall(this.viewOptions);
        }, 120);
    }
}

customElements.define('oh-list-bind', OhListBind);

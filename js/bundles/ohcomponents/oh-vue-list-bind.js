/**
 * This is a non-visible data binding component and serves as *Controller*
 * in the MVA (Model-View-Adapter) concept.
 * 
 * It waits for the target, identified by the "for" attribute
 * to be ready and then loads the "listhelper" es6 module.
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
        this.forid = this.getAttribute("for");
    }
    connectedCallback() {
        this.target = document.getElementById(this.forid);
        if (!this.target) return;
        if (!this.target.ok) {
            this.target.addEventListener("load", this.connectedCallback.bind(this), { once: true, passive: true });
            return;
        }

        const listhelper = this.getAttribute("listhelper");
        import('./listhelper/' + listhelper + '.js')
            .then(this.startList.bind(this)).catch(e => {
                console.log("list bind failed", e);
                this.target.error = e;
            });
    }
    disconnectedCallback() {
        if (!this.modeladapter) {
            this.modeladapter.dispose();
            delete this.modeladapter;
        }
    }
    async startList(module) {
        if (this.modeladapter) this.modeladapter.dispose();
        this.modeladapter = new module.StoreView();
        this.target.start(this.modeladapter, module.mixins, module.schema, module.runtimekeys);
        this.target.items = await this.modeladapter.getall();
    }
}

customElements.define('oh-list-bind', OhListBind);

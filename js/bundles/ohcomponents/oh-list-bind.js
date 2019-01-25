/**
 * This is a data binding non-visible component.
 * 
 * It waits for the target, identified by the "for" attribute
 * to be ready and then loads the "listhelper" es6 module.
 * The helper module is expected to export:
 * - mixins: A list of mixins to apply to list item components
 * - schema: An optional json-schema for the text-editor
 * - runtimekeys: A list of keys that should be filtered out for the text-editor
 * - store: An OH store.
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
        if (!this.store) {
            this.store.dispose();
            delete this.store;
        }
    }
    async startList(module) {
        if (this.store) this.store.dispose();
        this.store = new module.StoreView();
        this.target.start(this.store, module.mixins, module.schema, module.runtimekeys);
        this.target.items = await this.store.getall();
    }
}

customElements.define('oh-list-bind', OhListBind);

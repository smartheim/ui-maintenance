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
class OhVueBind extends HTMLElement {
    constructor() {
        super();
        this.style.display = "none";
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

        const adapter = this.getAttribute("adapter");
        import('./objectadapter/' + adapter + '.js')
            .then(this.start.bind(this)).catch(e => {
                console.log("object bind failed", e);
                this.target.error = e;
            });
    }
    disconnectedCallback() {
        if (!this.modeladapter) {
            this.modeladapter.dispose();
            delete this.modeladapter;
        }
    }
    async start(module) {
        if (this.modeladapter) this.modeladapter.dispose();
        this.modeladapter = new module.StoreView();
        this.target.start(this.modeladapter, module.mixins, module.schema, module.runtimekeys);
        this.target.items = await this.modeladapter.getall();
    }
}

customElements.define('oh-object-bind', OhVueBind);

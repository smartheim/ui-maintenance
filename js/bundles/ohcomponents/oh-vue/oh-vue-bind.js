import { importModule } from "./importModule";

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
        let target = document.getElementById(forid);
        if (!target) {
            target = this.nextElementSibling;
        }
        if (!target.ok) {
            target.addEventListener("load", this.connectedCallback.bind(this), { once: true, passive: true });
            return;
        }

        const adapter = this.getAttribute("adapter");
        importModule('./js/mixins/' + adapter + '.js')
            .then(async (module) => {
                target.start(module.mixins);
            })
            .catch(e => console.log("adapter bind failed", e));
    }
    disconnectedCallback() {
    }
}

customElements.define('oh-vue-bind', OhVueBind);

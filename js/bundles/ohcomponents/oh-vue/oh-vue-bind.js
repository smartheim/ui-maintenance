import { importModule } from "./importModule";

/**
 * This is a non-visible data binding component and serves as *Controller*
 * in the MVA (Model-View-Adapter) concept.
 * 
 * It waits for the target, identified by the "for" attribute
 * to be ready and then loads the "adapter" es6 module.
 * 
 * The helper module is expected to export:
 * - mixins: A list of mixins to apply to list-item components
 * - components: An optional json-schema for the text-editor
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

        const usebundle = this.hasAttribute("usebundle");
        const adapter = this.getAttribute("adapter");
        const path = usebundle ? './js/' : './js/mixins/';
        importModule(path + adapter + '.js')
            .then(async (module) => {
                target.start(module.mixins);
            })
            .catch(e => console.log("adapter bind failed", e));
    }
    disconnectedCallback() {
    }
}

customElements.define('oh-vue-bind', OhVueBind);

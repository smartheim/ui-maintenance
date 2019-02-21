import { importModule } from "../../../common/importModule";

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

    this.target = target;

    let contextdata = {};
    if (this.hasAttribute("contextfrom") && this.hasAttribute("sourceproperty")) {
      const targetNode = document.querySelector(this.getAttribute("contextfrom"));
      const sourceProperty = this.getAttribute("sourceproperty") || "contextdata";
      contextdata = targetNode[sourceProperty];
    }

    if (this.hasAttribute("adapter")) {
      const adapter = this.getAttribute("adapter");
      importModule('./js/' + adapter + '.js')
        .then((module) => {
          target.start(module.mixins, contextdata);
        })
        .catch(e => console.log("adapter bind failed", e));
    } else {
      target.start([], contextdata);
    }
  }
  disconnectedCallback() {
  }
  set context(data) {
    if (this.target) this.target.updateContext(data);
  }
}

customElements.define('oh-vue-bind', OhVueBind);

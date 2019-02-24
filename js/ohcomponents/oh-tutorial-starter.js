import { importModule } from "../_common/importModule";
/**
 * Extracts a value from the URL query string ("queryParameter") and adds it as an attribute
 * to the referenced destination via element ID given by "for" or by using the next sibling element.
 */
class OhTutorialStarter extends HTMLElement {
  constructor() {
    super();
    this.clickBound = () => this.clicked();
  }
  connectedCallback() {
    this.style.display = "none";
    const forid = this.getAttribute("for");
    this.target = document.getElementById(forid);
    if (!this.target) {
      this.target = this.nextElementSibling;
    }
    if (!this.target) {
      console.warn("Failed to find target", forid);
      return;
    }
    this.target.addEventListener("click", this.clickBound, { passive: true });
  }
  disconnectedCallback() {
    if (this.target) this.target.removeEventListener("click", this.clickBound, { passive: true });
  }
  async clicked() {
    let m = await importModule('./js/tutorial.js');
    m.startTutorial(this.getAttribute("subject"));
  }
}

customElements.define('oh-tutorial-starter', OhTutorialStarter);

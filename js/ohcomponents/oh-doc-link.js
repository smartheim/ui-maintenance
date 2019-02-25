/**
 * @category Data Components
 * @customelement oh-doc-link
 * @description This is a tandem component for ui-context-help and alike.
 * 
 * The target component is expected to have this API interface:
 * .reload() // Optional: For reloading content
 * .checkCacheAndLoad() // Optional: For displaying the original, cached content if that was temporarly overwritten
 * .contenturl OR .url // property for setting a new url
 * .contextdata // If this is existing it will be set to null before setting the url
 * 
 * Attributes:
 * - href // The destination url
 * - toggle // If set will toggle a body class "showcontext"
 * - reload // If set will call target.reload() if no "href" is also set
 * - home // If set will call target.checkCacheAndLoad() if no "href" is also set
 * 
 * Usage: <oh-doc-link href="some-link-to-markdown-or-html"><a href="#">Documentation</a></oh-doc-link>
 */
class OhDocLink extends HTMLElement {
  constructor() {
    super();
    let tmpl = document.createElement('template');
    tmpl.innerHTML = `<slot></slot>`;
    let shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(tmpl.content.cloneNode(true));
    this.slotListenerBound = () => this.slotListener();
    this.context = null;
  }
  static get observedAttributes() {
    return ['href'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.href = this.getAttribute("href");
    this.target = this.hasAttribute("target") ? this.getAttribute("target") : "ui-context-help";
    this.toggle = this.hasAttribute("toggle");
    this.reload = this.hasAttribute("reload");
    this.show = this.hasAttribute("show");
    this.home = this.hasAttribute("home");
  }
  connectedCallback() {
    this.attributeChangedCallback();
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', this.slotListenerBound, { passive: true });
  }
  disconnectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');
    slot.removeEventListener('slotchange', this.slotListenerBound, { passive: true });
  }

  /**
   * As soon as the <slot> got a child, this is called.
   * Add the on-click lister to all child nodes.
   */
  slotListener() {
    if (!this.shadowRoot) return;
    const slot = this.shadowRoot.querySelector('slot');
    const nodes = slot.assignedNodes();
    if (!nodes.length) return;
    for (var node of nodes) {
      node.onclick = (e) => this.clickListener(e);
    }
    this.onclick = (e) => this.clickListener(e);
  }

  /**
   * Add "showcontext" class to body and tell the target
   * web component the new url and context data.
   */
  clickListener(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.toggle)
      document.querySelector('body').classList.toggle('showcontext');
    else if (this.show)
      document.querySelector('body').classList.add('showcontext');
    var el = document.querySelector(this.target);
    if (!el) {
      console.warn("Did not find target element: ", this.target);
      return;
    }

    if (this.href) {
      el.contextdata = this.context;
      if (el.contenturl)
        el.contenturl = this.href;
      else
        el.url = this.href;
    } else if (this.home) {
      el.home();
    } else if (this.reload) {
      el.reload();
    }
  }
}

customElements.define('oh-doc-link', OhDocLink);
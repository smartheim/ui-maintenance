/**
 * This is a tandem component for oh-context-help.
 * Usage: <oh-doc-link><a href="#" data-href="some-link-to-markdown-or-html">Documentation</a></oh-doc-link>
 */
class OhDocLink extends HTMLElement {
  constructor() {
    super();
    let tmpl = document.createElement('template');
    tmpl.innerHTML = `<slot></slot>`;
    let shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(tmpl.content.cloneNode(true));
    this.slotListenerBound = () => this.slotListener();
    this.toggle = this.hasAttribute("toggle");
    this.reload = this.hasAttribute("reload");
    this.home = this.hasAttribute("home");
    this.context = null;
    this.attributeChangedCallback();
  }
  static get observedAttributes() {
    return ['href'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.href = this.getAttribute("href");
  }
  connectedCallback() {
    const slot = this.shadowRoot.querySelector('slot');
    slot.addEventListener('slotchange', this.slotListenerBound);
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
   * Add "showcontext" class to body and tell the oh-context-help
   * web component the new url and context data.
   */
  clickListener(e) {
    e.preventDefault();
    e.stopPropagation();
    if (this.toggle)
      document.querySelector('body').classList.toggle('showcontext');
    else
      document.querySelector('body').classList.add('showcontext');
    var el = document.querySelector("oh-context-help");
    if (!el) return;
    if (this.href) {
      el.contextdata = this.context;
      el.contenturl = this.href;
    } else if (this.home) {
      el.checkCacheAndLoad();
    }else if (this.reload) {
      el.reset();
    }
  }
}

customElements.define('oh-doc-link', OhDocLink);
/**
 * @category Web Components
 * @customelement nav-breadcrumb
 * @description A navigation breadcrumb.
 * This is rendered as a disabled <a> tag if no parent is known.
 * 
 * A parent is declared via a link tag in the header, like:
 * <link rel="parent" href="rules.html" data-title="Rule list" data-idkey="uid" />
 * 
 * If you do not set the "data-title" attribute, then "Home" will be used.
 * 
 * The "data-idkey" attribute is used to extract that parameter from the query url.
 * It will be used for the parent links hash.
 * So if the page has an url of "http://abc.org?uid=myThing", then the parent link
 * will be constructed as "http://abc.org/rules.html#uid=myThing".
 * 
 * @attribute label The label for the current page. Reactive.
 * 
 * @example <caption>An example</caption>
 * <nav-breadcrumb label="My page"></nav-breadcrumb>
 */
class NavBreadcrumb extends HTMLElement {
  constructor() {
    super();
  }
  static get observedAttributes() {
    return ['label'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == "label") {
      this.label = this.getAttribute("label");
      this.render();
    }
  }
  connectedCallback() {
    this.style.display = "block";

    const link = document.querySelector('link[rel="parent"]');
    if (link) {
      let paramAsHash = link.dataset.idkey;
      if (paramAsHash) {
        paramAsHash = new URL(window.location).searchParams.get(paramAsHash);
        if (!paramAsHash)
          paramAsHash = "";
        else
          paramAsHash = paramAsHash.replace(/:/g, '_'); // Replace potential colons, as they are not valid for IDs
      }

      this.parentLink = link.href + "#" + paramAsHash;
      this.parent = link.dataset.title ? link.dataset.title : "Home";
    }

    if (this.hasAttribute("label"))
      this.attributeChangedCallback("label");
    else {
      if (!this.label)
        this.label = document.title;
      this.render();
    }
  }
  render() {
    while (this.firstChild) { this.firstChild.remove(); }
    this.innerHTML = `
      ${this.parentLink ? `<a href="${this.parentLink}">${this.parent}</a> <span>→</span>` : ``}
      <span>${this.label}</span>`;
  }
}

customElements.define('nav-breadcrumb', NavBreadcrumb);

/**
 * @category Web Components
 * @customelement nav-buttons
 * @description Prev/Next navigation buttons
 * 
 * @example <caption>An example</caption>
 * <nav-buttons></nav-buttons>
 */
class NavButtons extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.style.display = "block";
    this.prevLink = this.hasAttribute("prevLink") ? this.getAttribute("prevLink") : null;
    this.nextLink = this.hasAttribute("nextLink") ? this.getAttribute("nextLink") : null;

    if (!this.prevLink) {
      const link = document.querySelector('link[rel="prev"]');
      if (link) this.prevLink = link.href;
      else this.prevLink = "";
    }

    if (!this.nextLink) {
      const link = document.querySelector('link[rel="next"]');
      if (link) this.nextLink = link.href;
      else this.nextLink = "";
    }

    this.prevEnabled = this.prevLink != "";
    this.nextEnabled = this.nextLink != "";

    while (this.firstChild) { this.firstChild.remove(); }

    this.innerHTML = `
    <a data-no-reload="nav" class="btn btn-primary col-2 mx-2 ${this.prevEnabled ? "" : "disabled"}" href="${this.prevLink}">Back</a>
    <a data-no-reload="nav" class="btn btn-primary col-2 mx-2 ${this.nextEnabled ? "" : "disabled"}" href="${this.nextLink}">Next</a>`;
  }
}

customElements.define('nav-buttons', NavButtons);

/**
 * Class to handle a loaded page
 */
class Page {
  constructor(dom) {
    this.dom = dom;
  }

  /**
   * Performs a querySelector in the page content or document
   *
   * @param  {string} selector
   * @param  {DocumentElement} context
   *
   * @return {Node}
   */
  querySelector(selector, context = this.dom) {
    const result = context.querySelector(selector);

    if (!result) {
      throw new Error(`Not found the target "${selector}"`);
    }

    return result;
  }

  /**
   * Performs a querySelector
   *
   * @param  {string} selector
   * @param  {DocumentElement} context
   *
   * @return {Nodelist}
   */
  querySelectorAll(selector, context = this.dom) {
    const result = context.querySelectorAll(selector);

    if (!result.length) {
      throw new Error(`Not found the target "${selector}"`);
    }

    return result;
  }

  /**
   * Removes elements in the document
   *
   * @param  {String} selector
   *
   * @return {this}
   */
  removeContent(selector) {
    this.querySelectorAll(selector, document).forEach(element =>
      element.remove()
    );

    return this;
  }

  async timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Replace an element in the document by an element in the page
   * Optionally, it can execute a callback to the new inserted element
   *
   * @param  {String} selector
   * @param  {Function|undefined} callback
   *
   * @return {this}
   */
  async replaceContent(selector = 'body', options = null) {
    const content = this.querySelector(selector);

    if (!options || !options.animationClass)
      this.querySelector(selector, document).replaceWith(content);
    else {
      try {
        const oldMain = this.querySelector(selector, document);
        const duration = options.duration || 1;
        // First insert the new element, just before the old one.
        // The grid layout will make sure the old one is still at the front
        oldMain.parentNode.insertBefore(content, oldMain);
        // Add animation class and remove old after timeout
        oldMain.classList.add(options.animationClass);
        await this.timeout(duration * 1000);
        oldMain.remove();
      } catch (e) {
        console.warn("ANIM failed", e);
      }
    }

    if (options && typeof options.callback === 'function') {
      options.callback(content);
    }

    return this;
  }

  /**
   * Appends the content of an element in the page in other element in the document
   * Optionally, it can execute a callback for each new inserted elements
   *
   * @param  {String} selector
   * @param  {Function|undefined} callback
   *
   * @return {this}
   */
  appendContent(target = 'body', callback = undefined) {
    const content = Array.from(this.querySelector(target).childNodes);
    const fragment = document.createDocumentFragment();

    content.forEach(item => fragment.appendChild(item));

    this.querySelector(target, document).append(fragment);

    if (typeof callback === 'function') {
      content
        .filter(item => item.nodeType === Node.ELEMENT_NODE)
        .forEach(callback);
    }

    return this;
  }

  replaceNavReferences(context = 'head') {
    const documentContext = this.querySelector(context, document);
    const pageContext = this.querySelector(context);

    documentContext.querySelectorAll('link[rel="prev"]').forEach(link => link.remove());
    documentContext.querySelectorAll('link[rel="next"]').forEach(link => link.remove());
    documentContext.querySelectorAll('link[rel="parent"]').forEach(link => link.remove());

    var link;
    link = pageContext.querySelector('link[rel="prev"]');
    if (link) documentContext.append(link);
    link = pageContext.querySelector('link[rel="next"]');
    if (link) documentContext.append(link);
    link = pageContext.querySelector('link[rel="parent"]');
    if (link) documentContext.append(link);

    return this;
  }

  addNewStyles(context = 'head') {
    const currentPage = this.querySelector(context, document);
    const newPage = this.querySelector(context);

    // Inline styles are perfomed immediately
    currentPage
      .querySelectorAll('style')
      .forEach(style => style.remove());
    newPage
      .querySelectorAll('style')
      .forEach(style => currentPage.append(style));


    this.oldLinks = Array.from(
      currentPage.querySelectorAll('link[rel="stylesheet"]')
    );

    const newLinks = Array.from(
      newPage.querySelectorAll('link[rel="stylesheet"]')
    ).filter(newLink => {
      let found = this.oldLinks.findIndex(oldLink => oldLink.href == newLink.href);
      if (found != -1) {
        this.oldLinks.splice(found, 1);
        return false;
      }
      return true;
    });

    // Don't remove stylesheets with the data-keep flag like in:
    // <link rel="stylesheet" href="css/tutorial.css" type="text/css" data-keep="true" />
    this.oldLinks = this.oldLinks.filter(e => !e.dataset.keep);

    return Promise.all(
      newLinks.map(
        link =>
          new Promise((resolve, reject) => {
            link.addEventListener('load', resolve);
            link.addEventListener('error', reject);
            currentPage.append(link);
          })
      )
    ).then(() => this);
  }

  removeOldStyles(context = 'head') {
    for (let link of this.oldLinks) {
      link.remove();
    }
    delete this.oldLinks;
    return this;
  }

  /**
   * Change the scripts of the current page
   *
   * @param {string} context
   *
   * @return Promise
   */
  replaceScripts(context = 'head') {
    const documentContext = this.querySelector(context, document);
    const pageContext = this.querySelector(context);
    const oldScripts = Array.from(
      documentContext.querySelectorAll('script')
    );
    const newScripts = Array.from(pageContext.querySelectorAll('script'));

    oldScripts.forEach(script => {
      if (!script.src) {
        script.remove();
        return;
      }

      const index = newScripts.findIndex(
        newScript => newScript.src === script.src
      );

      if (index === -1) {
        script.remove();
      } else {
        newScripts.splice(index, 1);
      }
    });

    return Promise.all(
      newScripts.map(
        script =>
          new Promise((resolve, reject) => {
            const scriptElement = document.createElement('script');

            scriptElement.type = script.type || 'text/javascript';
            scriptElement.defer = script.defer;
            scriptElement.async = script.async;

            if (script.src) {
              scriptElement.src = script.src;
              scriptElement.addEventListener('load', resolve);
              scriptElement.addEventListener('error', reject);
              documentContext.append(scriptElement);
              return;
            }

            scriptElement.innerText = script.innerText;
            documentContext.append(script);
            resolve();
          })
      )
    ).then(() => Promise.resolve(this));
  }
}

/**
 * Class to load an url and generate a page with the result
 */
class UrlLoader {
  constructor(url) {
    this.url = url;
    this.html = null;
    this.state = {};
  }

  /**
   * Performs a fetch to the url and return a promise
   *
   * @return {Promise}
   */
  fetch() {
    return fetch(this.url);
  }

  /**
   * Go natively to the url. Used as fallback
   */
  fallback() {
    document.location = this.url;
  }

  /**
   * Load the page with the content of the page
   *
   * @return {Promise}
   */
  async load(replace = false, state = null) {
    if (this.html) {
      const page = new Page(parseHtml(this.html));
      this.setState(page.dom.title, replace, state);
      return page;
    }

    const html = await this.fetch()
      .then(res => {
        if (res.status < 200 || res.status >= 300) {
          throw new Error(`The request status code is ${res.status}`);
        }

        return res;
      })
      .then(res => res.text());

    if (this.html !== false) {
      this.html = html;
    }

    const page = new Page(parseHtml(html));
    this.setState(page.dom.title, replace, state);
    return page;
  }

  setState(title, replace = false, state = null) {
    document.title = title;

    if (state) {
      this.state = state;
    }

    if (this.url !== document.location.href) {
      if (replace) {
        history.replaceState(this.state, null, this.url);
      } else {
        history.pushState(this.state, null, this.url);
      }
    } else {
      history.replaceState(this.state, null, this.url);
    }
  }
}

/**
 * Class to submit a form and generate a page with the result
 */
class FormLoader extends UrlLoader {
  constructor(form) {
    let url = form.action.split('?', 2).shift();
    const method = (form.method || 'GET').toUpperCase();

    if (method === 'GET') {
      url += '?' + new URLSearchParams(new FormData(form));
    }

    super(url);

    this.html = false;
    this.method = method;
    this.form = form;
  }

  /**
   * Submit natively the form. Used as fallback
   */
  fallback() {
    this.form.submit();
  }

  /**
   * Performs a fetch with the form data and return a promise
   *
   * @return {Promise}
   */
  fetch() {
    const options = { method: this.method };

    if (this.method === 'POST') {
      options.body = new FormData(this.form);
    }

    return fetch(this.url, options);
  }
}

function parseHtml(html) {
  html = html.trim().replace(/^\<!DOCTYPE html\>/i, '');
  const doc = document.implementation.createHTMLDocument();
  doc.documentElement.innerHTML = html;

  return doc;
}

/**
 * Class to handle the navigation history
 */
class Navigator {
  constructor(handler) {
    this.handler = handler;
    this.fnRequirePageReloadList = [
      async (el, url) => !(url && url.indexOf(`${document.location.protocol}//${document.location.host}`) === 0),
      async (el, url) => url === document.location.href ? null : false,
      async (el, url) => new URL(url).hash === "#" ? null : false

    ];
  }

  /**
   * Add a filter. Depending on the return value a page will be served via
   * partial html replacement, a complete page reload or the page navigation will
   * be aborted.
   * 
   * @param {fnRequirePageReloadPrototype} fnRequirePageReload The filter function accepting two arguments: the element clicked and url
   *
   * @return {this}
   */
  addFilter(fnRequirePageReload) {
    this.fnRequirePageReloadList.push(fnRequirePageReload);
    return this;
  }

  async consultFilters(event, el, url) {
    for (let fnRequirePageReload of this.fnRequirePageReloadList) {
      const r = await fnRequirePageReload(el, url);
      if (r === true) {
        event.stopPropagation();
        // Default handling. Clone the old event and attach a "alreadyHandled" property.
        // The event will arrive at the a.click handler further down, but not handled
        // ourself anymore when that property is noticed.
        const new_e = new event.constructor(event.type, event);
        new_e.alreadyHandled = true;
        el.dispatchEvent(new_e);
        return false;
      } else if (r === null)
        return false;
    }
    return true;
  }

  /**
   * Init the navigator, attach the events to capture the history changes
   *
   * @return {this}
   */
  init() {
    var handlePopState = (event) => {
      this.go(document.location.href, event);
    };

    delegate('click', 'a', async (event, link) => {
      window.removeEventListener('popstate', handlePopState);
      if (event.alreadyHandled) return;
      event.preventDefault();
      if (await this.consultFilters(event, link, link.href)) this.go(link.href, event);
      setTimeout(() => window.addEventListener('popstate', handlePopState), 0);
    });

    delegate('submit', 'form', (event, form) => {
      if (event.alreadyHandled) return;
      if (this.consultFilters(event, form, resolve(form.action)))
        this.submit(form, event);
    });

    window.addEventListener('popstate', handlePopState);

    return this;
  }

  /**
   * Go to other url.
   *
   * @param  {string} url
   * @param  {Event} event
   *
   * @return {Promise|void}
   */
  go(url, event) {
    return this.load(new UrlLoader(resolve(url)), event);
  }

  /**
   * Submit a form via ajax
   *
   * @param  {HTMLFormElement} form
   * @param  {Event} event
   *
   * @return {Promise}
   */
  submit(form, event) {
    return this.load(new FormLoader(form), event);
  }

  /**
   * Execute a page loader
   *
   * @param  {UrlLoader|FormLoader} loader
   * @param  {Event} event
   *
   * @return {Promise}
   */
  load(loader, event) {
    try {
      return this.handler(loader, event);
    } catch (err) {
      console.error(err);
      loader.fallback();

      return Promise.resolve();
    }
  }
}

const link = document.createElement('a');

function resolve(url) {
  link.setAttribute('href', url);
  return link.href;
}

function delegate(event, selector, callback) {
  document.addEventListener(
    event,
    function (event) {
      for (
        let target = event.target;
        target && target != this;
        target = target.parentNode
      ) {
        if (target.matches(selector)) {
          callback.call(target, event, target);
          break;
        }
      }
    },
    true
  );
}

/**
 * @category Web Components
 * @customelement nav-ajax-page-load
 * @description 
 * To avoid flickering of the website-shell, an ajax loading mechanism
 * is used. This is a progressive enhancement and the page works without
 * it as well.
 * 
 * The script only replaces part of the page with the downloaded content.
 * That is:
 * - All styles and scripts linked in the body section
 * - <main>, <footer>, <section.header>, <aside>, <nav> is replaced.
 * - "prev"/"next"/"parent" ref links in <head> are replaced.
 * - A "DOMContentLoaded" event is emitted after loading
 * 
 * A not-found message is shown if loading failed.
 * 
 * A replacement does not happen if the link points to the same page or ("#").
 * 
 * @see https://github.com/oom-components/page-loader
 * @example <caption>An example</caption>
 * <nav-ajax-page-load></nav-ajax-page-load>
 */
class NavAjaxPageLoad extends HTMLElement {
  constructor() {
    super();

    this.nav = new Navigator((loader, event) => {
      if (event && event.target && event.target.classList)
        event.target.classList.add("disabled");
      loader.load()
        .then(page => page.addNewStyles("body"))
        .then(page => this.checkReload(event.target, "aside") ? page.replaceContent('aside') : page)
        .then(page => this.checkReload(event.target, "nav") ? page.replaceContent('body>nav') : page)
        .then(page => page.replaceNavReferences())
        .then(page => page.replaceContent('footer'))
        .then(page => page.replaceContent('section.header'))
        .then(page => page.replaceContent('main', { animationClass: "bouncyFadeOut", duration: 0.7 }))
        .then(page => page.removeOldStyles("body"))
        .then(page => page.replaceScripts("body"))
        .then(() => this.prepareLoadedContent(event))
        .catch(e => { // Connection lost? Check login
          console.log("Failed to load page:", e);
          document.querySelector("main").innerHTML = `
<main class='centered m-4'>
  <section class='card p-4'>
    <h4>Error loading the page ☹</h4>
    ${e.message ? e.message : e}
  </section>
</main>
`;
          document.dispatchEvent(new Event('FailedLoading'));
        });
    });

    // Perform default action if clicking on a same page link where only the hash differs.
    // Required for anchor links
    this.nav.addFilter((el, url) => ((el && el.dataset && !el.dataset.noReload) && new URL(url).pathname == window.location.pathname));

    // Abort page request on demand
    this.nav.addFilter((el, url) => {
      if (this.hasUnsavedChanges) {
        const r = window.confirm("You have unsaved changes. Dismiss them?");
        if (r) this.hasUnsavedChanges = false;
        return r ? false : null; // Perform a normal xhr page replacement or abort the request
      }
      return false;
    });

    this.boundUnsavedChanges = (event) => {
      this.hasUnsavedChanges = event.detail;
      window.removeEventListener("beforeunload", this.boundBeforeUnload, { passive: false });
      if (this.hasUnsavedChanges) window.addEventListener("beforeunload", this.boundBeforeUnload, { passive: false });
    };
    this.boundBeforeUnload = (event) => {
      if (this.hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = 'You have unsaved changes which will not be saved.';
        return event.returnValue;
      }
    };
  }

  prepareLoadedContent(event) {
    if (event.target && event.target.classList) event.target.classList.remove("disabled");
    setTimeout(() => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.dispatchEvent(new Event('DOMContentLoaded'));
    }, 50);
  }

  checkReload(target, section) {
    const d = (target && target.dataset && target.dataset.noReload) ? target.dataset.noReload.split(",") : [];
    return !d.includes(section);
  }

  connectedCallback() {
    this.nav.init();

    document.addEventListener("unsavedchanges", this.boundUnsavedChanges, { passive: true });

    if (localStorage.getItem('skiphome') != "true") return;
    const hasRedirected = sessionStorage.getItem("redirected");
    if (!hasRedirected) {
      sessionStorage.setItem("redirected", "true");
      if (window.location.pathname === "/index.html") {
        this.nav.go("maintenance.html");
        return;
      }
    }
  }
  disconnectedCallback() {
    document.removeEventListener("unsavedchanges", this.boundUnsavedChanges, { passive: true });
    window.removeEventListener("beforeunload", this.boundBeforeUnload, { passive: false });
  }
}

customElements.define('nav-ajax-page-load', NavAjaxPageLoad);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const directives = new WeakMap();
const isDirective = (o) => {
    return typeof o === 'function' && directives.has(o);
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * True if the custom elements polyfill is in use.
 */
const isCEPolyfill = window.customElements !== undefined &&
    window.customElements.polyfillWrapFlushCallback !==
        undefined;
/**
 * Removes nodes, starting from `startNode` (inclusive) to `endNode`
 * (exclusive), from `container`.
 */
const removeNodes = (container, startNode, endNode = null) => {
    let node = startNode;
    while (node !== endNode) {
        const n = node.nextSibling;
        container.removeChild(node);
        node = n;
    }
};

/**
 * @license
 * Copyright (c) 2018 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * A sentinel value that signals that a value was handled by a directive and
 * should not be written to the DOM.
 */
const noChange = {};
/**
 * A sentinel value that signals a NodePart to fully clear its content.
 */
const nothing = {};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An expression marker with embedded unique key to avoid collision with
 * possible text in templates.
 */
const marker = `{{lit-${String(Math.random()).slice(2)}}}`;
/**
 * An expression marker used text-positions, multi-binding attributes, and
 * attributes with markup-like text values.
 */
const nodeMarker = `<!--${marker}-->`;
const markerRegex = new RegExp(`${marker}|${nodeMarker}`);
/**
 * Suffix appended to all bound attribute names.
 */
const boundAttributeSuffix = '$lit$';
/**
 * An updateable Template that tracks the location of dynamic parts.
 */
class Template {
    constructor(result, element) {
        this.parts = [];
        this.element = element;
        let index = -1;
        let partIndex = 0;
        const nodesToRemove = [];
        const _prepareTemplate = (template) => {
            const content = template.content;
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
            // null
            const walker = document.createTreeWalker(content, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
            // Keeps track of the last index associated with a part. We try to delete
            // unnecessary nodes, but we never want to associate two different parts
            // to the same index. They must have a constant node between.
            let lastPartIndex = 0;
            while (walker.nextNode()) {
                index++;
                const node = walker.currentNode;
                if (node.nodeType === 1 /* Node.ELEMENT_NODE */) {
                    if (node.hasAttributes()) {
                        const attributes = node.attributes;
                        // Per
                        // https://developer.mozilla.org/en-US/docs/Web/API/NamedNodeMap,
                        // attributes are not guaranteed to be returned in document order.
                        // In particular, Edge/IE can return them out of order, so we cannot
                        // assume a correspondance between part index and attribute index.
                        let count = 0;
                        for (let i = 0; i < attributes.length; i++) {
                            if (attributes[i].value.indexOf(marker) >= 0) {
                                count++;
                            }
                        }
                        while (count-- > 0) {
                            // Get the template literal section leading up to the first
                            // expression in this attribute
                            const stringForPart = result.strings[partIndex];
                            // Find the attribute name
                            const name = lastAttributeNameRegex.exec(stringForPart)[2];
                            // Find the corresponding attribute
                            // All bound attributes have had a suffix added in
                            // TemplateResult#getHTML to opt out of special attribute
                            // handling. To look up the attribute value we also need to add
                            // the suffix.
                            const attributeLookupName = name.toLowerCase() + boundAttributeSuffix;
                            const attributeValue = node.getAttribute(attributeLookupName);
                            const strings = attributeValue.split(markerRegex);
                            this.parts.push({ type: 'attribute', index, name, strings });
                            node.removeAttribute(attributeLookupName);
                            partIndex += strings.length - 1;
                        }
                    }
                    if (node.tagName === 'TEMPLATE') {
                        _prepareTemplate(node);
                    }
                }
                else if (node.nodeType === 3 /* Node.TEXT_NODE */) {
                    const data = node.data;
                    if (data.indexOf(marker) >= 0) {
                        const parent = node.parentNode;
                        const strings = data.split(markerRegex);
                        const lastIndex = strings.length - 1;
                        // Generate a new text node for each literal section
                        // These nodes are also used as the markers for node parts
                        for (let i = 0; i < lastIndex; i++) {
                            parent.insertBefore((strings[i] === '') ? createMarker() :
                                document.createTextNode(strings[i]), node);
                            this.parts.push({ type: 'node', index: ++index });
                        }
                        // If there's no text, we must insert a comment to mark our place.
                        // Else, we can trust it will stick around after cloning.
                        if (strings[lastIndex] === '') {
                            parent.insertBefore(createMarker(), node);
                            nodesToRemove.push(node);
                        }
                        else {
                            node.data = strings[lastIndex];
                        }
                        // We have a part for each match found
                        partIndex += lastIndex;
                    }
                }
                else if (node.nodeType === 8 /* Node.COMMENT_NODE */) {
                    if (node.data === marker) {
                        const parent = node.parentNode;
                        // Add a new marker node to be the startNode of the Part if any of
                        // the following are true:
                        //  * We don't have a previousSibling
                        //  * The previousSibling is already the start of a previous part
                        if (node.previousSibling === null || index === lastPartIndex) {
                            index++;
                            parent.insertBefore(createMarker(), node);
                        }
                        lastPartIndex = index;
                        this.parts.push({ type: 'node', index });
                        // If we don't have a nextSibling, keep this node so we have an end.
                        // Else, we can remove it to save future costs.
                        if (node.nextSibling === null) {
                            node.data = '';
                        }
                        else {
                            nodesToRemove.push(node);
                            index--;
                        }
                        partIndex++;
                    }
                    else {
                        let i = -1;
                        while ((i = node.data.indexOf(marker, i + 1)) !==
                            -1) {
                            // Comment node has a binding marker inside, make an inactive part
                            // The binding won't work, but subsequent bindings will
                            // TODO (justinfagnani): consider whether it's even worth it to
                            // make bindings in comments work
                            this.parts.push({ type: 'node', index: -1 });
                        }
                    }
                }
            }
        };
        _prepareTemplate(element);
        // Remove text binding nodes after the walk to not disturb the TreeWalker
        for (const n of nodesToRemove) {
            n.parentNode.removeChild(n);
        }
    }
}
const isTemplatePartActive = (part) => part.index !== -1;
// Allows `document.createComment('')` to be renamed for a
// small manual size-savings.
const createMarker = () => document.createComment('');
/**
 * This regex extracts the attribute name preceding an attribute-position
 * expression. It does this by matching the syntax allowed for attributes
 * against the string literal directly preceding the expression, assuming that
 * the expression is in an attribute-value position.
 *
 * See attributes in the HTML spec:
 * https://www.w3.org/TR/html5/syntax.html#attributes-0
 *
 * "\0-\x1F\x7F-\x9F" are Unicode control characters
 *
 * " \x09\x0a\x0c\x0d" are HTML space characters:
 * https://www.w3.org/TR/html5/infrastructure.html#space-character
 *
 * So an attribute is:
 *  * The name: any character except a control character, space character, ('),
 *    ("), ">", "=", or "/"
 *  * Followed by zero or more space characters
 *  * Followed by "="
 *  * Followed by zero or more space characters
 *  * Followed by:
 *    * Any character except space, ('), ("), "<", ">", "=", (`), or
 *    * (") then any non-("), or
 *    * (') then any non-(')
 */
const lastAttributeNameRegex = /([ \x09\x0a\x0c\x0d])([^\0-\x1F\x7F-\x9F \x09\x0a\x0c\x0d"'>=/]+)([ \x09\x0a\x0c\x0d]*=[ \x09\x0a\x0c\x0d]*(?:[^ \x09\x0a\x0c\x0d"'`<>=]*|"[^"]*|'[^']*))$/;

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * An instance of a `Template` that can be attached to the DOM and updated
 * with new values.
 */
class TemplateInstance {
    constructor(template, processor, options) {
        this._parts = [];
        this.template = template;
        this.processor = processor;
        this.options = options;
    }
    update(values) {
        let i = 0;
        for (const part of this._parts) {
            if (part !== undefined) {
                part.setValue(values[i]);
            }
            i++;
        }
        for (const part of this._parts) {
            if (part !== undefined) {
                part.commit();
            }
        }
    }
    _clone() {
        // When using the Custom Elements polyfill, clone the node, rather than
        // importing it, to keep the fragment in the template's document. This
        // leaves the fragment inert so custom elements won't upgrade and
        // potentially modify their contents by creating a polyfilled ShadowRoot
        // while we traverse the tree.
        const fragment = isCEPolyfill ?
            this.template.element.content.cloneNode(true) :
            document.importNode(this.template.element.content, true);
        const parts = this.template.parts;
        let partIndex = 0;
        let nodeIndex = 0;
        const _prepareInstance = (fragment) => {
            // Edge needs all 4 parameters present; IE11 needs 3rd parameter to be
            // null
            const walker = document.createTreeWalker(fragment, 133 /* NodeFilter.SHOW_{ELEMENT|COMMENT|TEXT} */, null, false);
            let node = walker.nextNode();
            // Loop through all the nodes and parts of a template
            while (partIndex < parts.length && node !== null) {
                const part = parts[partIndex];
                // Consecutive Parts may have the same node index, in the case of
                // multiple bound attributes on an element. So each iteration we either
                // increment the nodeIndex, if we aren't on a node with a part, or the
                // partIndex if we are. By not incrementing the nodeIndex when we find a
                // part, we allow for the next part to be associated with the current
                // node if neccessasry.
                if (!isTemplatePartActive(part)) {
                    this._parts.push(undefined);
                    partIndex++;
                }
                else if (nodeIndex === part.index) {
                    if (part.type === 'node') {
                        const part = this.processor.handleTextExpression(this.options);
                        part.insertAfterNode(node.previousSibling);
                        this._parts.push(part);
                    }
                    else {
                        this._parts.push(...this.processor.handleAttributeExpressions(node, part.name, part.strings, this.options));
                    }
                    partIndex++;
                }
                else {
                    nodeIndex++;
                    if (node.nodeName === 'TEMPLATE') {
                        _prepareInstance(node.content);
                    }
                    node = walker.nextNode();
                }
            }
        };
        _prepareInstance(fragment);
        if (isCEPolyfill) {
            document.adoptNode(fragment);
            customElements.upgrade(fragment);
        }
        return fragment;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The return type of `html`, which holds a Template and the values from
 * interpolated expressions.
 */
class TemplateResult {
    constructor(strings, values, type, processor) {
        this.strings = strings;
        this.values = values;
        this.type = type;
        this.processor = processor;
    }
    /**
     * Returns a string of HTML used to create a `<template>` element.
     */
    getHTML() {
        const endIndex = this.strings.length - 1;
        let html = '';
        for (let i = 0; i < endIndex; i++) {
            const s = this.strings[i];
            // This exec() call does two things:
            // 1) Appends a suffix to the bound attribute name to opt out of special
            // attribute value parsing that IE11 and Edge do, like for style and
            // many SVG attributes. The Template class also appends the same suffix
            // when looking up attributes to create Parts.
            // 2) Adds an unquoted-attribute-safe marker for the first expression in
            // an attribute. Subsequent attribute expressions will use node markers,
            // and this is safe since attributes with multiple expressions are
            // guaranteed to be quoted.
            const match = lastAttributeNameRegex.exec(s);
            if (match) {
                // We're starting a new bound attribute.
                // Add the safe attribute suffix, and use unquoted-attribute-safe
                // marker.
                html += s.substr(0, match.index) + match[1] + match[2] +
                    boundAttributeSuffix + match[3] + marker;
            }
            else {
                // We're either in a bound node, or trailing bound attribute.
                // Either way, nodeMarker is safe to use.
                html += s + nodeMarker;
            }
        }
        return html + this.strings[endIndex];
    }
    getTemplateElement() {
        const template = document.createElement('template');
        template.innerHTML = this.getHTML();
        return template;
    }
}

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const isPrimitive = (value) => {
    return (value === null ||
        !(typeof value === 'object' || typeof value === 'function'));
};
/**
 * Sets attribute values for AttributeParts, so that the value is only set once
 * even if there are multiple parts for an attribute.
 */
class AttributeCommitter {
    constructor(element, name, strings) {
        this.dirty = true;
        this.element = element;
        this.name = name;
        this.strings = strings;
        this.parts = [];
        for (let i = 0; i < strings.length - 1; i++) {
            this.parts[i] = this._createPart();
        }
    }
    /**
     * Creates a single part. Override this to create a differnt type of part.
     */
    _createPart() {
        return new AttributePart(this);
    }
    _getValue() {
        const strings = this.strings;
        const l = strings.length - 1;
        let text = '';
        for (let i = 0; i < l; i++) {
            text += strings[i];
            const part = this.parts[i];
            if (part !== undefined) {
                const v = part.value;
                if (v != null &&
                    (Array.isArray(v) ||
                        // tslint:disable-next-line:no-any
                        typeof v !== 'string' && v[Symbol.iterator])) {
                    for (const t of v) {
                        text += typeof t === 'string' ? t : String(t);
                    }
                }
                else {
                    text += typeof v === 'string' ? v : String(v);
                }
            }
        }
        text += strings[l];
        return text;
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            this.element.setAttribute(this.name, this._getValue());
        }
    }
}
class AttributePart {
    constructor(comitter) {
        this.value = undefined;
        this.committer = comitter;
    }
    setValue(value) {
        if (value !== noChange && (!isPrimitive(value) || value !== this.value)) {
            this.value = value;
            // If the value is a not a directive, dirty the committer so that it'll
            // call setAttribute. If the value is a directive, it'll dirty the
            // committer if it calls setValue().
            if (!isDirective(value)) {
                this.committer.dirty = true;
            }
        }
    }
    commit() {
        while (isDirective(this.value)) {
            const directive = this.value;
            this.value = noChange;
            directive(this);
        }
        if (this.value === noChange) {
            return;
        }
        this.committer.commit();
    }
}
class NodePart {
    constructor(options) {
        this.value = undefined;
        this._pendingValue = undefined;
        this.options = options;
    }
    /**
     * Inserts this part into a container.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendInto(container) {
        this.startNode = container.appendChild(createMarker());
        this.endNode = container.appendChild(createMarker());
    }
    /**
     * Inserts this part between `ref` and `ref`'s next sibling. Both `ref` and
     * its next sibling must be static, unchanging nodes such as those that appear
     * in a literal section of a template.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterNode(ref) {
        this.startNode = ref;
        this.endNode = ref.nextSibling;
    }
    /**
     * Appends this part into a parent part.
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    appendIntoPart(part) {
        part._insert(this.startNode = createMarker());
        part._insert(this.endNode = createMarker());
    }
    /**
     * Appends this part after `ref`
     *
     * This part must be empty, as its contents are not automatically moved.
     */
    insertAfterPart(ref) {
        ref._insert(this.startNode = createMarker());
        this.endNode = ref.endNode;
        ref.endNode = this.startNode;
    }
    setValue(value) {
        this._pendingValue = value;
    }
    commit() {
        while (isDirective(this._pendingValue)) {
            const directive = this._pendingValue;
            this._pendingValue = noChange;
            directive(this);
        }
        const value = this._pendingValue;
        if (value === noChange) {
            return;
        }
        if (isPrimitive(value)) {
            if (value !== this.value) {
                this._commitText(value);
            }
        }
        else if (value instanceof TemplateResult) {
            this._commitTemplateResult(value);
        }
        else if (value instanceof Node) {
            this._commitNode(value);
        }
        else if (Array.isArray(value) ||
            // tslint:disable-next-line:no-any
            value[Symbol.iterator]) {
            this._commitIterable(value);
        }
        else if (value === nothing) {
            this.value = nothing;
            this.clear();
        }
        else {
            // Fallback, will render the string representation
            this._commitText(value);
        }
    }
    _insert(node) {
        this.endNode.parentNode.insertBefore(node, this.endNode);
    }
    _commitNode(value) {
        if (this.value === value) {
            return;
        }
        this.clear();
        this._insert(value);
        this.value = value;
    }
    _commitText(value) {
        const node = this.startNode.nextSibling;
        value = value == null ? '' : value;
        if (node === this.endNode.previousSibling &&
            node.nodeType === 3 /* Node.TEXT_NODE */) {
            // If we only have a single text node between the markers, we can just
            // set its value, rather than replacing it.
            // TODO(justinfagnani): Can we just check if this.value is primitive?
            node.data = value;
        }
        else {
            this._commitNode(document.createTextNode(typeof value === 'string' ? value : String(value)));
        }
        this.value = value;
    }
    _commitTemplateResult(value) {
        const template = this.options.templateFactory(value);
        if (this.value instanceof TemplateInstance &&
            this.value.template === template) {
            this.value.update(value.values);
        }
        else {
            // Make sure we propagate the template processor from the TemplateResult
            // so that we use its syntax extension, etc. The template factory comes
            // from the render function options so that it can control template
            // caching and preprocessing.
            const instance = new TemplateInstance(template, value.processor, this.options);
            const fragment = instance._clone();
            instance.update(value.values);
            this._commitNode(fragment);
            this.value = instance;
        }
    }
    _commitIterable(value) {
        // For an Iterable, we create a new InstancePart per item, then set its
        // value to the item. This is a little bit of overhead for every item in
        // an Iterable, but it lets us recurse easily and efficiently update Arrays
        // of TemplateResults that will be commonly returned from expressions like:
        // array.map((i) => html`${i}`), by reusing existing TemplateInstances.
        // If _value is an array, then the previous render was of an
        // iterable and _value will contain the NodeParts from the previous
        // render. If _value is not an array, clear this part and make a new
        // array for NodeParts.
        if (!Array.isArray(this.value)) {
            this.value = [];
            this.clear();
        }
        // Lets us keep track of how many items we stamped so we can clear leftover
        // items from a previous render
        const itemParts = this.value;
        let partIndex = 0;
        let itemPart;
        for (const item of value) {
            // Try to reuse an existing part
            itemPart = itemParts[partIndex];
            // If no existing part, create a new one
            if (itemPart === undefined) {
                itemPart = new NodePart(this.options);
                itemParts.push(itemPart);
                if (partIndex === 0) {
                    itemPart.appendIntoPart(this);
                }
                else {
                    itemPart.insertAfterPart(itemParts[partIndex - 1]);
                }
            }
            itemPart.setValue(item);
            itemPart.commit();
            partIndex++;
        }
        if (partIndex < itemParts.length) {
            // Truncate the parts array so _value reflects the current state
            itemParts.length = partIndex;
            this.clear(itemPart && itemPart.endNode);
        }
    }
    clear(startNode = this.startNode) {
        removeNodes(this.startNode.parentNode, startNode.nextSibling, this.endNode);
    }
}
/**
 * Implements a boolean attribute, roughly as defined in the HTML
 * specification.
 *
 * If the value is truthy, then the attribute is present with a value of
 * ''. If the value is falsey, the attribute is removed.
 */
class BooleanAttributePart {
    constructor(element, name, strings) {
        this.value = undefined;
        this._pendingValue = undefined;
        if (strings.length !== 2 || strings[0] !== '' || strings[1] !== '') {
            throw new Error('Boolean attributes can only contain a single expression');
        }
        this.element = element;
        this.name = name;
        this.strings = strings;
    }
    setValue(value) {
        this._pendingValue = value;
    }
    commit() {
        while (isDirective(this._pendingValue)) {
            const directive = this._pendingValue;
            this._pendingValue = noChange;
            directive(this);
        }
        if (this._pendingValue === noChange) {
            return;
        }
        const value = !!this._pendingValue;
        if (this.value !== value) {
            if (value) {
                this.element.setAttribute(this.name, '');
            }
            else {
                this.element.removeAttribute(this.name);
            }
        }
        this.value = value;
        this._pendingValue = noChange;
    }
}
/**
 * Sets attribute values for PropertyParts, so that the value is only set once
 * even if there are multiple parts for a property.
 *
 * If an expression controls the whole property value, then the value is simply
 * assigned to the property under control. If there are string literals or
 * multiple expressions, then the strings are expressions are interpolated into
 * a string first.
 */
class PropertyCommitter extends AttributeCommitter {
    constructor(element, name, strings) {
        super(element, name, strings);
        this.single =
            (strings.length === 2 && strings[0] === '' && strings[1] === '');
    }
    _createPart() {
        return new PropertyPart(this);
    }
    _getValue() {
        if (this.single) {
            return this.parts[0].value;
        }
        return super._getValue();
    }
    commit() {
        if (this.dirty) {
            this.dirty = false;
            // tslint:disable-next-line:no-any
            this.element[this.name] = this._getValue();
        }
    }
}
class PropertyPart extends AttributePart {
}
// Detect event listener options support. If the `capture` property is read
// from the options object, then options are supported. If not, then the thrid
// argument to add/removeEventListener is interpreted as the boolean capture
// value so we should only pass the `capture` property.
let eventOptionsSupported = false;
try {
    const options = {
        get capture() {
            eventOptionsSupported = true;
            return false;
        }
    };
    // tslint:disable-next-line:no-any
    window.addEventListener('test', options, options);
    // tslint:disable-next-line:no-any
    window.removeEventListener('test', options, options);
}
catch (_e) {
}
class EventPart {
    constructor(element, eventName, eventContext) {
        this.value = undefined;
        this._pendingValue = undefined;
        this.element = element;
        this.eventName = eventName;
        this.eventContext = eventContext;
        this._boundHandleEvent = (e) => this.handleEvent(e);
    }
    setValue(value) {
        this._pendingValue = value;
    }
    commit() {
        while (isDirective(this._pendingValue)) {
            const directive = this._pendingValue;
            this._pendingValue = noChange;
            directive(this);
        }
        if (this._pendingValue === noChange) {
            return;
        }
        const newListener = this._pendingValue;
        const oldListener = this.value;
        const shouldRemoveListener = newListener == null ||
            oldListener != null &&
                (newListener.capture !== oldListener.capture ||
                    newListener.once !== oldListener.once ||
                    newListener.passive !== oldListener.passive);
        const shouldAddListener = newListener != null && (oldListener == null || shouldRemoveListener);
        if (shouldRemoveListener) {
            this.element.removeEventListener(this.eventName, this._boundHandleEvent, this._options);
        }
        if (shouldAddListener) {
            this._options = getOptions(newListener);
            this.element.addEventListener(this.eventName, this._boundHandleEvent, this._options);
        }
        this.value = newListener;
        this._pendingValue = noChange;
    }
    handleEvent(event) {
        if (typeof this.value === 'function') {
            this.value.call(this.eventContext || this.element, event);
        }
        else {
            this.value.handleEvent(event);
        }
    }
}
// We copy options because of the inconsistent behavior of browsers when reading
// the third argument of add/removeEventListener. IE11 doesn't support options
// at all. Chrome 41 only reads `capture` if the argument is an object.
const getOptions = (o) => o &&
    (eventOptionsSupported ?
        { capture: o.capture, passive: o.passive, once: o.once } :
        o.capture);

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * Creates Parts when a template is instantiated.
 */
class DefaultTemplateProcessor {
    /**
     * Create parts for an attribute-position binding, given the event, attribute
     * name, and string literals.
     *
     * @param element The element containing the binding
     * @param name  The attribute name
     * @param strings The string literals. There are always at least two strings,
     *   event for fully-controlled bindings with a single expression.
     */
    handleAttributeExpressions(element, name, strings, options) {
        const prefix = name[0];
        if (prefix === '.') {
            const comitter = new PropertyCommitter(element, name.slice(1), strings);
            return comitter.parts;
        }
        if (prefix === '@') {
            return [new EventPart(element, name.slice(1), options.eventContext)];
        }
        if (prefix === '?') {
            return [new BooleanAttributePart(element, name.slice(1), strings)];
        }
        const comitter = new AttributeCommitter(element, name, strings);
        return comitter.parts;
    }
    /**
     * Create parts for a text-position binding.
     * @param templateFactory
     */
    handleTextExpression(options) {
        return new NodePart(options);
    }
}
const defaultTemplateProcessor = new DefaultTemplateProcessor();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
/**
 * The default TemplateFactory which caches Templates keyed on
 * result.type and result.strings.
 */
function templateFactory(result) {
    let templateCache = templateCaches.get(result.type);
    if (templateCache === undefined) {
        templateCache = {
            stringsArray: new WeakMap(),
            keyString: new Map()
        };
        templateCaches.set(result.type, templateCache);
    }
    let template = templateCache.stringsArray.get(result.strings);
    if (template !== undefined) {
        return template;
    }
    // If the TemplateStringsArray is new, generate a key from the strings
    // This key is shared between all templates with identical content
    const key = result.strings.join(marker);
    // Check if we already have a Template for this key
    template = templateCache.keyString.get(key);
    if (template === undefined) {
        // If we have not seen this key before, create a new Template
        template = new Template(result, result.getTemplateElement());
        // Cache the Template for this key
        templateCache.keyString.set(key, template);
    }
    // Cache all future queries for this TemplateStringsArray
    templateCache.stringsArray.set(result.strings, template);
    return template;
}
const templateCaches = new Map();

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
const parts = new WeakMap();
/**
 * Renders a template to a container.
 *
 * To update a container with new values, reevaluate the template literal and
 * call `render` with the new result.
 *
 * @param result a TemplateResult created by evaluating a template tag like
 *     `html` or `svg`.
 * @param container A DOM parent to render to. The entire contents are either
 *     replaced, or efficiently updated if the same result type was previous
 *     rendered there.
 * @param options RenderOptions for the entire render tree rendered to this
 *     container. Render options must *not* change between renders to the same
 *     container, as those changes will not effect previously rendered DOM.
 */
const render = (result, container, options) => {
    let part = parts.get(container);
    if (part === undefined) {
        removeNodes(container, container.firstChild);
        parts.set(container, part = new NodePart(Object.assign({ templateFactory }, options)));
        part.appendInto(container);
    }
    part.setValue(result);
    part.commit();
};

/**
 * @license
 * Copyright (c) 2017 The Polymer Project Authors. All rights reserved.
 * This code may only be used under the BSD style license found at
 * http://polymer.github.io/LICENSE.txt
 * The complete set of authors may be found at
 * http://polymer.github.io/AUTHORS.txt
 * The complete set of contributors may be found at
 * http://polymer.github.io/CONTRIBUTORS.txt
 * Code distributed by Google as part of the polymer project is also
 * subject to an additional IP rights grant found at
 * http://polymer.github.io/PATENTS.txt
 */
// IMPORTANT: do not change the property name or the assignment expression.
// This line will be used in regexes to search for lit-html usage.
// TODO(justinfagnani): inject version number at build time
(window['litHtmlVersions'] || (window['litHtmlVersions'] = [])).push('1.0.0');
/**
 * Interprets a template literal as an HTML template that can efficiently
 * render to and update a container.
 */
const html = (strings, ...values) => new TemplateResult(strings, values, 'html', defaultTemplateProcessor);

/**
 * @category Web Components
 * @customelement ui-filter
 * @description 
 * A UI component with a filter bar and a button group "grid"/"list"/"textual".
 * 
 * This is not a shadow-dom component, but still allows children ("slots"). Those
 * are shown when the selection mode is on.
 * 
 * Attributes:
 * 
 * - "placeholder": A placeholder for the filter bar
 * - "value": A value for the filter bar
 * - "mode": The current mode. Must be one of "grid","list","textual"
 * - "grid": The tooltip title of the grid button
 * - "list": The tooltip title of the list button
 * - "textual": The tooltip title of the textual button
 * 
 * Events:
 * 
 * - "filter": The user clicked on the filter button or hit enter
 * 
 * @example <caption>Import an image, name it minnie.</caption>
 * <ui-filter src="#minnie" name="minnie" index="1"></ui-filter>
 */
class UiFilterBar extends HTMLElement {
  constructor() {
    super();
  }
  static get observedAttributes() {
    return ['value'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == "value") {
      this.value = this.getAttribute("value") || "";
      this.input.value = this.value;
      this.dispatchEvent(new CustomEvent('filter', { detail: { value: this.value, typing: true } }));
    }
  }
  connectedCallback() {
    this.classList.add("ui-filterbar");
    if (this.hasAttribute("suggestions")) {
      this.suggestionsDomID = Math.random().toString(36);
      const suggestionsEl = document.createElement("datalist");
      suggestionsEl.id = this.suggestionsDomID;
      const items = this.getAttribute("suggestions").split(",");
      for (let item of items) {
        const openEL = document.createElement("option");
        openEL.setAttribute("value", item);
        suggestionsEl.appendChild(openEL);
      }
      document.body.appendChild(suggestionsEl);
    }
    this.placeholder = this.getAttribute("placeholder");
    this.value = this.getAttribute("value") || "";
    this.mode = this.getAttribute("mode") || "grid";
    this.grid = this.getAttribute("grid");
    this.list = this.getAttribute("list");
    this.foritems = this.hasAttribute("additionalButtons") ? this.getAttribute("additionalButtons").split(",") : [];
    this.textual = this.getAttribute("textual");
    this.select = this.getAttribute("select");
    this.selectmode = this.getAttribute("selectmode") || false;

    // Non-shadow-dom but still slots magic - Part 1
    const slotElements = [];
    for (let node of this.childNodes) {
      slotElements.push(node.cloneNode(true));
    }
    while (this.firstChild) { this.firstChild.remove(); }

    const additionalButtons = [];
    let btnIndex = 0;
    for (const i of this.foritems) {
      additionalButtons.push(html`<button data-btnindex="${btnIndex}" class="btn btn-light" @click="${this.additionalButtonClicked.bind(this)}">${i}</button>`);
      ++btnIndex;
    }

    render(html`
        <form @submit="${this.search.bind(this)}" class="ui-filterbar">
        <div class="btn-group additionalButtons" role="group" aria-label="Editor bar">${additionalButtons}</div>
          <div class="input-group">
            <input class="form-control py-2 filterinput" type="search" name="filter" placeholder="${this.placeholder}"
              value="${this.value}" @input="${this.searchI.bind(this)}">
            <span class="input-group-append">
              <button class="btn btn-outline-secondary" @click="${this.search.bind(this)}">
                <i class="fa fa-search"></i>
              </button>
            </span>
          </div>
          <div class="btn-group ml-3 viewmode" role="group" aria-label="Change view mode"></div>
          ${!this.select ? '' :
        html`<div class="hidden selectcomponents ml-3"></div>
          <button type="button" title="${this.select}" @click="${this.selectChanged.bind(this)}" class="selectbtn ml-3 btn ${this.selectmode ? "btn-info" : "btn-light"}">
            <i class="fas fa-check-double"></i>
          </button>`}
        </form>
        <div class="ui-editorbar">
          <span class="editorHintMessage"></span>
          <div class="ml-auto btn-group" role="group" aria-label="Editor bar">
            <button class="btn btn-success" @click="${this.editorSave.bind(this)}">Submit</button>
            <button class="btn btn-danger" @click="${this.editorDiscard.bind(this)}">Discard</button>
          </div>
        </div>
        `, this);

    this.input = this.querySelector("input");
    this.filterbar = this.querySelector(".ui-filterbar");
    this.editorbar = this.querySelector(".ui-editorbar");
    this.selectbtn = this.querySelector(".selectbtn");
    this.selectcomponents = this.querySelector(".selectcomponents");
    this.editorHintMessage = this.querySelector(".editorHintMessage");
    this.additionalButtons = this.querySelector(".additionalButtons");
    if (this.foritems.length) this.selectAdditionalButton(0);

    this.editorbar.classList.add("hidden");

    // Non-shadow-dom but still slots magic - Part 2
    if (slotElements.length) {
      const slot = this.selectcomponents;

      for (let el of slotElements) {
        slot.appendChild(el);
      }

      // Wire up all buttons that have a data-action to dispatch an event
      // This is for the selection mode only.
      slot.querySelectorAll("*[data-action]").forEach(button => {
        button.addEventListener("click", e => {
          e.preventDefault();
          const action = e.target.dataset.action;
          this.dispatchEvent(new CustomEvent('selection', { detail: { action } }));
        });
      });
    }

    // Don't show the mode button group if no mode changes allowed
    if (!this.grid && !this.list && !this.textual) {
      this.querySelector(".viewmode").classList.add("hidden");
    } else
      this.renderViewMode();
  }
  disconnectedCallback() {
    if (this.suggestionsDomID) {
      document.getElementById(this.suggestionsDomID).remove();
      delete this.suggestionsDomID;
    }
  }

  searchI(event) {
    event.preventDefault();
    this.value = event.target.value;
    this.dispatchEvent(new CustomEvent('filter', { detail: { value: this.value, typing: true } }));
  }
  search(event) {
    event.preventDefault();
    event.stopPropagation();
    const formData = new FormData(this.filterbar);
    this.value = formData.get("filter");
    this.dispatchEvent(new CustomEvent('filter', { detail: { value: this.value } }));
  }
  modeChange(event) {
    event.preventDefault();
    this.mode = event.target.dataset.mode;
    this.renderViewMode();
    this.dispatchEvent(new CustomEvent('mode', { detail: { mode: this.mode } }));
    if (this.mode == "textual") {
      this.selectmode = false;
      this.selectbtn.classList.add("hidden");
      this.additionalButtons.classList.add("hidden");
    } else {
      this.selectbtn.classList.remove("hidden");
      this.additionalButtons.classList.remove("hidden");
    }
  }
  selectAdditionalButton(index) {
    for (let c of this.additionalButtons.children) {
      if (index == parseInt(c.dataset.btnindex)) {
        c.classList.remove("btn-light");
        c.classList.add("btn-info");
        this.dispatchEvent(new CustomEvent("secondaryMode", { detail: index }));
      } else {
        c.classList.add("btn-light");
        c.classList.remove("btn-info");
      }
    }
  }
  additionalButtonClicked(event) {
    event.preventDefault();
    this.selectAdditionalButton(parseInt(event.target.dataset.btnindex));
  }
  setEditorContentChanged(val, message = "") {
    if (val) {
      this.editorHintMessage.innerHTML = message;
      this.editorbar.classList.remove("hidden");
      this.filterbar.classList.add("hidden");
    } else {
      this.editorbar.classList.add("hidden");
      this.filterbar.classList.remove("hidden");
    }
    document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: val }));
  }
  editorSave() {
    this.dispatchEvent(new CustomEvent('editor', { detail: { save: true } }));
  }
  editorDiscard() {
    this.dispatchEvent(new CustomEvent('editor', { detail: { discard: true } }));
  }

  selectChanged(event) {
    event.preventDefault();
    this.selectmode = !this.selectmode;
    if (this.selectmode)
      this.selectcomponents.classList.remove("hidden");
    else
      this.selectcomponents.classList.add("hidden");
    this.dispatchEvent(new CustomEvent('selection', { detail: { selectmode: this.selectmode } }));
  }
  renderViewMode() {
    render(html`${!this.grid ? '' : html`<button type="button" title="${this.grid} (Alt+g)" accesskey="g" data-mode="grid" @click="${this.modeChange.bind(this)}"
              class="btn ${this.mode == "grid" ? "btn-info" : "btn-light"}"><i class="fas fa-th-large"></i></button>`}
          ${!this.list ? '' : html`<button type="button" title="${this.list} (Alt+l)" data-mode="list" accesskey="l" @click="${this.modeChange.bind(this)}"
              class="btn ${this.mode == "list" ? "btn-info" : "btn-light"}"><i class="fas fa-th-list"></i></button>`}
          ${!this.textual ? '' : html`<button type="button" title="${this.textual} (Alt+t)" data-mode="textual" accesskey="t" @click="${this.modeChange.bind(this)}"
              class="btn ${this.mode == "textual" ? "btn-info" : "btn-light"}"><i class="fas fa-align-justify"></i></button>`}
              `, this.querySelector(".viewmode"));
  }
}

customElements.define('ui-filter', UiFilterBar);

var style = ":host {\n  --padding: 0;\n}\n\nform {\n  background-color: inherit;\n  font-size: 1.25rem;\n  padding: var(--padding);\n  color: inherit;\n  margin: 0;\n  outline: 2px dashed #000;\n  outline-offset: -10px;\n  outline-color: inherit;\n  transition: outline-offset 0.15s ease-in-out, background-color 0.15s linear;\n}\n\n.is-dragover {\n  outline-offset: -20px;\n  outline-color: #c8dadf;\n  background-color: #fff;\n}\n.is-dragover > * {\n  pointer-events: none;\n}\n\n.uploading,\n.success,\n.error {\n  display: none;\n}\n\nform.is-uploading .uploading,\nform.is-success .success,\nform.is-error .error {\n  display: block;\n}\n\n.uploading {\n  font-style: italic;\n}\n\n.success {\n  animation: appear-from-inside 0.25s ease-in-out;\n}\n\n@keyframes appear-from-inside {\n  from {\n    transform: translateY(-50%) scale(0);\n  }\n  75% {\n    transform: translateY(-50%) scale(1.1);\n  }\n  to {\n    transform: translateY(-50%) scale(1);\n  }\n}\ninput[type=file] {\n  width: 0.1px;\n  height: 0.1px;\n  opacity: 0;\n  overflow: hidden;\n  position: absolute;\n  z-index: -1;\n}\n\ninput[type=file] + label {\n  max-width: 80%;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n  cursor: pointer;\n  display: inline-block;\n  overflow: hidden;\n}\n\ninput[type=file] + label:hover strong,\ninput[type=file]:focus + label strong,\ninput[type=file].has-focus + label strong {\n  color: #39bfd3;\n}\n\ninput[type=file]:focus + label,\ninput[type=file].has-focus + label {\n  outline: 1px dotted #000;\n  outline: -webkit-focus-ring-color auto 5px;\n}";

/**
 * @category Web Components
 * @customelement ui-drop-zone
 * @description A file drop zone

 * @example <caption>A drop-zone</caption>
 * <ui-drop-zone></ui-drop-zone>
 */
class UiDropZone extends HTMLElement {
  constructor() {
    super();
    this.droppedFiles = [];
    this.url = this.hasAttribute("url") ? this.getAttribute("url") : '#';
    this.method = this.hasAttribute("method") ? this.getAttribute("method") : 'post';
    this.attachShadow({ mode: 'open' });
  }
  connectedCallback() {
    this.render();
  }
  disconnectedCallback() {
  }

  render() {
    render(html`
        <style>${style}</style>
        <form method="${this.method}" action="${this.url}" enctype="multipart/form-data"
        @submit="${(e) => this.submit(e)}" @reset="${(e) => this.restart(e)}"
        @drag="${unwanted}" @dragstart="${unwanted}"
        @drop="${(e) => this.drop(e)}" @dragover="${drag}" @dragenter="${drag}" @dragleave="${dragover}" @dragend="${dragover}">
          <div @drag="${ignore}" @dragstart="${ignore}">
            <input @change="${(e) => this.fileschange(e)}" @focus="${focus}" @blur="${blur}" type="file" name="files[]" id="file" multiple />
            <label for="file"><slot name="label">Select file...</slot></label>
          </div>
          <div class="uploading"><slot name="uploading">Uploading&hellip;</slot></div>
          <div class="success"><slot name="success">Done!</slot> <input type="reset"></div>
          <div class="error"><slot name="error">Error!</slot> <span></span>. <input type="reset"></div>
        </form>`, this.shadowRoot);
  }

  triggerFormSubmit() {
    const form = this.shadowRoot.querySelector('form');
    form.dispatchEvent(new Event("submit"));
  }

  fileschange(event) {
    this.droppedFiles = event.target.files;
    this.triggerFormSubmit();
  }

  restart(e) {
    this.droppedFiles = [];
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.remove('is-error', 'is-success');
  }

  drop(e) {
    e.preventDefault();
    e.stopPropagation();
    e.target.classList.remove('is-dragover');
    this.droppedFiles = e.dataTransfer.files; // the files that were dropped
    this.triggerFormSubmit();
  }

  submit(event) {
    const form = event.target;
    const input = form.querySelector('input[type="file"]');
    const errorMsg = form.querySelector('.error span');

    // preventing the duplicate submissions if the current one is in progress
    if (form.classList.contains('is-uploading')) return false;

    form.classList.add('is-uploading');
    form.classList.remove('is-error');

    event.preventDefault();

    if (!this.droppedFiles.length) return;

    // gathering the form data
    const formdata = new FormData(form);
    console.log(this.droppedFiles);
    if (this.droppedFiles.length) {
      for (let file of this.droppedFiles)
        formdata.append(input.getAttribute('name'), file);
    }

    // ajax request
    const ajax = new XMLHttpRequest();
    ajax.open(form.getAttribute('method'), form.getAttribute('action'), true);

    ajax.onload = function () {
      form.classList.remove('is-uploading');
      if (ajax.status >= 200 && ajax.status < 400) {
        const data = JSON.parse(ajax.responseText);
        form.classList.add(data.success == true ? 'is-success' : 'is-error');
        if (!data.success)
          errorMsg.textContent = data.error;
      }
      else {
        form.classList.add('is-error');
        errorMsg.textContent = "Server responded with " + ajax.status;
      }
    };

    ajax.onerror = function (e) {
      form.classList.remove('is-uploading');
      form.classList.add('is-error');
      errorMsg.textContent = e;
    };

    ajax.send(formdata);
  }
}

customElements.define('ui-drop-zone', UiDropZone);

function unwanted(e) {
  e.preventDefault();
  e.stopPropagation();
}

function ignore(e) {
  e.preventDefault();
}

function focus(e) {
  e.target.classList.add('has-focus');
}

function blur(e) {
  e.target.classList.remove('has-focus');
}

function drag(e) {
  e.preventDefault();
  e.stopPropagation();
  e.target.classList.add('is-dragover');
}

function dragover(e) {
  e.preventDefault();
  e.stopPropagation();
  e.target.classList.remove('is-dragover');
}

/**
 * @category Web Components
 * @customelement ui-switch
 * @description A switch
 * @attribute [storekey] A localstorage key
 * @attribute [documentevent] An event with this name is send to the document on change
 * @example <caption>A switch</caption>
 * <ui-switch></ui-switch>
 */
class UiSwitch extends HTMLElement {
  constructor() {
    super();
  }
  setCheck(newState, noevents) {
    this.input.checked = newState;

    if (!noevents && !this.disabled) this.dispatchEvent(new Event("input"));
    if (this.showid) {
      const el = document.getElementById(this.showid);
      if (el) {
        if (this.input.checked) {
          el.classList.add("show");
          el.classList.remove("hidden");
        } else {
          el.classList.remove("show");
          el.classList.add("hidden");
        }
      }
    }
  }
  set value(newValue) {
    const nv = (newValue == 'true');

    if (this.input)
      this.setCheck(nv, true);
    else
      this._value = nv;
  }
  get value() {
    return this.input && this.input.checked;
  }
  connectedCallback() {
    this.storekey = this.hasAttribute("storekey") ? this.getAttribute("storekey") : null;
    this.documentevent = this.hasAttribute("documentevent") ? this.getAttribute("documentevent") : null;
    while (this.firstChild) { this.firstChild.remove(); }

    const root = this.appendChild(document.createElement("div"));

    root.classList.add("ui-switch");

    this.input = root.appendChild(document.createElement("input"));
    this.input.type = "checkbox";
    if (this.storekey) this.input.setAttribute("name", this.storekey);
    this.addEventListener("click", (e) => {
      e.preventDefault();
      this.setCheck(!this.input.checked);
      if (this.storekey) localStorage.setItem(this.storekey, this.input.checked);
      if (this.documentevent) document.dispatchEvent(new Event(this.documentevent));
    });
    root.appendChild(document.createElement("span"));
    const titleEl = root.appendChild(document.createElement("div"));

    this.showid = this.hasAttribute("showid") ? this.getAttribute("showid") : null;
    titleEl.title = this.hasAttribute("title") ? this.getAttribute("title") : "";
    titleEl.innerHTML = this.hasAttribute("label") ? this.getAttribute("label") : (this.hasAttribute("title") ? this.getAttribute("title") : "");
    if (this.disabled) this.classList.add("disabled"); else this.classList.remove("disabled");

    this.attributeChangedCallback("showid");
    const isChecked = this.hasAttribute("checked") ? this.getAttribute("checked") == "true" : this._value;
    const cached = this.storekey ? localStorage.getItem(this.storekey) == "true" : this._value;
    window.requestAnimationFrame(() => this.setCheck(isChecked || cached, true));
  }
  static get observedAttributes() {
    return ['checked'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (!this.input) return;
    if (name == "checked") {
      this.setCheck(this.getAttribute("checked") == "true");
    } else if (name == "disabled")
      this.disabled = this.hasAttribute("disabled") ? this.getAttribute("disabled") : false;
    else if (name == "showid") {
      this.showid = this.hasAttribute("showid") ? this.getAttribute("showid") : null;
    }
  }
}

customElements.define('ui-switch', UiSwitch);

let idcounter = 0;

/**
* @category Web Components
* @customelement ui-notification
* @description
* Add this web-component to your page for permanent (but closable) notifications.
* Create elements of this type via script for dynamic notications.
* 
* Notifications with a timeout are removing themselves from the dom again automatically.
* 
* @example <caption>Static usage</caption>
* <ui-notification persistent>My awesome text</ui-notification>
* 
* @example <caption>Dynamic usage</caption>
* const el = document.createElement("ui-notification");
* el.id = "login";
* el.setAttribute("closetime", 3000);
* el.innerHTML = "My dynamic <b>html</b> text";
* document.body.appendChild(el);
*/
class UiNotification extends HTMLElement {
  constructor() {
    super();

    let tmpl = document.createElement('template');
    tmpl.innerHTML = `<style>:host {
            font-size: 16px;
            color: white;
            background: rgba(0, 0, 0, 0.9);
            line-height: 1.3em;
            padding: 10px 15px;
            margin: 5px 10px;
            position: relative;
            border-radius: 5px;
            transition: opacity 0.5s ease-in;
            display: block;
        }
        :host(.hide) {
            opacity: 0;
        }
        </style><slot></slot>`;
    let shadow = this.attachShadow({ mode: 'open' });
    shadow.appendChild(tmpl.content.cloneNode(true));
  }
  connectedCallback() {
    this.id = this.hasAttribute("id") ? this.getAttribute("id") : this.id;
    this.target = this.hasAttribute("target") ? this.getAttribute("target") : "alert-area";
    this.hidebutton = this.hasAttribute("hidebutton");
    this.persistent = this.hasAttribute("persistent");
    this.closetime = this.hasAttribute("closetime") ? this.getAttribute("closetime") : 5000;

    if (!this.id) this.id = "notification" + idcounter;
    ++idcounter;

    let target = this.parentNode.ownerDocument.getElementById(this.target);
    if (target != this.parentNode) {
      // Remove existing notification with same id
      let oldmsg = target.querySelector("#" + this.id);
      if (oldmsg && oldmsg != this) oldmsg.remove();
      // Add new one
      target.appendChild(this);
      return;
    }

    const slot = this.shadowRoot.querySelector('slot');
    let nodes = slot.assignedNodes();
    if (!nodes.length) {
      this.innerHTML = "No content!";
      return;
    }

    const closelink = document.createElement("a");
    closelink.href = "#";
    closelink.setAttribute("data-close", "");
    closelink.style.float = "right";
    closelink.innerHTML = "<i class='fas fa-times'></i>";
    if (nodes[0].nodeType == 3) {
      nodes[0].parentNode.insertBefore(document.createElement("div"), nodes[0]);
      nodes[0].previousElementSibling.appendChild(nodes[0]);
    }
    nodes = slot.assignedNodes();
    nodes[0].prepend(closelink);

    for (const node of nodes) {
      const linksThatClose = node.querySelectorAll("a[data-close]");
      linksThatClose.forEach(link => {
        if (this.hidebutton) node.querySelector("a[data-close]").classList.add("d-none");
        else
          link.addEventListener('click', event => {
            event.preventDefault();
            this.hide();
          });
      });
    }



    if (this.persistent) return;
    this.hideAfterCloseTime();
  }
  hideAfterCloseTime() {
    this.alertTimeout = setTimeout(() => {
      this.alertTimeout = null;
      this.hide();
    }, this.closetime);
  }
  disconnectedCallback() {
    if (this.alertTimeout) clearTimeout(this.alertTimeout);
    if (this.disperseTimeout) clearTimeout(this.disperseTimeout);
    this.disperseTimeout = null;
  }
  hide() {
    this.classList.add('hide');
    this.disperseTimeout = setTimeout(() => this.remove(), 500);
  }
}

customElements.define('ui-notification', UiNotification);

/**
 * @category Web Components
 * @customelement ui-tags
 * @description A component where an arbitrary number of "tags" can be added and individually removed.
 * @attribute [suggestions] A comma separated list of suggestions
 * @attribute [value] The value. A comma separated list is expected. Also settable as property.
 * @attribute [open] Always open input, instead of a self-closing add-tag input.
 * 
 * @property {String|Array} [value] A comma separated list or an array
 * 
 * @fires ui-tags#input
 * 
 * @example <caption>A tags list with the 'abc' tag already added,</caption>
 * <ui-tags suggestions="abc,def" value="abc"></ui-tags>
 */
class UiTags extends HTMLElement {
  constructor() {
    super();
    this.tags = [];
  }
  connectedCallback() {
    this.classList.add("ui-tags");
    this.alwaysopen = this.hasAttribute("open");
    if (this.hasAttribute("suggestions")) {
      this.suggestionsDomID = Math.random().toString(36).slice(2);
      const suggestionsEl = document.createElement("datalist");
      suggestionsEl.id = this.suggestionsDomID;
      const items = this.getAttribute("suggestions").split(",");
      for (let item of items) {
        const openEL = document.createElement("option");
        openEL.setAttribute("value", item);
        suggestionsEl.appendChild(openEL);
      }
      document.body.appendChild(suggestionsEl);
    }
    this.render();
  }
  disconnectedCallback() {
    if (this.suggestionsDomID) {
      document.getElementById(this.suggestionsDomID).remove();
      delete this.suggestionsDomID;
    }
  }
  set value(val) {
    if (!Array.isArray(val)) {
      this.tags = val ? val.split(",") : [];
    } else
      this.tags = val.slice();
    this.render();
  }
  get value() {
    return this.tags;
  }
  addTag(sourceInput) {
    const tagname = sourceInput.value;
    if (!tagname || !tagname.length || this.tags.includes(tagname)) return;
    console.log("addTag", tagname);
    sourceInput.value = '';
    this.tags.push(tagname);
    this.render();
    setTimeout(() => sourceInput.focus(), 50);
    this.dispatchEvent(new Event("input"));
  }
  removeTag(tagname, e) {
    if (e) e.preventDefault();
    this.tags = this.tags.filter(t => t != tagname);
    console.log("remove", tagname, this.tags);
    this.render();
    this.dispatchEvent(new Event("input"));
  }
  inputKey(event) {
    if (event.key == 'Enter') {
      event.preventDefault();
      this.addTag(event.target);
    }
  }
  render() {
    const tagsEl = this.tags.map((tag) =>
      html`<div class="ui-tag-list"><span>${tag}</span>
                <button @click="${(e) => this.removeTag(tag, e)}" class="btn btn-danger-hover p-0"><i class="fas fa-times"></i></button>
            </div>`
    );
    render(html`${tagsEl}
        <div style="min-width:120px"><div class="ui-tags-add btn btn-success-hover p-0 ${this.alwaysopen ? "open" : ""}">
            <input list="${this.suggestionsDomID}" placeholder="Add" oninput="event.stopPropagation()"
                @keypress="${(event) => this.inputKey(event)}">
            <i class="fas fa-plus" @click=${(event) => this.addTag(event.target.previousElementSibling)}></i>
        </div></div>`, this);
  }
}

customElements.define('ui-tags', UiTags);

/**
 * Input event
 *
 * @category Web Components
 * @event ui-tags#input
 * @type {Array}
 */

/**
 * @category Web Components
 * @customelement ui-dropdown
 * @description A dropdown component.
 * @attribute novalue Will not apply the selected entry as new value, only emits an input event
 * @attribute editable If set, displays an input box instead of a label
 * @attribute allowunset If set, shows a clear option
 * @attribute icons If set, displays an icon for each option. The icon file path is like: img/{icon}/{key}.png
 * @attribute required If set, this element is required within a <form>.
 * @attribute options The options to show as a comma separated string. You should prefer the options property instead.
 * @example <caption>A dropdown example</caption>
 * <ui-dropdown></ui-dropdown>
 */
class UiDropdown extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    if (this.hasAttribute("viewkey")) this.viewkey = this.getAttribute("viewkey");
    if (this.hasAttribute("desckey")) this.desckey = this.getAttribute("desckey");
    if (this.hasAttribute("valuekey")) this.valuekey = this.getAttribute("valuekey");
    this.allowunset = this.hasAttribute("allowunset");
    this.editable = this.hasAttribute("editable");
    this.novalue = this.hasAttribute("novalue");
    this.nostate = this.hasAttribute("nostate");
    this.icons = this.hasAttribute("icons") ? this.getAttribute("icons") : null;
    this.required = this.hasAttribute("required");

    this.bodyClickBound = (e) => this.bodyClicked(e);
    this.addEventListener("click", e => e.stopPropagation());
    this.classList.add("dropdown");
    const classes = this.hasAttribute("btnclass") ? this.getAttribute("btnclass") : "btn btn-primary-hover btn-sm";

    let controlChild = null;
    if (this.firstElementChild == null) {
      controlChild = document.createElement("div");
      if (this.editable) {
        render(html`
            <input class="${classes} dropdown-toggle label" aria-haspopup="true" aria-expanded="false">`, controlChild);
      } else {
        render(html`
            <button class="${classes} dropdown-toggle" type="button" aria-haspopup="true" aria-expanded="false"><span class="label"></span></button>`, controlChild);
      }
      controlChild = this.appendChild(controlChild.firstElementChild);
    } else {
      controlChild = this.firstElementChild;
    }
    controlChild.addEventListener("click", this.toggleShow.bind(this), { passive: true });

    const el = document.createElement("div"); el.classList.add("dropdown-menu");
    this.dropdownEl = this.appendChild(el);
    this.labelEl = this.querySelector(".label");
    if (!this.labelEl) throw new Error("Render failed");

    if (this._options) this.options = this._options;
    if (this.hasAttribute("options")) this.attributeChangedCallback("options");
    if (this.hasAttribute("value"))
      this.attributeChangedCallback("value");
    else
      this.value = this._value;
  }
  disconnectedCallback() {
    while (this.firstChild) { this.firstChild.remove(); }
  }
  static get observedAttributes() {
    return ['value'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    if (name == "value") this.value = this.getAttribute("value");
    if (name == "options") {
      const options = {};
      const items = this.getAttribute("options").split(",");
      for (let item of items) {
        const data = item.split(":");
        if (data.length == 1) options[item] = { label: item };
        else options[data[0].trim()] = { label: data[1].trim() };
      }
      this.options = options;
    }
  }
  toggleShow() {
    if (this.dropdownEl.classList.contains("show")) this.close(); else this.open();
  }
  bodyClicked(e) {
    this.closeTimer = setTimeout(() => this.close(), 50);
  }
  close() {
    this.dropdownEl.classList.remove("show");
  }
  open() {
    if (this.closeTimer) { clearTimeout(this.closeTimer); delete this.closeTimer; }
    document.body.addEventListener("click", this.bodyClickBound, { once: true, passive: true, capture: true });
    this.dropdownEl.classList.add("show");
  }
  set value(key) {

    this._value = key;
    if (!this.dropdownEl) return;

    if (key == null || key == undefined || key == "" || !this._options) {
      if (this.editable) {
        this.labelEl.placeholder = this.getAttribute("label");
        this.labelEl.value = "";
      } else
        this.labelEl.innerHTML = this.getAttribute("label");
      return;
    }

    if (!this.novalue && this._options && this._options[key]) {
      const option = this._options[key];
      if (this.editable)
        this.labelEl.value = option.label;
      else
        this.labelEl.innerHTML = option.label;
      this.labelEl.title = option.desc || "";
    }
    this._value = key;
    // Change active marker
    let selectedEl = this.dropdownEl.querySelector(".active");
    if (selectedEl) selectedEl.classList.remove("active");
    selectedEl = this.dropdownEl.querySelector("a[data-key='" + key + "']");
    if (selectedEl) selectedEl.classList.add("active");
  }
  get value() {
    return this._value;
  }
  get options() {
    return this._options;
  }
  // We allow arrays as well as object(key:{label,desc}) mappings
  set options(newValue) {
    this._options = newValue;
    if (!this.dropdownEl) return;

    if (Array.isArray(newValue)) {
      if (!this.viewkey || !this.valuekey) {
        console.warn("No viewkey/valuekey set!");
        return;
      }
      const options = {};
      for (let entry of newValue) {
        const key = entry[this.valuekey];
        const label = entry[this.viewkey];
        const desc = entry[this.desckey];
        options[key] = { label, desc };
      }
      newValue = options;
    }
    this._options = newValue;

    while (this.dropdownEl.firstChild) { this.dropdownEl.firstChild.remove(); }
    for (let key of Object.keys(this._options)) {
      const option = this._options[key];
      const a = document.createElement("div");
      a.classList.add("dropdown-item");
      a.dataset.key = key;
      a.addEventListener("click", (event) => this.select(event.target.dataset.key, event));
      let img = this.icons ? `<img src="img/${this.icons}/${key}.png">` : "";
      if (option.desc)
        a.innerHTML = `${img}<div><b>${option.label}</b><br><div class="small">${option.desc}</div></div>`;
      else
        a.innerHTML = `${img}<div>${option.label}</div>`;
      this.dropdownEl.appendChild(a);
    }

    this.value = this._value;
  }
  select(key, event) {
    if (event) event.preventDefault();
    this.dropdownEl.classList.remove("show");
    document.body.removeEventListener("click", this.bodyClickBound, { once: true, passive: true, capture: true });
    if (!this.nostate) this.value = key;
    this.dispatchEvent(new CustomEvent("input", { detail: key }));
  }
}

customElements.define('ui-dropdown', UiDropdown);

/**
 * @category Web Components
 * @customelement ui-tabs
 * @description A tabbing component. 
 * 
 * @example <caption>An example</caption>
 * <ui-tabs>
  <ul class="nav nav-tabs" slot="links">
    <li class="nav-item"><a class="navlink" href="#">First tab</a></li>
    <li class="nav-item"><a class="navlink" href="#">Second tab</a></li>
    <li class="nav-item"><a class="navlink" href="#">Third tab</a></li>
  </ul>
  <div class="tab-content" slot="tabs">
    <div>First</div>
    <div>Second</div>
    <div>Third</div>
  </div>
</ui-tabs>
 */
class UiTabs extends HTMLElement {
  constructor() {
    super();
    this.last = -1;
    this._active = 0;
    this.attachShadow({ mode: 'open' });
  }
  set activetab(val) {
    if (!this.tabs) {
      this._active = val;
      return;
    }
    if (!Number.isInteger(val)) return;
    if (this.last != -1) {
      if (this.links) this.links[this.last].classList.remove("active");
      this.tabs[this.last].style.visibility = "hidden";
    }
    this.last = val;
    if (this.links) this.links[val].classList.add("active");
    this.tabs[val].style.visibility = "visible";
  }
  connectedCallback() {
    if (this.hasAttribute("upsidedown"))
      this.shadowRoot.innerHTML = `<style>:host{display:block}</style><slot name="tabs"></slot><slot name="links"></slot>`;
    else
      this.shadowRoot.innerHTML = `<style>:host{display:block}</style><slot name="links"></slot><slot name="tabs"></slot>`;

    let linkUl = this.shadowRoot.querySelector('slot[name="links"]').assignedNodes()[0];
    if (linkUl) {
      this.links = linkUl.querySelectorAll(".navlink");
      for (let i = 0; i < this.links.length; ++i) {
        const index = i;
        this.links[index].addEventListener("click", (e) => (e.preventDefault(), this.activateTab(index)));
      }
    }

    const tabSlot = this.shadowRoot.querySelector('slot[name="tabs"]').assignedNodes()[0];
    tabSlot.style.display = "grid";
    this.tabs = tabSlot.children;
    for (let e of this.tabs) {
      e.style["grid-row-start"] = 1;
      e.style["grid-column-start"] = 1;
      e.style.visibility = "hidden";
    }

    this.activetab = this._active;
  }
  disconnectedCallback() {
  }
}

customElements.define('ui-tabs', UiTabs);

var style$1 = "@charset \"UTF-8\";\n:host {\n  position: relative;\n  box-sizing: border-box;\n  display: inline-block;\n  width: 100%;\n  min-height: 1rem;\n}\n\ninput,\n::slotted(input) {\n  overflow: hidden;\n  cursor: pointer;\n  user-select: none;\n  position: absolute;\n  top: 0;\n  left: 0;\n  right: 0;\n  bottom: 0;\n  width: 100%;\n  padding: inherit;\n  margin: inherit;\n  z-index: 0;\n  font-size: inherit;\n  font-weight: inherit;\n  line-height: inherit;\n  color: inherit;\n  background-color: inherit;\n  background-clip: inherit;\n  border: inherit;\n  border-radius: inherit;\n  transition: inherit;\n}\n\n.multiselect-field-placeholder {\n  padding: 0.25em 0.5em;\n  color: #888;\n  line-height: 1;\n  position: relative;\n  z-index: 1;\n  pointer-events: none;\n}\n\n.multiselect-tag {\n  position: relative;\n  display: inline-block;\n  padding: 0.25em 1.5em 0.25em 0.5em;\n  border: 1px solid #bdbdbd;\n  border-radius: 0.2em;\n  margin: 0 0.2em 0.2em 0;\n  line-height: 1;\n  vertical-align: middle;\n  z-index: 1;\n}\n\n.multiselect-tag:last-child {\n  margin-right: 0;\n}\n\n.multiselect-tag:hover {\n  background: #efefef;\n}\n\n.multiselect-tag-text {\n  min-height: 1em;\n}\n\n.multiselect-tag-remove-button {\n  position: absolute;\n  top: 0.25em;\n  right: 0.25em;\n  width: 1em;\n  height: 1em;\n  opacity: 0.3;\n  cursor: pointer;\n}\n\n.multiselect-tag-remove-button:hover {\n  opacity: 1;\n}\n\n.multiselect-tag-remove-button:before,\n.multiselect-tag-remove-button:after {\n  content: \" \";\n  position: absolute;\n  left: 0.5em;\n  width: 2px;\n  height: 1em;\n  background-color: #333;\n}\n\n.multiselect-tag-remove-button:before {\n  transform: rotate(45deg);\n}\n\n.multiselect-tag-remove-button:after {\n  transform: rotate(-45deg);\n}\n\n.multiselect-popup {\n  position: absolute;\n  z-index: 1000;\n  top: 2rem;\n  display: none;\n  overflow-y: auto;\n  width: 100%;\n  max-height: 300px;\n  box-sizing: border-box;\n  border: 1px solid #bdbdbd;\n  border-radius: 0.2em;\n  background: white;\n}\n\n.multiselect-list {\n  padding: 0;\n  margin: 0;\n}\n\n.multiselect-list li {\n  padding: 0.5em 1em;\n  min-height: 1em;\n  list-style: none;\n  cursor: pointer;\n}\n\n.multiselect-list li[selected] {\n  background: #f3f3f3;\n}\n.multiselect-list li[selected]::before {\n  content: \"✔\";\n  padding-right: 10px;\n}\n\n.multiselect-list li:focus {\n  outline: dotted 1px #333;\n  background: #e9e9e9;\n}\n\n.multiselect-list li:hover {\n  background: #e9e9e9;\n}";

/**
 * @category Web Components
 * @customelement ui-multiselect
 * @description A multiselect

 * @example <caption>Multi select example</caption>
 * <ui-multiselect></ui-multiselect>
 */
class UImultiSelect extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.selected = {};
    this.items = [];
  }
  connectedCallback() {
    this._options = {
      placeholder: this.getAttribute("placeholder") || 'Select'
    };
    if (this.hasAttribute("viewkey")) this.viewkey = this.getAttribute("viewkey");
    if (this.hasAttribute("desckey")) this.desckey = this.getAttribute("desckey");
    if (this.hasAttribute("valuekey")) this.valuekey = this.getAttribute("valuekey");
    render(html`<style>${style$1}</style>
        <slot><input></slot>
        <div class="multiselect-popup">
            <ul class="multiselect-list" role="listbox" aria-multiselectable="true"></ul>
        </div>
        `, this.shadowRoot);

    let slot = this.shadowRoot.querySelector('slot').assignedNodes();
    let input = (slot.length > 0) ? slot[0] : this.shadowRoot.querySelector('input');
    if (this.hasAttribute("required")) input.setAttribute("required", "required");
    input.style.color = "transparent";
    input.style.height = "initial";
    input.addEventListener("click", e => e.preventDefault());
    input.setAttribute("autocomplete", "off");
    this.input = input;
    this.style.height = "initial";
    this._field = this.shadowRoot;
    this._popup = this.shadowRoot.querySelector('.multiselect-popup');
    this._list = this.shadowRoot.querySelector('.multiselect-list');

    this.fieldClickHandlerBound = e => this.fieldClickHandler(e);
    this.shadowRoot.addEventListener('click', this.fieldClickHandlerBound);
    this.shadowRoot.addEventListener('keydown', this.keyDownHandler.bind(this));

    this._field.appendChild(this.createPlaceholder());

    if (this.hasAttribute("options")) {
      this.items = this.getAttribute("options").split(",").map(e => { return { "id": e, "label": e } });
      this.renderOptionsList();
    } else if (this.cachedOptions) {
      this.options = this.cachedOptions;
      delete this.cachedOptions;
    }

    if (this.cachedValue) {
      this.value = this.cachedValue;
      delete this.cachedValue;
    }
  }
  disconnectedCallback() {
    this.shadowRoot.removeEventListener('click', this.fieldClickHandlerBound);
  }
  attributeChangedCallback(optionName, oldValue, newValue) {
    this._options[optionName] = newValue;
    if (optionName == "options") this.renderOptionsList();
  };
  set options(newValue) {
    if (!this._list) {
      this.cachedOptions = newValue;
      return;
    }
    if (!this.viewkey || !this.valuekey) {
      console.warn("No viewkey/valuekey set!", newValue);
      return;
    }
    const options = [];
    for (let entry of newValue) {
      const id = entry[this.valuekey];
      const label = entry[this.viewkey];
      const desc = entry[this.desckey];
      //console.log("OPTION", { id, label, desc });
      options.push({ id, label, desc });
    }
    this.items = options;
    this.renderOptionsList();
    this.renderField();
  }
  get value() {
    return Object.keys(this.selected).join(",");
  }
  get valueArray() {
    return Object.keys(this.selected);
  }
  set value(newVal) {
    if (!this._list) {
      this.cachedValue = newVal;
      return;
    }

    if (!newVal || !newVal.length) newVal = [];

    let keys = Array.isArray(newVal) ? newVal : newVal.split(",");
    for (let key of keys) {
      if (this.selected[key]) continue;
      let found = false;
      for (let item of this.items) {
        if (item.id === key) {
          this.selected[key] = item;
          found = true;
          break;
        }
      }
      if (!found) {
        this.selected[key] = { id: key, label: key };
      }
    }
    // Remove entries form this.selected that are not in keys
    let oldKeys = Object.keys(this.selected);
    for (let oldKey of oldKeys) {
      if (!keys.includes(oldKey)) {
        delete this.selected[oldKey];
      }
    }

    this.renderField();
  }
  renderOptionsList() {
    while (this._list.firstChild) { this._list.firstChild.remove(); }
    for (let item of this.items) {
      const liEl = document.createElement("li");
      liEl.setAttribute("role", "option");
      liEl.setAttribute("tabindex", -1);
      liEl.dataset.id = item.id;
      liEl.dataset.label = item.label;
      if (item.desc) {
        liEl.dataset.desc = item.desc;
        liEl.innerHTML = `<b>${item.label}</b><br><small>${item.desc}</small>`;
      } else liEl.innerHTML = item.label;
      // Selected?
      if (this.selected[item.id]) {
        liEl.setAttribute('selected', 'selected');
        liEl.setAttribute('aria-selected', true);
        this.selected[item.id] = { id: item.id, label: item.label, desc: item.desc };
      }

      const liEl2 = this._list.appendChild(liEl);
      liEl2.addEventListener("click", (e) => this.selectItem(e.target.closest("li"), e));
    }
  }
  renderField() {
    let keys = Object.keys(this.selected);

    // Placeholder
    if (!keys.length) {
      this._field.querySelectorAll(".multiselect-tag").forEach(e => e.remove());
      if (!this._field.querySelector(".multiselect-field-placeholder"))
        this._field.appendChild(this.createPlaceholder());
      this.input.removeAttribute("value");
      return;
    } else {
      let placeholder = this._field.querySelector(".multiselect-field-placeholder");
      if (placeholder) placeholder.remove();
      this.input.setAttribute("value", "-");
    }

    const foundItems = {};
    const nodes = this._field.querySelectorAll(".multiselect-tag");
    for (let node of nodes) {
      const id = node.dataset.id;
      if (!keys.includes(id)) { // Remove
        node.remove();
      } else { // Update
        let tagInfo = this.selected[id];
        if (!tagInfo.label) continue;
        node.querySelector(".multiselect-tag-text").textContent = tagInfo.label;
        foundItems[id] = true;
      }
    }

    // Add
    for (let tagKey of keys) {
      const newTagInfo = this.selected[tagKey];
      const id = newTagInfo.id;
      if (!id || foundItems[id]) continue;

      const tag = document.createElement('div');
      tag.dataset.id = id;
      tag.className = 'multiselect-tag';
      const content = document.createElement('div');
      content.className = 'multiselect-tag-text';
      content.textContent = newTagInfo.label;
      if (newTagInfo.desc) content.title = newTagInfo.desc;
      const removeButton = document.createElement('div');
      removeButton.className = 'multiselect-tag-remove-button';
      removeButton.dataset.id = id;
      removeButton.addEventListener('click', (e) => this.removeClick(e));
      tag.appendChild(content);
      tag.appendChild(removeButton);

      this._field.appendChild(tag);
    }
  }
  fieldClickHandler() {
    this._isOpened ? this.close() : this.open();
  }
  keyDownHandler(event) {
    switch (event.which) {
      case 8:
        this.handleBackspaceKey();
        break;
      case 13:
        this.handleEnterKey();
        break;
      case 27:
        this.handleEscapeKey();
        break;
      case 38:
        event.altKey ? this.handleAltArrowUpKey() : this.handleArrowUpKey();
        break;
      case 40:
        event.altKey ? this.handleAltArrowDownKey() : this.handleArrowDownKey();
        break;
      default:
        return;
    }
    event.preventDefault();
  }
  handleEnterKey() {
    if (this._isOpened) {
      const focusedItem = this.shadowRoot.querySelectorAll('li')[this._focusedItemIndex];
      if (focusedItem) this.selectItem(focusedItem);
    }
  }
  handleArrowDownKey() {
    this._focusedItemIndex = (this._focusedItemIndex < this.shadowRoot.querySelectorAll('li').length - 1)
      ? this._focusedItemIndex + 1
      : 0;
    this.refreshFocusedItem();
  }
  handleArrowUpKey() {
    this._focusedItemIndex = (this._focusedItemIndex > 0)
      ? this._focusedItemIndex - 1
      : this.shadowRoot.querySelectorAll('li').length - 1;
    this.refreshFocusedItem();
  }
  handleAltArrowDownKey() {
    this.open();
  }
  handleAltArrowUpKey() {
    this.close();
  }
  refreshFocusedItem() {
    const el = this.shadowRoot.querySelectorAll('li')[this._focusedItemIndex];
    if (el) el.focus();
  }
  handleBackspaceKey() {
    const selectedItemElements = this.shadowRoot.querySelectorAll("li[selected]");
    if (selectedItemElements.length) {
      const item = selectedItemElements[selectedItemElements.length - 1];
      const itemID = item.dataset.id;
      delete this.selected[itemID];
      item.removeAttribute('selected');
      item.setAttribute('aria-selected', false);
      this.renderField();
      this.fireChangeEvent();
      this.unselectItem();
    }
  }
  handleEscapeKey() {
    this.close();
  }
  selectItem(item, event) {
    if (event) event.stopPropagation();
    if (!item.hasAttribute('selected')) {
      item.setAttribute('selected', 'selected');
      item.setAttribute('aria-selected', true);
      this.selected[item.dataset.id] = { id: item.dataset.id, label: item.dataset.label, desc: item.dataset.desc };
      this.renderField();
      this.fireChangeEvent();
    }
    this.close();
  }
  fireChangeEvent() {
    const event = new CustomEvent("input");
    this.dispatchEvent(event);
  }
  togglePopup(show) {
    this._isOpened = show;
    this._popup.style.display = show ? 'block' : 'none';
    this.setAttribute("aria-expanded", show);
  }
  removeClick(event) {
    event.stopPropagation();
    const id = event.target.dataset.id;
    delete this.selected[id];
    const item = this._list.querySelector('li[data-id="' + id + '"]');
    if (item) {
      item.removeAttribute('selected');
      item.setAttribute('aria-selected', false);
    }
    let fieldItem = event.target.parentElement;
    fieldItem.remove();
    this.fireChangeEvent();
    this._focusedItemIndex = 0;
    if (Object.keys(this.selected).length == 0) this.renderField();
  }
  createPlaceholder() {
    const placeholder = document.createElement('div');
    placeholder.className = 'multiselect-field-placeholder';
    placeholder.textContent = this._options.placeholder;
    return placeholder;
  }
  open() {
    this.togglePopup(true);
    this.refreshFocusedItem();
  }
  close() {
    this.togglePopup(false);
    //this.shadowRoot.focus();
  }
  selectedItems() {
    const result = [];
    const selectedItems = this.shadowRoot.querySelectorAll('li[selected]');
    for (let i = 0; i < selectedItems.length; i++) {
      const selectedItem = selectedItems[i];
      result.push(selectedItem.hasAttribute('value')
        ? selectedItem.getAttribute('value')
        : selectedItem.textContent);
    }
    return result;
  }
}

customElements.define('ui-multiselect', UImultiSelect);

/**
 * @category Web Components
 * @customelement ui-youtube
 * @description Renders an embedded player for a youtube link.
 * @attribute videoid The youtube video ID
 * @attribute [videoparams] Youtube video parameters
 * 
 * @example <caption>An embedded youtube video</caption>
 * <ui-youtube videoid="t8DmGXQa7F4" videoparams="modestbranding=1&showinfo=0&controls=1&vq=hd720"></ui-youtube>
 */
class UiYoutube extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.classList.add("youtube");
    this.videoid = this.getAttribute("videoid") || null;
    this.videoparams = this.getAttribute("videoparams") || null;

    // Based on the YouTube ID, we can easily find the thumbnail image
    this.style.backgroundImage = 'url(http://i.ytimg.com/vi/' + this.videoid + '/sddefault.jpg)';

    // Overlay the Play icon to make it look like a video player
    let play = document.createElement("div");
    play.setAttribute("class", "play");
    play = this.appendChild(play);

    this.onclick = function () {
      // Create an iFrame with autoplay set to true
      const iframe = document.createElement("iframe");
      const iframe_url = "https://www.youtube.com/embed/" + this.videoid + "?autoplay=1&autohide=1";
      if (this.videoparams) iframe_url += '&' + this.videoparams;
      iframe.setAttribute("src", iframe_url);
      iframe.setAttribute("frameborder", '0');
      iframe.setAttribute("allowfullscreen", 'true');
      iframe.setAttribute("allow", 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture');

      // The height and width of the iFrame should be the same as parent
      iframe.style.width = this.style.width;
      iframe.style.height = this.style.height;

      // Replace the YouTube thumbnail with YouTube Player
      play.remove();
      this.appendChild(iframe);
    };
  }
}

customElements.define('ui-youtube', UiYoutube);

class FetchError extends Error {
  constructor(message, status) {
    super(message);
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, FetchError);
    }
    this.message = message;
    this.status = status;
  }
  networkErrorMessage() {
    return this.message + " (" + this.status + ")";
  }
  toString() {
    return this.message + " (" + this.status + ")";
  }
}

async function fetchWithTimeout(url, timeout = 5000) {
  const controller = new AbortController();
  const signal = controller.signal;
  setTimeout(() => controller.abort(), timeout);
  const response = await fetch(url, { signal: signal, validateHttpsCertificates: false, muteHttpExceptions: true }).catch(e => {
    throw (e instanceof DOMException && e.name === "AbortError" ? "Timeout after " + (timeout / 1000) + "s." : e);
  });
  if (!response.ok) {
    const body = await response.text();
    throw new FetchError(response.statusText + " " + body, response.status);
  }
  return response;
}

/**
 * @category Web Components
 * @customelement ui-community-topics
 * @description This element renders a list of topics threads from the given forum url.
 * 
 * Attributes:
 * - "url": For example "https://api.github.com/repos/openhab/openhab2-addons/issues".
 * - "loading": The loading html text
 * - "error": The error html text
 * - "nothome": read-only. Will be set, when the url is overwritten by "content"
 * 
 * Methods:
 * - checkCacheAndLoad(): Reloads data.
 * - reload(): Reset cache and reload.
 * - load(): Load a specific url
 * 
 * Properties:
 * - contenturl: Content that temporarly overwrittes the current url 
 */
class OhCommunityTopics extends HTMLElement {
  constructor() {
    super();
    if (!this.style.display || this.style.display.length == 0)
      this.style.display = "block";
  }
  static get observedAttributes() {
    return ['url', 'cachetime'];
  }
  connectedCallback() {
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.limit = this.hasAttribute("limit") ? parseInt(this.getAttribute("limit")) : null;
    this.topics = this.hasAttribute("topics") ? this.getAttribute("topics") : null;
    this.order = this.hasAttribute("order") ? this.getAttribute("order") : "created";
    this.attributeChangedCallback();
    this.initdone = true;
    this.checkCacheAndLoad();
  }
  set contenturl(val) {
    while (this.firstChild) { this.firstChild.remove(); }
    this.innerHTML = this.loading;
    this.checkCacheAndLoad(val);
  }
  get contenturl() {
    if (!this.topics) return null;
    if (this.order)
      return this.url + "/" + this.topics + ".json?order=" + this.order;
    else
      return this.url + "/" + this.topics + ".json";
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.cachetime = this.cachetime = (this.hasAttribute("cachetime") ? parseInt(this.getAttribute("cachetime")) : null) || 1440; // One day in minutes
    this.url = this.hasAttribute("url") ? this.getAttribute("url") : "https://cors-anywhere.herokuapp.com/https://community.openhab.org";
    if (this.initdone) this.checkCacheAndLoad();
  }
  checkCacheAndLoad() {
    if (!this.contenturl) {
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = "No url given!";
      return;
    }
    const cacheTimestamp = parseInt(localStorage.getItem("timestamp_" + this.contenturl)) || 0;
    this.title = `Caching for ${this.cachetime / 60} hours. Last refresh: ${new Date(cacheTimestamp).toLocaleString()}`;
    let cachedData = null;
    if (cacheTimestamp > 0 && (cacheTimestamp + this.cachetime * 60 * 1000 > Date.now())) {
      cachedData = localStorage.getItem(this.contenturl);
    }
    if (cachedData) {
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = cachedData;
    } else {
      this.reload();
    }
  }
  reload() {
    if (!this.contenturl) {
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = "No url given!";
      return;
    }
    localStorage.removeItem("timestamp_" + this.contenturl);
    while (this.firstChild) { this.firstChild.remove(); }
    this.innerHTML = this.loading;
    this.load();
  }
  load() {
    const url = this.contenturl;
    fetchWithTimeout(url)
      .then(response => response.json())
      .then(jsonData => {
        let d = "<ul>";
        let counter = 0;
        for (let topic of jsonData.topic_list.topics) {
          const date = new Date(topic.created_at).toLocaleDateString();
          d += "<li><a target='_blank' href='https://community.openhab.org/t/" + topic.slug + "/" + topic.id + "'>" + topic.title + "</a> <small>" + date + "</small></li>";
          if (this.limit > 0 && this.limit <= counter) break;
          ++counter;
        }        return d + "</ul>";
      })
      .then(html => {
        localStorage.setItem(url, html);
        localStorage.setItem("timestamp_" + url, Date.now());
        this.title = `Caching for ${this.cachetime / 60} hours. Last refresh: ${new Date(Date.now()).toLocaleString()}`;
        while (this.firstChild) { this.firstChild.remove(); }
        this.innerHTML = html;
      }).catch(e => {
        while (this.firstChild) { this.firstChild.remove(); }
        this.innerHTML = this.error + e + " " + this.url;
        throw e;
      });
  }
}

customElements.define('ui-community-topics', OhCommunityTopics);

/**
 * Helpers
 */
    
function escape$1(html, encode) {
    if (encode) {
        if (escape$1.escapeTest.test(html)) {
        return html.replace(escape$1.escapeReplace, function (ch) { return escape$1.replacements[ch]; });
        }
    } else {
        if (escape$1.escapeTestNoEncode.test(html)) {
        return html.replace(escape$1.escapeReplaceNoEncode, function (ch) { return escape$1.replacements[ch]; });
        }
    }

    return html;
}

escape$1.escapeTest = /[&<>"']/;
escape$1.escapeReplace = /[&<>"']/g;
escape$1.replacements = {
'&': '&amp;',
'<': '&lt;',
'>': '&gt;',
'"': '&quot;',
"'": '&#39;'
};

escape$1.escapeTestNoEncode = /[<>"']|&(?!#?\w+;)/;
escape$1.escapeReplaceNoEncode = /[<>"']|&(?!#?\w+;)/g;

function unescape(html) {
    // explicitly match decimal, hex, and named HTML entities
    return html.replace(/&(#(?:\d+)|(?:#x[0-9A-Fa-f]+)|(?:\w+));?/ig, 
        function(_, n) {
            n = n.toLowerCase();
            if (n === 'colon') return ':';
            if (n.charAt(0) === '#') {
                return n.charAt(1) === 'x'
                ? String.fromCharCode(parseInt(n.substring(2), 16))
                : String.fromCharCode(+n.substring(1));
            }
        return '';
    });
}

function edit(regex, opt) {
    regex = regex.source || regex;
    opt = opt || '';
    return {
        replace: function(name, val) {
            val = val.source || val;
            val = val.replace(/(^|[^\[])\^/g, '$1');
            regex = regex.replace(name, val);
            return this;
        },
        getRegex: function() {
            return new RegExp(regex, opt);
        }
    };
}

let baseUrls = {};
let originIndependentUrl = /^$|^[a-z][a-z0-9+.-]*:|^[?#]/i;

function resolveUrl(base, href) {
    if (!baseUrls[' ' + base]) {
        // we can ignore everything in base after the last slash of its path component,
        // but we might need to add _that_
        // https://tools.ietf.org/html/rfc3986#section-3
        if (/^[^:]+:\/*[^/]*$/.test(base)) {
            baseUrls[' ' + base] = base + '/';
        } else {
            baseUrls[' ' + base] = rtrim(base, '/', true);
        }
    }
    base = baseUrls[' ' + base];

    if (href.slice(0, 2) === '//') {
        return base.replace(/:[\s\S]*/, ':') + href;
    } else if (href.charAt(0) === '/') {
        return base.replace(/(:\/*[^/]*)[\s\S]*/, '$1') + href;
    } else {
        return base + href;
    }
}


function noop() {}
noop.exec = noop;

function merge(obj) {
    let i = 1,
        target,
        key;

    for (; i < arguments.length; i++) {
    target = arguments[i];
        for (key in target) {
            if (Object.prototype.hasOwnProperty.call(target, key)) {
                obj[key] = target[key];
            }
        }
    }
    return obj;
}

function splitCells(tableRow, count) {
    // ensure that every cell-delimiting pipe has a space
    // before it to distinguish it from an escaped pipe
    let row = tableRow.replace(/\|/g, function (match, offset, str) {
        let escaped = false,
            curr = offset;
        while (--curr >= 0 && str[curr] === '\\') escaped = !escaped;
        if (escaped) {
            // odd number of slashes means | is escaped
            // so we leave it alone
            return '|';
        } else {
            // add space before unescaped |
            return ' |';
        }
        }),
        cells = row.split(/ \|/),
        i = 0;

    if (cells.length > count) {
        cells.splice(count);
    } else {
        while (cells.length < count) cells.push('');
    }

    for (; i < cells.length; i++) {
        // leading or trailing whitespace is ignored per the gfm spec
        cells[i] = cells[i].trim().replace(/\\\|/g, '|');
    }
    return cells;
}

// Remove trailing 'c's. Equivalent to str.replace(/c*$/, '').
// /c*$/ is vulnerable to REDOS.
// invert: Remove suffix of non-c chars instead. Default falsey.
function rtrim(str, c, invert) {
    if (str.length === 0) {
        return '';
    }

    // Length of suffix matching the invert condition.
    let suffLen = 0;

    // Step left until we fail to match the invert condition.
    while (suffLen < str.length) {
        let currChar = str.charAt(str.length - suffLen - 1);
        if (currChar === c && !invert) {
            suffLen++;
        } else if (currChar !== c && invert) {
            suffLen++;
        } else {
            break;
        }
    }
    return str.substr(0, str.length - suffLen);
}

/**
 * Renderer
 */
class Renderer$1{

    constructor(options,defaults) {
      this.options = options || defaults;
    }
    
    code(code, lang, escaped) {
      if (this.options.highlight) {
        let out = this.options.highlight(code, lang);
        if (out != null && out !== code) {
          escaped = true;
          code = out;
        }
      }
    
      if (!lang) {
        return '<pre><code>'
          + (escaped ? code : escape$1(code, true))
          + '</code></pre>';
      }
    
      return '<pre><code class="'
        + this.options.langPrefix
        + escape$1(lang, true)
        + '">'
        + (escaped ? code : escape$1(code, true))
        + '</code></pre>\n';
    };
    
    blockquote(quote) {
      return '<blockquote>\n' + quote + '</blockquote>\n';
    };
    
    html(html) {
      return html;
    };
    
    heading(text, level, raw) {
      if (this.options.headerIds) {
        return '<h'
          + level
          + ' id="'
          + this.options.headerPrefix
          + raw.toLowerCase().replace(/[^\w]+/g, '-')
          + '">'
          + text
          + '</h'
          + level
          + '>\n';
      }
      // ignore IDs
      return '<h' + level + '>' + text + '</h' + level + '>\n';
    };
    
    hr(){
      return this.options.xhtml ? '<hr/>\n' : '<hr>\n';
    };
    
    list(body, ordered, start){
      let type = ordered ? 'ol' : 'ul',
          startatt = (ordered && start !== 1) ? (' start="' + start + '"') : '';
      return '<' + type + startatt + '>\n' + body + '</' + type + '>\n';
    };
    
    listitem(text) {
      return '<li>' + text + '</li>\n';
    };
    
    checkbox(checked) {
      return '<input '
        + (checked ? 'checked="" ' : '')
        + 'disabled="" type="checkbox"'
        + (this.options.xhtml ? ' /' : '')
        + '> ';
    };
    
    paragraph(text) {
      return '<p>' + text + '</p>\n';
    };
    
    table(header, body) {
      if (body) body = '<tbody>' + body + '</tbody>';
    
      return '<table>\n'
        + '<thead>\n'
        + header
        + '</thead>\n'
        + body
        + '</table>\n';
    };
    
    tablerow(content) {
      return '<tr>\n' + content + '</tr>\n';
    };
    
    tablecell(content, flags) {
      let type = flags.header ? 'th' : 'td';
      let tag = flags.align
        ? '<' + type + ' align="' + flags.align + '">'
        : '<' + type + '>';
      return tag + content + '</' + type + '>\n';
    };
    
    // span level renderer
    strong(text) {
      return '<strong>' + text + '</strong>';
    };
    
    em(text) {
      return '<em>' + text + '</em>';
    };
    
    codespan(text) {
      return '<code>' + text + '</code>';
    };
    
    br() {
      return this.options.xhtml ? '<br/>' : '<br>';
    };
    
    del(text) {
      return '<del>' + text + '</del>';
    };
    
    link(href, title, text) {
      if (this.options.sanitize) {
        try {
          let prot = decodeURIComponent(unescape(href))
            .replace(/[^\w:]/g, '')
            .toLowerCase();
        } catch (e) {
          return text;
        }
        if (prot.indexOf('javascript:') === 0 || prot.indexOf('vbscript:') === 0 || prot.indexOf('data:') === 0) {
          return text;
        }
      }
      if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        href = resolveUrl(this.options.baseUrl, href);
      }
      try {
        href = encodeURI(href).replace(/%25/g, '%');
      } catch (e) {
        return text;
      }
      let out = '<a href="' + escape$1(href) + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += '>' + text + '</a>';
      return out;
    };
    
    image(href, title, text) {
      if (this.options.baseUrl && !originIndependentUrl.test(href)) {
        href = resolveUrl(this.options.baseUrl, href);
      }
      let out = '<img src="' + href + '" alt="' + text + '"';
      if (title) {
        out += ' title="' + title + '"';
      }
      out += this.options.xhtml ? '/>' : '>';
      return out;
    };
    
    text(text) {
      return text;
    };
}

    /**
     * TextRenderer
     * returns only the textual part of the token
     */
    
    class TextRenderer{}    
    // no need for block level renderers
    
    TextRenderer.prototype.strong =
    TextRenderer.prototype.em =
    TextRenderer.prototype.codespan =
    TextRenderer.prototype.del =
    TextRenderer.prototype.text = function (text) {
      return text;
    };
    
    TextRenderer.prototype.link =
    TextRenderer.prototype.image = function(href, title, text) {
      return '' + text;
    };
    
    TextRenderer.prototype.br = function() {
      return '';
    };

/**
 * Block-Level Grammar
 */
let block = {
  blockquote: /^( {0,3}> ?(paragraph|[^\n]*)(?:\n|$))+/,
  bullet : /(?:[*+-]|\d+\.)/,
  code: /^( {4}[^\n]+\n*)+/,
  _comment : /<!--(?!-?>)[\s\S]*?-->/,
  def: /^ {0,3}\[(label)\]: *\n? *<?([^\s>]+)>?(?:(?: +\n? *| *\n *)(title))? *(?:\n+|$)/,
  fences: noop,
  heading: /^ *(#{1,6}) *([^\n]+?) *(?:#+ *)?(?:\n+|$)/,
  hr: /^ {0,3}((?:- *){3,}|(?:_ *){3,}|(?:\* *){3,})(?:\n+|$)/,
  html: '^ {0,3}(?:' // optional indentation
        + '<(script|pre|style)[\\s>][\\s\\S]*?(?:</\\1>[^\\n]*\\n+|$)' // (1)
        + '|comment[^\\n]*(\\n+|$)' // (2)
        + '|<\\?[\\s\\S]*?\\?>\\n*' // (3)
        + '|<![A-Z][\\s\\S]*?>\\n*' // (4)
        + '|<!\\[CDATA\\[[\\s\\S]*?\\]\\]>\\n*' // (5)
        + '|</?(tag)(?: +|\\n|/?>)[\\s\\S]*?(?:\\n{2,}|$)' // (6)
        + '|<(?!script|pre|style)([a-z][\\w-]*)(?:attribute)*? */?>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$)' // (7) open tag
        + '|</(?!script|pre|style)[a-z][\\w-]*\\s*>(?=\\h*\\n)[\\s\\S]*?(?:\\n{2,}|$)' // (7) closing tag
        + ')', 
  item : /^( *)(bull) [^\n]*(?:\n(?!\1bull )[^\n]*)*/,
  _label : /(?!\s*\])(?:\\[\[\]]|[^\[\]])+/,
  lheading: /^([^\n]+)\n *(=|-){2,} *(?:\n+|$)/,
  list: /^( *)(bull) [\s\S]+?(?:hr|def|\n{2,}(?! )(?!\1bull )\n*|\s*$)/,
  newline: /^\n+/,
  nptable: noop,
  paragraph: /^([^\n]+(?:\n(?!hr|heading|lheading| {0,3}>|<\/?(?:tag)(?: +|\n|\/?>)|<(?:script|pre|style|!--))[^\n]+)*)/,
  table: noop,  
  text: /^[^\n]+/,
  _title : /(?:"(?:\\"?|[^"\\])*"|'[^'\n]*(?:\n[^'\n]+)*\n?'|\([^()]*\))/,
  _tag : 'address|article|aside|base|basefont|blockquote|body|caption'
          + '|center|col|colgroup|dd|details|dialog|dir|div|dl|dt|fieldset|figcaption'
          + '|figure|footer|form|frame|frameset|h[1-6]|head|header|hr|html|iframe'
          + '|legend|li|link|main|menu|menuitem|meta|nav|noframes|ol|optgroup|option'
          + '|p|param|section|source|summary|table|tbody|td|tfoot|th|thead|title|tr'
          + '|track|ul'
};

/**
 * Normal Block Grammar
 */

block.def = edit(block.def)
            .replace('label', block._label)
            .replace('title', block._title)
            .getRegex();
    
block.item = edit(block.item, 'gm')
            .replace(/bull/g, block.bullet)
            .getRegex();

block.list = edit(block.list)
            .replace(/bull/g, block.bullet)
            .replace('hr', '\\n+(?=\\1?(?:(?:- *){3,}|(?:_ *){3,}|(?:\\* *){3,})(?:\\n+|$))')
            .replace('def', '\\n+(?=' + block.def.source + ')')
            .getRegex();

block.html = edit(block.html, 'i')
            .replace('comment', block._comment)
            .replace('tag', block._tag)
            .replace('attribute', / +[a-zA-Z:_][\w.:-]*(?: *= *"[^"\n]*"| *= *'[^'\n]*'| *= *[^\s"'=<>`]+)?/)
            .getRegex();

block.paragraph = edit(block.paragraph)
                  .replace('hr', block.hr)
                  .replace('heading', block.heading)
                  .replace('lheading', block.lheading)
                  .replace('tag', block._tag) // pars can be interrupted by type (6) html blocks
                  .getRegex();

block.blockquote = edit(block.blockquote)
                  .replace('paragraph', block.paragraph)
                  .getRegex();
    
block.normal = merge({}, block);
/**
 * GFM Block Grammar
 */

block.gfm = merge({}, block.normal, {
  fences: /^ *(`{3,}|~{3,})[ \.]*(\S+)? *\n([\s\S]*?)\n? *\1 *(?:\n+|$)/,
  paragraph: /^/,
  heading: /^ *(#{1,6}) +([^\n]+?) *#* *(?:\n+|$)/
});

block.gfm.paragraph = edit(block.paragraph)
  .replace('(?!', '(?!'
    + block.gfm.fences.source.replace('\\1', '\\2') + '|'
    + block.list.source.replace('\\1', '\\3') + '|')
  .getRegex();

/**
 * GFM + Tables Block Grammar
 */

block.tables = merge({}, block.gfm, {
  nptable: /^ *([^|\n ].*\|.*)\n *([-:]+ *\|[-| :]*)(?:\n((?:.*[^>\n ].*(?:\n|$))*)\n*|$)/,
  table: /^ *\|(.+)\n *\|?( *[-:]+[-| :]*)(?:\n((?: *[^>\n ].*(?:\n|$))*)\n*|$)/
});
    
/**
 * Pedantic grammar
 */

block.pedantic = merge({}, block.normal, {
  html: edit(
    '^ *(?:comment *(?:\\n|\\s*$)'
    + '|<(tag)[\\s\\S]+?</\\1> *(?:\\n{2,}|\\s*$)' // closed tag
    + '|<tag(?:"[^"]*"|\'[^\']*\'|\\s[^\'"/>\\s]*)*?/?> *(?:\\n{2,}|\\s*$))')
    .replace('comment', block._comment)
    .replace(/tag/g, '(?!(?:'
      + 'a|em|strong|small|s|cite|q|dfn|abbr|data|time|code|var|samp|kbd|sub'
      + '|sup|i|b|u|mark|ruby|rt|rp|bdi|bdo|span|br|wbr|ins|del|img)'
      + '\\b)\\w+(?!:|[^\\w\\s@]*@)\\b')
    .getRegex(),
  def: /^ *\[([^\]]+)\]: *<?([^\s>]+)>?(?: +(["(][^\n]+[")]))? *(?:\n+|$)/
});

/**
 * Inline-Level Grammar
 */
    
let inline = {
    escape: /^\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/,
    autolink: /^<(scheme:[^\s\x00-\x1f<>]*|email)>/,
    url: noop,
    tag: '^comment'
    + '|^</[a-zA-Z][\\w:-]*\\s*>' // self-closing tag
    + '|^<[a-zA-Z][\\w-]*(?:attribute)*?\\s*/?>' // open tag
    + '|^<\\?[\\s\\S]*?\\?>' // processing instruction, e.g. <?php ?>
    + '|^<![a-zA-Z]+\\s[\\s\\S]*?>' // declaration, e.g. <!DOCTYPE html>
    + '|^<!\\[CDATA\\[[\\s\\S]*?\\]\\]>', // CDATA section
    link: /^!?\[(label)\]\(href(?:\s+(title))?\s*\)/,
    reflink: /^!?\[(label)\]\[(?!\s*\])((?:\\[\[\]]?|[^\[\]\\])+)\]/,
    nolink: /^!?\[(?!\s*\])((?:\[[^\[\]]*\]|\\[\[\]]|[^\[\]])*)\](?:\[\])?/,
    strong: /^__([^\s])__(?!_)|^\*\*([^\s])\*\*(?!\*)|^__([^\s][\s\S]*?[^\s])__(?!_)|^\*\*([^\s][\s\S]*?[^\s])\*\*(?!\*)/,
    em: /^_([^\s_])_(?!_)|^\*([^\s*"<\[])\*(?!\*)|^_([^\s][\s\S]*?[^\s_])_(?!_)|^_([^\s_][\s\S]*?[^\s])_(?!_)|^\*([^\s"<\[][\s\S]*?[^\s*])\*(?!\*)|^\*([^\s*"<\[][\s\S]*?[^\s])\*(?!\*)/,
    code: /^(`+)([^`]|[^`][\s\S]*?[^`])\1(?!`)/,
    br: /^( {2,}|\\)\n(?!\s*$)/,
    del: noop,
    text: /^(`+|[^`])[\s\S]*?(?=[\\<!\[`*]|\b_| {2,}\n|$)/,
    _escapes: /\\([!"#$%&'()*+,\-./:;<=>?@\[\]\\^_`{|}~])/g,
    _scheme : /[a-zA-Z][a-zA-Z0-9+.-]{1,31}/,
    _email : /[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+(@)[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+(?![-_])/,
    _attribute : /\s+[a-zA-Z:_][\w.:-]*(?:\s*=\s*"[^"]*"|\s*=\s*'[^']*'|\s*=\s*[^\s"'=<>`]+)?/,
    _label : /(?:\[[^\[\]]*\]|\\[\[\]]?|`[^`]*`|[^\[\]\\])*?/,
    _href : /\s*(<(?:\\[<>]?|[^\s<>\\])*>|(?:\\[()]?|\([^\s\x00-\x1f\\]*\)|[^\s\x00-\x1f()\\])*?)/,
    _title : /"(?:\\"?|[^"\\])*"|'(?:\\'?|[^'\\])*'|\((?:\\\)?|[^)\\])*\)/
};

inline.autolink = edit(inline.autolink)
    .replace('scheme', inline._scheme)
    .replace('email', inline._email)
    .getRegex();

inline.tag = edit(inline.tag)
    .replace('comment', block._comment)
    .replace('attribute', inline._attribute)
    .getRegex();

inline.link = edit(inline.link)
    .replace('label', inline._label)
    .replace('href', inline._href)
    .replace('title', inline._title)
    .getRegex();

inline.reflink = edit(inline.reflink)
    .replace('label', inline._label)
    .getRegex();

/**
 * Normal Inline Grammar
 */

inline.normal = merge({}, inline);

/**
 * Pedantic Inline Grammar
 */

inline.pedantic = merge({}, inline.normal, {
    strong: /^__(?=\S)([\s\S]*?\S)__(?!_)|^\*\*(?=\S)([\s\S]*?\S)\*\*(?!\*)/,
    em: /^_(?=\S)([\s\S]*?\S)_(?!_)|^\*(?=\S)([\s\S]*?\S)\*(?!\*)/,
    link: edit(/^!?\[(label)\]\((.*?)\)/)
    .replace('label', inline._label)
    .getRegex(),
    reflink: edit(/^!?\[(label)\]\s*\[([^\]]*)\]/)
    .replace('label', inline._label)
    .getRegex()
});

/**
 * GFM Inline Grammar
 */

inline.gfm = merge({}, inline.normal, {
    escape: edit(inline.escape).replace('])', '~|])').getRegex(),
    _extended_email: /[A-Za-z0-9._+-]+(@)[a-zA-Z0-9-_]+(?:\.[a-zA-Z0-9-_]*[a-zA-Z0-9])+(?![-_])/,
    url: /^((?:ftp|https?):\/\/|www\.)(?:[a-zA-Z0-9\-]+\.?)+[^\s<]*|^email/,
    _backpedal: /(?:[^?!.,:;*_~()&]+|\([^)]*\)|&(?![a-zA-Z0-9]+;$)|[?!.,:;*_~)]+(?!$))+/,
    del: /^~+(?=\S)([\s\S]*?\S)~+/,
    text: edit(inline.text)
    .replace(']|', '~]|')
    .replace('|$', '|https?://|ftp://|www\\.|[a-zA-Z0-9.!#$%&\'*+/=?^_`{\\|}~-]+@|$')
    .getRegex()
});

inline.gfm.url = edit(inline.gfm.url)
    .replace('email', inline.gfm._extended_email)
    .getRegex();
/**
 * GFM + Line Breaks Inline Grammar
 */

inline.breaks = merge({}, inline.gfm, {
    br: edit(inline.br).replace('{2,}', '*').getRegex(),
    text: edit(inline.gfm.text).replace('{2,}', '*').getRegex()
});

/**
 * Inline Lexer & Compiler
 */ 
class InlineLexer{
    constructor(links, options) {
        this.options = options || marked.defaults;
        this.links = links;
        this.rules = inline.normal;
        this.renderer = this.options.renderer || new Renderer();
        this.renderer.options = this.options;

        if (!this.links) {
            throw new Error('Tokens array requires a `links` property.');
        }

        /**
         * Expose Inline Rules
         */
        if (this.options.pedantic) {
            this.rules = inline.pedantic;
        } else if (this.options.gfm) {
            if (this.options.breaks) {
                this.rules = inline.breaks;
            } else {
                this.rules = inline.gfm;
            }
        }else{
          this.rules = inline;
        }

      }
    
    /**
     * Static Lexing/Compiling Method
     */
    static output(src, links, options) {
        let inline = new InlineLexer(links, options);
        return inline.output(src);
    };
    //Non static method
    output(src) {
        //console.log("prepping output for: ",src);
        let out = '',
            link,
            text,
            href,
            title,
            cap,
            prevCapZero;
      
        while (src) {
          // escape
          if (cap = this.rules.escape.exec(src)) {
            //console.log('escape');
            src = src.substring(cap[0].length);
            out += cap[1];
            continue;
          }
      
          // autolink
          if (cap = this.rules.autolink.exec(src)) {
            //console.log('autolink');
            src = src.substring(cap[0].length);
            if (cap[2] === '@') {
              text = escape(this.mangle(cap[1]));
              href = 'mailto:' + text;
            } else {
              text = escape(cap[1]);
              href = text;
            }
            out += this.renderer.link(href, null, text);
            continue;
          }
      
          // url (gfm)
          if (!this.inLink && (cap = this.rules.url.exec(src))) {
            //console.log('url (gfm)');
            if (cap[2] === '@') {
              text = escape(cap[0]);
              href = 'mailto:' + text;
            } else {
              // do extended autolink path validation
              do {
                prevCapZero = cap[0];
                cap[0] = this.rules._backpedal.exec(cap[0])[0];
              } while (prevCapZero !== cap[0]);
              text = escape(cap[0]);
              if (cap[1] === 'www.') {
                href = 'http://' + text;
              } else {
                href = text;
              }
            }
            src = src.substring(cap[0].length);
            out += this.renderer.link(href, null, text);
            continue;
          }
      
          // tag
          if (cap = this.rules.tag.exec(src)) {
            //console.log('tag');
            if (!this.inLink && /^<a /i.test(cap[0])) {
              this.inLink = true;
            } else if (this.inLink && /^<\/a>/i.test(cap[0])) {
              this.inLink = false;
            }
            if (!this.inRawBlock && /^<(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              this.inRawBlock = true;
            } else if (this.inRawBlock && /^<\/(pre|code|kbd|script)(\s|>)/i.test(cap[0])) {
              this.inRawBlock = false;
            }
      
            src = src.substring(cap[0].length);
            out += this.options.sanitize
              ? this.options.sanitizer
                ? this.options.sanitizer(cap[0])
                : escape(cap[0])
              : cap[0];
            continue;
          }
      
          // link
          if (cap = this.rules.link.exec(src)) {
            //console.log('link');
            src = src.substring(cap[0].length);
            this.inLink = true;
            href = cap[2];
            if (this.options.pedantic) {
              link = /^([^'"]*[^\s])\s+(['"])(.*)\2/.exec(href);
      
              if (link) {
                href = link[1];
                title = link[3];
              } else {
                title = '';
              }
            } else {
              title = cap[3] ? cap[3].slice(1, -1) : '';
            }
            href = href.trim().replace(/^<([\s\S]*)>$/, '$1');
            out += this.outputLink(cap, {
              href: InlineLexer.escapes(href),
              title: InlineLexer.escapes(title)
            });
            this.inLink = false;
            continue;
          }
      
          // reflink, nolink
          if ((cap = this.rules.reflink.exec(src))
              || (cap = this.rules.nolink.exec(src))) {
                //console.log('reflink, nolink');
            src = src.substring(cap[0].length);
            link = (cap[2] || cap[1]).replace(/\s+/g, ' ');
            link = this.links[link.toLowerCase()];
            if (!link || !link.href) {
              out += cap[0].charAt(0);
              src = cap[0].substring(1) + src;
              continue;
            }
            this.inLink = true;
            out += this.outputLink(cap, link);
            this.inLink = false;
            continue;
          }
      
          // strong
          if (cap = this.rules.strong.exec(src)) {
            //console.log('strong');
            src = src.substring(cap[0].length);
            out += this.renderer.strong(this.output(cap[4] || cap[3] || cap[2] || cap[1]));
            continue;
          }
      
          // em
          if (cap = this.rules.em.exec(src)) {
            //console.log('em');
            src = src.substring(cap[0].length);
            out += this.renderer.em(this.output(cap[6] || cap[5] || cap[4] || cap[3] || cap[2] || cap[1]));
            continue;
          }
      
          // code
          if (cap = this.rules.code.exec(src)) {
            //console.log('code');
            src = src.substring(cap[0].length);
            out += this.renderer.codespan(escape(cap[2].trim(), true));
            continue;
          }
      
          // br
          if (cap = this.rules.br.exec(src)) {
            //console.log('br');
            src = src.substring(cap[0].length);
            out += this.renderer.br();
            continue;
          }
      
          // del (gfm)
          if (cap = this.rules.del.exec(src)) {
            //console.log('del (gfm)');
            src = src.substring(cap[0].length);
            out += this.renderer.del(this.output(cap[1]));
            continue;
          }
      
          // text
          if (cap = this.rules.text.exec(src)) {
            //console.log('text');
            src = src.substring(cap[0].length);
            //if (this.inRawBlock) {
              //console.log('text inRawBlock');
              out += this.renderer.text(cap[0]);
           // } else {
             // //console.log('text needs escaping');
              //out += this.renderer.text(escape(this.smartypants(cap[0])));
            //}
            continue;
          }
      
          if (src) {
            throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
          }
        }
        return out;
      };

    static escapes(text) {
      return text ? text.replace(InlineLexer.rules._escapes, '$1') : text;
    };

      /**
       * Compile Link
      */
    outputLink(cap, link) {
        let href = link.href,
            title = link.title ? escape(link.title) : null;
      
        return cap[0].charAt(0) !== '!'
          ? this.renderer.link(href, title, this.output(cap[1]))
          : this.renderer.image(href, title, escape(cap[1]));
      };

       /**
       * Smartypants Transformations
        */
      smartypants(text) {
        if (!this.options.smartypants) return text;
        return text
          // em-dashes
          .replace(/---/g, '\u2014')
          // en-dashes
          .replace(/--/g, '\u2013')
          // opening singles
          .replace(/(^|[-\u2014/(\[{"\s])'/g, '$1\u2018')
          // closing singles & apostrophes
          .replace(/'/g, '\u2019')
          // opening doubles
          .replace(/(^|[-\u2014/(\[{\u2018\s])"/g, '$1\u201c')
          // closing doubles
          .replace(/"/g, '\u201d')
          // ellipses
          .replace(/\.{3}/g, '\u2026');
      };

      /**
      * Mangle Links
      */
      mangle(text) {
        if (!this.options.mangle) return text;
        let out = '',
            l = text.length,
            i = 0,
            ch;
      
        for (; i < l; i++) {
          ch = text.charCodeAt(i);
          if (Math.random() > 0.5) {
            ch = 'x' + ch.toString(16);
          }
          out += '&#' + ch + ';';
        }
        return out;
      };
}

InlineLexer.rules = inline.normal;

/**
 * Parsing & Compiling
 */
class Parser {

  constructor(options) {
    this.tokens = [];
    this.token = null;
    this.options = options || marked.defaults;
    this.options.renderer = this.options.renderer || new Renderer$1();
    this.renderer = this.options.renderer;
    this.renderer.options = this.options;
  }

  /**
   * Static Parse Method
   */

  static parse(tokens, options) {
    let parser = new Parser(options);

    return parser.parse(tokens);
  };

  /**
   * Parse Loop
   */

  parse(tokens) {
    //console.warn("Parser.parse: ",tokens);
    this.inline = new InlineLexer(tokens.links, this.options);
    // use an InlineLexer with a TextRenderer to extract pure text
    this.inlineText = new InlineLexer(
      tokens.links,
      merge({}, this.options, { renderer: new TextRenderer() })
    );
    this.tokens = tokens.reverse();

    let out = '';
    while (this.next()) {
      out += this.tok();
    }
    //console.warn("out: ",out);
    return out;
  };

  /**
   * Next Token
   */

  next() {
    return this.token = this.tokens.pop();
  };

  /**
   * Preview Next Token
   */

  peek() {
    return this.tokens[this.tokens.length - 1] || 0;
  };

  /**
   * Parse Text Tokens
   */

  parseText() {
    let body = this.token.text;

    while (this.peek().type === 'text') {
      body += '\n' + this.next().text;
    }

    return this.inline.output(body);
  };

  /**
   * Parse Current Token
   */

  tok() {
    let body = '';
    switch (this.token.type) {
      case 'space': {
        return '';
      }
      case 'hr': {
        return this.renderer.hr();
      }
      case 'heading': {
        //console.log("placing "+this.token.text+" into a heading tag");
        let inlineOutPut = this.inline.output(this.token.text);
        //console.log("inlineOutPut: ",inlineOutPut);
        return this.renderer.heading(
          inlineOutPut,
          this.token.depth,
          unescape(this.inlineText.output(this.token.text)));
      }
      case 'code': {
        return this.renderer.code(this.token.text,
          this.token.lang,
          this.token.escaped);
      }
      case 'table': {
        let header = '',
          body = '',
          i,
          row,
          cell,
          j;

        // header
        cell = '';
        for (i = 0; i < this.token.header.length; i++) {
          cell += this.renderer.tablecell(
            this.inline.output(this.token.header[i]),
            { header: true, align: this.token.align[i] }
          );
        }
        header += this.renderer.tablerow(cell);

        for (i = 0; i < this.token.cells.length; i++) {
          row = this.token.cells[i];

          cell = '';
          for (j = 0; j < row.length; j++) {
            cell += this.renderer.tablecell(
              this.inline.output(row[j]),
              { header: false, align: this.token.align[j] }
            );
          }

          body += this.renderer.tablerow(cell);
        }
        return this.renderer.table(header, body);
      }
      case 'blockquote_start': {
        body = '';
        while (this.next().type !== 'blockquote_end') {
          body += this.tok();
        }
        return this.renderer.blockquote(body);
      }
      case 'list_start': {
        body = '';
        let ordered = this.token.ordered,
          start = this.token.start;

        while (this.next().type !== 'list_end') {
          body += this.tok();
        }
        return this.renderer.list(body, ordered, start);
      }
      case 'list_item_start': {
        body = '';
        let loose = this.token.loose;

        if (this.token.task) {
          body += this.renderer.checkbox(this.token.checked);
        }

        while (this.next().type !== 'list_item_end') {
          body += !loose && this.token.type === 'text'
            ? this.parseText()
            : this.tok();
        }

        return this.renderer.listitem(body);
      }
      case 'html': {
        return this.renderer.html(this.token.text);
      }
      case 'paragraph': {
        return this.renderer.paragraph(this.inline.output(this.token.text));
      }
      case 'text': {
        return this.renderer.paragraph(this.parseText());
      }
    }
  };
}

/**
 * Block Lexer
 */
class Lexer{
    constructor(options) {
      this.tokens = [];
      this.tokens.links = Object.create(null);
      this.options = options || marked.defaults;
      this.rules = block.normal;
    
      if (this.options.pedantic) {
        this.rules = block.pedantic;
      } else if (this.options.gfm) {
        if (this.options.tables) {
          this.rules = block.tables;
        } else {
          this.rules = block.gfm;
        }
      }
    }
    
    /**
     * Static Lex Method
     */
    
    static lex(src, options) {
      let lexer = new Lexer(options);
      return lexer.lex(src);
    };
    
    /**
     * Preprocessing
     */
    
    lex(src){
      src = src
        .replace(/\r\n|\r/g, '\n')
        .replace(/\t/g, '    ')
        .replace(/\u00a0/g, ' ')
        .replace(/\u2424/g, '\n');
    
      return this.tokenize(src, true);
    };
    
    /**
     * Lexing
     */
    
    tokenize(src, top) {
      src = src.replace(/^ +$/gm, '');
      let next,
          loose,
          cap,
          bull,
          b,
          item,
          listStart,
          listItems,
          t,
          space,
          i,
          tag,
          l,
          isordered,
          istask,
          ischecked;
    
      while (src) {
        // newline
        if (cap = this.rules.newline.exec(src)) {
          src = src.substring(cap[0].length);
          if (cap[0].length > 1) {
            this.tokens.push({
              type: 'space'
            });
          }
          //console.log('space');
        }
        
        // code
        if (cap = this.rules.code.exec(src)) {
          src = src.substring(cap[0].length);
          cap = cap[0].replace(/^ {4}/gm, '');
          this.tokens.push({
            type: 'code',
            text: !this.options.pedantic
              ? rtrim(cap, '\n')
              : cap
          });
          //console.log('code');
          continue;
        }
        
        // fences (gfm)
        if (cap = this.rules.fences.exec(src)) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'code',
            lang: cap[2],
            text: cap[3] || ''
          });
          //console.log('fences');
          continue;
        }
    
        // heading
        if (cap = this.rules.heading.exec(src)) {
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'heading',
            depth: cap[1].length,
            text: cap[2]
          });
          //console.log('heading');
          continue;
        }
    
        // table no leading pipe (gfm)
        if (top && (cap = this.rules.nptable.exec(src))) {
          //console.log('nptables');
          item = {
            type: 'table',
            header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
            align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
            cells: cap[3] ? cap[3].replace(/\n$/, '').split('\n') : []
          };
    
          if (item.header.length === item.align.length) {
            src = src.substring(cap[0].length);
    
            for (i = 0; i < item.align.length; i++) {
              if (/^ *-+: *$/.test(item.align[i])) {
                item.align[i] = 'right';
              } else if (/^ *:-+: *$/.test(item.align[i])) {
                item.align[i] = 'center';
              } else if (/^ *:-+ *$/.test(item.align[i])) {
                item.align[i] = 'left';
              } else {
                item.align[i] = null;
              }
            }
    
            for (i = 0; i < item.cells.length; i++) {
              item.cells[i] = splitCells(item.cells[i], item.header.length);
            }
    
            this.tokens.push(item);    
            continue;
          }
        }
    
        // hr
        if (cap = this.rules.hr.exec(src)) {
          //console.log('hr');
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'hr'
          });
          continue;
        }
    
        // blockquote
        if (cap = this.rules.blockquote.exec(src)) {
          //console.log('blockquote');
          src = src.substring(cap[0].length);    
          this.tokens.push({
            type: 'blockquote_start'
          });
    
          cap = cap[0].replace(/^ *> ?/gm, '');
    
          // Pass `top` to keep the current
          // "toplevel" state. This is exactly
          // how markdown.pl works.
          this.tokenize(cap, top);
    
          this.tokens.push({
            type: 'blockquote_end'
          });
    
          continue;
        }
    
        // list
        if (cap = this.rules.list.exec(src)) {
          //console.log('list');
          src = src.substring(cap[0].length);
          bull = cap[2];
          isordered = bull.length > 1;
    
          listStart = {
            type: 'list_start',
            ordered: isordered,
            start: isordered ? +bull : '',
            loose: false
          };
    
          this.tokens.push(listStart);
    
          // Get each top-level item.
          cap = cap[0].match(this.rules.item);
    
          listItems = [];
          next = false;
          l = cap.length;
          i = 0;
    
          for (; i < l; i++) {
            item = cap[i];
    
            // Remove the list item's bullet
            // so it is seen as the next token.
            space = item.length;
            item = item.replace(/^ *([*+-]|\d+\.) +/, '');
    
            // Outdent whatever the
            // list item contains. Hacky.
            if (~item.indexOf('\n ')) {
              space -= item.length;
              item = !this.options.pedantic
                ? item.replace(new RegExp('^ {1,' + space + '}', 'gm'), '')
                : item.replace(/^ {1,4}/gm, '');
            }
    
            // Determine whether the next list item belongs here.
            // Backpedal if it does not belong in this list.
            if (this.options.smartLists && i !== l - 1) {
              b = block.bullet.exec(cap[i + 1])[0];
              if (bull !== b && !(bull.length > 1 && b.length > 1)) {
                src = cap.slice(i + 1).join('\n') + src;
                i = l - 1;
              }
            }
    
            // Determine whether item is loose or not.
            // Use: /(^|\n)(?! )[^\n]+\n\n(?!\s*$)/
            // for discount behavior.
            loose = next || /\n\n(?!\s*$)/.test(item);
            if (i !== l - 1) {
              next = item.charAt(item.length - 1) === '\n';
              if (!loose) loose = next;
            }
    
            if (loose) {
              listStart.loose = true;
            }
    
            // Check for task list items
            istask = /^\[[ xX]\] /.test(item);
            ischecked = undefined;
            if (istask) {
              ischecked = item[1] !== ' ';
              item = item.replace(/^\[[ xX]\] +/, '');
            }
    
            t = {
              type: 'list_item_start',
              task: istask,
              checked: ischecked,
              loose: loose
            };
    
            listItems.push(t);
            this.tokens.push(t);
    
            // Recurse.
            this.tokenize(item, false);
    
            this.tokens.push({
              type: 'list_item_end'
            });
          }
    
          if (listStart.loose) {
            l = listItems.length;
            i = 0;
            for (; i < l; i++) {
              listItems[i].loose = true;
            }
          }
    
          this.tokens.push({
            type: 'list_end'
          });
    
          continue;
        }
    
        // html
        if (cap = this.rules.html.exec(src)) {
          //console.log('html');
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: this.options.sanitize
              ? 'paragraph'
              : 'html',
            pre: !this.options.sanitizer
              && (cap[1] === 'pre' || cap[1] === 'script' || cap[1] === 'style'),
            text: cap[0]
          });
          continue;
        }
    
        // def
        if (top && (cap = this.rules.def.exec(src))) {
          //console.log('def');
          src = src.substring(cap[0].length);
          if (cap[3]) cap[3] = cap[3].substring(1, cap[3].length - 1);
          tag = cap[1].toLowerCase().replace(/\s+/g, ' ');
          if (!this.tokens.links[tag]) {
            this.tokens.links[tag] = {
              href: cap[2],
              title: cap[3]
            };
          }
          continue;
        }
    
        // table (gfm)
        if (top && (cap = this.rules.table.exec(src))) {
          //console.log('table (GFM)');
          item = {
            type: 'table',
            header: splitCells(cap[1].replace(/^ *| *\| *$/g, '')),
            align: cap[2].replace(/^ *|\| *$/g, '').split(/ *\| */),
            cells: cap[3] ? cap[3].replace(/(?: *\| *)?\n$/, '').split('\n') : []
          };
    
          if (item.header.length === item.align.length) {
            src = src.substring(cap[0].length);
    
            for (i = 0; i < item.align.length; i++) {
              if (/^ *-+: *$/.test(item.align[i])) {
                item.align[i] = 'right';
              } else if (/^ *:-+: *$/.test(item.align[i])) {
                item.align[i] = 'center';
              } else if (/^ *:-+ *$/.test(item.align[i])) {
                item.align[i] = 'left';
              } else {
                item.align[i] = null;
              }
            }
    
            for (i = 0; i < item.cells.length; i++) {
              item.cells[i] = splitCells(
                item.cells[i].replace(/^ *\| *| *\| *$/g, ''),
                item.header.length);
            }
    
            this.tokens.push(item);
    
            continue;
          }
        }
    
        // lheading
        if (cap = this.rules.lheading.exec(src)) {
          //console.log('lheading');
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'heading',
            depth: cap[2] === '=' ? 1 : 2,
            text: cap[1]
          });
          continue;
        }
    
        // top-level paragraph
        if (top && (cap = this.rules.paragraph.exec(src))) {
          //console.log('paragraph');
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'paragraph',
            text: cap[1].charAt(cap[1].length - 1) === '\n'
              ? cap[1].slice(0, -1)
              : cap[1]
          });
          continue;
        }
    
        // text
        if (cap = this.rules.text.exec(src)) {
          //console.log('text');
          // Top-level should never reach here.
          src = src.substring(cap[0].length);
          this.tokens.push({
            type: 'text',
            text: cap[0]
          });
          continue;
        }
    
        if (src) {
          throw new Error('Infinite loop on byte: ' + src.charCodeAt(0));
        }
      }
      //console.warn("this.tokens: ",this.tokens);
      return this.tokens;
    };
}

/**
 * marked - a markdown parser
 * Copyright (c) 2011-2018, Christopher Jeffrey. (MIT Licensed)
 * https://github.com/markedjs/marked
 * Refactored by Sara Garmin @saragarmee
 * https://github.com/telepathic-elements/marked
 */

class Marked{
    constructor(){
        this.defaults = Marked.getDefaults();
        this.Parser = Parser;
        this.parser = Parser.parse;
        this.Renderer = Renderer$1;
        this.TextRenderer = TextRenderer;
        this.Lexer = Lexer;
        this.lexer = Lexer.lex;
        this.InlineLexer = InlineLexer;
        this.inlineLexer = InlineLexer.output;
    }

    async parse(src, opt, callback) {
        // throw error in case of non string input
        if (typeof src === 'undefined' || src === null) {
            throw new Error('Marked.parse(): input parameter is undefined or null');
        }
        if (typeof src !== 'string') {
            throw new Error('Marked.parse(): input parameter is of type '+ Object.prototype.toString.call(src) + ', string expected');
        }
    
        if (callback || typeof opt === 'function') {
            if (!callback) {
                callback = opt;
                opt = null;
            }
    
            opt = merge({}, this.defaults, opt || {});
        
            let highlight = opt.highlight;
           
            let tokens = 0;
            let pending = 0;
            try {
                tokens = Lexer.lex(src, opt);
            } catch (e) {
                return callback(e);
            }
    
            pending = tokens.length;
    
            let done = (err)=>{
                if (err) {
                    opt.highlight = highlight;
                    return callback(err);
                }
        
                let out;
        
                try {
                    out = Parser.parse(tokens, opt);
                } catch (e) {
                    err = e;
                }
                opt.highlight = highlight;
                return err ? callback(err) : callback(null, out);
            };
    
            if (!highlight || highlight.length < 3) {
                return done();
            }
    
            delete opt.highlight;
    
            if (!pending) return done();
    
            for(let token of tokens) {
                
                if (token.type !== 'code') {
                    return --pending || done();
                }
                return highlight(token.text, token.lang, function(err, code) {
                    if (err) return done(err);
                    if (code == null || code === token.text) {
                    return --pending || done();
                    }
                    token.text = code;
                    token.escaped = true;
                    --pending || done();
                });
            }
    
            return;
        }

        try {
            if (opt){
                opt = merge({}, this.defaults, opt);
            }else{
                opt = this.defaults;
            }
            
            return Parser.parse(Lexer.lex(src, opt), opt);
        } catch (e) {
            e.message += '\nPlease report this to https://github.com/markedjs/marked.';
            if ((opt || this.defaults).silent) {
                return '<p>An error occurred:</p><pre>'
                + escape$1(e.message + '', true)
                + '</pre>';
            }
            throw e;
        }
    }
    static renderer(){
        return new Renderer$1(null,Marked.getDefaults());
    }

    static getDefaults() {
        return {
          baseUrl: null,
          breaks: false,
          gfm: true,
          headerIds: true,
          headerPrefix: '',
          highlight: null,
          langPrefix: 'language-',
          mangle: true,
          pedantic: false,
          sanitize: false,
          sanitizer: null,
          silent: false,
          smartLists: false,
          smartypants: false,
          tables: true,
          xhtml: false
        };
    };
    
    /**
    * Options
    */
    setOptions(opt) {
        merge(this.defaults, opt);
        return this;
    };
}

/**
* @category Web Components
* @customelement ui-changelog
* @description This element renders the changelog from the github release page
* 
* @attribute url For example "https://api.github.com/repos/openhab/openhab-distro/releases/latest".
* @attribute cachetime A cache time in minutes. Default is one day.
* @attribute hasissues read-only. Will be set, when there are issues found for the given filter.
*                Use this in css selectors to show/hide etc.
* 
* @example <caption>An example</caption>
* <ui-changelog></ui-changelog>
*/
class OhChangelog extends HTMLElement {
  constructor() {
    super();
    this.marked = new Marked();
    this.renderer = new this.marked.Renderer();
    this.toc = [];

    /**
     * To get the TOC, we need to listen to the renderer.heading method
     */
    this.renderer.heading = (text, level) => {
      const slug = text.toLowerCase().replace(/[^\w]+/g, '-');
      this.toc.push({
        level: level,
        slug: slug,
        title: text
      });
      return "<h" + level + " id=\"" + slug + "\"><a href=\"#" + slug + "\" class=\"anchor\"></a>" + text + "</h" + level + ">";
    };
  }
  static get observedAttributes() {
    return ['url', 'toctarget', 'cachetime'];
  }
  connectedCallback() {
    if (!this.style.display || this.style.display.length == 0)
      this.style.display = "block";
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.attributeChangedCallback();
    this.initdone = true;
    this.checkCacheAndLoad();
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.url = this.hasAttribute("url") ? this.getAttribute("url") : "https://api.github.com/repos/openhab/openhab-distro/releases/latest";
    this.toctarget = this.hasAttribute("toctarget") ? this.getAttribute("toctarget") : null;
    this.cachetime = this.hasAttribute("cachetime") ? parseInt(this.getAttribute("cachetime")) : 1440; // One day in minutes
    if (this.initdone) this.checkCacheAndLoad();
  }
  checkCacheAndLoad() {
    if (!this.url) {
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = "No url given!";
      return;
    }
    const cacheTimestamp = parseInt(localStorage.getItem("timestamp_" + this.url)) || 0;
    let cachedData = null;
    if (cacheTimestamp > 0 && (cacheTimestamp + this.cachetime * 60 * 1000 > Date.now())) {
      cachedData = localStorage.getItem(this.url);
    }
    if (cachedData) {
      const e = this.toctarget ? document.querySelector(this.toctarget) : null;
      if (e) e.innerHTML = localStorage.getItem("toc_" + this.url);
      while (this.firstChild) { this.firstChild.remove(); }
      this.innerHTML = cachedData;
    } else {
      this.reload();
    }
  }
  /**
   * Forcefully reloads the data.
   */
  reload() {
    this.toc = [];
    localStorage.removeItem("timestamp_" + this.url);

    while (this.firstChild) { this.firstChild.remove(); }
    this.innerHTML = this.loading;

    fetchWithTimeout(this.url)
      .then(response => response.json())
      .then(async (json) => {
        let htmlstr = "";
        if (Array.isArray(json)) {
          for (let i = 0; i < json.length; i++) {
            const release = json[i];
            const markdown = await this.marked.parse(release.body, { renderer: this.renderer });
            htmlstr += "<h2>" + release.name + "</h2>" + markdown + "<hr>";
          }
        } else {
          const release = json;
          const markdown = await this.marked.parse(release.body, { renderer: this.renderer });
          htmlstr += "<h2>" + release.name + "</h2>" + markdown;
        }
        localStorage.setItem(this.url, htmlstr);
        localStorage.setItem("timestamp_" + this.url, Date.now());

        let tocstr = "";
        if (this.toc && this.toc.length) {
          for (let t of this.toc) {
            if (t.level > 4)
              continue;
            if (t.level == 3) {
              tocstr += "<li class='level3'>";
            } else
              if (t.level == 4) {
                tocstr += "<li class='level4'>";
              } else
                tocstr += "<li>";

            tocstr += "<a href=\"#" + t.slug + "\">" + t.title + "</a>";
            tocstr += "</li>";
          }
          localStorage.setItem("toc_" + this.url, tocstr);
        }
        return Promise.resolve({ main: htmlstr, toc: tocstr });
      })
      .then(data => {
        const e = document.querySelector(this.toctarget);
        if (e) e.innerHTML = data.toc;
        while (this.firstChild) { this.firstChild.remove(); }
        this.innerHTML = data.main;
      }).catch(e => {
        while (this.firstChild) { this.firstChild.remove(); }
        console.warn(e);
        this.innerHTML = this.error + e + " " + this.url;
      });
  }
}

customElements.define('ui-changelog', OhChangelog);

const marked$1 = new Marked();

/**
* @category Web Components
* @customelement ui-context-help
* @description This element renders the context help on the right pane.
* @attribute url The url [https://api.github.com/repos/openhab/openhab2-addons/issues]
* @attribute [loading] The loading html text [Loading...]
* @attribute [error] The error html text [Error has happened]
* @attribute [cachetime] The cache time in minutes [600]
* @attribute [nothome] read-only. Will be set, when the url is overwritten by "content"
* @property {String} contenturl Content url that temporarly overwrittes the current url 
* @example <caption>Example</caption>
* <ui-context-help></ui-context-help>
*/
class OhContextHelp extends HTMLElement {
  constructor() {
    super();
  }
  static get observedAttributes() {
    return ['url', 'cachetime'];
  }
  connectedCallback() {
    if (!this.style.display || this.style.display.length == 0) this.style.display = "block";
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.attributeChangedCallback();
    this.initdone = true;
    this.checkCacheAndLoad();
  }
  set contenturl(val) {
    this.innerHTML = this.loading;
    this.url = val;
    this.checkCacheAndLoad();
  }
  get contenturl() {
    return this.url;
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.cachetime = this.hasAttribute("cachetime") ? parseInt(this.getAttribute("cachetime")) : 600; // One day in minutes
    if (name == "url") {
      this.originalurl = this.getAttribute("url");
      this.url = this.originalurl;
    }
    if (this.initdone) this.checkCacheAndLoad();
  }
  /**
   * Reloads data
   */
  checkCacheAndLoad() {
    if (!this.url) {
      this.innerHTML = "No url given!";
      return;
    }
    const cacheTimestamp = parseInt(localStorage.getItem("timestamp_" + this.url)) || 0;
    let cachedData = null;
    if (cacheTimestamp > 0 && (cacheTimestamp + this.cachetime * 60 * 1000 > Date.now())) {
      cachedData = localStorage.getItem(this.url);
    }
    if (cachedData) {
      this.renderData(cachedData);
    }
    else {
      this.reload();
    }
  }
  /**
   * Goes back to the set "url" that might have been temporarily overwritten by {@link #load}.
   */
  home() {
    this.contenturl = this.originalurl;
  }
  /**
   * Reset cache and reload.
   */
  reload() {
    this.load(this.url);
  }
  /**
   * Load a specific url
   * @property {String} contenturl Content that temporarly overwrittes the current url 
   */
  load(contenturl) {
    fetchWithTimeout(contenturl).then(response => response.text()).then(str => contenturl.includes(".md") ? marked$1.parse(str) : str).then(html => {
      localStorage.setItem(contenturl, html);
      localStorage.setItem("timestamp_" + contenturl, Date.now());
      this.renderData(html);
    }
    ).catch(e => {
      this.innerHTML = this.error + e + " " + this.url;
    }
    );
  }
  renderData(data) {
    let additional = '<oh-doc-link class="link float-right" reload>Reload</oh-doc-link>';
    if (this.originalurl != this.url) {
      additional += '<p><oh-doc-link class="link" home>Page help</oh-doc-link> → <a class="disabled">Specific help</a></p>';
      this.setAttribute("nothome",
        "");
    }
    else {
      this.removeAttribute('nothome');
    }
    this.innerHTML = additional + data;
  }
}

customElements.define('ui-context-help', OhContextHelp);

// Pattern is a zero-conflict wrapper extending RegExp features
// in order to make YAML parsing regex more expressive.
//
class Pattern {
    static initClass() {

        // @property [RegExp] The RegExp instance
        this.prototype.regex = null;

        // @property [String] The raw regex string
        this.prototype.rawRegex = null;

        // @property [String] The cleaned regex string (used to create the RegExp instance)
        this.prototype.cleanedRegex = null;

        // @property [Object] The dictionary mapping names to capturing bracket numbers
        this.prototype.mapping = null;
    }

    // Constructor
    //
    // @param [String] rawRegex The raw regex string defining the pattern
    //
    constructor(rawRegex, modifiers) {
        if (modifiers == null) { modifiers = ''; }
        let cleanedRegex = '';
        const len = rawRegex.length;
        let mapping = null;

        // Cleanup raw regex and compute mapping
        let capturingBracketNumber = 0;
        let i = 0;
        while (i < len) {
            const _char = rawRegex.charAt(i);
            if (_char === '\\') {
                // Ignore next character
                cleanedRegex += rawRegex.slice(i, +(i + 1) + 1 || undefined);
                i++;
            } else if (_char === '(') {
                // Increase bracket number, only if it is capturing
                if (i < (len - 2)) {
                    const part = rawRegex.slice(i, +(i + 2) + 1 || undefined);
                    if (part === '(?:') {
                        // Non-capturing bracket
                        i += 2;
                        cleanedRegex += part;
                    } else if (part === '(?<') {
                        // Capturing bracket with possibly a name
                        capturingBracketNumber++;
                        i += 2;
                        let name = '';
                        while ((i + 1) < len) {
                            const subChar = rawRegex.charAt(i + 1);
                            if (subChar === '>') {
                                cleanedRegex += '(';
                                i++;
                                if (name.length > 0) {
                                    // Associate a name with a capturing bracket number
                                    if (mapping == null) { mapping = {}; }
                                    mapping[name] = capturingBracketNumber;
                                }
                                break;
                            } else {
                                name += subChar;
                            }

                            i++;
                        }
                    } else {
                        cleanedRegex += _char;
                        capturingBracketNumber++;
                    }
                } else {
                    cleanedRegex += _char;
                }
            } else {
                cleanedRegex += _char;
            }

            i++;
        }

        this.rawRegex = rawRegex;
        this.cleanedRegex = cleanedRegex;
        this.regex = new RegExp(this.cleanedRegex, `g${modifiers.replace('g', '')}`);
        this.mapping = mapping;
    }


    // Executes the pattern's regex and returns the matching values
    //
    // @param [String] str The string to use to execute the pattern
    //
    // @return [Array] The matching values extracted from capturing brackets or null if nothing matched
    //
    exec(str) {
        this.regex.lastIndex = 0;
        const matches = this.regex.exec(str);

        if ((matches == null)) {
            return null;
        }

        if (this.mapping != null) {
            for (let name in this.mapping) {
                const index = this.mapping[name];
                matches[name] = matches[index];
            }
        }

        return matches;
    }


    // Tests the pattern's regex
    //
    // @param [String] str The string to use to test the pattern
    //
    // @return [Boolean] true if the string matched
    //
    test(str) {
        this.regex.lastIndex = 0;
        return this.regex.test(str);
    }


    // Replaces occurences matching with the pattern's regex with replacement
    //
    // @param [String] str The source string to perform replacements
    // @param [String] replacement The string to use in place of each replaced occurence.
    //
    // @return [String] The replaced string
    //
    replace(str, replacement) {
        this.regex.lastIndex = 0;
        return str.replace(this.regex, replacement);
    }


    // Replaces occurences matching with the pattern's regex with replacement and
    // get both the replaced string and the number of replaced occurences in the string.
    //
    // @param [String] str The source string to perform replacements
    // @param [String] replacement The string to use in place of each replaced occurence.
    // @param [Integer] limit The maximum number of occurences to replace (0 means infinite number of occurences)
    //
    // @return [Array] A destructurable array containing the replaced string and the number of replaced occurences. For instance: ["my replaced string", 2]
    //
    replaceAll(str, replacement, limit) {
        if (limit == null) { limit = 0; }
        this.regex.lastIndex = 0;
        let count = 0;
        while (this.regex.test(str) && ((limit === 0) || (count < limit))) {
            this.regex.lastIndex = 0;
            str = str.replace(this.regex, replacement);
            count++;
        }

        return [str, count];
    }
}
Pattern.initClass();



// A bunch of utility methods
//
class Utils {
    static initClass() {

        this.REGEX_LEFT_TRIM_BY_CHAR = {};
        this.REGEX_RIGHT_TRIM_BY_CHAR = {};
        this.REGEX_SPACES = /\s+/g;
        this.REGEX_DIGITS = /^\d+$/;
        this.REGEX_OCTAL = /[^0-7]/gi;
        this.REGEX_HEXADECIMAL = /[^a-f0-9]/gi;

        // Precompiled date pattern
        this.PATTERN_DATE = new Pattern('^' +
            '(?<year>[0-9][0-9][0-9][0-9])' +
            '-(?<month>[0-9][0-9]?)' +
            '-(?<day>[0-9][0-9]?)' +
            '(?:(?:[Tt]|[ \t]+)' +
            '(?<hour>[0-9][0-9]?)' +
            ':(?<minute>[0-9][0-9])' +
            ':(?<second>[0-9][0-9])' +
            '(?:\.(?<fraction>[0-9]*))?' +
            '(?:[ \t]*(?<tz>Z|(?<tz_sign>[-+])(?<tz_hour>[0-9][0-9]?)' +
            '(?::(?<tz_minute>[0-9][0-9]))?))?)?' +
            '$', 'i');

        // Local timezone offset in ms
        this.LOCAL_TIMEZONE_OFFSET = new Date().getTimezoneOffset() * 60 * 1000;
    }

    // Trims the given string on both sides
    //
    // @param [String] str The string to trim
    // @param [String] _char The character to use for trimming (default: '\\s')
    //
    // @return [String] A trimmed string
    //
    static trim(str, _char) {
        if (_char == null) { _char = '\\s'; }
        let regexLeft = this.REGEX_LEFT_TRIM_BY_CHAR[_char];
        if (regexLeft == null) {
            this.REGEX_LEFT_TRIM_BY_CHAR[_char] = (regexLeft = new RegExp(`^${_char}${_char}*`));
        }
        regexLeft.lastIndex = 0;
        let regexRight = this.REGEX_RIGHT_TRIM_BY_CHAR[_char];
        if (regexRight == null) {
            this.REGEX_RIGHT_TRIM_BY_CHAR[_char] = (regexRight = new RegExp(_char + '' + _char + '*$'));
        }
        regexRight.lastIndex = 0;
        return str.replace(regexLeft, '').replace(regexRight, '');
    }


    // Trims the given string on the left side
    //
    // @param [String] str The string to trim
    // @param [String] _char The character to use for trimming (default: '\\s')
    //
    // @return [String] A trimmed string
    //
    static ltrim(str, _char) {
        if (_char == null) { _char = '\\s'; }
        let regexLeft = this.REGEX_LEFT_TRIM_BY_CHAR[_char];
        if (regexLeft == null) {
            this.REGEX_LEFT_TRIM_BY_CHAR[_char] = (regexLeft = new RegExp(`^${_char}${_char}*`));
        }
        regexLeft.lastIndex = 0;
        return str.replace(regexLeft, '');
    }


    // Trims the given string on the right side
    //
    // @param [String] str The string to trim
    // @param [String] _char The character to use for trimming (default: '\\s')
    //
    // @return [String] A trimmed string
    //
    static rtrim(str, _char) {
        if (_char == null) { _char = '\\s'; }
        let regexRight = this.REGEX_RIGHT_TRIM_BY_CHAR[_char];
        if (regexRight == null) {
            this.REGEX_RIGHT_TRIM_BY_CHAR[_char] = (regexRight = new RegExp(_char + '' + _char + '*$'));
        }
        regexRight.lastIndex = 0;
        return str.replace(regexRight, '');
    }


    // Checks if the given value is empty (null, undefined, empty string, string '0', empty Array, empty Object)
    //
    // @param [Object] value The value to check
    //
    // @return [Boolean] true if the value is empty
    //
    static isEmpty(value) {
        return !(value) || (value === '') || (value === '0') || (value instanceof Array && (value.length === 0)) || this.isEmptyObject(value);
    }

    // Checks if the given value is an empty object
    //
    // @param [Object] value The value to check
    //
    // @return [Boolean] true if the value is empty and is an object
    //
    static isEmptyObject(value) {
        return value instanceof Object && (((() => {
            const result = [];
            for (let k of Object.keys(value || {})) {
                result.push(k);
            }
            return result;
        })()).length === 0);
    }

    // Counts the number of occurences of subString inside string
    //
    // @param [String] string The string where to count occurences
    // @param [String] subString The subString to count
    // @param [Integer] start The start index
    // @param [Integer] length The string length until where to count
    //
    // @return [Integer] The number of occurences
    //
    static subStrCount(string, subString, start, length) {
        let c = 0;

        string = `${string}`;
        subString = `${subString}`;

        if (start != null) {
            string = string.slice(start);
        }
        if (length != null) {
            string = string.slice(0, length);
        }

        const len = string.length;
        const sublen = subString.length;
        for (let j = 0, i = j, end = len, asc = 0 <= end; asc ? j < end : j > end; asc ? j++ : j-- , i = j) {
            if (subString === string.slice(i, sublen)) {
                c++;
                i += sublen - 1;
            }
        }

        return c;
    }


    // Returns true if input is only composed of digits
    //
    // @param [Object] input The value to test
    //
    // @return [Boolean] true if input is only composed of digits
    //
    static isDigits(input) {
        this.REGEX_DIGITS.lastIndex = 0;
        return this.REGEX_DIGITS.test(input);
    }


    // Decode octal value
    //
    // @param [String] input The value to decode
    //
    // @return [Integer] The decoded value
    //
    static octDec(input) {
        this.REGEX_OCTAL.lastIndex = 0;
        return parseInt((input + '').replace(this.REGEX_OCTAL, ''), 8);
    }


    // Decode hexadecimal value
    //
    // @param [String] input The value to decode
    //
    // @return [Integer] The decoded value
    //
    static hexDec(input) {
        this.REGEX_HEXADECIMAL.lastIndex = 0;
        input = this.trim(input);
        if ((input + '').slice(0, 2) === '0x') { input = (input + '').slice(2); }
        return parseInt((input + '').replace(this.REGEX_HEXADECIMAL, ''), 16);
    }


    // Get the UTF-8 character for the given code point.
    //
    // @param [Integer] c The unicode code point
    //
    // @return [String] The corresponding UTF-8 character
    //
    static utf8chr(c) {
        const ch = String.fromCharCode;
        if (0x80 > (c %= 0x200000)) {
            return ch(c);
        }
        if (0x800 > c) {
            return ch(0xC0 | (c >> 6)) + ch(0x80 | (c & 0x3F));
        }
        if (0x10000 > c) {
            return ch(0xE0 | (c >> 12)) + ch(0x80 | ((c >> 6) & 0x3F)) + ch(0x80 | (c & 0x3F));
        }

        return ch(0xF0 | (c >> 18)) + ch(0x80 | ((c >> 12) & 0x3F)) + ch(0x80 | ((c >> 6) & 0x3F)) + ch(0x80 | (c & 0x3F));
    }


    // Returns the boolean value equivalent to the given input
    //
    // @param [String|Object]    input       The input value
    // @param [Boolean]          strict      If set to false, accept 'yes' and 'no' as boolean values
    //
    // @return [Boolean]         the boolean value
    //
    static parseBoolean(input, strict) {
        if (strict == null) { strict = true; }
        if (typeof (input) === 'string') {
            const lowerInput = input.toLowerCase();
            if (!strict) {
                if (lowerInput === 'no') { return false; }
            }
            if (lowerInput === '0') { return false; }
            if (lowerInput === 'false') { return false; }
            if (lowerInput === '') { return false; }
            return true;
        }
        return !!input;
    }



    // Returns true if input is numeric
    //
    // @param [Object] input The value to test
    //
    // @return [Boolean] true if input is numeric
    //
    static isNumeric(input) {
        this.REGEX_SPACES.lastIndex = 0;
        return (typeof (input) === 'number') || ((typeof (input) === 'string') && !isNaN(input) && (input.replace(this.REGEX_SPACES, '') !== ''));
    }


    // Returns a parsed date from the given string
    //
    // @param [String] str The date string to parse
    //
    // @return [Date] The parsed date or null if parsing failed
    //
    static stringToDate(str) {
        let date, fraction, tz_offset;
        if (!(str != null ? str.length : undefined)) {
            return null;
        }

        // Perform regular expression pattern
        const info = this.PATTERN_DATE.exec(str);
        if (!info) {
            return null;
        }

        // Extract year, month, day
        const year = parseInt(info.year, 10);
        const month = parseInt(info.month, 10) - 1; // In javascript, january is 0, february 1, etc...
        const day = parseInt(info.day, 10);

        // If no hour is given, return a date with day precision
        if (info.hour == null) {
            date = new Date(Date.UTC(year, month, day));
            return date;
        }

        // Extract hour, minute, second
        const hour = parseInt(info.hour, 10);
        const minute = parseInt(info.minute, 10);
        const second = parseInt(info.second, 10);

        // Extract fraction, if given
        if (info.fraction != null) {
            fraction = info.fraction.slice(0, 3);
            while (fraction.length < 3) {
                fraction += '0';
            }
            fraction = parseInt(fraction, 10);
        } else {
            fraction = 0;
        }

        // Compute timezone offset if given
        if (info.tz != null) {
            let tz_minute;
            const tz_hour = parseInt(info.tz_hour, 10);
            if (info.tz_minute != null) {
                tz_minute = parseInt(info.tz_minute, 10);
            } else {
                tz_minute = 0;
            }

            // Compute timezone delta in ms
            tz_offset = ((tz_hour * 60) + tz_minute) * 60000;
            if ('-' === info.tz_sign) {
                tz_offset *= -1;
            }
        }

        // Compute date
        date = new Date(Date.UTC(year, month, day, hour, minute, second, fraction));
        if (tz_offset) {
            date.setTime(date.getTime() - tz_offset);
        }

        return date;
    }


    // Repeats the given string a number of times
    //
    // @param [String]   str     The string to repeat
    // @param [Integer]  number  The number of times to repeat the string
    //
    // @return [String]  The repeated string
    //
    static strRepeat(str, number) {
        let res = '';
        let i = 0;
        while (i < number) {
            res += str;
            i++;
        }
        return res;
    }


    // Reads the data from the given file path and returns the result as string
    //
    // @param [String]   path        The path to the file
    // @param [Function] callback    A callback to read file asynchronously (optional)
    //
    // @return [String]  The resulting data as string
    //
    static getStringFromFile(path, callback = null) {
        let xhr = null;
        if (typeof window !== 'undefined' && window !== null) {
            if (window.XMLHttpRequest) {
                xhr = new XMLHttpRequest();
            } else if (window.ActiveXObject) {
                for (let name of ["Msxml2.XMLHTTP.6.0", "Msxml2.XMLHTTP.3.0", "Msxml2.XMLHTTP", "Microsoft.XMLHTTP"]) {
                    try {
                        xhr = new ActiveXObject(name);
                    } catch (error) { }
                }
            }
        }

        if (xhr != null) {
            // Browser
            if (callback != null) {
                // Async
                xhr.onreadystatechange = function () {
                    if (xhr.readyState === 4) {
                        if ((xhr.status === 200) || (xhr.status === 0)) {
                            return callback(xhr.responseText);
                        } else {
                            return callback(null);
                        }
                    }
                };
                xhr.open('GET', path, true);
                return xhr.send(null);

            } else {
                // Sync
                xhr.open('GET', path, false);
                xhr.send(null);

                if ((xhr.status === 200) || (xhr.status === 0)) {
                    return xhr.responseText;
                }

                return null;
            }
        } else {
            // Node.js-like
            const req = require;
            const fs = req('fs'); // Prevent browserify from trying to load 'fs' module
            if (callback != null) {
                // Async
                return fs.readFile(path, function (err, data) {
                    if (err) {
                        return callback(null);
                    } else {
                        return callback(String(data));
                    }
                });

            } else {
                // Sync
                const data = fs.readFileSync(path);
                if (data != null) {
                    return String(data);
                }
                return null;
            }
        }
    }
}
Utils.initClass();



// Unescaper encapsulates unescaping rules for single and double-quoted YAML strings.
//
class Unescaper {
    static initClass() {

        // Regex fragment that matches an escaped character in
        // a double quoted string.
        this.PATTERN_ESCAPED_CHARACTER = new Pattern('\\\\([0abt\tnvfre "\\/\\\\N_LP]|x[0-9a-fA-F]{2}|u[0-9a-fA-F]{4}|U[0-9a-fA-F]{8})');

    }


    // Unescapes a single quoted string.
    //
    // @param [String]       value A single quoted string.
    //
    // @return [String]      The unescaped string.
    //
    static unescapeSingleQuotedString(value) {
        return value.replace(/\'\'/g, '\'');
    }


    // Unescapes a double quoted string.
    //
    // @param [String]       value A double quoted string.
    //
    // @return [String]      The unescaped string.
    //
    static unescapeDoubleQuotedString(value) {
        if (this._unescapeCallback == null) {
            this._unescapeCallback = str => {
                return this.unescapeCharacter(str);
            };
        }

        // Evaluate the string
        return this.PATTERN_ESCAPED_CHARACTER.replace(value, this._unescapeCallback);
    }


    // Unescapes a character that was found in a double-quoted string
    //
    // @param [String]       value An escaped character
    //
    // @return [String]      The unescaped character
    //
    static unescapeCharacter(value) {
        const ch = String.fromCharCode;
        switch (value.charAt(1)) {
            case '0':
                return ch(0);
            case 'a':
                return ch(7);
            case 'b':
                return ch(8);
            case 't':
                return "\t";
            case "\t":
                return "\t";
            case 'n':
                return "\n";
            case 'v':
                return ch(11);
            case 'f':
                return ch(12);
            case 'r':
                return ch(13);
            case 'e':
                return ch(27);
            case ' ':
                return ' ';
            case '"':
                return '"';
            case '/':
                return '/';
            case '\\':
                return '\\';
            case 'N':
                // U+0085 NEXT LINE
                return ch(0x0085);
            case '_':
                // U+00A0 NO-BREAK SPACE
                return ch(0x00A0);
            case 'L':
                // U+2028 LINE SEPARATOR
                return ch(0x2028);
            case 'P':
                // U+2029 PARAGRAPH SEPARATOR
                return ch(0x2029);
            case 'x':
                return Utils.utf8chr(Utils.hexDec(value.substr(2, 2)));
            case 'u':
                return Utils.utf8chr(Utils.hexDec(value.substr(2, 4)));
            case 'U':
                return Utils.utf8chr(Utils.hexDec(value.substr(2, 8)));
            default:
                return '';
        }
    }
}
Unescaper.initClass();



// Escaper encapsulates escaping rules for single
// and double-quoted YAML strings.
class Escaper {
    static initClass() {

        // Mapping arrays for escaping a double quoted string. The backslash is
        // first to ensure proper escaping.
        let ch;
        this.LIST_ESCAPEES = ['\\', '\\\\', '\\"', '"',
            "\x00", "\x01", "\x02", "\x03", "\x04", "\x05", "\x06", "\x07",
            "\x08", "\x09", "\x0a", "\x0b", "\x0c", "\x0d", "\x0e", "\x0f",
            "\x10", "\x11", "\x12", "\x13", "\x14", "\x15", "\x16", "\x17",
            "\x18", "\x19", "\x1a", "\x1b", "\x1c", "\x1d", "\x1e", "\x1f",
            (ch = String.fromCharCode)(0x0085), ch(0x00A0), ch(0x2028), ch(0x2029)];
        this.LIST_ESCAPED = ['\\\\', '\\"', '\\"', '\\"',
            "\\0", "\\x01", "\\x02", "\\x03", "\\x04", "\\x05", "\\x06", "\\a",
            "\\b", "\\t", "\\n", "\\v", "\\f", "\\r", "\\x0e", "\\x0f",
            "\\x10", "\\x11", "\\x12", "\\x13", "\\x14", "\\x15", "\\x16", "\\x17",
            "\\x18", "\\x19", "\\x1a", "\\e", "\\x1c", "\\x1d", "\\x1e", "\\x1f",
            "\\N", "\\_", "\\L", "\\P"];

        this.MAPPING_ESCAPEES_TO_ESCAPED = (() => {
            const mapping = {};
            for (let i = 0, end = this.LIST_ESCAPEES.length, asc = 0 <= end; asc ? i < end : i > end; asc ? i++ : i--) {
                mapping[this.LIST_ESCAPEES[i]] = this.LIST_ESCAPED[i];
            }
            return mapping;
        })();

        // Characters that would cause a dumped string to require double quoting.
        this.PATTERN_CHARACTERS_TO_ESCAPE = new Pattern('[\\x00-\\x1f]|\xc2\x85|\xc2\xa0|\xe2\x80\xa8|\xe2\x80\xa9');

        // Other precompiled patterns
        this.PATTERN_MAPPING_ESCAPEES = new Pattern(this.LIST_ESCAPEES.join('|').split('\\').join('\\\\'));
        this.PATTERN_SINGLE_QUOTING = new Pattern('[\\s\'":{}[\\],&*#?]|^[-?|<>=!%@`]');
    }



    // Determines if a JavaScript value would require double quoting in YAML.
    //
    // @param [String]   value   A JavaScript value value
    //
    // @return [Boolean] true    if the value would require double quotes.
    //
    static requiresDoubleQuoting(value) {
        return this.PATTERN_CHARACTERS_TO_ESCAPE.test(value);
    }


    // Escapes and surrounds a JavaScript value with double quotes.
    //
    // @param [String]   value   A JavaScript value
    //
    // @return [String]  The quoted, escaped string
    //
    static escapeWithDoubleQuotes(value) {
        const result = this.PATTERN_MAPPING_ESCAPEES.replace(value, str => {
            return this.MAPPING_ESCAPEES_TO_ESCAPED[str];
        });
        return `"${result}"`;
    }


    // Determines if a JavaScript value would require single quoting in YAML.
    //
    // @param [String]   value   A JavaScript value
    //
    // @return [Boolean] true if the value would require single quotes.
    //
    static requiresSingleQuoting(value) {
        return this.PATTERN_SINGLE_QUOTING.test(value);
    }


    // Escapes and surrounds a JavaScript value with single quotes.
    //
    // @param [String]   value   A JavaScript value
    //
    // @return [String]  The quoted, escaped string
    //
    static escapeWithSingleQuotes(value) {
        return `'${value.replace(/'/g, "''")}'`;
    }
}
Escaper.initClass();

class ParseException extends Error {

    constructor(message, parsedLine, snippet) {
        super(message);
        this.message = message;
        this.parsedLine = parsedLine;
        this.snippet = snippet;
    }

    toString() {
        if ((this.parsedLine != null) && (this.snippet != null)) {
            return `<ParseException> ${this.message} (line ${this.parsedLine}: '${this.snippet}')`;
        } else {
            return `<ParseException> ${this.message}`;
        }
    }
}

class ParseMore extends Error {

    constructor(message, parsedLine, snippet) {
        super(message);
        this.message = message;
        this.parsedLine = parsedLine;
        this.snippet = snippet;
    }

    toString() {
        if ((this.parsedLine != null) && (this.snippet != null)) {
            return `<ParseMore> ${this.message} (line ${this.parsedLine}: '${this.snippet}')`;
        } else {
            return `<ParseMore> ${this.message}`;
        }
    }
}





// Inline YAML parsing and dumping
class Inline {
    static initClass() {

        // Quoted string regular expression
        this.REGEX_QUOTED_STRING = '(?:"(?:[^"\\\\]*(?:\\\\.[^"\\\\]*)*)"|\'(?:[^\']*(?:\'\'[^\']*)*)\')';

        // Pre-compiled patterns
        //
        this.PATTERN_TRAILING_COMMENTS = new Pattern('^\\s*#.*$');
        this.PATTERN_QUOTED_SCALAR = new Pattern(`^${this.REGEX_QUOTED_STRING}`);
        this.PATTERN_THOUSAND_NUMERIC_SCALAR = new Pattern('^(-|\\+)?[0-9,]+(\\.[0-9]+)?$');
        this.PATTERN_SCALAR_BY_DELIMITERS = {};

        // Settings
        this.settings = {};
    }


    // Configure YAML inline.
    //
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    static configure(exceptionOnInvalidType = null, objectDecoder = null) {
        // Update settings
        this.settings.exceptionOnInvalidType = exceptionOnInvalidType;
        this.settings.objectDecoder = objectDecoder;
    }


    // Converts a YAML string to a JavaScript object.
    //
    // @param [String]   value                   A YAML string
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object]  A JavaScript object representing the YAML string
    //
    // @throw [ParseException]
    //
    static parse(value, exceptionOnInvalidType, objectDecoder = null) {
        // Update settings from last call of Inline.parse()
        let result;
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        this.settings.exceptionOnInvalidType = exceptionOnInvalidType;
        this.settings.objectDecoder = objectDecoder;

        if ((value == null)) {
            return '';
        }

        value = Utils.trim(value);

        if (0 === value.length) {
            return '';
        }

        // Keep a context object to pass through static methods
        const context = { exceptionOnInvalidType, objectDecoder, i: 0 };

        switch (value.charAt(0)) {
            case '[':
                result = this.parseSequence(value, context);
                ++context.i;
                break;
            case '{':
                result = this.parseMapping(value, context);
                ++context.i;
                break;
            default:
                result = this.parseScalar(value, null, ['"', "'"], context);
        }

        // Some comments are allowed at the end
        if (this.PATTERN_TRAILING_COMMENTS.replace(value.slice(context.i), '') !== '') {
            throw new ParseException(`Unexpected characters near "${value.slice(context.i)}".`);
        }

        return result;
    }


    // Dumps a given JavaScript variable to a YAML string.
    //
    // @param [Object]   value                   The JavaScript variable to convert
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectEncoder           A function to serialize custom objects, null otherwise
    //
    // @return [String]  The YAML string representing the JavaScript object
    //
    // @throw [DumpException]
    //
    static dump(value, exceptionOnInvalidType, objectEncoder = null) {
        let needle;
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        if ((value == null)) {
            return 'null';
        }
        const type = typeof value;
        if (type === 'object') {
            if (value instanceof Date) {
                return value.toISOString();
            } else if (objectEncoder != null) {
                const result = objectEncoder(value);
                if ((typeof result === 'string') || (result != null)) {
                    return result;
                }
            }
            return this.dumpObject(value);
        }
        if (type === 'boolean') {
            return (value ? 'true' : 'false');
        }
        if (Utils.isDigits(value)) {
            return (type === 'string' ? `'${value}'` : String(parseInt(value)));
        }
        if (Utils.isNumeric(value)) {
            return (type === 'string' ? `'${value}'` : String(parseFloat(value)));
        }
        if (type === 'number') {
            return (value === Infinity ? '.Inf' : (value === -Infinity ? '-.Inf' : (isNaN(value) ? '.NaN' : value)));
        }
        if (Escaper.requiresDoubleQuoting(value)) {
            return Escaper.escapeWithDoubleQuotes(value);
        }
        if (Escaper.requiresSingleQuoting(value)) {
            return Escaper.escapeWithSingleQuotes(value);
        }
        if ('' === value) {
            return '""';
        }
        if (Utils.PATTERN_DATE.test(value)) {
            return `'${value}'`;
        }
        if ((needle = value.toLowerCase(), ['null', '~', 'true', 'false'].includes(needle))) {
            return `'${value}'`;
        }
        // Default
        return value;
    }


    // Dumps a JavaScript object to a YAML string.
    //
    // @param [Object]   value                   The JavaScript object to dump
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectEncoder           A function do serialize custom objects, null otherwise
    //
    // @return string The YAML string representing the JavaScript object
    //
    static dumpObject(value, exceptionOnInvalidType, objectSupport = null) {
        // Array
        let output, val;
        if (value instanceof Array) {
            output = [];
            for (val of Array.from(value)) {
                output.push(this.dump(val));
            }
            return `[${output.join(', ')}]`;

            // Mapping
        } else {
            output = [];
            for (let key in value) {
                val = value[key];
                output.push(this.dump(key) + ': ' + this.dump(val));
            }
            return `{${output.join(', ')}}`;
        }
    }


    // Parses a scalar to a YAML string.
    //
    // @param [Object]   scalar
    // @param [Array]    delimiters
    // @param [Array]    stringDelimiters
    // @param [Object]   context
    // @param [Boolean]  evaluate
    //
    // @return [String]  A YAML string
    //
    // @throw [ParseException] When malformed inline YAML string is parsed
    //
    static parseScalar(scalar, delimiters = null, stringDelimiters, context = null, evaluate) {
        let needle, output;
        if (stringDelimiters == null) { stringDelimiters = ['"', "'"]; }
        if (evaluate == null) { evaluate = true; }
        if (context == null) {
            context = { exceptionOnInvalidType: this.settings.exceptionOnInvalidType, objectDecoder: this.settings.objectDecoder, i: 0 };
        }
        let { i } = context;

        if ((needle = scalar.charAt(i), Array.from(stringDelimiters).includes(needle))) {
            // Quoted scalar
            output = this.parseQuotedScalar(scalar, context);
            ({ i } = context);

            if (delimiters != null) {
                let needle1;
                const tmp = Utils.ltrim(scalar.slice(i), ' ');
                if (!((needle1 = tmp.charAt(0), Array.from(delimiters).includes(needle1)))) {
                    throw new ParseException(`Unexpected characters (${scalar.slice(i)}).`);
                }
            }

        } else {
            // "normal" string
            if (!delimiters) {
                output = scalar.slice(i);
                i += output.length;

                // Remove comments
                const strpos = output.indexOf(' #');
                if (strpos !== -1) {
                    output = Utils.rtrim(output.slice(0, strpos));
                }

            } else {
                let match;
                const joinedDelimiters = delimiters.join('|');
                let pattern = this.PATTERN_SCALAR_BY_DELIMITERS[joinedDelimiters];
                if (pattern == null) {
                    pattern = new Pattern(`^(.+?)(${joinedDelimiters})`);
                    this.PATTERN_SCALAR_BY_DELIMITERS[joinedDelimiters] = pattern;
                }
                if (match = pattern.exec(scalar.slice(i))) {
                    output = match[1];
                    i += output.length;
                } else {
                    throw new ParseException(`Malformed inline YAML string (${scalar}).`);
                }
            }


            if (evaluate) {
                output = this.evaluateScalar(output, context);
            }
        }

        context.i = i;
        return output;
    }


    // Parses a quoted scalar to YAML.
    //
    // @param [String]   scalar
    // @param [Object]   context
    //
    // @return [String]  A YAML string
    //
    // @throw [ParseMore] When malformed inline YAML string is parsed
    //
    static parseQuotedScalar(scalar, context) {
        let match;
        let { i } = context;

        if (!(match = this.PATTERN_QUOTED_SCALAR.exec(scalar.slice(i)))) {
            throw new ParseMore(`Malformed inline YAML string (${scalar.slice(i)}).`);
        }

        let output = match[0].substr(1, match[0].length - 2);

        if ('"' === scalar.charAt(i)) {
            output = Unescaper.unescapeDoubleQuotedString(output);
        } else {
            output = Unescaper.unescapeSingleQuotedString(output);
        }

        i += match[0].length;

        context.i = i;
        return output;
    }


    // Parses a sequence to a YAML string.
    //
    // @param [String]   sequence
    // @param [Object]   context
    //
    // @return [String]  A YAML string
    //
    // @throw [ParseMore] When malformed inline YAML string is parsed
    //
    static parseSequence(sequence, context) {
        const output = [];
        const len = sequence.length;
        let { i } = context;
        i += 1;

        // [foo, bar, ...]
        while (i < len) {
            var needle;
            context.i = i;
            switch (sequence.charAt(i)) {
                case '[':
                    // Nested sequence
                    output.push(this.parseSequence(sequence, context));
                    ({ i } = context);
                    break;
                case '{':
                    // Nested mapping
                    output.push(this.parseMapping(sequence, context));
                    ({ i } = context);
                    break;
                case ']':
                    return output;
                    break;
                case ',': case ' ': case "\n":
                    break;
                // Do nothing
                default:
                    var isQuoted = ((needle = sequence.charAt(i), ['"', "'"].includes(needle)));
                    var value = this.parseScalar(sequence, [',', ']'], ['"', "'"], context);
                    ({ i } = context);

                    if (!(isQuoted) && (typeof (value) === 'string') && ((value.indexOf(': ') !== -1) || (value.indexOf(":\n") !== -1))) {
                        // Embedded mapping?
                        try {
                            value = this.parseMapping(`{${value}}`);
                        } catch (e) { }
                    }
                    // No, it's not


                    output.push(value);

                    --i;
            }

            ++i;
        }

        throw new ParseMore(`Malformed inline YAML string ${sequence}`);
    }


    // Parses a mapping to a YAML string.
    //
    // @param [String]   mapping
    // @param [Object]   context
    //
    // @return [String]  A YAML string
    //
    // @throw [ParseMore] When malformed inline YAML string is parsed
    //
    static parseMapping(mapping, context) {
        const output = {};
        const len = mapping.length;
        let { i } = context;
        i += 1;

        // {foo: bar, bar:foo, ...}
        let shouldContinueWhileLoop = false;
        while (i < len) {
            context.i = i;
            switch (mapping.charAt(i)) {
                case ' ': case ',': case "\n":
                    ++i;
                    context.i = i;
                    shouldContinueWhileLoop = true;
                    break;
                case '}':
                    return output;
                    break;
            }

            if (shouldContinueWhileLoop) {
                shouldContinueWhileLoop = false;
                continue;
            }

            // Key
            const key = this.parseScalar(mapping, [':', ' ', "\n"], ['"', "'"], context, false);
            ({ i } = context);

            // Value
            let done = false;

            while (i < len) {
                context.i = i;
                switch (mapping.charAt(i)) {
                    case '[':
                        // Nested sequence
                        var value = this.parseSequence(mapping, context);
                        ({ i } = context);
                        // Spec: Keys MUST be unique; first one wins.
                        // Parser cannot abort this mapping earlier, since lines
                        // are processed sequentially.
                        if (output[key] === undefined) {
                            output[key] = value;
                        }
                        done = true;
                        break;
                    case '{':
                        // Nested mapping
                        value = this.parseMapping(mapping, context);
                        ({ i } = context);
                        // Spec: Keys MUST be unique; first one wins.
                        // Parser cannot abort this mapping earlier, since lines
                        // are processed sequentially.
                        if (output[key] === undefined) {
                            output[key] = value;
                        }
                        done = true;
                        break;
                    case ':': case ' ': case "\n":
                        break;
                    // Do nothing
                    default:
                        value = this.parseScalar(mapping, [',', '}'], ['"', "'"], context);
                        ({ i } = context);
                        // Spec: Keys MUST be unique; first one wins.
                        // Parser cannot abort this mapping earlier, since lines
                        // are processed sequentially.
                        if (output[key] === undefined) {
                            output[key] = value;
                        }
                        done = true;
                        --i;
                }

                ++i;

                if (done) {
                    break;
                }
            }
        }

        throw new ParseMore(`Malformed inline YAML string ${mapping}`);
    }


    // Evaluates scalars and replaces magic values.
    //
    // @param [String]   scalar
    //
    // @return [String]  A YAML string
    //
    static evaluateScalar(scalar, context) {
        let cast, date, firstWord, raw;
        scalar = Utils.trim(scalar);
        const scalarLower = scalar.toLowerCase();

        switch (scalarLower) {
            case 'null': case '': case '~':
                return null;
            case 'true':
                return true;
            case 'false':
                return false;
            case '.inf':
                return Infinity;
            case '.nan':
                return NaN;
            case '-.inf':
                return Infinity;
            default:
                var firstChar = scalarLower.charAt(0);
                switch (firstChar) {
                    case '!':
                        var firstSpace = scalar.indexOf(' ');
                        if (firstSpace === -1) {
                            firstWord = scalarLower;
                        } else {
                            firstWord = scalarLower.slice(0, firstSpace);
                        }
                        switch (firstWord) {
                            case '!':
                                if (firstSpace !== -1) {
                                    return parseInt(this.parseScalar(scalar.slice(2)));
                                }
                                return null;
                            case '!str':
                                return Utils.ltrim(scalar.slice(4));
                            case '!!str':
                                return Utils.ltrim(scalar.slice(5));
                            case '!!int':
                                return parseInt(this.parseScalar(scalar.slice(5)));
                            case '!!bool':
                                return Utils.parseBoolean(this.parseScalar(scalar.slice(6)), false);
                            case '!!float':
                                return parseFloat(this.parseScalar(scalar.slice(7)));
                            case '!!timestamp':
                                return Utils.stringToDate(Utils.ltrim(scalar.slice(11)));
                            default:
                                if (context == null) {
                                    context = { exceptionOnInvalidType: this.settings.exceptionOnInvalidType, objectDecoder: this.settings.objectDecoder, i: 0 };
                                }
                                var { objectDecoder, exceptionOnInvalidType } = context;

                                if (objectDecoder) {
                                    // If objectDecoder function is given, we can do custom decoding of custom types
                                    const trimmedScalar = Utils.rtrim(scalar);
                                    firstSpace = trimmedScalar.indexOf(' ');
                                    if (firstSpace === -1) {
                                        return objectDecoder(trimmedScalar, null);
                                    } else {
                                        let subValue = Utils.ltrim(trimmedScalar.slice(firstSpace + 1));
                                        if (!(subValue.length > 0)) {
                                            subValue = null;
                                        }
                                        return objectDecoder(trimmedScalar.slice(0, firstSpace), subValue);
                                    }
                                }

                                if (exceptionOnInvalidType) {
                                    throw new ParseException('Custom object support when parsing a YAML file has been disabled.');
                                }

                                return null;
                        }
                    case '0':
                        if ('0x' === scalar.slice(0, 2)) {
                            return Utils.hexDec(scalar);
                        } else if (Utils.isDigits(scalar)) {
                            return Utils.octDec(scalar);
                        } else if (Utils.isNumeric(scalar)) {
                            return parseFloat(scalar);
                        } else {
                            return scalar;
                        }
                    case '+':
                        if (Utils.isDigits(scalar)) {
                            raw = scalar;
                            cast = parseInt(raw);
                            if (raw === String(cast)) {
                                return cast;
                            } else {
                                return raw;
                            }
                        } else if (Utils.isNumeric(scalar)) {
                            return parseFloat(scalar);
                        } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
                            return parseFloat(scalar.replace(',', ''));
                        }
                        return scalar;
                    case '-':
                        if (Utils.isDigits(scalar.slice(1))) {
                            if ('0' === scalar.charAt(1)) {
                                return -Utils.octDec(scalar.slice(1));
                            } else {
                                raw = scalar.slice(1);
                                cast = parseInt(raw);
                                if (raw === String(cast)) {
                                    return -cast;
                                } else {
                                    return -raw;
                                }
                            }
                        } else if (Utils.isNumeric(scalar)) {
                            return parseFloat(scalar);
                        } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
                            return parseFloat(scalar.replace(',', ''));
                        }
                        return scalar;
                    default:
                        if (date = Utils.stringToDate(scalar)) {
                            return date;
                        } else if (Utils.isNumeric(scalar)) {
                            return parseFloat(scalar);
                        } else if (this.PATTERN_THOUSAND_NUMERIC_SCALAR.test(scalar)) {
                            return parseFloat(scalar.replace(',', ''));
                        }
                        return scalar;
                }
        }
    }
}
Inline.initClass();



// Parser parses YAML strings to convert them to JavaScript objects.
//
class Parser$1 {
    static initClass() {

        // Pre-compiled patterns
        //
        this.prototype.PATTERN_FOLDED_SCALAR_ALL = new Pattern('^(?:(?<type>![^\\|>]*)\\s+)?(?<separator>\\||>)(?<modifiers>\\+|\\-|\\d+|\\+\\d+|\\-\\d+|\\d+\\+|\\d+\\-)?(?<comments> +#.*)?$');
        this.prototype.PATTERN_FOLDED_SCALAR_END = new Pattern('(?<separator>\\||>)(?<modifiers>\\+|\\-|\\d+|\\+\\d+|\\-\\d+|\\d+\\+|\\d+\\-)?(?<comments> +#.*)?$');
        this.prototype.PATTERN_SEQUENCE_ITEM = new Pattern('^\\-((?<leadspaces>\\s+)(?<value>.+?))?\\s*$');
        this.prototype.PATTERN_ANCHOR_VALUE = new Pattern('^&(?<ref>[^ ]+) *(?<value>.*)');
        this.prototype.PATTERN_COMPACT_NOTATION = new Pattern(`^(?<key>${Inline.REGEX_QUOTED_STRING}|[^ '"\\{\\[].*?) *\\:(\\s+(?<value>.+?))?\\s*$`);
        this.prototype.PATTERN_MAPPING_ITEM = new Pattern(`^(?<key>${Inline.REGEX_QUOTED_STRING}|[^ '"\\[\\{].*?) *\\:(\\s+(?<value>.+?))?\\s*$`);
        this.prototype.PATTERN_DECIMAL = new Pattern('\\d+');
        this.prototype.PATTERN_INDENT_SPACES = new Pattern('^ +');
        this.prototype.PATTERN_TRAILING_LINES = new Pattern('(\n*)$');
        this.prototype.PATTERN_YAML_HEADER = new Pattern('^\\%YAML[: ][\\d\\.]+.*\n', 'm');
        this.prototype.PATTERN_LEADING_COMMENTS = new Pattern('^(\\#.*?\n)+', 'm');
        this.prototype.PATTERN_DOCUMENT_MARKER_START = new Pattern('^\\-\\-\\-.*?\n', 'm');
        this.prototype.PATTERN_DOCUMENT_MARKER_END = new Pattern('^\\.\\.\\.\\s*$', 'm');
        this.prototype.PATTERN_FOLDED_SCALAR_BY_INDENTATION = {};

        // Context types
        //
        this.prototype.CONTEXT_NONE = 0;
        this.prototype.CONTEXT_SEQUENCE = 1;
        this.prototype.CONTEXT_MAPPING = 2;
    }


    // Constructor
    //
    // @param [Integer]  offset  The offset of YAML document (used for line numbers in error messages)
    //
    constructor(offset) {
        if (offset == null) { offset = 0; }
        this.offset = offset;
        this.lines = [];
        this.currentLineNb = -1;
        this.currentLine = '';
        this.refs = {};
    }


    // Parses a YAML string to a JavaScript value.
    //
    // @param [String]   value                   A YAML string
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object]  A JavaScript value
    //
    // @throw [ParseException] If the YAML is not valid
    //
    parse(value, exceptionOnInvalidType, objectDecoder = null) {
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        this.currentLineNb = -1;
        this.currentLine = '';
        this.lines = this.cleanup(value).split("\n");

        let data = null;
        let context = this.CONTEXT_NONE;
        let allowOverwrite = false;
        while (this.moveToNextLine()) {
            var c, e, key, matches, mergeNode, parser, values;
            if (this.isCurrentLineEmpty()) {
                continue;
            }

            // Tab?
            if ("\t" === this.currentLine[0]) {
                throw new ParseException('A YAML file cannot contain tabs as indentation.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }

            let isRef = (mergeNode = false);
            if (values = this.PATTERN_SEQUENCE_ITEM.exec(this.currentLine)) {
                if (this.CONTEXT_MAPPING === context) {
                    throw new ParseException('You cannot define a sequence item when in a mapping');
                }
                context = this.CONTEXT_SEQUENCE;
                if (data == null) { data = []; }

                if ((values.value != null) && (matches = this.PATTERN_ANCHOR_VALUE.exec(values.value))) {
                    isRef = matches.ref;
                    values.value = matches.value;
                }

                // Array
                if ((values.value == null) || ('' === Utils.trim(values.value, ' ')) || (Utils.ltrim(values.value, ' ').indexOf('#') === 0)) {
                    if ((this.currentLineNb < (this.lines.length - 1)) && !this.isNextLineUnIndentedCollection()) {
                        c = this.getRealCurrentLineNb() + 1;
                        parser = new Parser$1(c);
                        parser.refs = this.refs;
                        data.push(parser.parse(this.getNextEmbedBlock(null, true), exceptionOnInvalidType, objectDecoder));
                    } else {
                        data.push(null);
                    }

                } else {
                    if ((values.leadspaces != null ? values.leadspaces.length : undefined) && (matches = this.PATTERN_COMPACT_NOTATION.exec(values.value))) {

                        // This is a compact notation element, add to next block and parse
                        c = this.getRealCurrentLineNb();
                        parser = new Parser$1(c);
                        parser.refs = this.refs;

                        let block = values.value;
                        const indent = this.getCurrentLineIndentation();
                        if (this.isNextLineIndented(false)) {
                            block += `\n${this.getNextEmbedBlock(indent + values.leadspaces.length + 1, true)}`;
                        }

                        data.push(parser.parse(block, exceptionOnInvalidType, objectDecoder));

                    } else {
                        data.push(this.parseValue(values.value, exceptionOnInvalidType, objectDecoder));
                    }
                }

            } else if ((values = this.PATTERN_MAPPING_ITEM.exec(this.currentLine)) && (values.key.indexOf(' #') === -1)) {
                var val;
                if (this.CONTEXT_SEQUENCE === context) {
                    throw new ParseException('You cannot define a mapping item when in a sequence');
                }
                context = this.CONTEXT_MAPPING;
                if (data == null) { data = {}; }

                // Force correct settings
                Inline.configure(exceptionOnInvalidType, objectDecoder);
                try {
                    key = Inline.parseScalar(values.key);
                } catch (error) {
                    e = error;
                    e.parsedLine = this.getRealCurrentLineNb() + 1;
                    e.snippet = this.currentLine;

                    throw e;
                }

                if ('<<' === key) {
                    var i;
                    mergeNode = true;
                    allowOverwrite = true;
                    if ((values.value != null ? values.value.indexOf('*') : undefined) === 0) {
                        const refName = values.value.slice(1);
                        if (this.refs[refName] == null) {
                            throw new ParseException(`Reference "${refName}" does not exist.`, this.getRealCurrentLineNb() + 1, this.currentLine);
                        }

                        const refValue = this.refs[refName];

                        if (typeof refValue !== 'object') {
                            throw new ParseException('YAML merge keys used with a scalar value instead of an object.', this.getRealCurrentLineNb() + 1, this.currentLine);
                        }

                        if (refValue instanceof Array) {
                            // Merge array with object
                            for (i = 0; i < refValue.length; i++) {
                                var name;
                                value = refValue[i];
                                if (data[name = String(i)] == null) { data[name] = value; }
                            }
                        } else {
                            // Merge objects
                            for (key in refValue) {
                                value = refValue[key];
                                if (data[key] == null) { data[key] = value; }
                            }
                        }

                    } else {
                        if ((values.value != null) && (values.value !== '')) {
                            ({ value } = values);
                        } else {
                            value = this.getNextEmbedBlock();
                        }

                        c = this.getRealCurrentLineNb() + 1;
                        parser = new Parser$1(c);
                        parser.refs = this.refs;
                        const parsed = parser.parse(value, exceptionOnInvalidType);

                        if (typeof parsed !== 'object') {
                            throw new ParseException('YAML merge keys used with a scalar value instead of an object.', this.getRealCurrentLineNb() + 1, this.currentLine);
                        }

                        if (parsed instanceof Array) {
                            // If the value associated with the merge key is a sequence, then this sequence is expected to contain mapping nodes
                            // and each of these nodes is merged in turn according to its order in the sequence. Keys in mapping nodes earlier
                            // in the sequence override keys specified in later mapping nodes.
                            for (let parsedItem of Array.from(parsed)) {
                                if (typeof parsedItem !== 'object') {
                                    throw new ParseException('Merge items must be objects.', this.getRealCurrentLineNb() + 1, parsedItem);
                                }

                                if (parsedItem instanceof Array) {
                                    // Merge array with object
                                    for (i = 0; i < parsedItem.length; i++) {
                                        value = parsedItem[i];
                                        const k = String(i);
                                        if (!data.hasOwnProperty(k)) {
                                            data[k] = value;
                                        }
                                    }
                                } else {
                                    // Merge objects
                                    for (key in parsedItem) {
                                        value = parsedItem[key];
                                        if (!data.hasOwnProperty(key)) {
                                            data[key] = value;
                                        }
                                    }
                                }
                            }

                        } else {
                            // If the value associated with the key is a single mapping node, each of its key/value pairs is inserted into the
                            // current mapping, unless the key already exists in it.
                            for (key in parsed) {
                                value = parsed[key];
                                if (!data.hasOwnProperty(key)) {
                                    data[key] = value;
                                }
                            }
                        }
                    }

                } else if ((values.value != null) && (matches = this.PATTERN_ANCHOR_VALUE.exec(values.value))) {
                    isRef = matches.ref;
                    values.value = matches.value;
                }


                if (mergeNode); else if ((values.value == null) || ('' === Utils.trim(values.value, ' ')) || (Utils.ltrim(values.value, ' ').indexOf('#') === 0)) {
                    // Hash
                    // if next line is less indented or equal, then it means that the current value is null
                    if (!(this.isNextLineIndented()) && !(this.isNextLineUnIndentedCollection())) {
                        // Spec: Keys MUST be unique; first one wins.
                        // But overwriting is allowed when a merge node is used in current block.
                        if (allowOverwrite || (data[key] === undefined)) {
                            data[key] = null;
                        }

                    } else {
                        c = this.getRealCurrentLineNb() + 1;
                        parser = new Parser$1(c);
                        parser.refs = this.refs;
                        val = parser.parse(this.getNextEmbedBlock(), exceptionOnInvalidType, objectDecoder);

                        // Spec: Keys MUST be unique; first one wins.
                        // But overwriting is allowed when a merge node is used in current block.
                        if (allowOverwrite || (data[key] === undefined)) {
                            data[key] = val;
                        }
                    }

                } else {
                    val = this.parseValue(values.value, exceptionOnInvalidType, objectDecoder);

                    // Spec: Keys MUST be unique; first one wins.
                    // But overwriting is allowed when a merge node is used in current block.
                    if (allowOverwrite || (data[key] === undefined)) {
                        data[key] = val;
                    }
                }

            } else {
                // 1-liner optionally followed by newline
                var needle;
                const lineCount = this.lines.length;
                if ((1 === lineCount) || ((2 === lineCount) && Utils.isEmpty(this.lines[1]))) {
                    try {
                        value = Inline.parse(this.lines[0], exceptionOnInvalidType, objectDecoder);
                    } catch (error1) {
                        e = error1;
                        e.parsedLine = this.getRealCurrentLineNb() + 1;
                        e.snippet = this.currentLine;

                        throw e;
                    }

                    if (typeof value === 'object') {
                        var first;
                        if (value instanceof Array) {
                            first = value[0];
                        } else {
                            for (key in value) {
                                first = value[key];
                                break;
                            }
                        }

                        if ((typeof first === 'string') && (first.indexOf('*') === 0)) {
                            data = [];
                            for (let alias of Array.from(value)) {
                                data.push(this.refs[alias.slice(1)]);
                            }
                            value = data;
                        }
                    }

                    return value;

                } else if ((needle = Utils.ltrim(value).charAt(0), ['[', '{'].includes(needle))) {
                    try {
                        return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
                    } catch (error2) {
                        e = error2;
                        e.parsedLine = this.getRealCurrentLineNb() + 1;
                        e.snippet = this.currentLine;

                        throw e;
                    }
                }

                throw new ParseException('Unable to parse.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }

            if (isRef) {
                if (data instanceof Array) {
                    this.refs[isRef] = data[data.length - 1];
                } else {
                    let lastKey = null;
                    for (key in data) {
                        lastKey = key;
                    }
                    this.refs[isRef] = data[lastKey];
                }
            }
        }


        if (Utils.isEmpty(data)) {
            return null;
        } else {
            return data;
        }
    }



    // Returns the current line number (takes the offset into account).
    //
    // @return [Integer]     The current line number
    //
    getRealCurrentLineNb() {
        return this.currentLineNb + this.offset;
    }


    // Returns the current line indentation.
    //
    // @return [Integer]     The current line indentation
    //
    getCurrentLineIndentation() {
        return this.currentLine.length - Utils.ltrim(this.currentLine, ' ').length;
    }


    // Returns the next embed block of YAML.
    //
    // @param [Integer]          indentation The indent level at which the block is to be read, or null for default
    //
    // @return [String]          A YAML string
    //
    // @throw [ParseException]   When indentation problem are detected
    //
    getNextEmbedBlock(indentation = null, includeUnindentedCollection) {
        let isItUnindentedCollection, newIndent;
        if (includeUnindentedCollection == null) { includeUnindentedCollection = false; }
        this.moveToNextLine();

        if ((indentation == null)) {
            newIndent = this.getCurrentLineIndentation();

            const unindentedEmbedBlock = this.isStringUnIndentedCollectionItem(this.currentLine);

            if (!(this.isCurrentLineEmpty()) && (0 === newIndent) && !(unindentedEmbedBlock)) {
                throw new ParseException('Indentation problem.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }

        } else {
            newIndent = indentation;
        }


        const data = [this.currentLine.slice(newIndent)];

        if (!includeUnindentedCollection) {
            isItUnindentedCollection = this.isStringUnIndentedCollectionItem(this.currentLine);
        }

        // Comments must not be removed inside a string block (ie. after a line ending with "|")
        // They must not be removed inside a sub-embedded block as well
        const removeCommentsPattern = this.PATTERN_FOLDED_SCALAR_END;
        let removeComments = !removeCommentsPattern.test(this.currentLine);

        while (this.moveToNextLine()) {
            const indent = this.getCurrentLineIndentation();

            if (indent === newIndent) {
                removeComments = !removeCommentsPattern.test(this.currentLine);
            }

            if (removeComments && this.isCurrentLineComment()) {
                continue;
            }

            if (this.isCurrentLineBlank()) {
                data.push(this.currentLine.slice(newIndent));
                continue;
            }

            if (isItUnindentedCollection && !this.isStringUnIndentedCollectionItem(this.currentLine) && (indent === newIndent)) {
                this.moveToPreviousLine();
                break;
            }

            if (indent >= newIndent) {
                data.push(this.currentLine.slice(newIndent));
            } else if (Utils.ltrim(this.currentLine).charAt(0) === '#'); else if (0 === indent) {
                this.moveToPreviousLine();
                break;
            } else {
                throw new ParseException('Indentation problem.', this.getRealCurrentLineNb() + 1, this.currentLine);
            }
        }


        return data.join("\n");
    }


    // Moves the parser to the next line.
    //
    // @return [Boolean]
    //
    moveToNextLine() {
        if (this.currentLineNb >= (this.lines.length - 1)) {
            return false;
        }

        this.currentLine = this.lines[++this.currentLineNb];

        return true;
    }


    // Moves the parser to the previous line.
    //
    moveToPreviousLine() {
        this.currentLine = this.lines[--this.currentLineNb];
    }


    // Parses a YAML value.
    //
    // @param [String]   value                   A YAML value
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object] A JavaScript value
    //
    // @throw [ParseException] When reference does not exist
    //
    parseValue(value, exceptionOnInvalidType, objectDecoder) {
        let matches, needle;
        if (0 === value.indexOf('*')) {
            const pos = value.indexOf('#');
            if (pos !== -1) {
                value = value.substr(1, pos - 2);
            } else {
                value = value.slice(1);
            }

            if (this.refs[value] === undefined) {
                throw new ParseException(`Reference "${value}" does not exist.`, this.currentLine);
            }

            return this.refs[value];
        }


        if (matches = this.PATTERN_FOLDED_SCALAR_ALL.exec(value)) {
            const modifiers = matches.modifiers != null ? matches.modifiers : '';

            let foldedIndent = Math.abs(parseInt(modifiers));
            if (isNaN(foldedIndent)) { foldedIndent = 0; }
            const val = this.parseFoldedScalar(matches.separator, this.PATTERN_DECIMAL.replace(modifiers, ''), foldedIndent);
            if (matches.type != null) {
                // Force correct settings
                Inline.configure(exceptionOnInvalidType, objectDecoder);
                return Inline.parseScalar(matches.type + ' ' + val);
            } else {
                return val;
            }
        }

        // Value can be multiline compact sequence or mapping or string
        if ((needle = value.charAt(0), ['[', '{', '"', "'"].includes(needle))) {
            while (true) {
                try {
                    return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
                } catch (e) {
                    if (e instanceof ParseMore && this.moveToNextLine()) {
                        value += `\n${Utils.trim(this.currentLine, ' ')}`;
                    } else {
                        e.parsedLine = this.getRealCurrentLineNb() + 1;
                        e.snippet = this.currentLine;
                        throw e;
                    }
                }
            }
        } else {
            if (this.isNextLineIndented()) {
                value += `\n${this.getNextEmbedBlock()}`;
            }
            return Inline.parse(value, exceptionOnInvalidType, objectDecoder);
        }

    }


    // Parses a folded scalar.
    //
    // @param [String]       separator   The separator that was used to begin this folded scalar (| or >)
    // @param [String]       indicator   The indicator that was used to begin this folded scalar (+ or -)
    // @param [Integer]      indentation The indentation that was used to begin this folded scalar
    //
    // @return [String]      The text value
    //
    parseFoldedScalar(separator, indicator, indentation) {
        let matches;
        if (indicator == null) { indicator = ''; }
        if (indentation == null) { indentation = 0; }
        let notEOF = this.moveToNextLine();
        if (!notEOF) {
            return '';
        }

        let isCurrentLineBlank = this.isCurrentLineBlank();
        let text = '';

        // Leading blank lines are consumed before determining indentation
        while (notEOF && isCurrentLineBlank) {
            // newline only if not EOF
            if (notEOF = this.moveToNextLine()) {
                text += "\n";
                isCurrentLineBlank = this.isCurrentLineBlank();
            }
        }


        // Determine indentation if not specified
        if (0 === indentation) {
            if (matches = this.PATTERN_INDENT_SPACES.exec(this.currentLine)) {
                indentation = matches[0].length;
            }
        }


        if (indentation > 0) {
            let pattern = this.PATTERN_FOLDED_SCALAR_BY_INDENTATION[indentation];
            if (pattern == null) {
                pattern = new Pattern(`^ {${indentation}}(.*)$`);
                Parser$1.prototype.PATTERN_FOLDED_SCALAR_BY_INDENTATION[indentation] = pattern;
            }

            while (notEOF && (isCurrentLineBlank || (matches = pattern.exec(this.currentLine)))) {
                if (isCurrentLineBlank) {
                    text += this.currentLine.slice(indentation);
                } else {
                    text += matches[1];
                }

                // newline only if not EOF
                if (notEOF = this.moveToNextLine()) {
                    text += "\n";
                    isCurrentLineBlank = this.isCurrentLineBlank();
                }
            }

        } else if (notEOF) {
            text += "\n";
        }


        if (notEOF) {
            this.moveToPreviousLine();
        }


        // Remove line breaks of each lines except the empty and more indented ones
        if ('>' === separator) {
            let newText = '';
            for (let line of Array.from(text.split("\n"))) {
                if ((line.length === 0) || (line.charAt(0) === ' ')) {
                    newText = Utils.rtrim(newText, ' ') + line + "\n";
                } else {
                    newText += line + ' ';
                }
            }
            text = newText;
        }

        if ('+' !== indicator) {
            // Remove any extra space or new line as we are adding them after
            text = Utils.rtrim(text);
        }

        // Deal with trailing newlines as indicated
        if ('' === indicator) {
            text = this.PATTERN_TRAILING_LINES.replace(text, "\n");
        } else if ('-' === indicator) {
            text = this.PATTERN_TRAILING_LINES.replace(text, '');
        }

        return text;
    }


    // Returns true if the next line is indented.
    //
    // @return [Boolean]     Returns true if the next line is indented, false otherwise
    //
    isNextLineIndented(ignoreComments) {
        if (ignoreComments == null) { ignoreComments = true; }
        const currentIndentation = this.getCurrentLineIndentation();
        let EOF = !this.moveToNextLine();

        if (ignoreComments) {
            while (!(EOF) && this.isCurrentLineEmpty()) {
                EOF = !this.moveToNextLine();
            }
        } else {
            while (!(EOF) && this.isCurrentLineBlank()) {
                EOF = !this.moveToNextLine();
            }
        }

        if (EOF) {
            return false;
        }

        let ret = false;
        if (this.getCurrentLineIndentation() > currentIndentation) {
            ret = true;
        }

        this.moveToPreviousLine();

        return ret;
    }


    // Returns true if the current line is blank or if it is a comment line.
    //
    // @return [Boolean]     Returns true if the current line is empty or if it is a comment line, false otherwise
    //
    isCurrentLineEmpty() {
        const trimmedLine = Utils.trim(this.currentLine, ' ');
        return (trimmedLine.length === 0) || (trimmedLine.charAt(0) === '#');
    }


    // Returns true if the current line is blank.
    //
    // @return [Boolean]     Returns true if the current line is blank, false otherwise
    //
    isCurrentLineBlank() {
        return '' === Utils.trim(this.currentLine, ' ');
    }


    // Returns true if the current line is a comment line.
    //
    // @return [Boolean]     Returns true if the current line is a comment line, false otherwise
    //
    isCurrentLineComment() {
        // Checking explicitly the first char of the trim is faster than loops or strpos
        const ltrimmedLine = Utils.ltrim(this.currentLine, ' ');

        return ltrimmedLine.charAt(0) === '#';
    }


    // Cleanups a YAML string to be parsed.
    //
    // @param [String]   value The input YAML string
    //
    // @return [String]  A cleaned up YAML string
    //
    cleanup(value) {
        let line, trimmedValue;
        if (value.indexOf("\r") !== -1) {
            value = value.split("\r\n").join("\n").split("\r").join("\n");
        }

        // Strip YAML header
        let count = 0;
        [value, count] = Array.from(this.PATTERN_YAML_HEADER.replaceAll(value, ''));
        this.offset += count;

        // Remove leading comments
        [trimmedValue, count] = Array.from(this.PATTERN_LEADING_COMMENTS.replaceAll(value, '', 1));
        if (count === 1) {
            // Items have been removed, update the offset
            this.offset += Utils.subStrCount(value, "\n") - Utils.subStrCount(trimmedValue, "\n");
            value = trimmedValue;
        }

        // Remove start of the document marker (---)
        [trimmedValue, count] = Array.from(this.PATTERN_DOCUMENT_MARKER_START.replaceAll(value, '', 1));
        if (count === 1) {
            // Items have been removed, update the offset
            this.offset += Utils.subStrCount(value, "\n") - Utils.subStrCount(trimmedValue, "\n");
            value = trimmedValue;

            // Remove end of the document marker (...)
            value = this.PATTERN_DOCUMENT_MARKER_END.replace(value, '');
        }

        // Ensure the block is not indented
        const lines = value.split("\n");
        let smallestIndent = -1;
        for (line of Array.from(lines)) {
            if (Utils.trim(line, ' ').length === 0) { continue; }
            const indent = line.length - Utils.ltrim(line).length;
            if ((smallestIndent === -1) || (indent < smallestIndent)) {
                smallestIndent = indent;
            }
        }
        if (smallestIndent > 0) {
            for (let i = 0; i < lines.length; i++) {
                line = lines[i];
                lines[i] = line.slice(smallestIndent);
            }
            value = lines.join("\n");
        }

        return value;
    }


    // Returns true if the next line starts unindented collection
    //
    // @return [Boolean]     Returns true if the next line starts unindented collection, false otherwise
    //
    isNextLineUnIndentedCollection(currentIndentation = null) {
        if (currentIndentation == null) { currentIndentation = this.getCurrentLineIndentation(); }
        let notEOF = this.moveToNextLine();

        while (notEOF && this.isCurrentLineEmpty()) {
            notEOF = this.moveToNextLine();
        }

        if (false === notEOF) {
            return false;
        }

        let ret = false;
        if ((this.getCurrentLineIndentation() === currentIndentation) && this.isStringUnIndentedCollectionItem(this.currentLine)) {
            ret = true;
        }

        this.moveToPreviousLine();

        return ret;
    }


    // Returns true if the string is un-indented collection item
    //
    // @return [Boolean]     Returns true if the string is un-indented collection item, false otherwise
    //
    isStringUnIndentedCollectionItem() {
        return (this.currentLine === '-') || (this.currentLine.slice(0, 2) === '- ');
    }
}
Parser$1.initClass();



// Dumper dumps JavaScript variables to YAML strings.
//
class Dumper {
    static initClass() {

        // The amount of spaces to use for indentation of nested nodes.
        this.indentation = 4;
    }


    // Dumps a JavaScript value to YAML.
    //
    // @param [Object]   input                   The JavaScript value
    // @param [Integer]  inline                  The level where you switch to inline YAML
    // @param [Integer]  indent                  The level of indentation (used internally)
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectEncoder           A function to serialize custom objects, null otherwise
    //
    // @return [String]  The YAML representation of the JavaScript value
    //
    dump(input, inline, indent, exceptionOnInvalidType, objectEncoder = null) {
        if (inline == null) { inline = 0; }
        if (indent == null) { indent = 0; }
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        let output = '';

        if (typeof (input) === 'function') {
            return output;
        }

        const prefix = (indent ? Utils.strRepeat(' ', indent) : '');

        if ((inline <= 0) || (typeof (input) !== 'object') || input instanceof Date || Utils.isEmpty(input)) {
            output += prefix + Inline.dump(input, exceptionOnInvalidType, objectEncoder);

        } else {
            let value, willBeInlined;
            if (input instanceof Array) {
                for (value of Array.from(input)) {
                    willBeInlined = (((inline - 1) <= 0) || (typeof (value) !== 'object') || Utils.isEmpty(value));

                    output +=
                        prefix +
                        '- ' +
                        this.dump(value, inline - 1, (willBeInlined ? 0 : indent + this.indentation), exceptionOnInvalidType, objectEncoder) +
                        (willBeInlined ? "\n" : '');
                }

            } else {
                for (let key in input) {
                    value = input[key];
                    willBeInlined = (((inline - 1) <= 0) || (typeof (value) !== 'object') || Utils.isEmpty(value));

                    output +=
                        prefix +
                        Inline.dump(key, exceptionOnInvalidType, objectEncoder) + ':' +
                        (willBeInlined ? ' ' : "\n") +
                        this.dump(value, inline - 1, (willBeInlined ? 0 : indent + this.indentation), exceptionOnInvalidType, objectEncoder) +
                        (willBeInlined ? "\n" : '');
                }
            }
        }

        return output;
    }
}
Dumper.initClass();



// Yaml offers convenience methods to load and dump YAML.
//
class Yaml {

    // Parses YAML into a JavaScript object.
    //
    // The parse method, when supplied with a YAML string,
    // will do its best to convert YAML in a file into a JavaScript object.
    //
    //  Usage:
    //     myObject = Yaml.parse('some: yaml');
    //     console.log(myObject);
    //
    // @param [String]   input                   A string containing YAML
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types, false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object]  The YAML converted to a JavaScript object
    //
    // @throw [ParseException] If the YAML is not valid
    //
    static parse(input, exceptionOnInvalidType, objectDecoder = null) {
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        return new Parser$1().parse(input, exceptionOnInvalidType, objectDecoder);
    }


    // Parses YAML from file path into a JavaScript object.
    //
    // The parseFile method, when supplied with a YAML file,
    // will do its best to convert YAML in a file into a JavaScript object.
    //
    //  Usage:
    //     myObject = Yaml.parseFile('config.yml');
    //     console.log(myObject);
    //
    // @param [String]   path                    A file path pointing to a valid YAML file
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types, false otherwise
    // @param [Function] objectDecoder           A function to deserialize custom objects, null otherwise
    //
    // @return [Object]  The YAML converted to a JavaScript object or null if the file doesn't exist.
    //
    // @throw [ParseException] If the YAML is not valid
    //
    static parseFile(path, callback = null, exceptionOnInvalidType, objectDecoder = null) {
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        if (callback != null) {
            // Async
            return Utils.getStringFromFile(path, input => {
                let result = null;
                if (input != null) {
                    result = this.parse(input, exceptionOnInvalidType, objectDecoder);
                }
                callback(result);
            });
        } else {
            // Sync
            const input = Utils.getStringFromFile(path);
            if (input != null) {
                return this.parse(input, exceptionOnInvalidType, objectDecoder);
            }
            return null;
        }
    }


    // Dumps a JavaScript object to a YAML string.
    //
    // The dump method, when supplied with an object, will do its best
    // to convert the object into friendly YAML.
    //
    // @param [Object]   input                   JavaScript object
    // @param [Integer]  inline                  The level where you switch to inline YAML
    // @param [Integer]  indent                  The amount of spaces to use for indentation of nested nodes.
    // @param [Boolean]  exceptionOnInvalidType  true if an exception must be thrown on invalid types (a JavaScript resource or object), false otherwise
    // @param [Function] objectEncoder           A function to serialize custom objects, null otherwise
    //
    // @return [String]  A YAML string representing the original JavaScript object
    //
    static dump(input, inline, indent, exceptionOnInvalidType, objectEncoder = null) {
        if (inline == null) { inline = 2; }
        if (indent == null) { indent = 4; }
        if (exceptionOnInvalidType == null) { exceptionOnInvalidType = false; }
        const yaml = new Dumper();
        yaml.indentation = indent;

        return yaml.dump(input, inline, 0, exceptionOnInvalidType, objectEncoder);
    }


    // Alias of dump() method for compatibility reasons.
    //
    static stringify(input, inline, indent, exceptionOnInvalidType, objectEncoder) {
        return this.dump(input, inline, indent, exceptionOnInvalidType, objectEncoder);
    }


    // Alias of parseFile() method for compatibility reasons.
    //
    static load(path, callback, exceptionOnInvalidType, objectDecoder) {
        return this.parseFile(path, callback, exceptionOnInvalidType, objectDecoder);
    }
}

/**
 * Embeds the VS code editor. There are some workarounds in place,
 * because the monaco editor is a no ES6-module RequireJS package.
 * 
 * That hopefully changes in the future. (Microsoft is working on it)
 */

const NEVER_CANCEL_TOKEN = {
  isCancellationRequested: false,
  onCancellationRequested: () => Event.NONE,
};

/**
* @category Web Components
* @customelement ui-codeeditor
* @description A VS-Code based editor component. (Project "monaco").
*
* Events:
* - "state": Emited as soon as the editor content has been altered
 * 
 * @property {String} scriptfile A URL to show in the editor
 * @property {Object} content A content object: {value:"text",language:"javascript|yaml",modeluri:"optional_schema_uri"}
 * @property {Object} modelschema A model schema object
 * @property {Boolean} haschanges A boolean that is true if the editor content has been altered
 * @example <caption>Code editor example</caption>
 * <ui-codeeditor></ui-codeeditor>
 */
class OhCodeEditor extends HTMLElement {
  constructor() {
    super();
    this.themechangeBound = () => this.updateTheme();
    //this.attachShadow({ mode: 'open' });
  }

  set scriptfile(filename) {
    fetchWithTimeout(filename).then(response => response.text())
      .then(res => {
        this.content = { value: res, language: "javascript" };
      })
      .catch(error => console.warn(error, e));
  }

  get scriptfile() {
    return "";
  }

  set haschanges(val) {
    if (this._haschanges == val) return;
    this._haschanges = val;
    if (!val) {
      this.removeAttribute("haschanges");
    } else {
      this.setAttribute("haschanges", "true");
      this.dispatchEvent(new Event("state"));
    }
  }

  get haschanges() {
    return this._haschanges;
  }

  /**
   * The editor content. You can always access the original content via `originalcontent`.
   * If you set data.language to "yaml", the json content will be converted internally for presentation.
   */
  set content(data) {
    if (!data) {
      return;
    }

    if (this.editor) {
      // Dispose old
      delete this.cached;
      this.haschanges = false;
      this.editor.setModel(null);
      if (this.model) this.model.dispose();

      // Create new model
      this._originalcontent = data.value;
      const editorContent = data.language == "yaml" ? Yaml.dump(data.value, 10, 4).replace(/-     /g, "-\n    ") : data.value;
      this.model = this.monaco.editor.createModel(editorContent, data.language, data.modeluri);
      this.model.onDidChangeContent(() => {
        this.haschanges = true;
        this.undoRedoUpdateAfterModelChange();
      });
      this.editor.setModel(this.model);
      // Load language extensions and schemas
      if (data.language == "yaml") this.loadYamlHighlightSupport();
      this.updateSchema();
      // Undo/Redo
      this.initialVersion = this.model.getAlternativeVersionId();
      this.currentVersion = this.initialVersion;
      this.lastVersion = this.initialVersion;
      this.dispatchEvent(new CustomEvent("redoavailable", { detail: false }));
      this.dispatchEvent(new CustomEvent("undoavailable", { detail: false }));

    }
    else
      this.cached = data;
  }

  get content() {
    if (this.model) {
      const datavalue = this.model.getValue();
      if (this.model.getModeId() == "yaml") return Yaml.parse(datavalue);
      return datavalue;
    }
    return null;
  }

  addAtCursorPosition(additionalText) {
    if (!this.model) return;
    const line = this.editor.getPosition();
    const range = new this.monaco.Range(line.lineNumber, 1, line.lineNumber, 1);
    this.editor.executeEdits("my-source", [{ identifier: { major: 1, minor: 1 }, range: range, text: additionalText, forceMoveMarkers: true }]);
    this.editor.pushUndoStop();
  }

  /**
   * Return the unmodifed content that was set by `content = "value"`.
   */
  get originalcontent() {
    return this._originalcontent;
  }

  showConfirmDialog(callbackID, okBtn = null, cancelBtn = null, text = "Read-only mode. Storing data &hellip;") {
    this.overlayWidget.callbackID = callbackID;
    this.overlayWidget.btnConfirmNode.style.display = okBtn ? "block" : "none";
    this.overlayWidget.btnConfirmNode.innerHTML = okBtn;
    this.overlayWidget.btnCancelNode.style.display = cancelBtn ? "block" : "none";
    this.overlayWidget.btnCancelNode.innerHTML = cancelBtn;
    this.overlayWidget.textNode.innerHTML = text;
    this.readonly = true;
  }

  confirmDialog(result) {
    this.dispatchEvent(new CustomEvent("confirmed", { detail: { result, dialogid: this.overlayWidget.callbackID } }));
    if (!result) this.readonly = false;
  }

  /**
   * Show an overlay with the text that was set in `showConfirmDialog`.
   */
  set readonly(val) {
    if (this._readonly == val) return;
    this._readonly = val;
    if (this.editor) {
      this.editor.updateOptions({ readOnly: val });
      if (val) {
        this.editor.addOverlayWidget(this.overlayWidget);
      } else {
        this.editor.removeOverlayWidget(this.overlayWidget);
      }
    }
  }

  updateSchema() {
    if (!this.modelschema || !this.monaco || !this.monaco.languages.yaml) return;
    this.monaco.languages.yaml.yamlDefaults.setDiagnosticsOptions({
      enableSchemaRequest: false,
      validate: true,
      schemas: [
        this.modelschema
      ],
    });
    if (this.yamlCompletionProvider) {
      this.yamlCompletionProvider.dispose();
      delete this.yamlCompletionProvider;
    }
    this.yamlCompletionProvider = this.monaco.languages.registerCompletionItemProvider('yaml', {
      triggerCharacters: ["-"],
      provideCompletionItems: async (model, position, context, token) => {
        const symbols = await this.getSymbolsForPosition(position);
        let suggestions = [];
        if (this.completionHelper) {
          // Must return "label","documentation","insertText"
          let prefilledArray = await this.completionHelper(symbols, context.triggerCharacter);
          for (let prefilled of prefilledArray) {
            if (data.language == "yaml") {
              // Convert to yaml
              prefilled.insertText = Yaml.dump([prefilled.insertText], 10, 4).replace(/-     /g, "-\n    ");
              if (context.triggerCharacter) prefilled.insertText = prefilled.insertText.replace("-", "");
            }
            prefilled.kind = monaco.languages.CompletionItemKind.Snippet;
            prefilled.insertTextRules = monaco.languages.CompletionItemInsertTextRule.InsertAsSnippet;
            suggestions.push(prefilled);
          }
        }
        return { suggestions: suggestions };
      }
    });
  }

  setCompletionHelper(helper) {
    this.completionHelper = helper;
  }

  loadRequireJS() {
    if (window.require) return Promise.resolve("");
    const url = "vs/loader.js";
    return new Promise((resolve, reject) => {
      let script = document.createElement('script');
      script.type = 'text/javascript';
      script.src = url;
      script.id = url.replace("/", "_").replace(".", "_");
      script.addEventListener('load', () => resolve(script), { passive: true });
      script.addEventListener('error', () => reject(script), { passive: true });
      this.appendChild(script);
    }).then(() => {
      window.require = require;
      window.define = define;
      if (!window.define) {
        console.error("Failed to make the vs loader globally available");
      }
      require.config = { paths: { 'vs': '.', baseUrl: '.' } };
    });
  }

  undoRedoUpdateAfterModelChange() {
    const versionId = this.editor.getModel().getAlternativeVersionId();
    // undoing
    if (versionId < this.currentVersion) {
      this.dispatchEvent(new CustomEvent("redoavailable", { detail: true }));
      // no more undo possible
      if (versionId === this.initialVersion) {
        this.dispatchEvent(new CustomEvent("undoavailable", { detail: false }));
      }
    } else {
      // redoing
      if (versionId <= this.lastVersion) {
        // redoing the last change
        if (versionId == this.lastVersion) {
          this.dispatchEvent(new CustomEvent("redoavailable", { detail: false }));
        }
      } else { // adding new change, disable redo when adding new changes
        this.dispatchEvent(new CustomEvent("redoavailable", { detail: false }));
        if (this.currentVersion > this.lastVersion) {
          this.lastVersion = this.currentVersion;
        }
      }
      this.dispatchEvent(new CustomEvent("undoavailable", { detail: true }));
    }
    this.currentVersion = versionId;
  }

  undo() {
    this.editor.trigger('aaaa', 'undo', 'aaaa');
    this.editor.focus();
  }

  redo() {
    this.editor.trigger('aaaa', 'redo', 'aaaa');
    this.editor.focus();
  }

  async getSymbolsForPosition(position) {
    if (!this.quickOpen) return null;
    let symbols = await this.quickOpen.getDocumentSymbols(
      this.model,
      true,
      NEVER_CANCEL_TOKEN
    );

    symbols = symbols.filter(symbol =>
      symbol.range.containsPosition(position)
    );
    if (symbols.length) {
      // this.model.getLineContent()
      let uidLine = null;
      for (let i = symbols[0].range.startLineNumber; i < symbols[0].range.endLineNumber; ++i) {
        let t = this.model.getLineContent(i);
        t = t.match(" thingTypeUID: [']+(.*)[']+");
        if (t && t.length > 0) {
          uidLine = t[1];
          break;
        }
      }
      if (!uidLine) return null;
      symbols[0] = { name: uidLine };
    }
    symbols = symbols.map(symbol => {
      const makeNumber = parseInt(symbol.name);
      if (makeNumber) return makeNumber;
      return symbol.name;
    });

    return symbols;
  }

  async cursorChangeListener(selection) {
    const position = selection.getPosition();
    let symbols = await this.getSymbolsForPosition(position);
    if (symbols && symbols.length) {
      this.dispatchEvent(new CustomEvent("selected", { detail: symbols }));
    }
  }

  loadYamlHighlightSupport() {
    if (this.yamlquickopen) return Promise.resolve("");
    return new Promise((resolve, reject) => {
      require(['vs/editor/contrib/quickOpen/quickOpen'], async quickOpen => {
        this.quickOpen = quickOpen;
        this.editor.onDidChangeCursorSelection(event => this.cursorChangeListener(event.selection));
        resolve();
      });
    });
  }

  loadYamlSupport() {
    if (this.monaco.languages.yaml) {
      return Promise.resolve("");
    }
    return new Promise((resolve, reject) => {
      require([
        'vs/language/yaml/monaco.contribution',
      ], () => {
        this.updateSchema();
        resolve();
      });
    });
  }

  loadMonaco() {
    if (window.monaco) {
      this.monaco = window.monaco;
      return Promise.resolve("");
    }
    return new Promise((resolve, reject) => {
      require(['./vs/editor/editor.main'], () => {
        window.monaco = monaco;
        this.monaco = monaco;
        resolve();
      });
    });
  }

  connectedCallback() {
    while (this.firstChild) { this.firstChild.remove(); }
    if (this.hasAttribute("themechangeevent")) {
      document.addEventListener(this.getAttribute("themechangeevent"), this.themechangeBound, { passive: true });
    }

    const that = this;
    this.overlayWidget = {
      domNode: null,
      textNode: null,
      btnConfirmNode: null,
      btnCancelNode: null,
      getId: function () {
        return 'my.overlay.widget';
      },
      getDomNode: function () {
        if (!this.domNode) {
          this.textNode = document.createElement('div');
          this.textNode.innerHTML = '&hellip;';
          this.btnConfirmNode = document.createElement('button');
          this.btnConfirmNode.classList.add("btn", "btn-success", "text-center");
          this.btnConfirmNode.innerHTML = "";
          this.btnConfirmNode.style["margin-right"] = "10px";
          this.btnConfirmNode.addEventListener("click", () => that.confirmDialog(true), { passive: true });
          this.btnCancelNode = document.createElement('button');
          this.btnCancelNode.classList.add("btn", "btn-secondary", "text-center");
          this.btnCancelNode.innerHTML = "";
          this.btnCancelNode.addEventListener("click", () => that.confirmDialog(false), { passive: true });
          this.domNode = document.createElement('div');
          this.domNode.appendChild(this.textNode);
          let btnContainer = this.domNode.appendChild(document.createElement('div'));
          btnContainer.style.display = "flex";
          btnContainer.appendChild(this.btnConfirmNode);
          btnContainer.appendChild(this.btnCancelNode);
          this.domNode.classList.add("editoroverlay");
        }
        return this.domNode;
      },
      getPosition: function () {
        return null;
      }
    };

    this.innerHTML = "<div>Loading editor &hellip;<br>This can take some seconds</div>";
    if (this.hasAttribute("scriptfile")) this.scriptfile = this.getAttribute("scriptfile");
    this.loadRequireJS()
      .then(() => this.loadMonaco())
      .then(() => this.loadYamlSupport())
      .then(() => this.updateSchema())
      .then(() => this.startEditor());
  }

  disconnectedCallback() {
    if (this.hasAttribute("themechangeevent")) {
      document.removeEventListener(this.getAttribute("themechangeevent"), this.themechangeBound, { passive: true });
    }
    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound, { passive: true });
    if (this.debounceResizeTimer) clearInterval(this.debounceResizeTimer);
    delete this.debounceResizeTimer;

    if (this.model) this.model.dispose();
    delete this.model;
    if (this.editor) this.editor.dispose();
    delete this.editor;
  }

  updateTheme() {
    this.monaco.editor.setTheme(localStorage.getItem("darktheme") == "true" ? "vs-dark" : "vs");
  }

  startEditor() {
    const el = this;
    while (this.firstChild) { this.firstChild.remove(); }
    this.editor = this.monaco.editor.create(el);
    this.offset = { width: el.offsetWidth, height: el.offsetHeight - 50 };
    this.editor.layout(this.offset);
    this.updateTheme();

    // Resizing
    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound, { passive: true });
    this.resizeBound = () => {
      if (this.debounceResizeTimer) {
        clearTimeout(this.debounceResizeTimer);
        delete this.debounceResizeTimer;
      }
      this.debounceResizeTimer = setTimeout(() => {
        let newOffset = { width: el.offsetWidth, height: el.offsetHeight - 50 };
        if (this.offset.height != newOffset.height || this.offset.width != newOffset.width) {
          this.offset = newOffset;
          this.editor.layout(this.offset);
        }
      }, 500);
    };
    window.addEventListener('resize', this.resizeBound, { passive: true });

    if (this.cached) {
      this.content = this.cached;
    } else {
      this.content = { value: "", language: "javascript", modeluri: null };
    }

    return Promise.resolve("");
  }
}

window.MonacoEnvironment = {
  baseUrl: '.',
  getWorkerUrl: function (moduleId, label) {
    if (label === 'json') {
      return './vs/language/json/jsonWorker.js';
    }
    if (label === 'css') {
      return './vs/language/css/cssWorker.js';
    }
    if (label === 'html') {
      return './vs/language/html/htmlWorker.js';
    }
    if (label === 'typescript' || label === 'javascript') {
      return './vs/language/typescript/tsWorker.js';
    }
    return './vs/base/worker/workerMain.js';
  }
};

customElements.define('ui-codeeditor', OhCodeEditor);

/**
* @category Web Components
* @customelement ui-github-issues
* @description This element renders a list of github-issue links (ul->li->a).
* @attribute url For example "https://api.github.com/repos/openhab/openhab2-addons/issues".
* @attribute filter For example "deconz"
* @attribute cachetime A cache time in minutes. Default is one day.
* @attribute hasissues  read-only. Will be set, when there are issues found for the given filter.
 *                Use this in css selectors to show/hide etc.
* @example <caption>Github issues example</caption>
* <ui-github-issues></ui-github-issues>
*/
class OhGithubIssues extends HTMLElement {
  constructor() {
    super();
  }
  connectedCallback() {
    this.style.display = "none";
    this.label = this.getAttribute("label");
    this.loading = this.getAttribute("loading") || "Loading... ";
    this.error = this.getAttribute("error") || "Failed to fetch! ";
    this.cachetime = (this.hasAttribute("cachetime") ? parseInt(this.getAttribute("cachetime")) : null) || 1440; // One day in minutes
    this.attributeChangedCallback();
    this.initdone = true;
    this.checkCacheAndLoad();
  }
  static get observedAttributes() {
    return ['url',
      'filter'];
  }
  attributeChangedCallback(name, oldValue, newValue) {
    this.url = this.getAttribute("url");
    this.filter = this.getAttribute("filter");
    if (this.filter) this.filter = this.filter.toLowerCase();
    if (this.initdone) this.checkCacheAndLoad();
  }
  /**
   * Refreshes the content (either from the cache or if that is invalid from the url).
   */
  checkCacheAndLoad() {
    if (!this.url) {
      this.style.display = "block";
      this.setAttribute("hasissues", "");
      this.innerHTML = "No url given!";
      return;
    }
    const cacheTimestamp = parseInt(localStorage.getItem("timestamp_" + this.url)) || 0;
    this.title = `Caching for ${this.cachetime / 60} hours. Last refresh: ${new Date(cacheTimestamp).toLocaleString()}`;
    let cachedData = null;
    if (cacheTimestamp > 0 && (cacheTimestamp + this.cachetime * 60 * 1000 > Date.now())) {
      cachedData = localStorage.getItem(this.url);
    }

    if (cachedData) {
      this.renderData(JSON.parse(cachedData));
    } else {
      this.reload();
    }
  }
  /**
   * Force reloads the content from the given url.
   */
  async reload() {
    localStorage.removeItem("timestamp_" + this.url);
    if (localStorage.getItem("loading_" + this.url)) {
      console.warn("Already loading the issues list");
      return;
    }
    // Prevent double loading
    localStorage.setItem("loading_" + this.url, "true");
    // safety measure: Allow reloading after 30s
    setTimeout(() => localStorage.removeItem("loading_" + this.url), 30000);

    this.innerHTML = this.loading;
    try {
      let fullresponse = [];

      let response = await fetchWithTimeout(this.url);
      const linkHeader = response.headers.get("Link");

      let otherUrls = [response.json().then(json => (fullresponse = fullresponse.concat(json)), this.renderData(fullresponse))];

      // The Link header looks like this:
      // <https://api.github.com/repositories/19753195/issues?page=17>; rel="last", <https://api.github.com/repositories/19753195/issues?page=1>; rel="first"
      if (linkHeader) {
        const links = linkHeader.split(",");
        for (let link of links) {
          if (link.includes('rel="last"')) {
            let result = link.match(/<(.*)>/);
            if (result.length != 2) continue;
            const [baseurl, pagenoStr] = result[1].split("page=");
            const lastPage = parseInt(pagenoStr);
            for (let i = 2; i <= lastPage; ++i) {
              const url = baseurl + "page=" + i;
              console.log("RELOAD ISSUES NEXT LINK", url);
              otherUrls.push(fetchWithTimeout(url).then(r => r.json()).then(json => (fullresponse = fullresponse.concat(json)), this.renderData(fullresponse)));
            }
          }
        }
      }

      await Promise.all(otherUrls);

      localStorage.setItem(this.url, JSON.stringify(fullresponse));
      localStorage.setItem("timestamp_" + this.url, Date.now());
      localStorage.removeItem("loading_" + this.url); // Allow reloading
      this.renderData(fullresponse);
    } catch (e) {
      localStorage.removeItem("loading_" + this.url); // Allow reloading
      console.warn(e);
      this.style.display = "block";
      this.setAttribute("hasissues", "");
      this.innerHTML = this.error + e + " " + this.url;
    }
  }
  renderData(data, filter = null) {
    if (!filter) filter = this.filter;
    while (this.firstChild) { this.firstChild.remove(); }

    const ul = document.createElement('ul');
    let counter = 0;
    for (const entry of data) {
      if (!entry.title.toLowerCase().includes("[" + filter + "]")) continue;
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.innerHTML = entry.title;
      a.href = entry.html_url;
      a.target = "_blank";
      li.appendChild(a);
      ul.appendChild(li);
      ++counter;
    }
    if (counter > 0) {
      this.style.display = "block";
    }
    else {
      this.style.display = "none";
      return;
    }
    ul.classList.add("mb-0");

    {
      const el = document.createElement("a");
      el.href = "#";
      el.title = "Reload";
      el.innerHTML = `<i class="fas fa-sync-alt">`;
      el.style.float = "right";
      el.addEventListener("click", e => { e.preventDefault(); this.reload(); });
      this.appendChild(el);
    }

    {
      const el = document.createElement("a");
      el.href = "#";
      el.title = "Close";
      el.innerHTML = `<i class="fas fa-times">`;
      el.style.float = "right";
      el.classList.add("mr-2");
      el.addEventListener("click", e => { e.preventDefault(); this.style.display = "none"; });
      this.appendChild(el);
    }

    {
      const detailsEl = document.createElement("details");
      const sumEl = document.createElement("summary");
      sumEl.innerHTML = this.label;
      detailsEl.appendChild(sumEl);
      detailsEl.appendChild(ul);
      this.appendChild(detailsEl);
    }

    if (counter > 0) {
      this.setAttribute("hasissues", "");
    }
    else {
      this.removeAttribute('hasissues');
    }
  }
}

customElements.define('ui-github-issues', OhGithubIssues);

function generateTree(target, key, value, configurationType) {
  if (value.type == 'boolean') {
    target[key] = false;
  } else if (value.type == 'string') {
    if (value.enum && value.enum.length) {
      target[key] = value.enum[0];
    } else
      target[key] = value.description;
  } else if (value.type == 'array' && value.items && value.items.type == 'string') {
    target[key] = ["Demo1", "Demo2"];
  } else if (key == 'configuration' && configurationType) {
    let configs = {};
    for (let configParameter of configurationType) {
      configs[configParameter.name] = configParameter.defaultValue ? configParameter.defaultValue : configParameter.label;
    }
    target[key] = configs;
  }
}

function generateTreeRoot(schema, thingType, channelConfigTypes, channelTypes, listAllChannels = false) {
  let target = {};
  const schemaKeys = Object.keys(schema);
  for (let key of schemaKeys) {
    let value = schema[key];
    if (key == 'channels' && thingType && thingType.channels) {
      let channels = [];
      const channelKeys = Object.keys(schema.channels.items.properties);
      for (let extendedChannelType of channelTypes) {
        if (!listAllChannels && !thingType.channels.find(c => c.typeUID == extendedChannelType.UID)) continue;
        let channelTarget = {};
        for (let channelKey of channelKeys) {
          let channelValue = schema.channels.items.properties[channelKey];
          switch (channelKey) {
            case "uid":
              channelTarget[channelKey] = thingType.UID + ":myThingID:" + extendedChannelType.id;
              break;
            case "id":
              channelTarget[channelKey] = extendedChannelType.id;
              break;
            case "channelTypeUID":
              channelTarget[channelKey] = extendedChannelType.UID;
              break;
            case "label":
              channelTarget[channelKey] = extendedChannelType.label;
              break;
            case "defaultTags":
              channelTarget[channelKey] = extendedChannelType.tags ? extendedChannelType.tags : [];
              break;
            case "kind":
              channelTarget[channelKey] = extendedChannelType.kind;
              break;
            case "itemType":
              channelTarget[channelKey] = extendedChannelType.itemType;
              break;
            default:
              const channelConfigType = channelConfigTypes ? channelConfigTypes.find(c => c.uri == "channel-type:" + extendedChannelType.UID) : null;
              generateTree(channelTarget, channelKey, channelValue, channelConfigType ? channelConfigType.parameters : null);
          }
        }
        channels.push(channelTarget);
      }
      target[key] = channels;
    } else {
      generateTree(target, key, value, thingType ? thingType.configParameters : null);
    }
  }
  return target;
}

function generateTemplateForSchema(schema, thingType, channelConfigTypes, channelTypes, focus, focusChannelindex, listAllChannels = false) {
  let demo = generateTreeRoot(schema, thingType, channelConfigTypes, channelTypes, listAllChannels);

  if (focus == "channels" && demo.channels)
    demo = demo.channels;
  else if (focus == "channelconfig" && demo.channels.length > focusChannelindex) {
    demo = demo.channels[focusChannelindex];
  }
  return demo;
}

// Nav

/**
 * UI web components module.
 * 
 * Exports the YAML parser and converter via "Yaml".
 * 
 * @category Web Components
 * @module uicomponents
 */

export { Yaml, generateTemplateForSchema };

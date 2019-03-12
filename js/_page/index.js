import { UrlLoader, FormLoader } from './loaders.js';
export * from './page'

/**
 * A filter function
 * 
 * @param {Element} element The element that was clicked on.
 * @param {String|URL} url The url to navigate to.
 * @returns Return true a full page reload is required.
 *  Return false if a html replacement is fine.
 *  Return null if the page navigation should be aborted.
 */
function fnRequirePageReloadPrototype(element, url) {

}

/**
 * Class to handle the navigation history
 */
export default class Navigator {
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
    }

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

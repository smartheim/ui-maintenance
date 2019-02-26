
/**
 * 
 * @category Tutorial
 * @memberof module:tutorial.Tools
 * @description
 * 
 * Check if the current page corresponds to the given one.
 * If not, change to that page by using the navigation headerbar link.
 * 
 * @param {String} page The target page
 * @returns Returns a promise that either resolves immediately or
 * 600ms after a change page has been performed.
 */
function checkPage(page) {
  if (window.location.pathname != "/" + page + ".html") {
    console.warn("NOT ON " + page, window.location.pathname);
    document.querySelector("#nav" + page).click();
    return new Promise((accept, reject) => {
      setTimeout(accept, 600);
    });
  }
  return Promise.resolve();
}

/**
 * 
 * @category Tutorial
 * @memberof module:tutorial.Tools
 * @description
 * 
 * Returns a promise that accepts after the given time.
 * 
 * @param {Number} ms The wait time in milliseconds
 * @returns Returns a promise that accepts after the given time.
 */
function wait(ms = 600) {
  return new Promise((accept, reject) => {
    setTimeout(accept, ms);
  });
}

/**
 * @category Tutorial
 * @memberof module:tutorial.Tools
 * @description
 * 
 * Injects an item into a vue list
 * 
 * @param {String} domid The vue list dom ID
 * @param {Object} item An object to inject into the vue list
 */
function injectIntoVueList(domid, item) {
  const el = document.getElementById(domid);
  if (!el) return;
  const vuelist = el.__vue__;
  if (!vuelist) return;
  const list = vuelist.items;
  if (!list) return;
  list.push(item);
}

/**
 * @category Tutorial
 * @memberof module:tutorial.Tools
 * @description
 * 
 * Remove an injected item from a vue list
 * 
 * @param {String} domid The vue list dom ID
 * @param {String} itemkey The property that represents the ID of an item
 * @param {String} itemid An object to inject into the vue list
 */
function removeInjectedFromVueList(domid, itemkey, itemid) {
  const el = document.getElementById(domid);
  if (!el) return;
  const vuelist = el.__vue__;
  if (!vuelist) return;
  const list = vuelist.items;
  if (!list) return;
  for (let i = 0; i < list.length; ++i)
    if (list[i][itemkey] == itemid) {
      list.splice(i, 1);
      break;
    }
}


/**
 * @category Tutorial
 * @memberof module:tutorial.Tools
 * @description
 * 
 * Returns the standard set of buttons for a tour (Exit, Next).
 * @param {Object} tour The tour object
 */
function standardButtons(tour) {
  return [
    {
      action: tour.cancel,
      classes: 'shepherd-button-secondary',
      text: 'Exit'
    }, {
      action: tour.next,
      text: 'Next'
    }
  ]
}

/**
 * @category Tutorial
 * @memberof module:tutorial.Tools
 * @description
 * 
 * Returns the finish set of buttons for a tour (Exit, Finish).
 * @param {Object} tour The tour object
 */
function finishButton(tour) {
  return [
    {
      action: tour.cancel,
      classes: 'shepherd-button-secondary',
      text: 'Exit'
    },
    {
      action: () => {
        let el = document.createElement("a");
        el.href = "tutorial-exercises.html";
        el = document.body.appendChild(el);
        el.click();
        el.remove();
        tour.next();
      },
      text: 'Back to tutorials'
    }
  ]
}
export { standardButtons, finishButton, checkPage, injectIntoVueList, removeInjectedFromVueList, wait };

/**
 * All utility methods of {@link module:tutorial}.
 * @namespace Tools
 * @memberof module:tutorial
 * @category Tutorial
 */

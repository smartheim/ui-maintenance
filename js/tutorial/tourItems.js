
import { checkPage, finishButton, standardButtons, wait } from './util'
import { store } from './app.js'; // Pre-bundled, external reference

/**
 * @category Tutorial
 * @memberof module:tutorial
 * @description
 * 
 * This is the items tour
 */
function itemsTour(tour) {
  tour.addStep('addresult', {
    scrollTo: false,
    text: [`TODO`, `TODO`],
    buttons: finishButton(tour)
  });
}

export { itemsTour };
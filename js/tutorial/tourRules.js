
import { checkPage, finishButton, standardButtons, wait } from './util'
import { store } from './app.js'; // Pre-bundled, external reference

/**
 * @category Tutorial
 * @memberof module:tutorial
 * @description
 * 
 * This is the rules tour
 */
function rulesTour(tour) {
  tour.addStep('addresult', {
    scrollTo: false,
    text: [`TODO`, `TODO`],
    buttons: finishButton(tour)
  });
}

export { rulesTour };
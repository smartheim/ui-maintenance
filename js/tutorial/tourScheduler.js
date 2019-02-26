
import { checkPage, finishButton, standardButtons, wait } from './util'
import { store } from './app.js'; // Pre-bundled, external reference

/**
 * @category Tutorial
 * @memberof module:tutorial
 * @description
 * 
 * This is the scheduler tour
 */
function schedulerTour(tour) {
  tour.addStep('addresult', {
    scrollTo: false,
    text: [`TODO`, `TODO`],
    buttons: finishButton(tour)
  });
}

export { schedulerTour };
//import Shepherd from 'shepherd.js/src/js/shepherd';
import Shepherd from '../_shepherd/shepherd.esm.js';
import { store } from './app.js'; // Pre-bundled, external reference

import { inboxTour } from './tourInbox'
import { thingsTour } from './tourThings'
import { itemsTour } from './tourItems'
import { rulesTour } from './tourRules'
import { schedulerTour } from './tourScheduler'
import { expireTour } from './tourExpire'

/**
 * Starts the tour given by the tour id.
 * 
 * @param {String} tourid The tour id
 */
export function startTutorial(tourid) {
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      scrollTo: true,
      showCancelLink: false
    },
    useModalOverlay: true
  });
  tour.on("complete", () => {
    store.removeTutorialData();
  });
  tour.on("cancel", () => {
    store.removeTutorialData();
  });
  switch (tourid) {
    case "inbox": inboxTour(tour); break;
    case "things": thingsTour(tour); break;
    case "items": itemsTour(tour); break;

    case "rules": rulesTour(tour); break;
    case "scheduler": schedulerTour(tour); break;
    case "expire": expireTour(tour); break;
  }
  tour.start();
}

/**
 * Tutorial module
 * 
 * The tutorial is realized with Shepherd.js (which uses Tippy.js which uses Popper.js).
 * 
 * There are some utility methods and constants defined (like button configurations and tutorial object injections).
 * 
 * Each tutorial has its own file and method in the module. Shepherd.js is quite simple
 * to use. {@link startTutorial} is our main entry point where we get called by the tutorial exercises page.
 * It creates the corresponding tour and starts the tour.
 * 
 * A single tour is nothing else then a method where all tour steps are added one after the other
 * via Shepherd.js' `tour.addStep`.
 * 
 * @category Tutorial
 * @module tutorial
 */
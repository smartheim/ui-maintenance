
import { checkPage, finishButton, standardButtons, wait } from './util'
import { store } from './app.js'; // Pre-bundled, external reference

/**
 * @category Tutorial
 * @memberof module:tutorial
 * @description
 * 
 * This is the inbox tour
 */
function inboxTour(tour) {
  tour.addStep('gotoinbox', {
    scrollTo: false,
    text: [`The Inbox allows you to add auto-discovered Things.
    Remember that you need to have Add-ons installed first.`,
      `Click on the Inbox link to continue.`],
    attachTo: '#navinbox bottom',
    advanceOn: '#navinbox click',
    beforeShowPromise: () => {
      return Promise.resolve()
        .then(() => store.removeTutorialData()) // First remove leftovers
        .then(() => store.injectTutorialData("bindings", { id: "demo1", name: "Demo Binding", description: "a binding demo description" }))
        .then(() => store.injectTutorialData("discovery", { id: "demo1", name: "Demo Binding" }))
    },
    buttons: standardButtons(tour)
  });
  tour.addStep('manualdiscover', {
    scrollTo: false,
    text: [`Many add-ons support <b>background</b> discovery. No further actions required.`,
      `Some don't, like the network binding.`,
      `Click on any bindings name on the left to start a <b>manual</b> discovery.`],
    attachTo: '#manualdiscover right',
    advanceOn: '#manualdiscover click',
    beforeShowPromise: () => {
      return checkPage("inbox");
    },
    buttons: standardButtons(tour)
  });
  tour.addStep('addresult', {
    scrollTo: true,
    text: [`Found devices appear in your Inbox list.`,
      `You can hide discoveries that you do not want to see anymore, but also not want to accept either.`,
      `Take your time to discover this screen on your own, outside of the tutorial mode.`
    ],
    attachTo: '#demo1_demo1_demo1 right',
    advanceOn: '#demo1_demo1_demo1 click',
    beforeShowPromise: () => {
      return checkPage("inbox")
        .then(() => store.injectTutorialData("inbox", { flag: "NEW", thingTypeUID: "demo1:demo1", thingUID: "demo1:demo1:demo1", label: "Demo Thing" }))
        .then(() => wait());
    },
    buttons: finishButton(tour)
  });
}

export { inboxTour };
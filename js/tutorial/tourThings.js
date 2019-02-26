
import { checkPage, finishButton, standardButtons } from './util'
import { store } from './app.js'; // Pre-bundled, external reference

/**
 * @category Tutorial
 * @memberof module:tutorial
 * @description
 * 
 * This is the things tour
 */
function thingsTour(tour) {
  tour.addStep('gotopage', {
    scrollTo: false,
    text: [`The Things screen shows you all configured Things.
    A Thing is most of the time a representation of a physical device.
    Remember that Add-ons provide additional Things.`,
      `Click on the Things link to continue.`],
    attachTo: '#navthings bottom',
    advanceOn: '#navthings click',
    beforeShowPromise: () => {
      return Promise.resolve()
        .then(() => store.removeTutorialData()) // First remove leftovers
        .then(() => store.injectTutorialData("bindings", { id: "demo1", name: "Demo Binding", description: "a binding demo description" }))
        .then(() => store.injectTutorialData("thing-types", {
          UID: "demo1:demo1", listed: true, bridge: false, supportedBridgeTypeUIDs: [], label: "",
          description: "This thing was injected by the tutorial assistant! It's not of much value outside of the tutorial. Believe me."
        }))
        .then(() => store.injectTutorialData("things", {
          UID: "demo1:demo1:demo1", thingTypeUID: "demo1:demo1",
          channels: [], configuration: {}, actions: {}, properties: {},
          statusInfo: { status: "ONLINE", statusDetail: "NONE" },
          label: "Demo Thing"
        }))
    },
    buttons: standardButtons(tour)
  });
  tour.addStep('thingstatus', {
    scrollTo: false,
    text: [`A Thing has a status like Online / Offline / Uninitialized.`,
      `You find the status in the bottom left corner. You find more detailed information by hovering over the status label.`],
    attachTo: '#demo1_demo1_demo1',
    beforeShowPromise: () => {
      tour.options.useModalOverlay = true;
      return checkPage("things");
    },
    buttons: standardButtons(tour)
  });
  tour.addStep('thingactions', {
    scrollTo: false,
    text: [`Click on <i class="fas fa-ellipsis-v label"></i> at the bottom right corner to see Thing actions.`,
      `Some bindings offer additional actions like "Pair device" or a weblink for futher information.`],
    attachTo: '#demo1_demo1_demo1',
    beforeShowPromise: () => {
      tour.options.useModalOverlay = true;
      return checkPage("things");
    },
    buttons: standardButtons(tour)
  });
  tour.addStep('addmanualthing', {
    scrollTo: false,
    text: [`Usually you add Things via the Inbox. Some bindings require you to add Things manually though.`,
      `Change to the Add Things screen`],
    attachTo: 'a[href="thing_configuration.html"]',
    advanceOn: 'a[href="thing_configuration.html"] click',
    beforeShowPromise: () => {
      return checkPage("things");
    },
    buttons: standardButtons(tour)
  });
  tour.addStep('addresult', {
    scrollTo: false,
    text: [`Add a Thing.`,
      `TODO`],
    buttons: finishButton(tour)
  });
}

export { thingsTour };
import Shepherd from 'shepherd.js/dist/js/shepherd.esm.js';

export function startTutorial(tourid) {
  const tour = new Shepherd.Tour({
    defaultStepOptions: {
      scrollTo: true,
      showCancelLink: false
    },
    useModalOverlay: true
  });
  switch (tourid) {
    case "inbox": inboxTour(tour); break;
  }
  tour.start();
}

function inboxTour(tour) {
  tour.addStep('gotoinbox', {
    scrollTo: false,
    text: [`The Inbox allows you to add auto-discovered Things.
    Remember that you need to have Add-ons installed first.`,
      `Click on the Inbox link to continue.`],
    attachTo: '#navinbox bottom',
    advanceOn: '#navinbox click',
    buttons: [
      {
        action: tour.cancel,
        classes: 'shepherd-button-secondary',
        text: 'Exit'
      }, {
        action: tour.next,
        text: 'Next'
      }
    ]
  });
  tour.addStep('manualdiscover', {
    scrollTo: false,
    text: [`Many add-ons support background discovery. Some don't, like the network binding.`,
      `Click on the bindings name on the left to start a discovery.`],
    attachTo: '#manualdiscover right',
    advanceOn: '#manualdiscover click',
    beforeShowPromise: () => {
      if (window.location.pathname != "inbox.html") {
        console.warn("NOT ON INBOX", window.location.pathname);
        document.querySelector("#navinbox").click();
        return new Promise((accept, reject) => {
          setTimeout(accept, 600);
        });
      }
      return Promise.resolve();
    },
    buttons: [
      {
        action: tour.cancel,
        classes: 'shepherd-button-secondary',
        text: 'Exit'
      }, {
        action: tour.next,
        text: 'Next'
      }
    ]
  });
  tour.addStep('addresult', {
    scrollTo: false,
    text: [`Found devices appear in your Inbox list. You can hide discoveries that you do not want to see but also not want to accept.`,
      `Accept of one the Demo Things to finish this tutorial.`],
    attachTo: '#inboxlist top',
    beforeShowPromise: () => {
      if (window.location.pathname != "inbox.html") {
        console.warn("NOT ON INBOX");
        document.querySelector("#navinbox").click();
        return new Promise((accept, reject) => {
          setTimeout(accept, 600);
        });
      }
      return Promise.resolve();
    },
    buttons: [
      {
        action: tour.cancel,
        classes: 'shepherd-button-secondary',
        text: 'Exit'
      }, {
        action: tour.next,
        text: 'Next'
      }
    ]
  });
}
import { createNotification } from '../app.js';

const Mixin = {

  methods: {
    action(action) {
      createNotification(null, `${action} not yet supported by openHAB`, false, 1500);
    },
  }
};

const mixins = [Mixin];

export { mixins };

import { createNotification } from '../app.js'; // Pre-bundled, external reference

const Mixin = {

  methods: {
    action(action) {
      createNotification(null, `${action} not yet supported by openHAB`, false, 1500);
    },
  }
}

export const mixins = [Mixin];

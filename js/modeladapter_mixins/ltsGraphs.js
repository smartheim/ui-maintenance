import { createNotification } from '../app.js'; // Pre-bundled, external reference

const allowedTypes = Object.freeze(["memory", "cpu", "threads"]);
const Mixin = {
  methods: {
    action(action) {
      createNotification(null, `${action} not yet supported by openHAB`, false, 1500);
    },
    newData(websocketData) {
      websocketData = websocketData.detail;
      if (!websocketData.t || !allowedTypes.includes(websocketData.t)) return;
      const target = this.$refs[websocketData.t];
      if (websocketData.init) {
        target.initData(websocketData.init);
      } else {
        delete websocketData.t;
        target.addData(websocketData);
      }
    },
  }
}

export const mixins = [Mixin];

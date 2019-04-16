import { createNotification } from '../app.js';

const allowedTypes = Object.freeze(["memory", "cpu", "threads"]);
const Mixin = {
  data() {
    return {
      websocketRun: false,
      targetsReady: 0
    }
  },
  methods: {
    targetLoaded() {
      this.targetsReady += 1;
      if (this.targetsReady == 3) {
        this.websocketRun = true;
      }
    },
    action(action) {
      createNotification(null, `${action} not yet supported by openHAB`, false, 1500);
    },
    newData(websocketData) {
      websocketData = websocketData.detail;
      if (!websocketData.t || !allowedTypes.includes(websocketData.t)) return;
      const target = this.$refs[websocketData.t];
      if (!target || !target.initData) {
        console.warn("ltsGraps: Did not find target", websocketData.t, target);
        return;
      }
      if (websocketData.init) {
        target.initData(websocketData.init);
      } else {
        delete websocketData.t;
        target.addData(websocketData);
      }
    },
  }
};

const mixins = [Mixin];

export { mixins };

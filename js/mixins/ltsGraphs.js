import '../charts.js';

const allowedTypes = Object.freeze(["memory", "cpu", "threads"]);
const Mixin = {
  mounted: function () {
    for (let t of allowedTypes)
      this.$refs[t].initData([]);
  },
  data: function () {
    return {
    }
  },
  methods: {
    newData(websocketData) {
      websocketData = websocketData.detail;
      if (!websocketData.t || !allowedTypes.includes(websocketData.t)) return;
      const target = this.$refs[websocketData.t];
      if (websocketData.init) {
        for (let d of websocketData.init) target.addData(d);
      } else {
        delete websocketData.t;
        target.addData(websocketData);
      }
    },
  }
}

export const mixins = [Mixin];

// import { Vuex, Vue, store, mapState, mapActions } from './stores.js'
import * as cronstrue from '../cronstrue.js';
import { store } from '../app.js';
import { VueCal } from "../scheduler.js"

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("uid");
    this.runtimeKeys = Object.freeze(["link", "editable", "remainingRuns", "totalRuns", "lastrun"]);
    this.items = [];
  }
  stores() { return { "rules": "items" } };
  getall(options = null) {
    return this.get(options);
  }
  get(options = null) {
    return store.get("rules", null, options).then(items => this.items = items);
  }
  dispose() {
  }
}

const ScheduleMixin = {
  methods: {
    timerDescription: function () {
      if (this.item.type == "cron") {
        try {
          return cronstrue.toString(this.item.cronExpression, { throwExceptionOnParseError: true, use24HourTimeFormat: true });
        } catch (e) {
          return "Cron expression parse error: " + e;
        }
      } else if (this.item.type == "fixed") {
        return new Date().toString();
      } else {
        return "Unsupported timer type";
      }
    },
  }
}

const ItemListMixin = {
  data: function () {
    return {
      events: [
        {
          eventid: "lala",
          start: new Date(2018, 11, 19, 10, 35),
          end: new Date(2018, 11, 19, 11, 30),
          title: 'Doctor appointment',
          content: '<i class="v-icon material-icons">local_hospital</i>',
          class: 'health'
        },
        {
          eventid: "dudu",
          start: new Date(2018, 11, 21, 10, 35),
          end: new Date(2018, 11, 21, 11, 30),
          fixed: true,
          title: 'Doctor appointment',
          content: '<i class="v-icon material-icons">local_hospital</i>',
          class: 'health'
        },
      ],
    }
  },
  computed: {
  },
  mounted() {
  },
  methods: {
    onEventclick() {
      console.log("CLICK", arguments);
    },
    loadEvents(m) {
      this.$refs.cal.updateMutableEvents(this.events);
    },
    logEvents(t, m) {
      console.log(t, m);
    }
  },
  components: {
    VueCal
  },
};

const mixins = [ItemListMixin];
export { mixins, ModelAdapter };

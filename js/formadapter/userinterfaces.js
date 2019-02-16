import { openhabHost, store } from '../app.js';

class StoreView {
  constructor() { this.value = []; }
  stores() { return { "user-interfaces": "value" } };
  get(id, options = null) {
    return store.get("user-interfaces", null, options)
      .then(v => this.value = v);
  }
  dispose() {
  }
}

const UserInterfaceMixin = {
  computed: {
  },
  methods: {
    image(item) {
      const host = openhabHost();
      if (host != "demo") {
        return openhabHost() + item.image;
      } else {
        return "./img/scene_dummy.jpg";
      }
    },
    link(item) {
      const host = openhabHost();
      if (host != "demo") {
        return openhabHost() + item.link;
      } else {
        return "#";
      }
    }
  }
}

const mixins = [UserInterfaceMixin];
const runtimekeys = [];
const schema = null;
const ID_KEY = "id";

export { mixins, schema, runtimekeys, StoreView, ID_KEY };

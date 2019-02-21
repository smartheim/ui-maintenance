import { openhabHost, store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.value = [];
  }
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
        return "./dummydata/" + item.id + ".png";
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

export { mixins, ModelAdapter };

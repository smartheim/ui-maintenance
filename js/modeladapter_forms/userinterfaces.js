import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("id");
    this.runtimeKeys = []; this.value = [];
  }
  stores() { return { "user-interfaces": "value" } };
  async get(table = null, objectid = null, options = null) {
    this.value = await store.get("user-interfaces", null, options);
  }
  dispose() {
  }
}

const UserInterfaceMixin = {
  computed: {
  },
  methods: {
    image(item) {
      if (store.host != "demo") {
        return store.host + item.image;
      } else {
        return "./dummydata/" + item.id + ".png";
      }
    },
    link(item) {
      if (store.host != "demo") {
        return store.host + item.link;
      } else {
        return "#";
      }
    }
  }
};

const mixins = [UserInterfaceMixin];

export { mixins, ModelAdapter };

import { store } from '../app.js'; // Pre-bundled, external reference

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
}

const mixins = [UserInterfaceMixin];

export { mixins, ModelAdapter };

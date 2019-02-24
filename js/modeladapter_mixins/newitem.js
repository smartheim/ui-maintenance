import { store, fetchMethodWithTimeout } from '../app.js'; // Pre-bundled, external reference

const Mixin = {
  mounted: function () {
    this.$el.querySelector("input").focus();
  },
  data: function () {
    return {
      label: "",
      name: this.createNewRandomID(),
      type: "String",
      inProgress: false,
      message: null,
      messagetitle: null
    }
  },
  computed: {
    notready: function () {
      return !(this.label.trim().length > 0 && this.name.trim().length > 0 && this.type.length > 0);
    }
  },
  methods: {
    createNewRandomID: function () {
      return Math.random().toString(12).slice(2);
    },
    create: function (event) {
      event.preventDefault();
      if (this.notready) return;
      this.message = null;
      this.messagetitle = "Creating item...";
      this.inProgress = true;
      const data = { label: this.label, name: this.name, type: this.type };
      setTimeout(() => {
        fetchMethodWithTimeout(store.host + "/rest/items/" + data.name, "PUT", JSON.stringify(data))
          .then(r => {
            this.message = "Item '" + data.label + "' created";
            this.label = "";
            this.name = this.createNewRandomID();
          }).catch(e => {
            this.message = e.toString();
          })
      }, 500);
    }
  }
}

export const mixins = [Mixin];

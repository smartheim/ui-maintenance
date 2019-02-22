import { store, fetchMethodWithTimeout, OhDataBind } from '../app.js';
const Mixin = {
  mounted: function () {
    this.$el.querySelector("input").focus();
    this.itemsBind = new OhDataBind("listadapter/items", (status) => { }, (items) => this.items = items);
    this.createNewRandomID();
  },
  data: function () {
    return {
      items: [],
      selectedItems: [],
      label: "",
      description: "",
      uid: "",
      inProgress: false,
      message: null,
      messagetitle: null
    }
  },
  computed: {
    notready: function () {
      return !(this.label.trim().length > 0 && this.uid.trim().length > 0 && this.selectedItems.length > 0);
    }
  },
  methods: {
    createNewRandomID: function () {
      var text = "";
      var possible = "abcdefghijklmnopqrstuvwxyz0123456789";
      for (var j = 0; j < 4; j++) {
        for (var i = 0; i < 4; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
        text += "-";
      }
      for (var i = 0; i < 4; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
      this.uid = text;
    },
    create: function (event) {
      event.preventDefault();
      if (this.notready) return;
      this.message = null;
      this.messagetitle = "Creating Scene...";
      this.inProgress = true;
      let newRule = {
        "uid": this.uid,
        "name": this.label,
        "tags": [
          "scene"
        ],
        "description": this.description,
        "triggers": [],
        "conditions": [],
        "actions": this.selectedItems.split(",").map(selectedItem => {
          let item = this.items.find(item => item.name == selectedItem);
          if (!item) {
            console.warn("Did not find selected item");
            throw new Error("Did not find selected item");
          }
          return {
            "id": "ItemPostCommandAction" + item.name,
            "type": "core.ItemCommandAction",
            "configuration": {
              "itemName": item.name,
              "command": item.state
            }
          }
        })
      };

      setTimeout(() => {
        fetchMethodWithTimeout(store.host + "/rest/rules", "POST", JSON.stringify(newRule))
          .then(r => {
            this.message = "Scene '" + this.label + "' created";
            this.label = "";
            this.selectedItems = "";
            this.createNewRandomID();
          }).catch(e => {
            this.message = e.toString();
          })
      }, 500);
    }
  }
}

export const mixins = [Mixin];

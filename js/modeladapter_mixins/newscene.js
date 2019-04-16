import { store, fetchMethodWithTimeout } from '../app.js';

/**
 * Firefox is the last evergreen browser that does not support dynamic import yet.
 * It will with Firefox 67 (May 2019). Please remove this polyfill after
 * the release.
 */
async function importModule(url) {
  const vector = "import" + url.replace(/\./g, "").replace(/\//g, "_");
  if (document.getElementById("id_" + vector)) {
    return window[vector];
  }

  const loader = `
  import * as m from "${url}";
  window["${vector}"] = m;
  document.getElementById("id_${vector}").dispatchEvent(new CustomEvent("loaded",{detail:m}))
  `; // export Module

  const script = document.createElement("script");
  script.type = "module";
  script.id = "id_" + vector;
  script.async = 'async';
  script.textContent = loader;

  const promise = new Promise((resolve, reject) => {
    script.onerror = (e) => {
      console.warn(`Failed to import: ${url}`, e);
      reject(new Error(`Failed to import: ${url}`));
    };
    script.addEventListener("loaded", (event) => {
      resolve(event.detail);
    }, { passive: true });
    document.head.appendChild(script);
  });
  window[vector] = promise;
  return promise;
}

const ConnectionStatus = {
  CONNECTED: 0,
  PENDING: 1,
  ERROR: 2,
  NOTCONNECTED: 3,
};

/**
 * This is a data-bind for one of the list adapters.
 * 
 * Usage:
 * `new OhDataBind("modeladapter_lists/items", (status) => { }, (items) => this.items = items);`
 * 
 * @param adapter The adapter name, used to load the correct adapter file. E.g. "modeladapter_lists/items" etc.
 * @param connectionCb A callback function with one argument, the connection state: ConnectionStatus
 * @param dataCb A callback function for the initial data and all changed data.
 */
class OhDataBind {
  constructor(adapter, connectionCb, dataCb) {
    this.connectionCb = connectionCb;
    this.dataCb = dataCb;

    this.connectedBound = (e) => this.connected(e.detail);
    this.connectingBound = (e) => this.connecting(e.detail);
    this.disconnectedBound = (e) => this.disconnected(e.detail);
    this.listChangedBound = (e) => this.listChanged(e.detail);

    importModule('./js/' + adapter + '.js')
      .then(this.startList.bind(this)).catch(e => {
        console.warn("list bind failed", e);
      });
  }
  dispose() {
    store.removeEventListener("connectionEstablished", this.connectedBound, { passive: true });
    store.removeEventListener("connecting", this.connectingBound, { passive: true });
    store.removeEventListener("connectionLost", this.disconnectedBound, { passive: true });
    store.removeEventListener("storeChanged", this.listChangedBound, { passive: true });
    if (!this.modeladapter) {
      this.modeladapter.dispose();
      delete this.modeladapter;
    }
  }
  async startList(module) {
    if (this.modeladapter) this.modeladapter.dispose();
    this.modeladapter = new module.ModelAdapter();
    store.addEventListener("connectionEstablished", this.connectedBound, { passive: true });
    store.addEventListener("connecting", this.connectingBound, { passive: true });
    store.addEventListener("connectionLost", this.disconnectedBound, { passive: true });
    store.addEventListener("storeChanged", this.listChangedBound, { passive: true });

    if (store.connected) this.connected(); else this.disconnected();
  }

  async connected() {
    this.connectionCb(ConnectionStatus.CONNECTED);
    let list = await this.modeladapter.getall();
    this.dataCb(list);
  }

  connecting() {
    this.connectionCb(ConnectionStatus.PENDING);
  }
  disconnected() {
    this.connectionCb(ConnectionStatus.NOTCONNECTED);
  }

  listChanged(e) {
    let adapterField = this.modeladapter.stores()[e.storename];
    if (!adapterField) return;
    this.dataCb(e.value);
  }
}

const Mixin = {
  mounted: function () {
    this.$el.querySelector("input").focus();
    this.itemsBind = new OhDataBind("modeladapter_lists/items", (status) => { }, (items) => this.items = items);
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
      let text = "";
      const possible = "abcdefghijklmnopqrstuvwxyz0123456789";
      for (let j = 0; j < 4; j++) {
        for (let i = 0; i < 4; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
        text += "-";
      }
      for (let i = 0; i < 4; i++) text += possible.charAt(Math.floor(Math.random() * possible.length));
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
          });
      }, 500);
    }
  }
};

const mixins = [Mixin];

export { mixins };

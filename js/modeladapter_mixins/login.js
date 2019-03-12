import { store, createNotification } from '../app.js'; // Pre-bundled, external reference

const Mixin = {
  created: function () {
    this.dumpBound = (e) => this.dumpProgressChanged(e);
    this.connectionLostBound = (e) => this.connectionLost(e);
    this.connectionEstablishedBound = (e) => this.connectionEstablished(e);
  },
  mounted: function () {
    store.addEventListener("dump", this.dumpBound, { passive: true });
    store.addEventListener("connectionLost", this.connectionLostBound, { passive: true });
    store.addEventListener("connectionEstablished", this.connectionEstablishedBound, { passive: true });
  },
  beforeDestroy: function () {
    store.removeEventListener("dump", this.dumpBound, { passive: true });
    store.removeEventListener("connectionLost", this.connectionLostBound, { passive: true });
    store.removeEventListener("connectionEstablished", this.connectionEstablishedBound, { passive: true });
  },
  data: function () {
    return {
      credentialsRequired: false,
      crossorigin: false,
      connected: store.connected,
      connectionStatus: store.connectionErrorMessage,
      host: store.host,
      connecting: false,
      notconnectedpulse: false,
      dumpProgress: 0,
      dumpInProgress: false,
      dumpError: null,
    }
  },
  computed: {
    notconnected: function () {
      return !this.connected;
    },
    hostedapp: function () {
      return (window.location.host.includes("github"));
    }
  },
  methods: {
    connectionLost: function () {
      this.crossorigin = false;
      switch (store.connectErrorType) {
        case 404:
          break;
        case 4041:
          this.crossorigin = true;
          break;
      }
      this.host = store.host;
      this.connected = store.connected;
      this.connectionStatus = store.connectionErrorMessage;
      this.connecting = false;
      this.notconnectedpulse = true;
      setTimeout(() => {
        this.notconnectedpulse = false;
      }, 1000);
    },
    connectionEstablished: function () {
      this.crossorigin = false;
      this.host = store.host;
      this.connected = store.connected;
      this.connectionStatus = store.connectionErrorMessage;
      this.connecting = false;
    },
    submitted: function (event) {
      event.preventDefault();
      const host = new FormData(event.target).get("host");
      if (!host.startsWith("http://") && !host.startsWith("https://")) {
        createNotification("login", "Host must start with http(s)://!", false);
        return;
      }
      this.connecting = true;
      localStorage.setItem("host", host);
      store.reconnect(host).then(() => document.getElementById("home").click()).catch(() => { });
    },
    dumpProgressChanged(e) {
      console.log("NEW EVENT");
      this.dumpInProgress = e.detail.done == true ? false : true;
      this.dumpProgress = e.detail.progress;
      this.dumpError = e.detail.error;
    },
    dump() {
      if (this.dumpInProgress) return;
      this.dumpInProgress = true;
      store.dump().then(json => {
        this.dumpInProgress = false;
        const ourl = window.URL.createObjectURL(new Blob([JSON.stringify(json, null, 2)], { type: "application/json" }));
        const a = document.createElement('a');
        a.download = "demodata.json";
        a.href = ourl;
        a.textContent = "Download demodata.json";
        a.click();
        window.URL.revokeObjectURL(ourl);
        a.remove();
      }).catch(e => {
        this.dumpInProgress = false;
        console.warn(e);
        this.dumpError = e;
      });
    }
  }
}

export const mixins = [Mixin];

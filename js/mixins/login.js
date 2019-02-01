import { store } from '../app.js';

const Mixin = {
    created: function () {
        this.connectionLostBound = (e) => this.connectionLost(e);
        this.connectionEstablishedBound = (e) => this.connectionEstablished(e);
    },
    mounted: function () {
        store.addEventListener("connectionLost", this.connectionLostBound);
        store.addEventListener("connectionEstablished", this.connectionEstablishedBound);
    },
    beforeDestroy: function () {
        store.removeEventListener("connectionLost", this.connectionLostBound);
        store.removeEventListener("connectionEstablished", this.connectionEstablishedBound);
    },
    data: function () {
        return {
            credentialsRequired: false,
            crossorigin: false,
            connected: store.connected,
            connectionStatus: store.connectionErrorMessage,
            host: store.host,
            connecting: false,
            notconnectedpulse: false
        }
    },
    computed: {
        notconnected: function () {
            return !this.connected;
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
            this.connecting = true;
            localStorage.setItem("host", host);
            store.reconnect(host).then(() => {
                document.getElementById("home").dispatchEvent(new MouseEvent('click', { // programatically click home link now
                    view: window,
                    bubbles: true,
                    cancelable: true
                }));
            }).catch(() => { });
        },
        dump: function (event) {
            event.preventDefault();
            store.dump().then(json => {
                var ourl = window.URL.createObjectURL(new Blob([JSON.stringify(json)], { type: "application/json" }));
                var a = document.createElement('a');
                a.download = "demodata.json";
                a.href = ourl;
                a.textContent = "Download demodata.json";
                a.click();
                window.URL.revokeObjectURL(ourl);
                a.remove();
            });
        }
    }
}

export const mixins = [Mixin];

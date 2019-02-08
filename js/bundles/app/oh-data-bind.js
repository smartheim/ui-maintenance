import { store } from './app.js'; // Pre-bundled, external reference
import { importModule } from "./importModule";

export const ConnectionStatus = {
    CONNECTED: 0,
    PENDING: 1,
    ERROR: 2,
    NOTCONNECTED: 3,
};

/**
 * This is a data-bind for one of the list adapters.
 * 
 * Usage:
 * `new OhDataBind("items", (status) => { }, (items) => this.items = items);`
 * 
 * @param listadapter The listadapter name, used to load the correct adapter file
 * @param connectionCb A callback function with one argument, the connection state: ConnectionStatus
 * @param dataCb A callback function for the initial data and all changed data.
 */
class OhDataBind {
    constructor(listadapter, connectionCb, dataCb) {
        this.connectionCb = connectionCb;
        this.dataCb = dataCb;

        this.connectedBound = (e) => this.connected(e.detail);
        this.connectingBound = (e) => this.connecting(e.detail);
        this.disconnectedBound = (e) => this.disconnected(e.detail);
        this.listChangedBound = (e) => this.listChanged(e.detail);

        importModule('./js/listadapter/' + listadapter + '.js')
            .then(this.startList.bind(this)).catch(e => {
                console.warn("list bind failed", e);
            });
    }
    dispose() {
        store.removeEventListener("connectionEstablished", this.connectedBound, false);
        store.removeEventListener("connecting", this.connectingBound, false);
        store.removeEventListener("connectionLost", this.disconnectedBound, false);
        store.removeEventListener("storeChanged", this.listChangedBound, false);
        if (!this.modeladapter) {
            this.modeladapter.dispose();
            delete this.modeladapter;
        }
    }
    async startList(module) {
        if (this.modeladapter) this.modeladapter.dispose();
        this.modeladapter = new module.StoreView();
        store.addEventListener("connectionEstablished", this.connectedBound, false);
        store.addEventListener("connecting", this.connectingBound, false);
        store.addEventListener("connectionLost", this.disconnectedBound, false);
        store.addEventListener("storeChanged", this.listChangedBound, false);

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

export { OhDataBind };
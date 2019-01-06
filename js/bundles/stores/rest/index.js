import { createStore } from "./Store";
import { Resource } from "./Resource";
export class Vapi {
    constructor(options) {
        this.resource = new Resource(options);
        return this;
    }
    get(options) {
        return this.add(Object.assign(options, { method: "get" }));
    }
    delete(options) {
        return this.add(Object.assign(options, { method: "delete" }));
    }
    head(options) {
        return this.add(Object.assign(options, { method: "head" }));
    }
    options(options) {
        return this.add(Object.assign(options, { method: "options" }));
    }
    post(options) {
        return this.add(Object.assign(options, { method: "post" }));
    }
    put(options) {
        return this.add(Object.assign(options, { method: "put" }));
    }
    patch(options) {
        return this.add(Object.assign(options, { method: "patch" }));
    }
    add(options) {
        this.resource.add(options);
        return this;
    }
    getStore(options = {}) {
        return createStore(this.resource, options);
    }
}
export default Vapi;

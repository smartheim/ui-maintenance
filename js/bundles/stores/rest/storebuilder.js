/**
 * MIT licence
 * @author David Graeff
 */
const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj));

function performRequest(commit, requestFn, payload, method, propertyName) {
    var actionParams = { data: payload, params: { method: method } };
    commit(propertyName, actionParams); // Set state to pending
    return requestFn(actionParams.params, actionParams.data)
        .then(async (data) => {
            var payload = await data.json();
            console.log("received data");
            commit(`${propertyName}_${this.successSuffix}`, { payload, actionParams });
            return Promise.resolve(payload);
        }).catch(payload => {
            commit(`${propertyName}_${this.errorSuffix}`, { payload, actionParams });
        });
}

/**
 * A store builder for a Resource (with one or multiple endpoints/properties).
 * 
 * Creates all necesary mutations and actions.
 */
export class StoreBuilder {
    /**
     * Creates a store builder. Call build() to restore the VUEX store.
     * @param {Vapi} resource A Resource instance
     * @param {Object} options Options
     * @param {Boolean} options.createStateFn Use a state function instead of an initial state
     */
    constructor(resource, options) {
        this.updateSuffix = "update";
        this.successSuffix = "success";
        this.errorSuffix = "failed";
        this.pendingSuffix = "pending";
        this.resource = resource;
        this.options = Object.assign({ createStateFn: false }, options);
    }
    createStateFn() {
        return () => {
            const resourceState = cloneDeep(this.resource.state);
            const state = Object.assign({ pending: {}, error: {} }, resourceState);
            const properties = this.resource.properties;
            Object.keys(properties).forEach((propertyName) => {
                const property = properties[propertyName].property;
                // if state is undefined set default value to null
                if (state[property] === undefined) {
                    state[property] = null;
                }
                state["pending"][property] = false;
                state["error"][property] = null;
            });
            return state;
        };
    }
    createMutations(defaultState) {
        const mutations = {};
        const properties = this.resource.properties;
        Object.keys(properties).forEach((action) => {
            const { property, commitString, beforeRequest, onSuccess, onError } = properties[action];
            if (!property) throw new Error("Property MUST be defined!");

            // Add a mutation "_{propertyname}_pending". That will set pending to true, error to null.
            mutations[`${commitString}_${this.pendingSuffix}`] = (state, actionParams) => {
                state.pending[property] = true;
                state.error[property] = null;
                if (beforeRequest) {
                    beforeRequest(state, actionParams);
                }
            };
            // Add a mutation "_{propertyname}_update".
            // That will update the entire state[property] with payload or update
            // a single element state[propery][id]. This only happens if `actionParams` contains a key/value
            // with a key that is the same than configured with "collectionIdentifier".
            mutations[`${commitString}_${this.updateSuffix}`] = (state, { payload, actionParams }) => {
                if (onSuccess) {
                    onSuccess(state, payload, actionParams);
                    return;
                }
                state[property] = payload;
            };
            mutations[`${commitString}_${this.successSuffix}`] = (state, { payload, actionParams }) => {
                state.pending[property] = false;
                state.error[property] = null;
                if (onSuccess) {
                    onSuccess(state, payload, actionParams);
                    return;
                }
                state[property] = payload;
            };
            mutations[`${commitString}_${this.errorSuffix}`] = (state, { payload, actionParams }) => {
                state.pending[property] = false;
                state.error[property] = payload;
                if (onError) {
                    onError(state, payload, actionParams);
                    return;
                }
                // sets property to it's default value in case of an error
                state[property] = defaultState[property];
            };
        });
        return mutations;
    }
    createActions() {
        const storeActions = {};
        const properties = this.resource.properties;
        Object.keys(properties).forEach((propertyName) => {
            const { requestFn, collectionIdentifier } = properties[propertyName];
            /**
             * Create actions for "get{propertyname}", "put{propertyname}", "post{propertyname}", "update{propertyname}" 
             */
            storeActions["get" + propertyName] =
                ({ commit }) => performRequest(commit, requestFn, null, "GET", propertyName);
            storeActions["post" + propertyName] =
                ({ commit }, payload = {}) => performRequest(commit, requestFn, payload, "POST", propertyName);
            storeActions["put" + propertyName] =
                ({ commit }, payload = {}) => performRequest(commit, requestFn, payload, "PUT", propertyName);
            storeActions["update" + propertyName] =
                ({ commit }, payload = {}) => commit(`${propertyName}_${this.updateSuffix}`, { payload });

            if (!collectionIdentifier) return;
            /**
             * Create actions for "get{propertyname}Item", "put{propertyname}Item", "post{propertyname}Item", "update{propertyname}Item" 
             */
            storeActions["get" + propertyName+"Item"] =
                ({ commit }) => performRequest(commit, requestFn, null, "GET", propertyName);
            storeActions["post" + propertyName+"Item"] =
                ({ commit }, payload = {}) => performRequest(commit, requestFn, payload, "POST", propertyName);
            storeActions["put" + propertyName+"Item"] =
                ({ commit }, payload = {}) => performRequest(commit, requestFn, payload, "PUT", propertyName);
            storeActions["update" + propertyName+"Item"] =
                ({ commit }, payload = {}) => commit(`${propertyName}_${this.updateSuffix}`, { payload, actionParams });

        });
        return storeActions;
    }
    build(options={}) {
        return {
            state: this.options.createStateFn ? this.createStateFn() : this.createStateFn()(),
            mutations: this.createMutations(state),
            actions: this.createActions(),
            ...options
        };
    }
}

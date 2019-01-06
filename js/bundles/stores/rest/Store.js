const cloneDeep = (obj) => JSON.parse(JSON.stringify(obj));

class StoreCreator {
    constructor(resource, options) {
        this.successSuffix = "SUCCEEDED";
        this.errorSuffix = "FAILED";
        this.resource = resource;
        this.options = Object.assign({
            createStateFn: false
        }, options);
        this.store = this.createStore();
    }
    createState() {
        if (this.options.createStateFn) {
            return this.createStateFn();
        }
        else {
            return this.createStateObject();
        }
    }
    createStateObject() {
        const resourceState = cloneDeep(this.resource.state);
        const state = Object.assign({
            pending: {},
            error: {}
        }, resourceState);
        const actions = this.resource.actions;
        Object.keys(actions).forEach((action) => {
            const property = actions[action].property;
            // don't do anything if no property is set
            if (property === null) {
                return;
            }
            // if state is undefined set default value to null
            if (state[property] === undefined) {
                state[property] = null;
            }
            state["pending"][property] = false;
            state["error"][property] = null;
        });
        return state;
    }
    createStateFn() {
        return () => {
            const resourceState = cloneDeep(this.resource.state);
            const state = Object.assign({
                pending: {},
                error: {}
            }, resourceState);
            const actions = this.resource.actions;
            Object.keys(actions).forEach((action) => {
                const property = actions[action].property;
                // don't do anything if no property is set
                if (property === null) {
                    return;
                }
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
    createGetter() {
        return {};
    }
    createMutations(defaultState) {
        const mutations = {};
        const actions = this.resource.actions;
        Object.keys(actions).forEach((action) => {
            const { property, commitString, beforeRequest, onSuccess, onError } = actions[action];
            mutations[`${commitString}`] = (state, actionParams) => {
                if (property !== null) {
                    state.pending[property] = true;
                    state.error[property] = null;
                }
                if (beforeRequest) {
                    beforeRequest(state, actionParams);
                }
            };
            mutations[`${commitString}_${this.successSuffix}`] = (state, { payload, actionParams }) => {
                if (property !== null) {
                    state.pending[property] = false;
                    state.error[property] = null;
                }
                if (onSuccess) {
                    onSuccess(state, payload, actionParams);
                }
                else if (property !== null) {
                    state[property] = payload;
                }
            };
            mutations[`${commitString}_${this.errorSuffix}`] = (state, { payload, actionParams }) => {
                if (property !== null) {
                    state.pending[property] = false;
                    state.error[property] = payload;
                }
                if (onError) {
                    onError(state, payload, actionParams);
                }
                else if (property !== null) {
                    // sets property to it's default value in case of an error
                    state[property] = defaultState[property];
                }
            };
        });
        return mutations;
    }
    createActions() {
        const storeActions = {};
        const actions = this.resource.actions;
        Object.keys(actions).forEach((action) => {
            const { dispatchString, commitString, requestFn } = actions[action];
            storeActions[dispatchString] = async ({ commit }, actionParams = { params: {}, data: {} }) => {
                if (!actionParams.params)
                    actionParams.params = {};
                if (!actionParams.data)
                    actionParams.data = {};
                commit(commitString, actionParams);
                return requestFn(actionParams.params, actionParams.data)
                    .then(async (data) => {
                    var response = await data.json();
                    console.log("received data");
                    commit(`${commitString}_${this.successSuffix}`, {
                        payload: response, actionParams
                    });
                    return Promise.resolve(response);
                }).catch(error => {
                    commit(`${commitString}_${this.errorSuffix}`, {
                        payload: error, actionParams
                    });
                    // return Promise.reject(error);
                });
            };
        });
        return storeActions;
    }
    createStore() {
        const state = this.createState();
        return {
            state,
            mutations: this.createMutations(state),
            actions: this.createActions()
        };
    }
}
export function createStore(resource, options) {
    return new StoreCreator(resource, options).store;
}

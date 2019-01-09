/**
 * MIT licence
 * @author David Graeff
 */

 /**
  * Builds a query string for a URL
  * @param {Array} queryParams 
  */
function addQuery(queryParams) {
    if (queryParams && params.length > 0) {
        var queryString = "?";
        for (var p of params) queryString += p + "&";
        return queryString;
    }
    return "";
}

/**
 * A Vapi object represents a connection to a REST capable server.
 * You add REST endpoints to it via add() or any of the convienience methods
 * like get(). Those methods are chainable.
 * 
 * Example:
 * ```
 * const demo = new RestServer({...}).addResource({
 *   collectionIdentifier: "id",
 *   property: "Posts",
 *   // Can be a string or a function
 *   path: ({ id }) => id ? `/posts/${id}` : "/posts"
 * })
 * ```
 * 
 * You the retrieve the store for adding it to your Vuex instance:
 * `demo.getStore({namespaced:true})`
 * 
 * Use the store with auto generated actions:
 * - `store.dispatch('getPosts');`: Retrieve data and update the internal state.
 * - `store.dispatch('putPosts', {...});` Push via "put" the given data and update the internal state with the response.
 * - `store.dispatch('postPosts', {...});` Push via "post" the given data and update the internal state with the response.
 * - `store.dispatch('updatePosts', {...});` Updates the internal state without any http request.
 * 
 * If you have set `collectionIdentifier`, additional actions are generated:
 * - `store.dispatch('getPostsItem');`: Retrieve a single entry of the collection and update only that item in the internal state.
 * - `store.dispatch('putPostsItem', {...});` Push via "put" the given data and update only that item in the internal state with the response.
 * - `store.dispatch('postPostsItem', {...});` Push via "post" the given data and update only that item in the internal state with the response.
 * - `store.dispatch('updatePostsItem', {...});` Updates the internal state of a single item of the collection without any http request.
 * 
 */
export class RestServer {
    /**
     * Constructs a new Vapi Resource.
     * @param {Object} options The options
     * @param {String} options.baseURL A http method
     * @param {String} options.cacheName A localstore cache name. A prefix of "store_" will always be added.
     * @param {String} options.pathSuffix An optional path suffix appended to each URL like ".js".
     * @param {Object} options.state An initial state. Will be overwritten by a cached one, if cacheName is set.
     * @param {Array} options.queryParams Query parameters
     */
    constructor(options) {
        this.properties = {};
        this.baseURL = options.baseURL || "";
        this.pathSuffix = options.pathSuffix || "";
        this.cacheName = options.cacheName || null;
        this.state = options.state || {};
        this.queryParams = options.queryParams || false;

        // Try to retrieve cached state now
        if (this.cacheName) {
            const v = localStorage.getItem("store_" + this.cacheName);
            if (v) this.state = JSON.parse(v);
        }
    }
    /**
     * Overwrites the base URL, that was set in the constructor
     * @param {String} baseURL The URL 
     * @param {String} pathSuffix An optional path suffix like ".js" appended to each resource URL.
     */
    setBaseURL(baseURL, pathSuffix) {
        this.baseURL = baseURL;
        this.pathSuffix = pathSuffix;
    }
    /**
     * Add a new property
     * 
     * @param {Object} options The options
     * @param {Object} options.requestConfig The requestConfig
     * @param {String} options.headers http headers
     * @param {String} options.property The property name
     * @param {String|Function} options.path The uri relative path, starting with "/" or a function.
     * @param {String} options.collectionIdentifier If this resource represents a collection, set this to the unique identifer key.
     *    Additional actions will be generated for retrieving and updating a single position of the collection.
     */
    addResource(options) {
        if (!options.property) throw new Error(`Property MUST be set for ${this.baseURL}!`);

        options.requestConfig = options.requestConfig || {};
        var headersFn = null;
        if (options.headers) {
            if (typeof options.headers === "function") {
                const headersFunction = options.headers;
                headersFn = (params) => headersFunction(params);
            }
            else {
                headersFn = () => options.headers;
            }
        }

        let urlFn;
        if (typeof options.path === "function") {
            const pathFn = options.path;
            urlFn = (params) => this.baseURL + pathFn(params) + this.pathSuffix;
        }
        else {
            urlFn = () => this.baseURL + options.path + this.pathSuffix;
        }
        this.properties[options.property] = {
            requestFn: (params = { method: "GET" }, data = {}) => {
                const requestConfig = Object.assign({}, options.requestConfig);
                if (headersFn) {
                    if (requestConfig["headers"]) {
                        Object.assign(requestConfig["headers"], headersFn(params));
                    }
                    else {
                        requestConfig["headers"] = headersFn(params);
                    }
                }
                requestConfig.method = params.method;
                if (["POST", "PUT", "PATCH"].includes(requestConfig.method)) {
                    return fetch(urlFn(params) + addQuery(options, options.queryParams || this.queryParams), data, requestConfig).then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok.');
                        }
                        return response;
                    })
                }
                else {
                    return fetch(urlFn(params) + addQuery(options, params || this.queryParams), requestConfig).then(response => {
                        if (!response.ok) {
                            throw new Error('Network response was not ok.');
                        }
                        return response;
                    })
                }
            },
            property: options.property,
            beforeRequest: options.beforeRequest,
            onSuccess: options.onSuccess,
            onError: options.onError
        };
        return this;
    }
}

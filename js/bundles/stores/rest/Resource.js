export class Resource {
    constructor(options) {
        this.HTTPMethod = ["get", "delete", "head", "options", "post", "put", "patch"];
        this.actions = {};
        this.baseURL = (options.baseURL) ? options.baseURL : "";
        this.actions = {};
        this.state = options.state || {};
        this.queryParams = options.queryParams || false;
    }
    addQuery(options, params) {
        let queryParams = (options.queryParams !== undefined) ? options.queryParams : this.queryParams;
        if (queryParams && params.length>0) {
            var queryString = "?";
            for (var p of params) queryString+=p+"&";
            return queryString;
        }
        return "";
    }
    add(options) {
        options.method = options.method || "get";
        options.requestConfig = options.requestConfig || {};
        options.property = options.property || null;
        const headersFn = this.getHeadersFn(options);
        if (this.HTTPMethod.indexOf(options.method) === -1) {
            const methods = this.HTTPMethod.join(", ");
            throw new Error(`Illegal HTTP method set. Following methods are allowed: ${methods}. You chose "${options.method}".`);
        }
        let urlFn;
        if (typeof options.path === "function") {
            const pathFn = options.path;
            urlFn = (params) => this.baseURL + pathFn(params);
        }
        else {
            urlFn = () => this.baseURL + options.path;
        }
        this.actions[options.action] = {
            requestFn: (params = {}, data = {}) => {
                const requestConfig = Object.assign({}, options.requestConfig);
                if (headersFn) {
                    if (requestConfig["headers"]) {
                        Object.assign(requestConfig["headers"], headersFn(params));
                    }
                    else {
                        requestConfig["headers"] = headersFn(params);
                    }
                }
                if (["post", "put", "patch"].includes(options.method)) {
                    return fetch(urlFn(params)+this.addQuery(options, params), data, requestConfig).then(response => {
                        if (!response.ok) {
                          throw new Error('Network response was not ok.');
                        }
                        return response;
                      })
                }
                else {
                    return fetch(urlFn(params)+this.addQuery(options, params), requestConfig).then(response => {
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
            onError: options.onError,
            dispatchString: this.getDispatchString(options.action),
            commitString: this.getCommitString(options.action),
        };
        return this;
    }
    getHeadersFn(options) {
        if (options.headers) {
            if (typeof options.headers === "function") {
                const headersFunction = options.headers;
                return (params) => headersFunction(params);
            }
            else {
                return () => options.headers;
            }
        }
        return null;
    }
    get normalizedBaseURL() {
        return this.baseURL || "";
    }
    getDispatchString(action) {
        return action;
    }
    getCommitString(action) {
        const capitalizedAction = action.replace(/([A-Z])/g, "_$1").toUpperCase();
        return capitalizedAction;
    }
}
export default Resource;

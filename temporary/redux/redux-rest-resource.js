/* global fetch */

const defaultActions = {
  create: {method: 'POST'},
  fetch: {method: 'GET', isArray: true},
  get: {method: 'GET'},
  update: {method: 'PATCH'},
  updateMany: {method: 'PATCH', isArray: true, alias: 'update'},
  delete: {method: 'DELETE'},
  deleteMany: {method: 'DELETE', isArray: true, alias: 'delete'}
};

const defaultHeaders = {
  Accept: 'application/json',
  'Content-Type': 'application/json'
};

const defaultIdKeys = {
  singular: 'id',
  plural: 'ids'
};

const defaultState = {
  create: {
    isCreating: false
  },
  fetch: {
    items: [],
    isFetching: false,
    lastUpdated: 0,
    didInvalidate: true
  },
  get: {
    item: null,
    isFetchingItem: false,
    lastUpdatedItem: 0,
    didInvalidateItem: true
  },
  update: {
    isUpdating: false
  },
  delete: {
    isDeleting: false
  }
};

const initialState = Object.keys(defaultState).reduce((soFar, key) => ({...soFar, ...defaultState[key]}), {});

const defaultGlobals = {
  Promise,
  fetch
};

const includes = (array, key) => array.indexOf(key) !== -1;

const isString = maybeString => typeof maybeString === 'string';

const isObject = maybeObject => typeof maybeObject === 'object';

const isFunction = maybeFunction => typeof maybeFunction === 'function';

const pick = (obj, ...keys) =>
  keys.reduce((soFar, key) => {
    if (includes(keys, key) && obj[key] !== undefined) {
      soFar[key] = obj[key]; // eslint-disable-line no-param-reassign
    }
    return soFar;
  }, {});

const find = (collection, query) => {
  const queryKeys = Object.keys(query);
  let foundItem;
  collection.some(item => {
    const doesMatch = !queryKeys.some(key => item[key] !== query[key]);
    if (doesMatch) {
      foundItem = item;
    }
    return doesMatch;
  });
  return foundItem;
};

const mapObject = (object, func) =>
  Object.keys(object).reduce((soFar, key) => {
    soFar[key] = func(object[key]); // eslint-disable-line no-param-reassign
    return soFar;
  }, {});

const mergeObjects = (object, ...sources) => {
  const {concat} = Array.prototype;
  const uniqueKeys = concat
    .apply(Object.keys(object), sources.map(Object.keys))
    .filter((value, index, self) => self.indexOf(value) === index);
  return uniqueKeys.reduce((soFar, key) => {
    soFar[key] = Object.assign(soFar[key] || {}, ...sources.map(source => source[key] || {})); // eslint-disable-line no-param-reassign
    return soFar;
  }, object);
};

const startsWith = (string, target) => String(string).slice(0, target.length) === target;

const endsWith = (string, target) => String(string).slice(string.length - target.length) === target;

const ucfirst = str => str.charAt(0).toUpperCase() + str.substr(1);

const upperSnakeCase = string =>
  String(
    string.split('').reduce((soFar, letter, index) => {
      const charCode = letter.charCodeAt(0);
      return soFar + (index && charCode < 97 ? `_${letter}` : letter).toUpperCase();
    }, '')
  );

const getGerundName = name => `${name.replace(/e$/, '')}ing`;

const getPluralName = (name = '') => (name.endsWith('s') ? name : `${name}s`);

const parseContentRangeHeader = string => {
  if (typeof string === 'string') {
    const matches = string.match(/^(\w+) (\d+)-(\d+)\/(\d+|\*)/);

    if (matches) {
      return {
        unit: matches[1],
        first: +matches[2],
        last: +matches[3],
        length: matches[4] === '*' ? null : +matches[4]
      };
    }
  }
  return null;
};

const getIdKey = (action, {multi = false}) => (multi ? defaultIdKeys.plural : defaultIdKeys.singular);

const scopeType = (type, scope) => (scope ? `${scope}/${type}` : type);

const scopeTypes = (types = {}, scope) => (scope ? mapObject(types, type => scopeType(type, scope)) : types);

const getTypesScope = resourceName => (resourceName ? `@@resource/${upperSnakeCase(resourceName)}` : '');

const getActionTypeKey = (
  actionId,
  {resourceName, resourcePluralName = getPluralName(resourceName), isArray = false} = {}
) =>
  resourceName
    ? `${actionId.toUpperCase()}_${upperSnakeCase(isArray ? resourcePluralName : resourceName)}`
    : upperSnakeCase(actionId);

const getActionType = actionId => upperSnakeCase(actionId);

const createType = (actionId, {resourceName, resourcePluralName, isArray = false, alias}) => {
  const typeKey = getActionTypeKey(resourceName ? alias || actionId : actionId, {
    resourceName,
    resourcePluralName,
    isArray
  });
  return {
    [typeKey]: getActionType(actionId)
  };
};

const createTypes = (actions = {}, {resourceName, resourcePluralName, scope = getTypesScope(resourceName)} = {}) => {
  const rawTypes = Object.keys(actions).reduce((types, actionId) => {
    const actionOpts = actions[actionId];
    return Object.assign(
      types,
      createType(actionId, {
        resourceName,
        resourcePluralName,
        isArray: actionOpts.isArray,
        alias: actionOpts.alias
      })
    );
  }, {});
  return scopeTypes(rawTypes, scope);
};

const buildTransformPipeline = (initial, transform) => {
  let transformResponsePipeline;
  if (transform) {
    transformResponsePipeline = Array.isArray(transform) ? transform : [...initial, transform];
  } else {
    transformResponsePipeline = [...initial];
  }
  return transformResponsePipeline;
};
const applyTransformPipeline = pipeline =>
  // eslint-disable-line arrow-body-style
  initial => pipeline.reduce((soFar, fn) => soFar.then(fn), defaultGlobals.Promise.resolve(initial));

// https://github.com/angular/angular.js/blob/master/src/ngResource/resource.js#L473

const PROTOCOL_AND_DOMAIN_REGEX = /^https?:\/\/[^/]*/;
const NUMBER_REGEX = /^[0-9]+$/;

/**
 * This method is intended for encoding *key* or *value* parts of query component. We need a
 * custom method because encodeURIComponent is too aggressive and encodes stuff that doesn't
 * have to be encoded per http://tools.ietf.org/html/rfc3986
 */
const encodeUriQuery = (val, pctEncodeSpaces) =>
  encodeURIComponent(val)
    .replace(/%40/gi, '@')
    .replace(/%3A/gi, ':')
    .replace(/%24/g, '$')
    .replace(/%2C/gi, ',')
    .replace(/%20/g, pctEncodeSpaces ? '%20' : '+');

/**
 * We need our custom method because encodeURIComponent is too aggressive and doesn't follow
 * http://www.ietf.org/rfc/rfc3986.txt with regards to the character set
 * (pchar) allowed in path segments
 */
const encodeUriSegment = val =>
  encodeUriQuery(val, true)
    .replace(/%26/gi, '&')
    .replace(/%3D/gi, '=')
    .replace(/%2B/gi, '+');

const parseUrlParams = url =>
  url.split(/\W/).reduce((urlParams, param) => {
    if (!NUMBER_REGEX.test(param) && param && new RegExp(`(^|[^\\\\]):${param}(\\W|$)`).test(url)) {
      urlParams[param] = {
        // eslint-disable-line no-param-reassign
        isQueryParamValue: new RegExp(`\\?.*=:${param}(?:\\W|$)`).test(url)
      };
    }
    return urlParams;
  }, {});

const replaceUrlParamFromUrl = (url, urlParam, replace = '') =>
  url.replace(
    new RegExp(`(/?):${urlParam}(\\W|$)`, 'g'),
    (match, leadingSlashes, tail) => (replace || tail.charAt(0) === '/' ? leadingSlashes : '') + replace + tail
  );

const replaceQueryStringParamFromUrl = (url, key, value) => {
  const re = new RegExp(`([?&])${key}=.*?(&|$)`, 'i');
  const sep = url.indexOf('?') !== -1 ? '&' : '?';
  return url.match(re) ? url.replace(re, `$1${key}=${value}$2`) : `${url}${sep}${key}=${value}`;
};

const splitUrlByProtocolAndDomain = url => {
  let protocolAndDomain;
  const remainderUrl = url.replace(PROTOCOL_AND_DOMAIN_REGEX, match => {
    protocolAndDomain = match;
    return '';
  });
  return [protocolAndDomain, remainderUrl];
};

class HttpError extends Error {
  constructor(statusCode = 500, {body, message = 'HttpError'}) {
    super(message);
    this.name = this.constructor.name;
    this.message = message;
    if (typeof Error.captureStackTrace === 'function') {
      Error.captureStackTrace(this, this.constructor);
    } else {
      this.stack = new Error(message).stack;
    }
    // Http
    this.statusCode = statusCode;
    this.status = statusCode;
    this.body = body;
  }
}

const buildFetchUrl = (context, {url, urlParams, stripTrailingSlashes = true}) => {
  const [protocolAndDomain = '', remainderUrl] = splitUrlByProtocolAndDomain(url);
  // Replace urlParams with values from context
  let builtUrl = Object.keys(urlParams).reduce((wipUrl, urlParam) => {
    const urlParamInfo = urlParams[urlParam];
    const contextAsObject = !isObject(context)
      ? {
          [defaultIdKeys.singular]: context
        }
      : context;
    const value = contextAsObject[urlParam] || ''; // self.defaults[urlParam];
    if (value) {
      const encodedValue = urlParamInfo.isQueryParamValue ? encodeUriQuery(value, true) : encodeUriSegment(value);
      return replaceUrlParamFromUrl(wipUrl, urlParam, encodedValue);
    }
    return replaceUrlParamFromUrl(wipUrl, urlParam);
  }, remainderUrl);
  // Strip trailing slashes and set the url (unless this behavior is specifically disabled)
  if (stripTrailingSlashes) {
    builtUrl = builtUrl.replace(/\/+$/, '') || '/';
  }
  return protocolAndDomain + builtUrl;
};

const buildFetchOpts = (context, {method, headers, credentials, query, body}) => {
  const opts = {
    headers: defaultHeaders
  };
  if (method) {
    opts.method = method;
  }
  if (headers) {
    opts.headers = {
      ...opts.headers,
      ...headers
    };
  }
  if (credentials) {
    opts.credentials = credentials;
  }
  if (query) {
    opts.query = query;
  }
  const hasBody = /^(POST|PUT|PATCH)$/i.test(opts.method);
  if (body) {
    opts.body = isString(body) ? body : JSON.stringify(body);
  } else if (hasBody && context) {
    const contextAsObject = !isObject(context)
      ? {
          [defaultIdKeys.singular]: context
        }
      : context;
    opts.body = JSON.stringify(contextAsObject);
  }
  return opts;
};

const parseResponse = res => {
  const contentType = res.headers.get('Content-Type');
  // @NOTE parses 'application/problem+json; charset=utf-8' for example
  // see https://tools.ietf.org/html/rfc6839
  const isJson =
    contentType && (startsWith(contentType, 'application/json') || endsWith(contentType.split(';')[0], '+json'));
  return res[isJson ? 'json' : 'text']();
};

const fetch$1 = (url, options = {}) => {
  // Support options.query
  const builtUrl = Object.keys(options.query || []).reduce((wipUrl, queryParam) => {
    const queryParamValue = isString(options.query[queryParam])
      ? options.query[queryParam]
      : JSON.stringify(options.query[queryParam]);
    return replaceQueryStringParamFromUrl(wipUrl, queryParam, queryParamValue);
  }, url);
  return (options.Promise || defaultGlobals.Promise)
    .resolve((defaultGlobals.fetch || fetch$1)(builtUrl, options))
    .then(res => {
      if (!res.ok) {
        return parseResponse(res).then(body => {
          throw new HttpError(res.status, {
            body
          });
        });
      }
      return res;
    });
};

const defaultTransformResponsePipeline = [
  res =>
    parseResponse(res).then(body => {
      const transformedResponse = {body, code: res.status};
      // Add support for Content-Range parsing when a partial http code is used
      const isPartialContent = res.status === 206;
      if (isPartialContent) {
        transformedResponse.contentRange = parseContentRangeHeader(res.headers.get('Content-Range'));
      }
      return transformedResponse;
    })
];

// @inspiration https://github.com/angular/angular.js/blob/master/src/ngResource/resource.js

const SUPPORTED_FETCH_OPTS = ['url', 'method', 'headers', 'credentials', 'query', 'body'];
const SUPPORTED_REDUCE_OPTS = ['assignResponse', 'isArray', 'isPure'];

const getActionName = (
  actionId,
  {resourceName, resourcePluralName = getPluralName(resourceName), isArray = false, alias} = {}
) => (!resourceName ? actionId : `${alias || actionId}${ucfirst(isArray ? resourcePluralName : resourceName)}`);

const createAction = (
  actionId,
  {resourceName, resourcePluralName = getPluralName(resourceName), scope, stripTrailingSlashes = true, ...actionOpts}
) => {
  const type = scopeType(getActionType(actionId), scope);
  // Actual action function with two args
  // Context usage changes with resolved method:
  // - GET/DELETE will be used to resolve query params (eg. /users/:id)
  // - POST/PATCH will be used to resolve query params (eg. /users/:id) and as request body
  return (context, contextOpts = {}) => (dispatch, getState) => {
    // Prepare reduce options
    const reduceOpts = {
      ...pick(actionOpts, ...SUPPORTED_REDUCE_OPTS),
      ...pick(contextOpts, ...SUPPORTED_REDUCE_OPTS)
    };
    // Support pure actions
    if (actionOpts.isPure) {
      dispatch({
        type,
        status: 'resolved',
        options: reduceOpts,
        context
      });
      return Promise.resolve();
    }
    // First dispatch a pending action
    dispatch({
      type,
      status: 'pending',
      context
    });
    // Prepare fetch options
    const fetchOpts = {
      ...pick(actionOpts, ...SUPPORTED_FETCH_OPTS),
      ...pick(contextOpts, ...SUPPORTED_FETCH_OPTS)
    };
    // Support dynamic fetch options
    const resolvedfetchOpts = Object.keys(fetchOpts).reduce((soFar, key) => {
      soFar[key] = isFunction(fetchOpts[key])
        ? fetchOpts[key](getState, {
            context,
            contextOpts,
            actionId
          })
        : fetchOpts[key];
      return soFar;
    }, {});
    const {url, ...eligibleFetchOptions} = resolvedfetchOpts;
    // Build fetch url and options
    const urlParams = parseUrlParams(url);
    const finalFetchUrl = buildFetchUrl(context, {
      url,
      urlParams,
      isArray: reduceOpts.isArray,
      stripTrailingSlashes
    });
    const finalFetchOpts = buildFetchOpts(context, eligibleFetchOptions);
    return fetch$1(finalFetchUrl, finalFetchOpts)
      .then(
        applyTransformPipeline(buildTransformPipeline(defaultTransformResponsePipeline, actionOpts.transformResponse))
      )
      .then(payload =>
        dispatch({
          type,
          status: 'resolved',
          context,
          options: reduceOpts,
          receivedAt: Date.now(),
          ...payload
        })
      ) // eslint-disable-line
      .catch(err => {
        // Catch HttpErrors
        if (err.statusCode) {
          dispatch({
            type,
            status: 'rejected',
            code: err.status,
            body: err.body,
            context,
            options: reduceOpts,
            receivedAt: Date.now()
          });
          // Catch regular Errors
        } else {
          dispatch({
            type,
            status: 'rejected',
            code: null,
            body: err.message,
            context,
            options: reduceOpts,
            receivedAt: Date.now()
          });
        }
        throw err;
      });
  };
};

const createActions = (
  actions = {},
  {
    resourceName,
    resourcePluralName = getPluralName(resourceName),
    scope = getTypesScope(resourceName),
    ...globalOpts
  } = {}
) => {
  const actionKeys = Object.keys(actions);
  return actionKeys.reduce((actionFuncs, actionId) => {
    // Add support for relative url override
    const {url} = actions[actionId];

    if (globalOpts.url && url && isString(url) && url.substr(0, 1) === '.') {
      actions[actionId] = {
        ...actions[actionId],
        url: `${globalOpts.url}${url.substr(1)}`
      };
    }
    const actionOpts = {
      ...globalOpts,
      ...actions[actionId]
    };
    const actionName = getActionName(actionId, {
      resourceName,
      resourcePluralName,
      isArray: actionOpts.isArray,
      alias: actionOpts.alias
    });
    actionFuncs[actionName] = createAction(actionId, {
      resourceName,
      resourcePluralName,
      scope,
      ...actionOpts
    });
    return actionFuncs;
  }, {});
};

const getUpdateArrayData = (action, itemId) => {
  const actionOpts = action.options || {};
  const idKey = getIdKey(action, {multi: false});

  return actionOpts.assignResponse
    ? find(action.body, {
        [idKey]: itemId
      })
    : Object.keys(action.context).reduce((soFar, key) => {
        if (key !== 'ids') {
          soFar[key] = action.context[key];
        }
        return soFar;
      }, {});
};

const defaultReducers = {
  create: (state, action) => {
    switch (action.status) {
      case 'pending':
        // Add object to store as soon as possible?
        return {
          ...state,
          isCreating: true
          // items: [{
          //   id: state.items.reduce((maxId, obj) => Math.max(obj.id, maxId), -1) + 1,
          //   ...action.context
          // }, ...state.items]
        };
      case 'resolved':
        // Assign returned object
        return {
          ...state,
          isCreating: false,
          items: [...(state.items || []), action.body]
        };
      case 'rejected':
        return {
          ...state,
          isCreating: false
        };
      default:
        return state;
    }
  },
  fetch: (state, action) => {
    switch (action.status) {
      case 'pending':
        return {
          ...state,
          isFetching: true,
          didInvalidate: false
        };
      case 'resolved': {
        const isPartialContent = action.code === 206;
        let items = [];
        if (isPartialContent && action.contentRange) {
          const {contentRange} = action;
          if (contentRange.first > 0) {
            items = items.concat(state.items.slice(0, contentRange.last));
          }
          for (let i = contentRange.first; i <= contentRange.last; i += 1) {
            const newItem = action.body[i - contentRange.first];
            if (newItem != null) {
              items.push(newItem);
            }
          }
        } else {
          items = items.concat(action.body);
        }

        return {
          ...state,
          isFetching: false,
          didInvalidate: false,
          items,
          lastUpdated: action.receivedAt
        };
      }
      case 'rejected':
        return {
          ...state,
          isFetching: false,
          didInvalidate: false
        };
      default:
        return state;
    }
  },
  get: (state, action) => {
    switch (action.status) {
      case 'pending':
        return {
          ...state,
          isFetchingItem: true,
          didInvalidateItem: false
        };
      case 'resolved': {
        const actionOpts = action.options || {};
        const idKey = getIdKey(action, {multi: false});
        const item = action.body;
        const update = {};
        if (actionOpts.assignResponse) {
          const updatedItems = state.items;
          const listItemIndex = updatedItems.findIndex(el => el[idKey] === item[idKey]);
          if (listItemIndex !== -1) {
            updatedItems.splice(listItemIndex, 1, item);
            update.items = updatedItems.slice();
          }
        }
        return {
          ...state,
          isFetchingItem: false,
          didInvalidateItem: false,
          lastUpdatedItem: action.receivedAt,
          item,
          ...update
        };
      }
      case 'rejected':
        return {
          ...state,
          isFetchingItem: false,
          didInvalidateItem: false
        };
      default:
        return state;
    }
  },
  update: (state, action) => {
    switch (action.status) {
      case 'pending':
        // Update object in store as soon as possible?
        return {
          ...state,
          isUpdating: true
        };
      case 'resolved': {
        // Assign context or returned object
        const idKey = getIdKey(action, {multi: false});
        const id = isObject(action.context) ? action.context[idKey] : action.context;
        const actionOpts = action.options || {};
        const update = actionOpts.assignResponse ? action.body : action.context;
        const listItemIndex = state.items.findIndex(el => el[idKey] === id);
        const updatedItems = state.items.slice();
        if (listItemIndex !== -1) {
          updatedItems[listItemIndex] = {
            ...updatedItems[listItemIndex],
            ...update
          };
        }
        const updatedItem =
          state.item && state.item[idKey] === id
            ? {
                ...state.item,
                ...update
              }
            : state.item;
        return {
          ...state,
          isUpdating: false,
          items: updatedItems,
          item: updatedItem
        };
      }
      case 'rejected':
        return {
          ...state,
          isUpdating: false
        };
      default:
        return state;
    }
  },
  updateMany: (state, action) => {
    switch (action.status) {
      case 'pending':
        // Update object in store as soon as possible?
        return {
          ...state,
          isUpdatingMany: true
        };
      case 'resolved': {
        // Assign context or returned object
        const actionOpts = action.options || {};
        const idKey = getIdKey(action, {multi: false});
        const idKeyMulti = getIdKey(action, {multi: true});
        const {[idKeyMulti]: ids} = actionOpts.query || action.context;

        const updatedItems = state.items.map(item => {
          if (!ids || ids.includes(item[idKey])) {
            const updatedItem = getUpdateArrayData(action, item[idKey]);
            return updatedItem
              ? {
                  ...item,
                  ...updatedItem
                }
              : item;
          }
          return item;
        });
        // Also impact state.item? (@TODO opt-in/defautl?)
        const updatedItem =
          state.item && (!ids || ids.includes(state.item[idKey]))
            ? {
                ...state.item,
                ...getUpdateArrayData(action, state.item[idKey])
              }
            : state.item;
        return {
          ...state,
          isUpdatingMany: false,
          items: updatedItems,
          item: updatedItem
        };
      }
      case 'rejected':
        return {
          ...state,
          isUpdatingMany: false
        };
      default:
        return state;
    }
  },
  delete: (state, action) => {
    switch (action.status) {
      case 'pending':
        // Update object in store as soon as possible?
        return {
          ...state,
          isDeleting: true
        };
      case 'resolved': {
        const idKey = getIdKey(action, {multi: false});
        const id = action.context[idKey] || action.context;
        return {
          ...state,
          isDeleting: false,
          items: [...state.items.filter(el => el[idKey] !== id)]
        };
      }
      case 'rejected':
        return {
          ...state,
          isDeleting: false
        };
      default:
        return state;
    }
  },
  deleteMany: (state, action) => {
    switch (action.status) {
      case 'pending':
        // Update object in store as soon as possible?
        return {
          ...state,
          isDeletingMany: true
        };
      case 'resolved': {
        const actionOpts = action.options || {};
        const idKey = getIdKey(action, {multi: false});
        const idKeyMulti = getIdKey(action, {multi: true});
        const {[idKeyMulti]: ids} = actionOpts.query || action.context;

        if (!ids) {
          return {
            ...state,
            isDeletingMany: false,
            items: [],
            item: null
          };
        }
        return {
          ...state,
          isDeletingMany: false,
          items: [...state.items.filter(el => !ids.includes(el[idKey]))],
          item: state.item && ids.includes(state.item[idKey]) ? null : state.item
        };
      }
      case 'rejected':
        return {
          ...state,
          isDeletingMany: false
        };
      default:
        return state;
    }
  }
};

const createReducer = (actionId, {resourceName, resourcePluralName = `${resourceName}s`, ...actionOpts}) => {
  // Custom reducers
  if (actionOpts.reduce && isFunction(actionOpts.reduce)) {
    return actionOpts.reduce;
  }
  // Do require a custom reduce function for pure actions
  if (actionOpts.isPure) {
    throw new Error(`Missing \`reduce\` option for pure action \`${actionId}\``);
  }
  // Default reducers
  if (defaultReducers[actionId]) {
    return defaultReducers[actionId];
  }
  // Custom actions
  const gerundName = actionOpts.gerundName || getGerundName(actionId);
  const gerundStateKey = `is${ucfirst(gerundName)}`;
  return (state, action) => {
    switch (action.status) {
      case 'pending':
        // Update object in store as soon as possible?
        return {
          ...state,
          [gerundStateKey]: true
        };
      case 'resolved': // eslint-disable-line
        return {
          ...state,
          [gerundStateKey]: false
        };
      case 'rejected':
        return {
          ...state,
          [gerundStateKey]: false
        };
      default:
        return state;
    }
  };
};

const createReducers = (actions = {}, {resourceName, resourcePluralName, ...globalOpts} = {}) => {
  const actionKeys = Object.keys(actions);
  return actionKeys.reduce((actionReducers, actionId) => {
    const actionOpts = {
      ...globalOpts,
      ...actions[actionId]
    };
    const reducerKey = getActionType(actionId).toLowerCase();
    actionReducers[reducerKey] = createReducer(actionId, {
      resourceName,
      resourcePluralName,
      ...actionOpts
    });
    return actionReducers;
  }, {});
};

const createRootReducer = (
  reducers = {},
  {resourceName, resourcePluralName, scope = getTypesScope(resourceName), ...globalOpts} = {}
) => {
  const scopeNamespace = scope ? `${scope}/` : '';
  const rootReducer = (
    state = {
      ...initialState
    },
    action
  ) => {
    // Only process relevant namespace
    if (scopeNamespace && !String(action.type).startsWith(scopeNamespace)) {
      return state;
    }
    // Only process relevant action type
    const type = action.type.substr(scopeNamespace.length).toLowerCase();
    // Check for a matching reducer
    if (reducers[type]) {
      return reducers[type](state, action);
    }
    return state;
  };
  return rootReducer;
};

const reduceReducers = (...reducers) => (state, action) =>
  reducers.reduce((stateSoFar, reducer) => reducer(stateSoFar, action), state);

const combineReducers = (...reducers) => (state = {}, action) =>
  reducers.reduce(
    (stateSoFar, reducerMap) =>
      Object.keys(reducerMap).reduce((innerStateSoFar, key) => {
        const reducer = reducerMap[key];
        const previousStateForKey = stateSoFar[key];
        const nextStateForKey = reducer(previousStateForKey, action);
        return {...innerStateSoFar, [key]: nextStateForKey};
      }, stateSoFar),
    state
  );

const mergeReducers = (baseReducer, ...reducers) => {
  const combinedReducers = combineReducers(...reducers);
  return (state, action) => combinedReducers(baseReducer(state, action), action);
};

// https://github.com/angular/angular.js/blob/master/src/ngResource/resource.js

function createResource({
  name: resourceName,
  pluralName: resourcePluralName,
  actions: givenActions = {},
  mergeDefaultActions = true,
  pick: pickedActions = [],
  ...args
}) {
  // Merge passed actions with common defaults
  let resolvedActions = mergeDefaultActions ? mergeObjects({}, defaultActions, givenActions) : givenActions;
  // Eventually pick selected actions
  if (pickedActions.length) {
    resolvedActions = pick(resolvedActions, ...pickedActions);
  }
  const types = createTypes(resolvedActions, {resourceName, resourcePluralName, ...args});
  const actions = createActions(resolvedActions, {resourceName, resourcePluralName, ...args});
  const reducers = createReducers(resolvedActions, {resourceName, resourcePluralName, ...args});
  const rootReducer = createRootReducer(reducers, {resourceName, resourcePluralName, ...args});
  return {
    actions,
    reducers: rootReducer, // breaking change
    rootReducer,
    types
  };
}

function createResourceAction({name: resourceName, pluralName: resourcePluralName, method = 'GET', ...args}) {
  const actionId = method.toLowerCase();
  const scope = getTypesScope(resourceName);
  const types = scopeTypes(createType(actionId, {resourceName, resourcePluralName}), scope);
  const actionName = getActionName(actionId, {resourceName, resourcePluralName});
  const actions = {[actionName]: createAction(actionId, {resourceName, resourcePluralName, scope, ...args})};
  const reducers = {[actionId]: createReducer(actionId, {resourceName, resourcePluralName, scope, ...args})};
  const rootReducer = createRootReducer(reducers, {resourceName, resourcePluralName, ...args});
  return {
    actions,
    reducers, // new API
    rootReducer,
    types
  };
}

export { fetch$1 as fetch, HttpError, createResource, createResourceAction, reduceReducers, combineReducers, mergeReducers, defaultGlobals, defaultActions, defaultHeaders, defaultIdKeys, defaultState, initialState };

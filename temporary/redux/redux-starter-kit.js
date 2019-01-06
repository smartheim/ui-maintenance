import { createStore, compose, applyMiddleware, combineReducers } from './redux';
import thunk from './redux-thunk';
export { default as createNextState } from './immer';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) {
  return typeof obj;
} : function (obj) {
  return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj;
};

var defineProperty = function (obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, {
      value: value,
      enumerable: true,
      configurable: true,
      writable: true
    });
  } else {
    obj[key] = value;
  }

  return obj;
};

var toConsumableArray = function (arr) {
  if (Array.isArray(arr)) {
    for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i];

    return arr2;
  } else {
    return Array.from(arr);
  }
};

/**
 * @param {any} obj The object to inspect.
 * @returns {boolean} True if the argument appears to be a plain object.
 */
function isPlainObject(obj) {
  if ((typeof obj === 'undefined' ? 'undefined' : _typeof(obj)) !== 'object' || obj === null) return false;

  var proto = obj;
  while (Object.getPrototypeOf(proto) !== null) {
    proto = Object.getPrototypeOf(proto);
  }

  return Object.getPrototypeOf(obj) === proto;
}

function isPlain(val) {
  return typeof val === 'undefined' || typeof val === 'string' || typeof val === 'boolean' || typeof val === 'number' || Array.isArray(val) || isPlainObject(val);
}

var NON_SERIALIZABLE_STATE_MESSAGE = ['A non-serializable value was detected in the state, in the path: `%s`. Value: %o', 'Take a look at the reducer(s) handling this action type: %s.', '(See https://redux.js.org/faq/organizing-state#can-i-put-functions-promises-or-other-non-serializable-items-in-my-store-state)'].join('\n');

var NON_SERIALIZABLE_ACTION_MESSAGE = ['A non-serializable value was detected in an action, in the path: `%s`. Value: %o', 'Take a look at the logic that dispatched this action:  %o.', '(See https://redux.js.org/faq/actions#why-should-type-be-a-string-or-at-least-serializable-why-should-my-action-types-be-constants)'].join('\n');

function findNonSerializableValue(obj) {
  var path = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
  var isSerializable = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : isPlain;

  var foundNestedSerializable = void 0;

  if (!isSerializable(obj)) {
    return { keyPath: path.join('.') || '<root>', value: obj };
  }

  for (var property in obj) {
    if (obj.hasOwnProperty(property)) {
      var nestedPath = path.concat(property);
      var nestedValue = obj[property];

      if (!isSerializable(nestedValue)) {
        return { keyPath: nestedPath.join('.'), value: nestedValue };
      }

      if ((typeof nestedValue === 'undefined' ? 'undefined' : _typeof(nestedValue)) === 'object') {
        foundNestedSerializable = findNonSerializableValue(nestedValue, nestedPath);

        if (foundNestedSerializable) {
          return foundNestedSerializable;
        }
      }
    }
  }

  return false;
}

function createSerializableStateInvariantMiddleware() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var _options$isSerializab = options.isSerializable,
      isSerializable = _options$isSerializab === undefined ? isPlain : _options$isSerializab;


  return function (storeAPI) {
    return function (next) {
      return function (action) {
        var foundActionNonSerializableValue = findNonSerializableValue(action, [], isSerializable);

        if (foundActionNonSerializableValue) {
          var keyPath = foundActionNonSerializableValue.keyPath,
              value = foundActionNonSerializableValue.value;


          console.error(NON_SERIALIZABLE_ACTION_MESSAGE, keyPath, value, action);
        }

        var result = next(action);

        var state = storeAPI.getState();

        var foundStateNonSerializableValue = findNonSerializableValue(state);

        if (foundStateNonSerializableValue) {
          var _keyPath = foundStateNonSerializableValue.keyPath,
              _value = foundStateNonSerializableValue.value;


          console.error(NON_SERIALIZABLE_STATE_MESSAGE, _keyPath, _value, action.type);
        }

        return result;
      };
    };
  };
}

function getDefaultMiddleware() {
  var middlewareArray = [thunk];
  return middlewareArray;
}

function configureStore() {
  var options = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : {};
  var reducer = options.reducer,
      _options$middleware = options.middleware,
      middleware = _options$middleware === undefined ? getDefaultMiddleware() : _options$middleware,
      _options$devTools = options.devTools,
      devTools = _options$devTools === undefined ? true : _options$devTools,
      preloadedState = options.preloadedState,
      _options$enhancers = options.enhancers,
      enhancers = _options$enhancers === undefined ? [] : _options$enhancers;


  var rootReducer = void 0;

  if (typeof reducer === 'function') {
    rootReducer = reducer;
  } else if (isPlainObject(reducer)) {
    rootReducer = combineReducers(reducer);
  } else {
    throw new Error('Reducer argument must be a function or an object of functions that can be passed to combineReducers');
  }

  var middlewareEnhancer = applyMiddleware.apply(undefined, toConsumableArray(middleware));

  var finalCompose = compose;

  var storeEnhancers = [middlewareEnhancer].concat(toConsumableArray(enhancers));

  var composedEnhancer = finalCompose.apply(undefined, toConsumableArray(storeEnhancers));

  var store = createStore(rootReducer, preloadedState, composedEnhancer);

  return store;
}

function createReducer(initialState, actionsMap) {
  return function () {
    var state = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : initialState;
    var action = arguments[1];

    return createNextState(state, function (draft) {
      var caseReducer = actionsMap[action.type];

      if (caseReducer) {
        return caseReducer(draft, action);
      }

      return draft;
    });
  };
}

function createAction(type) {
  var action = function action(payload) {
    return {
      type: type,
      payload: payload
    };
  };
  action.toString = function () {
    return "" + type;
  };
  return action;
}

var getType = function getType(action) {
  return "" + action;
};

function createSliceSelector(slice) {
  if (!slice) {
    return function (state) {
      return state;
    };
  }
  return function (state) {
    return state[slice];
  };
}

function createSelectorName(slice) {
  if (!slice) {
    return 'getState';
  }
  return camelize('get ' + slice);
}

function camelize(str) {
  return str.replace(/(?:^\w|[A-Z]|\b\w)/g, function (letter, index) {
    return index === 0 ? letter.toLowerCase() : letter.toUpperCase();
  }).replace(/\s+/g, '').replace(/[-_]/g, '');
}

var getType$1 = function getType$$1(slice, action) {
  return slice ? slice + '/' + action : action;
};

function createSlice(_ref) {
  var _ref$slice = _ref.slice,
      slice = _ref$slice === undefined ? '' : _ref$slice,
      _ref$reducers = _ref.reducers,
      reducers = _ref$reducers === undefined ? {} : _ref$reducers,
      initialState = _ref.initialState;

  var actionKeys = Object.keys(reducers);

  var reducerMap = actionKeys.reduce(function (map, action) {
    map[getType$1(slice, action)] = reducers[action];
    return map;
  }, {});

  var reducer = createReducer(initialState, reducerMap);

  var actionMap = actionKeys.reduce(function (map, action) {
    var type = getType$1(slice, action);
    map[action] = createAction(type);
    return map;
  }, {});

  var selectors = defineProperty({}, createSelectorName(slice), createSliceSelector(slice));

  return {
    actions: actionMap,
    reducer: reducer,
    slice: slice,
    selectors: selectors
  };
}

export { configureStore, getDefaultMiddleware, createReducer, createAction, getType, createSlice, createSerializableStateInvariantMiddleware, isPlain };

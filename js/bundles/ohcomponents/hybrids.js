let process = { "env": { "NODE_ENV" : "production" } };

function camelToDash(str) {
  return str.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

function pascalToDash(str) {
  str = str[0].toLowerCase() + str.slice(1);
  return camelToDash(str);
}

function dispatch(host, eventType, options = {}) {
  return host.dispatchEvent(new CustomEvent(eventType, { bubbles: false, ...options }));
}

function shadyCSS(fn, fallback) {
  const shady = window.ShadyCSS;

  /* istanbul ignore next */
  if (shady && !shady.nativeShadow) {
    return fn(shady);
  }

  return fallback;
}

function stringifyElement(element) {
  const tagName = String(element.tagName).toLowerCase();
  return `<${tagName}>`;
}

const IS_IE = 'ActiveXObject' in window;

const defaultTransform = v => v;

const objectTransform = (value) => {
  if (typeof value !== 'object') {
    throw TypeError(`[property] Argument is not an object: ${typeof v}`);
  }
  return value && Object.freeze(value);
};

function property(value, connect) {
  const type = typeof value;
  let transform = defaultTransform;

  switch (type) {
    case 'string':
      transform = String;
      break;
    case 'number':
      transform = Number;
      break;
    case 'boolean':
      transform = Boolean;
      break;
    case 'function':
      transform = value;
      value = transform();
      break;
    case 'object':
      if (value) Object.freeze(value);
      transform = objectTransform;
      break;
    default: break;
  }

  return {
    get: (host, val = value) => val,
    set: (host, val, oldValue) => transform(val, oldValue),
    connect: type !== 'object' && type !== 'undefined'
      ? (host, key, invalidate) => {
        if (host[key] === value) {
          const attrName = camelToDash(key);

          if (host.hasAttribute(attrName)) {
            const attrValue = host.getAttribute(attrName);
            host[key] = attrValue !== '' ? attrValue : true;
          }
        }

        return connect && connect(host, key, invalidate);
      }
      : connect,
  };
}

const map = new WeakMap();
const cache = new WeakMap();
const FPS_THRESHOLD = 1000 / 60; // 60 FPS ~ 16,67ms time window
let queue = [];

function update(index = 0, startTime = 0) {
  if (startTime && (performance.now() - startTime > FPS_THRESHOLD)) {
    requestAnimationFrame(() => update(index));
  } else {
    const target = queue[index];
    const nextTime = performance.now();

    if (!target) {
      shadyCSS(shady => queue.forEach(t => shady.styleSubtree(t)));
      queue = [];
    } else {
      if (map.has(target)) {
        const key = map.get(target);
        const prevUpdate = cache.get(target);
        try {
          const nextUpdate = target[key];
          if (nextUpdate !== prevUpdate) {
            cache.set(target, nextUpdate);
            nextUpdate();
            if (!prevUpdate) shadyCSS(shady => shady.styleElement(target));
          }
        } catch (e) {
          update(index + 1, nextTime);
          throw e;
        }
      }
      update(index + 1, nextTime);
    }
  }
}

function addToQueue(event) {
  const target = event.composedPath()[0];
  if (target === event.currentTarget) {
    if (!queue[0]) {
      requestAnimationFrame((() => update()));
    }
    if (queue.indexOf(target) === -1) {
      queue.push(target);
    }
  }
}

function render(get, customOptions = {}) {
  if (typeof get !== 'function') {
    throw TypeError(`[render] The first argument must be a function: ${typeof get}`);
  }

  const options = { shadowRoot: true, ...customOptions };

  return {
    get: (host) => {
      const fn = get(host);
      return () => fn(host, options.shadowRoot ? host.shadowRoot : host);
    },
    connect(host, key) {
      if (map.has(host)) {
        throw Error(`[render] Render factory already used in '${map.get(host)}' key`);
      }

      if (options.shadowRoot && !host.shadowRoot) {
        const shadowRootInit = { mode: 'open' };
        if (typeof options.shadowRoot === 'object') {
          Object.assign(shadowRootInit, options.shadowRoot);
        }
        host.attachShadow(shadowRootInit);
      }

      host.addEventListener('@invalidate', addToQueue);
      map.set(host, key);

      return () => {
        host.removeEventListener('@invalidate', addToQueue);
        map.delete(host);
      };
    },
  };
}

const entries = new WeakMap();
function getEntry(target, key) {
  let targetMap = entries.get(target);
  if (!targetMap) {
    targetMap = new Map();
    entries.set(target, targetMap);
  }

  let entry = targetMap.get(key);

  if (!entry) {
    entry = {
      target,
      key,
      value: undefined,
      deps: new Set(),
      state: 1,
      checksum: 0,
    };
    targetMap.set(key, entry);
  }

  return entry;
}

function calculateChecksum({ state, deps }) {
  let checksum = state;
  deps.forEach((entry) => {
    // eslint-disable-next-line no-unused-expressions
    entry.target[entry.key];
    checksum += entry.state;
  });

  return checksum;
}

let context = null;
function get(target, key, getter) {
  const entry = getEntry(target, key);

  if (context === entry) {
    context = null;
    throw Error(`[cache] Circular '${key}' get invocation in '${stringifyElement(target)}'`);
  }

  if (context) {
    context.deps.add(entry);
  }

  const parentContext = context;
  context = entry;

  if (entry.checksum && entry.checksum === calculateChecksum(entry)) {
    context = parentContext;
    return entry.value;
  }

  entry.deps.clear();

  try {
    const nextValue = getter(target, entry.value);

    if (nextValue !== entry.value) {
      entry.state += 1;
      entry.value = nextValue;
    }

    entry.checksum = calculateChecksum(entry);
    context = parentContext;
  } catch (e) {
    context = null;
    throw e;
  }

  return entry.value;
}

function set(target, key, setter, value, callback) {
  if (context) {
    context = null;
    throw Error(`[cache] Try to set '${key}' of '${stringifyElement(target)}' in get call`);
  }

  const entry = getEntry(target, key);
  const newValue = setter(target, value, entry.value);

  if (newValue !== entry.value) {
    entry.state += 1;
    entry.value = newValue;

    callback();
  }
}

function invalidate(target, key, clearValue) {
  if (context) {
    context = null;
    throw Error(`[cache] Try to invalidate '${key}' in '${stringifyElement(target)}' get call`);
  }

  const entry = getEntry(target, key);

  entry.checksum = 0;

  if (clearValue) {
    entry.value = undefined;
  }
}

function dispatchInvalidate(host) {
  dispatch(host, '@invalidate', { bubbles: true, composed: true });
}

const defaultGet = (host, value) => value;

function compile(Hybrid, hybrids) {
  Hybrid.hybrids = hybrids;
  Hybrid.connects = [];

  Object.keys(hybrids).forEach((key) => {
    let config = hybrids[key];
    const type = typeof config;

    if (type === 'function') {
      config = key === 'render' ? render(config) : { get: config };
    } else if (config === null || type !== 'object' || (type === 'object' && !config.get && !config.set)) {
      config = property(config);
    }

    config.get = config.get || defaultGet;

    Object.defineProperty(Hybrid.prototype, key, {
      get: function get$$1() {
        return get(this, key, config.get);
      },
      set: config.set && function set$$1(newValue) {
        set(this, key, config.set, newValue, () => dispatchInvalidate(this));
      },
      enumerable: true,
      configurable: process.env.NODE_ENV !== 'production',
    });

    if (config.connect) {
      Hybrid.connects.push(host => config.connect(host, key, (clearCache = true) => {
        if (clearCache) invalidate(host, key);
        dispatchInvalidate(host);
      }));
    }
  });
}

let update$1;
/* istanbul ignore else */
if (process.env.NODE_ENV !== 'production') {
  const walkInShadow = (node, fn) => {
    fn(node);

    Array.from(node.children)
      .forEach(el => walkInShadow(el, fn));

    if (node.shadowRoot) {
      Array.from(node.shadowRoot.children)
        .forEach(el => walkInShadow(el, fn));
    }
  };

  const updateQueue = new Map();
  update$1 = (Hybrid, lastHybrids) => {
    if (!updateQueue.size) {
      Promise.resolve().then(() => {
        walkInShadow(document.body, (node) => {
          if (updateQueue.has(node.constructor)) {
            const hybrids = updateQueue.get(node.constructor);
            node.disconnectedCallback();

            Object.keys(node.constructor.hybrids).forEach((key) => {
              invalidate(node, key, node[key] === hybrids[key]);
            });

            node.connectedCallback();
            dispatchInvalidate(node);
          }
        });
        updateQueue.clear();
      });
    }
    updateQueue.set(Hybrid, lastHybrids);
  };
}

const connects = new WeakMap();

function defineElement(tagName, hybridsOrConstructor) {
  const type = typeof hybridsOrConstructor;
  if (type !== 'object' && type !== 'function') {
    throw TypeError('[define] Invalid second argument. It must be an object or a function');
  }

  const CustomElement = window.customElements.get(tagName);

  if (type === 'function') {
    if (CustomElement !== hybridsOrConstructor) {
      return window.customElements.define(tagName, hybridsOrConstructor);
    }
    return CustomElement;
  }

  if (CustomElement) {
    if (CustomElement.hybrids === hybridsOrConstructor) {
      return CustomElement;
    }
    if (process.env.NODE_ENV !== 'production' && CustomElement.hybrids) {
      Object.keys(CustomElement.hybrids).forEach((key) => {
        delete CustomElement.prototype[key];
      });

      const lastHybrids = CustomElement.hybrids;

      compile(CustomElement, hybridsOrConstructor);
      update$1(CustomElement, lastHybrids);

      return CustomElement;
    }

    throw Error(`[define] Element '${tagName}' already defined`);
  }

  class Hybrid extends HTMLElement {
    static get name() { return tagName; }

    connectedCallback() {
      const list = this.constructor.connects.reduce((acc, fn) => {
        const result = fn(this);
        if (result) acc.add(result);
        return acc;
      }, new Set());

      connects.set(this, list);
      dispatchInvalidate(this);
    }

    disconnectedCallback() {
      const list = connects.get(this);
      list.forEach(fn => fn());
    }
  }

  compile(Hybrid, hybridsOrConstructor);
  customElements.define(tagName, Hybrid);

  return Hybrid;
}

function defineMap(elements) {
  return Object.keys(elements).reduce((acc, key) => {
    const tagName = pascalToDash(key);
    acc[key] = defineElement(tagName, elements[key]);

    return acc;
  }, {});
}

function define(...args) {
  if (typeof args[0] === 'object') {
    return defineMap(args[0]);
  }

  return defineElement(...args);
}

const map$1 = new WeakMap();

document.addEventListener('@invalidate', (event) => {
  const set = map$1.get(event.composedPath()[0]);
  if (set) set.forEach(fn => fn());
});

function walk(node, fn) {
  let parentElement = node.parentElement || node.parentNode.host;

  while (parentElement) {
    const hybrids = parentElement.constructor.hybrids;

    if (hybrids && fn(hybrids)) {
      return parentElement;
    }

    parentElement = parentElement.parentElement
      || (parentElement.parentNode && parentElement.parentNode.host);
  }

  return parentElement || null;
}

function parent(hybridsOrFn) {
  const fn = typeof hybridsOrFn === 'function' ? hybridsOrFn : hybrids => hybrids === hybridsOrFn;
  return {
    get: host => walk(host, fn),
    connect(host, key, invalidate) {
      const target = host[key];

      if (target) {
        let set = map$1.get(target);
        if (!set) {
          set = new Set();
          map$1.set(target, set);
        }

        set.add(invalidate);

        return () => {
          set.delete(invalidate);
          invalidate();
        };
      }

      return false;
    },
  };
}

function walk$1(node, fn, options, items = []) {
  Array.from(node.children).forEach((child) => {
    const hybrids = child.constructor.hybrids;
    if (hybrids && fn(hybrids)) {
      items.push(child);
      if (options.deep && options.nested) {
        walk$1(child, fn, options, items);
      }
    } else if (options.deep) {
      walk$1(child, fn, options, items);
    }
  });

  return items;
}

function children(hybridsOrFn, options = { deep: false, nested: false }) {
  const fn = typeof hybridsOrFn === 'function' ? hybridsOrFn : hybrids => hybrids === hybridsOrFn;
  return {
    get(host) { return walk$1(host, fn, options); },
    connect(host, key, invalidate) {
      const observer = new MutationObserver(invalidate);
      const set = new Set();

      const childEventListener = ({ target }) => {
        if (!set.size) {
          Promise.resolve().then(() => {
            const list = host[key];
            for (let i = 0; i < list.length; i += 1) {
              if (set.has(list[i])) {
                invalidate(false);
                break;
              }
            }
            set.clear();
          });
        }
        set.add(target);
      };

      observer.observe(host, {
        childList: true, subtree: !!options.deep,
      });

      host.addEventListener('@invalidate', childEventListener);

      return () => {
        observer.disconnect();
        host.removeEventListener('@invalidate', childEventListener);
      };
    },
  };
}

const map$2 = new WeakMap();
const dataMap = {
  get(key, defaultValue) {
    if (map$2.has(key)) {
      return map$2.get(key);
    }

    if (defaultValue !== undefined) {
      map$2.set(key, defaultValue);
    }

    return defaultValue;
  },
  set(key, value) {
    map$2.set(key, value);
    return value;
  },
};

function getTemplateEnd(node) {
  let data;
  // eslint-disable-next-line no-cond-assign
  while (node && (data = dataMap.get(node)) && data.endNode) {
    node = data.endNode;
  }

  return node;
}

function removeTemplate(target) {
  const data = dataMap.get(target);
  const startNode = data.startNode;

  if (startNode) {
    const endNode = getTemplateEnd(data.endNode);

    let node = startNode;
    const lastNextSibling = endNode.nextSibling;

    while (node) {
      const nextSibling = node.nextSibling;
      node.parentNode.removeChild(node);
      node = nextSibling !== lastNextSibling && nextSibling;
    }
  }
}

const arrayMap = new WeakMap();

function movePlaceholder(target, previousSibling) {
  const data = dataMap.get(target);
  const startNode = data.startNode;
  const endNode = getTemplateEnd(data.endNode);

  previousSibling.parentNode.insertBefore(target, previousSibling.nextSibling);

  let prevNode = target;
  let node = startNode;
  while (node) {
    const nextNode = node.nextSibling;
    prevNode.parentNode.insertBefore(node, prevNode.nextSibling);
    prevNode = node;
    node = nextNode !== endNode.nextSibling && nextNode;
  }
}

function resolveArray(host, target, value) {
  let lastEntries = arrayMap.get(target);
  const entries = value.map((item, index) => ({
    id: Object.prototype.hasOwnProperty.call(item, 'id') ? item.id : index,
    value: item,
    placeholder: null,
    available: true,
  }));

  arrayMap.set(target, entries);

  if (lastEntries) {
    const ids = new Set();
    entries.forEach(entry => ids.add(entry.id));

    lastEntries = lastEntries.filter((entry) => {
      if (!ids.has(entry.id)) {
        removeTemplate(entry.placeholder);
        entry.placeholder.parentNode.removeChild(entry.placeholder);
        return false;
      }

      return true;
    });
  }

  let previousSibling = target;
  const lastIndex = value.length - 1;
  const data = dataMap.get(target);

  entries.forEach((entry, index) => {
    const matchedEntry = lastEntries
      && lastEntries.find(item => item.available && item.id === entry.id);

    let placeholder;
    if (matchedEntry) {
      matchedEntry.available = false;
      placeholder = matchedEntry.placeholder;

      if (placeholder.previousSibling !== previousSibling) {
        movePlaceholder(placeholder, previousSibling);
      }
      if (matchedEntry.value !== entry.value) {
        resolveValue(host, placeholder, entry.value);
      }
    } else {
      placeholder = document.createTextNode('');
      previousSibling.parentNode.insertBefore(placeholder, previousSibling.nextSibling);
      resolveValue(host, placeholder, entry.value);
    }

    previousSibling = getTemplateEnd(dataMap.get(placeholder).endNode || placeholder);

    if (index === 0) data.startNode = placeholder;
    if (index === lastIndex) data.endNode = previousSibling;

    entry.placeholder = placeholder;
  });

  if (lastEntries) {
    lastEntries.forEach((entry) => {
      if (entry.available) {
        removeTemplate(entry.placeholder);
        entry.placeholder.parentNode.removeChild(entry.placeholder);
      }
    });
  }
}

function resolveValue(host, target, value) {
  const type = Array.isArray(value) ? 'array' : typeof value;
  let data = dataMap.get(target, {});

  if (data.type !== type) {
    removeTemplate(target);
    data = dataMap.set(target, { type });

    if (target.textContent !== '') {
      target.textContent = '';
    }
  }

  switch (type) {
    case 'function':
      value(host, target);
      break;
    case 'array':
      resolveArray(host, target, value);
      break;
    default:
      target.textContent = type === 'number' || value ? value : '';
  }
}

const eventMap = new WeakMap();

function resolveEventListener(eventType) {
  return (host, target, value, lastValue) => {
    if (lastValue) {
      target.removeEventListener(
        eventType,
        eventMap.get(lastValue),
        lastValue.options !== undefined ? lastValue.options : false,
      );
    }

    if (value) {
      if (typeof value !== 'function') {
        throw Error(`Event listener must be a function: ${typeof value}`);
      }

      eventMap.set(value, value.bind(null, host));

      target.addEventListener(
        eventType,
        eventMap.get(value),
        value.options !== undefined ? value.options : false,
      );
    }
  };
}

function normalizeValue(value, set = new Set()) {
  if (Array.isArray(value)) {
    value.forEach(className => set.add(className));
  } else if (value !== null && typeof value === 'object') {
    Object.keys(value).forEach(key => value[key] && set.add(key));
  } else {
    set.add(value);
  }

  return set;
}

const classMap = new WeakMap();

function resolveClassList(host, target, value) {
  const previousList = classMap.get(target) || new Set();
  const list = normalizeValue(value);

  classMap.set(target, list);

  list.forEach((className) => {
    target.classList.add(className);
    previousList.delete(className);
  });

  previousList.forEach((className) => {
    target.classList.remove(className);
  });
}

const styleMap = new WeakMap();

function resolveStyle(host, target, value) {
  if (value === null || typeof value !== 'object') {
    throw TypeError(`Style value must be an object instance in ${stringifyElement(target)}:`, value);
  }

  const previousMap = styleMap.get(target) || new Map();

  const nextMap = Object.keys(value).reduce((map, key) => {
    const dashKey = camelToDash(key);
    const styleValue = value[key];

    if (!styleValue && styleValue !== 0) {
      target.style.removeProperty(dashKey);
    } else {
      target.style.setProperty(dashKey, styleValue);
    }

    map.set(dashKey, styleValue);
    previousMap.delete(dashKey);

    return map;
  }, new Map());

  previousMap.forEach((styleValue, key) => { target.style[key] = ''; });

  styleMap.set(target, nextMap);
}

function resolveProperty(attrName, propertyName, isSVG) {
  if (propertyName.substr(0, 2) === 'on') {
    const eventType = propertyName.substr(2);
    return resolveEventListener(eventType);
  }

  switch (attrName) {
    case 'class': return resolveClassList;
    case 'style': return resolveStyle;
    default:
      return (host, target, value) => {
        if (!isSVG && !(target instanceof SVGElement) && (propertyName in target)) {
          if (target[propertyName] !== value) {
            target[propertyName] = value;
          }
        } else if (value === false || value === undefined || value === null) {
          target.removeAttribute(attrName);
        } else {
          const attrValue = value === true ? '' : String(value);
          target.setAttribute(attrName, attrValue);
        }
      };
  }
}

const TIMESTAMP = Date.now();

const getPlaceholder = (id = 0) => `{{h-${TIMESTAMP}-${id}}}`;

const PLACEHOLDER_REGEXP_TEXT = getPlaceholder('(\\d+)');
const PLACEHOLDER_REGEXP_EQUAL = new RegExp(`^${PLACEHOLDER_REGEXP_TEXT}$`);
const PLACEHOLDER_REGEXP_ALL = new RegExp(PLACEHOLDER_REGEXP_TEXT, 'g');

const ATTR_PREFIX = `--${TIMESTAMP}--`;
const ATTR_REGEXP = new RegExp(ATTR_PREFIX, 'g');

const preparedTemplates = new WeakMap();

/* istanbul ignore next */
function applyShadyCSS(template, tagName) {
  if (!tagName) return template;

  return shadyCSS((shady) => {
    let map = preparedTemplates.get(template);
    if (!map) {
      map = new Map();
      preparedTemplates.set(template, map);
    }

    let clone = map.get(tagName);

    if (!clone) {
      clone = document.createElement('template');
      clone.content.appendChild(template.content.cloneNode(true));

      map.set(tagName, clone);

      const styles = clone.content.querySelectorAll('style');

      Array.from(styles).forEach((style) => {
        const count = style.childNodes.length + 1;
        for (let i = 0; i < count; i += 1) {
          style.parentNode.insertBefore(document.createTextNode(getPlaceholder()), style);
        }
      });

      shady.prepareTemplate(clone, tagName.toLowerCase());
    }
    return clone;
  }, template);
}

function createId(parts, isSVG) {
  return `${isSVG ? 'svg:' : ''}${parts.join(getPlaceholder())}`;
}

function createSignature(parts) {
  const signature = parts.reduce((acc, part, index) => {
    if (index === 0) {
      return part;
    }
    if (parts.slice(index).join('').match(/\s*<\/\s*(table|tr|thead|tbody|tfoot|colgroup)>/)) {
      return `${acc}<!--${getPlaceholder(index - 1)}-->${part}`;
    }
    return acc + getPlaceholder(index - 1) + part;
  }, '');

  /* istanbul ignore if */
  if (IS_IE) {
    return signature.replace(
      /style\s*=\s*(["][^"]+["]|['][^']+[']|[^\s"'<>/]+)/g,
      match => `${ATTR_PREFIX}${match}`,
    );
  }

  return signature;
}

function getPropertyName(string) {
  return string.replace(/\s*=\s*['"]*$/g, '').split(' ').pop();
}

function replaceComments(fragment) {
  const iterator = document.createNodeIterator(fragment, NodeFilter.SHOW_COMMENT, null, false);
  let node;
  // eslint-disable-next-line no-cond-assign
  while (node = iterator.nextNode()) {
    if (PLACEHOLDER_REGEXP_EQUAL.test(node.textContent)) {
      node.parentNode.insertBefore(document.createTextNode(node.textContent), node);
      node.parentNode.removeChild(node);
    }
  }
}

function createInternalWalker(context) {
  let node;

  return {
    get currentNode() { return node; },
    nextNode() {
      if (node === undefined) {
        node = context.childNodes[0];
      } else if (node.childNodes.length) {
        node = node.childNodes[0];
      } else if (node.nextSibling) {
        node = node.nextSibling;
      } else {
        node = node.parentNode.nextSibling;
      }

      return !!node;
    },
  };
}

function createExternalWalker(context) {
  return document.createTreeWalker(
    context,
    // eslint-disable-next-line no-bitwise
    NodeFilter.SHOW_ELEMENT | NodeFilter.SHOW_TEXT,
    null,
    false,
  );
}

/* istanbul ignore next */
const createWalker = typeof window.ShadyDOM === 'object' && window.ShadyDOM.inUse ? createInternalWalker : createExternalWalker;

const container = document.createElement('div');
function compile$1(rawParts, isSVG) {
  const template = document.createElement('template');
  const parts = [];

  let signature = createSignature(rawParts);
  if (isSVG) signature = `<svg>${signature}</svg>`;

  /* istanbul ignore if */
  if (IS_IE) {
    template.innerHTML = signature;
  } else {
    container.innerHTML = `<template>${signature}</template>`;
    template.content.appendChild(container.children[0].content);
  }

  if (isSVG) {
    const svgRoot = template.content.firstChild;
    template.content.removeChild(svgRoot);
    Array.from(svgRoot.childNodes).forEach(node => template.content.appendChild(node));
  }

  replaceComments(template.content);

  const compileWalker = createWalker(template.content);
  let compileIndex = 0;

  while (compileWalker.nextNode()) {
    const node = compileWalker.currentNode;

    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent;

      if (!text.match(PLACEHOLDER_REGEXP_EQUAL)) {
        const results = text.match(PLACEHOLDER_REGEXP_ALL);
        if (results) {
          let currentNode = node;
          results
            .reduce((acc, placeholder) => {
              const [before, next] = acc.pop().split(placeholder);
              if (before) acc.push(before);
              acc.push(placeholder);
              if (next) acc.push(next);
              return acc;
            }, [text])
            .forEach((part, index) => {
              if (index === 0) {
                currentNode.textContent = part;
              } else {
                currentNode = currentNode.parentNode
                  .insertBefore(document.createTextNode(part), currentNode.nextSibling);
              }
            });
        }
      }

      const equal = node.textContent.match(PLACEHOLDER_REGEXP_EQUAL);
      if (equal) {
        /* istanbul ignore else */
        if (!IS_IE) node.textContent = '';
        parts[equal[1]] = [compileIndex, resolveValue];
      }
    } else {
      /* istanbul ignore else */ // eslint-disable-next-line no-lonely-if
      if (node.nodeType === Node.ELEMENT_NODE) {
        Array.from(node.attributes).forEach((attr) => {
          const value = attr.value.trim();
          /* istanbul ignore next */
          const name = IS_IE ? attr.name.replace(ATTR_PREFIX, '') : attr.name;
          const equal = value.match(PLACEHOLDER_REGEXP_EQUAL);
          if (equal) {
            const propertyName = getPropertyName(rawParts[equal[1]]);
            parts[equal[1]] = [compileIndex, resolveProperty(name, propertyName, isSVG)];
            node.removeAttribute(attr.name);
          } else {
            const results = value.match(PLACEHOLDER_REGEXP_ALL);
            if (results) {
              const partialName = `attr__${name}`;

              results.forEach((placeholder, index) => {
                const [, id] = placeholder.match(PLACEHOLDER_REGEXP_EQUAL);
                parts[id] = [compileIndex, (host, target, attrValue) => {
                  const data = dataMap.get(target, {});
                  data[partialName] = (data[partialName] || value).replace(placeholder, attrValue == null ? '' : attrValue);

                  if ((results.length === 1) || (index + 1 === results.length)) {
                    target.setAttribute(name, data[partialName]);
                    data[partialName] = undefined;
                  }
                }];
              });

              attr.value = '';

              /* istanbul ignore next */
              if (IS_IE && name !== attr.name) {
                node.removeAttribute(attr.name);
                node.setAttribute(name, '');
              }
            }
          }
        });
      }
    }

    compileIndex += 1;
  }

  return (host, target, args) => {
    const data = dataMap.get(target, { type: 'function' });

    if (template !== data.template) {
      if (data.template) removeTemplate(target);

      const fragment = document.importNode(applyShadyCSS(template, host.tagName).content, true);

      const renderWalker = createWalker(fragment);
      const clonedParts = parts.slice(0);

      let renderIndex = 0;
      let currentPart = clonedParts.shift();

      const markers = [];

      Object.assign(data, { template, markers });

      while (renderWalker.nextNode()) {
        const node = renderWalker.currentNode;

        if (node.nodeType === Node.TEXT_NODE) {
          /* istanbul ignore next */
          if (PLACEHOLDER_REGEXP_EQUAL.test(node.textContent)) {
            node.textContent = '';
          } else if (IS_IE) {
            node.textContent = node.textContent.replace(ATTR_REGEXP, '');
          }
        } else if (process.env.NODE_ENV !== 'production' && node.nodeType === Node.ELEMENT_NODE) {
          if (node.tagName.indexOf('-') > -1 && !customElements.get(node.tagName.toLowerCase())) {
            throw Error(`Missing '${stringifyElement(node)}' element definition in '${stringifyElement(host)}'`);
          }
        }

        while (currentPart && currentPart[0] === renderIndex) {
          markers.push([node, currentPart[1]]);
          currentPart = clonedParts.shift();
        }

        renderIndex += 1;
      }

      const childList = Array.from(fragment.childNodes);

      data.startNode = childList[0];
      data.endNode = childList[childList.length - 1];

      if (target.nodeType === Node.TEXT_NODE) {
        let previousChild = target;
        childList.forEach((child) => {
          target.parentNode.insertBefore(child, previousChild.nextSibling);
          previousChild = child;
        });
      } else {
        target.appendChild(fragment);
      }
    }

    data.markers.forEach(([node, fn], index) => {
      if (data.lastArgs && data.lastArgs[index] === args[index]) return;
      fn(host, node, args[index], data.lastArgs ? data.lastArgs[index] : undefined);
    });

    data.lastArgs = args;
  };
}

const promiseMap = new WeakMap();

function resolve(promise, placeholder, delay = 200) {
  return (host, target) => {
    let timeout;

    if (placeholder) {
      timeout = setTimeout(() => {
        timeout = undefined;

        requestAnimationFrame(() => {
          placeholder(host, target);
        });
      }, delay);
    }

    promiseMap.set(target, promise);

    promise.then((template) => {
      if (timeout) clearTimeout(timeout);

      if (promiseMap.get(target) === promise) {
        template(host, target);
        promiseMap.set(target, null);
      }
    });
  };
}

function defineElements(elements) {
  define(elements);
  return this;
}

function key(id) {
  this.id = id;
  return this;
}

const updates = new Map();

function create(parts, args, isSVG) {
  const update = (host, target = host) => {
    const id = createId(parts, isSVG);
    let render = updates.get(id);

    if (!render) {
      render = compile$1(parts, isSVG);
      updates.set(id, render);
    }

    render(host, target, args);
  };

  return Object.assign(update, { define: defineElements, key });
}

function html(parts, ...args) {
  return create(parts, args);
}

function svg(parts, ...args) {
  return create(parts, args, true);
}

Object.assign(html, { resolve });
Object.assign(svg, { resolve });

export { define, property, parent, children, render, dispatch, html, svg };

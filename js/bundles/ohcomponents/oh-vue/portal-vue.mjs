/*
    portal-vue
    Version: 1.5.1
    Licence: MIT
    (c) Thorsten Lünborg
  */

import { Vue } from '../vue.js' // Pre-bundled, external reference

var nestRE = /^(attrs|props|on|nativeOn|class|style|hook)$/

var babelHelperVueJsxMergeProps = function mergeJSXProps(objs) {
  return objs.reduce(function (a, b) {
    var aa, bb, key, nestedKey, temp;
    for (key in b) {
      aa = a[key];
      bb = b[key];
      if (aa && nestRE.test(key)) {
        // normalize class
        if (key === 'class') {
          if (typeof aa === 'string') {
            temp = aa;
            a[key] = aa = {};
            aa[temp] = true;
          }
          if (typeof bb === 'string') {
            temp = bb;
            b[key] = bb = {};
            bb[temp] = true;
          }
        }
        if (key === 'on' || key === 'nativeOn' || key === 'hook') {
          // merge functions
          for (nestedKey in bb) {
            aa[nestedKey] = mergeFn(aa[nestedKey], bb[nestedKey]);
          }
        } else if (Array.isArray(aa)) {
          a[key] = aa.concat(bb);
        } else if (Array.isArray(bb)) {
          a[key] = [aa].concat(bb);
        } else {
          for (nestedKey in bb) {
            aa[nestedKey] = bb[nestedKey];
          }
        }
      } else {
        a[key] = b[key];
      }
    }
    return a
  }, {})
};

function mergeFn(a, b) {
  return function () {
    a && a.apply(this, arguments);
    b && b.apply(this, arguments);
  }
}

function extractAttributes(el) {
  const map = el.hasAttributes() ? el.attributes : [];
  const attrs = {};
  for (let i = 0; i < map.length; i++) {
    const attr = map[i];
    if (attr.value) {
      attrs[attr.name] = attr.value === '' ? true : attr.value;
    }
  }
  let klass, style;
  if (attrs.class) {
    klass = attrs.class;
    delete attrs.class;
  }
  if (attrs.style) {
    style = attrs.style;
    delete attrs.style;
  }
  const data = {
    attrs,
    class: klass,
    style,
  };
  return data
}

function freeze(item) {
  if (Array.isArray(item) || typeof item === 'object') {
    return Object.freeze(item)
  }
  return item
}

function combinePassengers(transports, slotProps = {}) {
  return transports.reduce((passengers, transport) => {
    let newPassengers = transport.passengers[0];
    newPassengers =
      typeof newPassengers === 'function'
        ? newPassengers(slotProps)
        : transport.passengers;
    return passengers.concat(newPassengers)
  }, [])
}

function stableSort(array, compareFn) {
  return array
    .map((v, idx) => [idx, v])
    .sort(function (a, b) { return this(a[1], b[1]) || a[0] - b[0] }.bind(compareFn))
    .map(c => c[1])
}

const transports = {};

const Wormhole = Vue.extend({
  data: () => ({ transports }),
  methods: {
    open(transport) {
      const { to, from, passengers } = transport;
      if (!to || !from || !passengers) return

      transport.passengers = freeze(passengers);
      const keys = Object.keys(this.transports);
      if (keys.indexOf(to) === -1) {
        Vue.set(this.transports, to, []);
      }

      const currentIndex = this.getTransportIndex(transport);
      // Copying the array here so that the PortalTarget change event will actually contain two distinct arrays
      const newTransports = this.transports[to].slice(0);
      if (currentIndex === -1) {
        newTransports.push(transport);
      } else {
        newTransports[currentIndex] = transport;
      }
      this.transports[to] = stableSort(newTransports, function (a, b) {
        return a.order - b.order
      });
    },

    close(transport, force = false) {
      const { to, from } = transport;
      if (!to || !from) return
      if (!this.transports[to]) {
        return
      }

      if (force) {
        this.transports[to] = [];
      } else {
        const index = this.getTransportIndex(transport);
        if (index >= 0) {
          // Copying the array here so that the PortalTarget change event will actually contain two distinct arrays
          const newTransports = this.transports[to].slice(0);
          newTransports.splice(index, 1);
          this.transports[to] = newTransports;
        }
      }
    },

    hasTarget(to) {
      return this.transports.hasOwnProperty(to)
    },

    hasContentFor(to) {
      if (!this.transports[to]) {
        return false
      }
      return this.getContentFor(to).length > 0
    },

    getSourceFor(to) {
      return this.transports[to] && this.transports[to][0].from
    },

    getContentFor(to) {
      const transports = this.transports[to];
      if (!transports) {
        return undefined
      }
      return combinePassengers(transports)
    },

    getTransportIndex({ to, from }) {
      for (const i in this.transports[to]) {
        if (this.transports[to][i].from === from) {
          return i
        }
      }
      return -1
    },
  },
});

const wormhole = new Wormhole(transports);

// import { transports } from './wormhole'

var Target = {
  abstract: false,
  name: 'portalTarget',
  props: {
    attributes: { type: Object, default: () => ({}) },
    multiple: { type: Boolean, default: false },
    name: { type: String, required: true },
    slim: { type: Boolean, default: false },
    slotProps: { type: Object, default: () => ({}) },
    tag: { type: String, default: 'div' },
    transition: { type: [Boolean, String, Object], default: false },
    transitionEvents: { type: Object, default: () => ({}) },
  },
  data() {
    return {
      transports: wormhole.transports,
      firstRender: true,
    }
  },
  created() {
    if (!this.transports[this.name]) {
      this.$set(this.transports, this.name, []);
    }
  },
  mounted() {
    this.unwatch = this.$watch('ownTransports', this.emitChange);
    this.$nextTick(() => {
      if (this.transition) {
        // only when we have a transition, because it causes a re-render
        this.firstRender = false;
      }
    });
    if (this.$options.abstract) {
      this.$options.abstract = false;
    }
  },
  updated() {
    if (this.$options.abstract) {
      this.$options.abstract = false;
    }
  },
  beforeDestroy() {
    this.unwatch();
  },

  computed: {
    ownTransports() {
      const transports$$1 = this.transports[this.name] || [];
      if (this.multiple) {
        return transports$$1
      }
      return transports$$1.length === 0 ? [] : [transports$$1[transports$$1.length - 1]]
    },
    passengers() {
      return combinePassengers(this.ownTransports, this.slotProps)
    },
    hasAttributes() {
      return Object.keys(this.attributes).length > 0
    },
    withTransition() {
      return !!this.transition
    },
    transitionData() {
      const t = this.transition;
      const data = {};

      // During first render, we render a dumb transition without any classes, events and a fake name
      // We have to do this to emulate the normal behaviour of transitions without `appear`
      // because in Portals, transitions can behave as if appear was defined under certain conditions.
      if (
        this.firstRender &&
        (typeof this.transition === 'object' && !this.transition.appear)
      ) {
        data.props = { name: '__notranstition__portal-vue__' };
        return data
      }

      if (typeof t === 'string') {
        data.props = { name: t };
      } else if (typeof t === 'object') {
        data.props = t;
      }
      if (this.renderSlim) {
        data.props.tag = this.tag;
      }
      data.on = this.transitionEvents;

      return data
    },
    transportedClasses() {
      return this.ownTransports
        .map(transport => transport.class)
        .reduce((array, subarray) => array.concat(subarray), [])
      //.filter((string, index, array) => array.indexOf(string) === index)
    },
  },

  methods: {
    emitChange(newTransports, oldTransports) {
      if (this.multiple) {
        this.$emit('change', [...newTransports], [...oldTransports]);
      } else {
        const newTransport =
          newTransports.length === 0 ? undefined : newTransports[0];
        const oldTransport =
          oldTransports.length === 0 ? undefined : oldTransports[0];
        this.$emit('change', { ...newTransport }, { ...oldTransport });
      }
    },
    // can't be a computed prop because it has to "react" to $slot changes.
    children() {
      return this.passengers.length !== 0
        ? this.passengers
        : this.$slots.default || []
    },
    noWrapper() {
      const noWrapper = !this.hasAttributes && this.slim;
      if (noWrapper && this.children().length > 1) {
        console.warn(
          '[portal-vue]: PortalTarget with `slim` option received more than one child element.'
        );
      }
      return noWrapper
    },
  },
  render(h) {
    this.$options.abstract = true;
    const noWrapper = this.noWrapper();
    const children = this.children();
    const TransitionType = noWrapper ? 'transition' : 'transition-group';
    const Tag = this.tag;

    if (this.withTransition) {
      return h(
        TransitionType,
        babelHelperVueJsxMergeProps([this.transitionData, { 'class': 'vue-portal-target' }]),
        [children]
      );
    }

    return noWrapper ? children[0] : h(
      Tag,
      babelHelperVueJsxMergeProps([{
        'class': 'vue-portal-target ' + this.transportedClasses.join(' ')
      }, this.attributes]),
      [children]
    );
  },
};

const inBrowser = typeof window !== 'undefined';

let pid = 1;

var Portal = {
  abstract: false,
  name: 'portal',
  props: {
    /* global HTMLElement */
    disabled: { type: Boolean, default: false },
    name: { type: String, default: () => String(pid++) },
    order: { type: Number, default: 0 },
    slim: { type: Boolean, default: false },
    slotProps: { type: Object, default: () => ({}) },
    tag: { type: [String], default: 'DIV' },
    targetEl: { type: inBrowser ? [String, HTMLElement] : String },
    breakshadow: { type: Boolean, default: false },
    targetClass: { type: String },
    to: {
      type: String,
      default: () => String(Math.round(Math.random() * 10000000)),
    },
  },

  mounted() {
    if (this.targetEl) {
      if (this.breakshadow)
        setTimeout(() => this.mountToTarget(), 100);
      else
        this.mountToTarget();
    }
    if (!this.disabled) {
      this.sendUpdate();
    }
    // Reset hack to make child components skip the portal when defining their $parent
    // was set to true during render when we render something locally.
    if (this.$options.abstract) {
      this.$options.abstract = false;
    }
  },

  updated() {
    if (this.disabled) {
      this.clear();
    } else {
      this.sendUpdate();
    }
    // Reset hack to make child components skip the portal when defining their $parent
    // was set to true during render when we render something locally.
    if (this.$options.abstract) {
      this.$options.abstract = false;
    }
  },

  beforeDestroy() {
    this.clear();
    if (this.mountedComp) {
      this.mountedComp.$destroy();
    }
  },
  watch: {
    to(newValue, oldValue) {
      oldValue && oldValue !== newValue && this.clear(oldValue);
      this.sendUpdate();
    },
    targetEl(newValue, oldValue) {
      if (newValue) {
        this.mountToTarget();
      }
    },
  },

  methods: {
    normalizedSlots() {
      return this.$scopedSlots.default
        ? [this.$scopedSlots.default]
        : this.$slots.default
    },
    sendUpdate() {
      const slotContent = this.normalizedSlots();

      if (slotContent) {
        wormhole.open({
          from: this.name,
          to: this.to,
          passengers: [...slotContent],
          class: this.targetClass && this.targetClass.split(' '),
          order: this.order,
        });
      } else {
        this.clear();
      }
    },

    clear(target) {
      wormhole.close({
        from: this.name,
        to: target || this.to,
      });
    },

    mountToTarget() {
      let el;
      const target = this.targetEl;

      if (typeof target === 'string') {
        el = document.querySelector(target);
      } else if (target instanceof HTMLElement) {
        el = target;
      } else {
        console.warn(
          '[vue-portal]: value of targetEl must be of type String or HTMLElement'
        );
        return
      }

      if (el) {
        const newTarget = new Vue({
          ...Target,
          parent: this,
          propsData: {
            name: this.to,
            tag: el.tagName,
            attributes: extractAttributes(el),
          },
        });
        newTarget.$mount(el);
        this.mountedComp = newTarget;
      } else {
        console.warn(
          '[vue-portal]: The specified targetEl ' + target + ' was not found'
        );
      }
    },
    normalizeChildren(children) {
      return typeof children === 'function'
        ? children(this.slotProps)
        : children
    },
  },

  render(h) {
    const children = this.$slots.default || this.$scopedSlots.default || [];
    const Tag = this.tag;
    if (children.length && this.disabled) {
      // hack to make child components skip the portal when defining their $parent
      this.$options.abstract = true;
      return children.length <= 1 && this.slim ? children[0] : h(Tag, [this.normalizeChildren(children)]);
    } else {
      return h(this.tag, { class: { 'v-portal': true }, style: { display: 'none' }, key: 'v-portal-placeholder' })
    }
  },
};

function install(Vue$$1, opts = {}) {
  Vue$$1.component(opts.portalName || 'Portal', Portal);
  Vue$$1.component(opts.portalTargetName || 'PortalTarget', Target);
}

var index = {
  install,
  Portal,
  PortalTarget: Target,
  Wormhole: wormhole,
};

export default index;

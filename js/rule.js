import { createNotification } from './app.js';
import { Vue } from './vue.js';
import { store } from '../js/app.js';

class Component {
  constructor(name) {
    if (this.constructor === Component)
      throw new TypeError('Can not construct abstract class.');

    this.name = name;
    this.data = {};
  }

  worker() { }
}

class Control {

  constructor(key) {
    if (this.constructor === Control)
      throw new TypeError('Can not construct abstract class');
    if (!key)
      throw new Error('The key parameter is missing in super() of Control ');

    this.key = key;
    this.data = {};
    this.parent = null;
  }

  getNode() {
    if (this.parent === null)
      throw new Error("Control isn't added to Node/Input");

    return this.parent instanceof Node ? this.parent : this.parent.node;
  }

  getData(key) {
    return this.getNode().data[key];
  }

  putData(key, data) {
    this.getNode().data[key] = data;
    return this;//ADDED
  }
}

class Connection {

  constructor(output, input) {
    this.output = output;
    this.input = input;
    this.data = {};

    this.input.addConnection(this);
  }

  remove() {
    this.input.removeConnection(this);
    this.output.removeConnection(this);
  }
}

class IO {

  constructor(key, name, socket, multiConns) {
    this.node = null;
    this.multipleConnections = multiConns;
    this.connections = [];

    this.key = key;
    this.name = name;
    this.socket = socket;
  }

  removeConnection(connection) {
    this.connections.splice(this.connections.indexOf(connection), 1);
  }

  removeConnections() {
    this.connections.map(connection => this.removeConnection(connection));
  }
}

class Socket {

  constructor(name, data = {}) {
    this.name = name;
    this.data = data;
    this.compatible = [];
  }

  combineWith(socketName) {
    this.compatible.push(socketName);
  }

  compatibleWith(socket) {
    return this.name == socket.name || socket.compatible.includes(this.name);
  }
}

class Input extends IO {

  constructor(key, title, socket, multiConns = false) {
    super(key, title, socket, multiConns);
    this.control = null;
  }

  hasConnection() {
    return this.connections.length > 0;
  }

  addConnection(connection) {
    if (!this.multipleConnections && this.hasConnection())
      throw new Error('Multiple connections not allowed');
    this.connections.push(connection);
  }

  addControl(control) {
    this.control = control;
    control.parent = this;
  }

  showControl() {
    return !this.hasConnection() && this.control !== null;
  }
}

class Output extends IO {

  constructor(key, title, socket, multiConns = true) {
    super(key, title, socket, multiConns);
  }

  hasConnection() {
    return this.connections.length > 0;
  }

  connectTo(input) {
    if (!this.socket.compatibleWith(input.socket))
      throw new Error('Sockets not compatible');
    if (!input.multipleConnections && input.hasConnection())
      throw new Error('Input already has one connection');
    if (!this.multipleConnections && this.hasConnection())
      throw new Error('Output already has one connection');

    var connection = new Connection(this, input);

    this.connections.push(connection);
    return connection;
  }

  connectedTo(input) {
    return this.connections.some((item) => {
      return item.input === input;
    });
  }
}

class Node {

  constructor(name) {
    this.name = name;
    this.id = Node.incrementId();
    this.position = [0.0, 0.0];

    this.inputs = new Map();
    this.outputs = new Map();
    this.controls = new Map();
    this.data = {};
    this.meta = {};
  }

  addControl(control) {
    control.parent = this;

    console.log("ADD CONTROL", control);
    this.controls.set(control.key, control);
    return this;
  }

  removeControl(control) {
    control.parent = null;

    this.controls.delete(control.key);
  }

  addInput(input) {
    if (input.node !== null)
      throw new Error('Input has already been added to the node');

    input.node = this;

    this.inputs.set(input.key, input);
    return this;
  }

  removeInput(input) {
    input.removeConnections();
    input.node = null;

    this.inputs.delete(input.key);
  }

  addOutput(output) {
    if (output.node !== null)
      throw new Error('Output has already been added to the node');

    output.node = this;

    this.outputs.set(output.key, output);
    return this;
  }

  removeOutput(output) {
    output.removeConnections();
    output.node = null;

    this.outputs.delete(output.key);
  }

  getConnections() {
    const ios = [...this.inputs.values(), ...this.outputs.values()];
    const connections = ios.reduce((arr, io) => {
      return [...arr, ...io.connections];
    }, []);

    return connections;
  }

  update() { }

  static incrementId() {
    if (!this.latestId)
      this.latestId = 1;
    else
      this.latestId++;
    return this.latestId
  }
}

class Component$1 extends Component {
  constructor(name) {
    super(name);
    if (this.constructor === Component$1)
      throw new TypeError('Can not construct abstract class.');

    this.editor = null;
    this.data = {};
  }

  async builder() { }

  async build(node) {
    await this.builder(node);

    return node;
  }

  async createNode(data = {}) {
    const node = new Node(this.name);

    node.data = data;
    await this.build(node);

    return node;
  }
}

class Events {

  constructor(handlers) {
    this.handlers = {
      warn: [console.warn],
      error: [console.error],
      ...handlers
    };
  }
}

class Emitter {

  constructor(events) {
    this.events = events instanceof Emitter ? events.events : events.handlers;
  }

  on(names, handler) {
    names.split(' ').forEach(name => {
      if (!this.events[name])
        throw new Error(`The event ${name} does not exist`);
      this.events[name].push(handler);
    });

    return this;
  }

  trigger(name, params) {
    if (!(name in this.events))
      throw new Error(`The event ${name} cannot be triggered`);

    return this.events[name].reduce((r, e) => {
      return (e(params) !== false) && r
    }, true); // return false if at least one event is false        
  }

  bind(name) {
    if (this.events[name])
      throw new Error(`The event ${name} is already bound`);

    this.events[name] = [];
  }

  exist(name) {
    return Array.isArray(this.events[name]);
  }
}

class Context extends Emitter {

  constructor(id, events) {
    super(events);

    if (!/^[\w-]{3,}@[0-9]+\.[0-9]+\.[0-9]+$/.test(id))
      throw new Error('ID should be valid to name@0.1.0 format');

    this.id = id;
    this.plugins = new Map();
  }

  use(plugin, options = {}) {
    if (plugin.name && this.plugins.has(plugin.name)) throw new Error(`Plugin ${plugin.name} already in use`)

    plugin.install(this, options);
    this.plugins.set(plugin.name, options);
  }
}

class EditorEvents extends Events {

  constructor() {
    super({
      nodecreate: [],
      nodecreated: [],
      noderemove: [],
      noderemoved: [],
      connectioncreate: [],
      connectioncreated: [],
      connectionremove: [],
      connectionremoved: [],
      translatenode: [],
      nodetranslate: [],
      nodetranslated: [],
      nodedraged: [],
      selectnode: [],
      nodeselect: [],
      nodeselected: [],
      rendernode: [],
      rendersocket: [],
      rendercontrol: [],
      renderconnection: [],
      updateconnection: [],
      componentregister: [],
      cleared: [],
      keydown: [],
      keyup: [],
      translate: [],
      translated: [],
      zoom: [],
      zoomed: [],
      click: [],
      mousemove: [],
      contextmenu: [],
      import: [],
      afterImport: [],
      export: [],
      process: [],
      showeditor: []
    });
  }
}

class Area extends Emitter {

  constructor(container, emitter) {
    super(emitter);

    const el = this.el = document.createElement('div');

    this.container = container;
    this.transform = { k: 1, x: 0, y: 0 };
    this.mouse = { x: 0, y: 0 };

    el.style.transformOrigin = '0 0';

    this._startPosition = null;
    // this._zoom = new Zoom(container, el, 0.1, this.onZoom.bind(this));
    //this._drag = new Drag(container, this.onTranslate.bind(this), this.onStart.bind(this));
    this.container.addEventListener('mousemove', this.mousemove.bind(this));

    this.update();
  }

  dispose() {
    //  this._drag.dispose();
  }

  update() {
    const t = this.transform;

    this.el.style.transform = `translate(${t.x}px, ${t.y}px) scale(${t.k})`;
  }

  mousemove(e) {
    const rect = this.el.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const k = this.transform.k;

    this.mouse = { x: x / k, y: y / k };
    this.trigger('mousemove', { ...this.mouse });
  }

  onStart() {
    this._startPosition = { ...this.transform };
  }

  onTranslate(dx, dy) {
    this.translate(this._startPosition.x + dx, this._startPosition.y + dy);
  }

  onZoom(delta, ox, oy, source) {
    this.zoom(this.transform.k * (1 + delta), ox, oy, source);

    this.update();
  }

  translate(x, y) {
    const params = { transform: this.transform, x, y };

    if (!this.trigger('translate', params)) return;

    this.transform.x = params.x;
    this.transform.y = params.y;

    this.update();
    this.trigger('translated');
  }

  zoom(zoom, ox = 0, oy = 0, source) {
    const k = this.transform.k;
    const params = { transform: this.transform, zoom, source };

    if (!this.trigger('zoom', params)) return;

    const d = (k - params.zoom) / ((k - zoom) || 1);

    this.transform.k = params.zoom || 1;
    this.transform.x += ox * d;
    this.transform.y += oy * d;

    this.update();
    this.trigger('zoomed', { source });
  }

  appendChild(el) {
    this.el.appendChild(el);
  }

  removeChild(el) {
    this.el.removeChild(el);
  }
}

class Control$1 extends Emitter {

  constructor(el, control, emitter) {
    super(emitter);
    this.trigger('rendercontrol', { el, control });
  }
}

class Socket$1 extends Emitter {

  constructor(el, type, io, node, emitter) {
    super(emitter);
    this.el = el;
    this.type = type;
    this.io = io;
    this.node = node;

    this.trigger('rendersocket', { el, [type]: this.io, socket: io.socket });
  }

  getPosition({ position }) {
    const el = this.el;

    return [
      position[0] + el.offsetLeft + el.offsetWidth / 2,
      position[1] + el.offsetTop + el.offsetHeight / 2
    ]
  }
}

class Node$1 extends Emitter {

  constructor(node, component, emitter) {
    super(emitter);

    this.node = node;
    this.component = component;
    this.sockets = new Map();
    this.controls = new Map();
    this.el = document.createElement('div');
    this.el.classList.add("nodewrapper");

    this.el.addEventListener('contextmenu', e => this.trigger('contextmenu', { e, node: this.node }));

    this._startPosition = null;
    // this._drag = new Drag(this.el, this.onTranslate.bind(this), this.onSelect.bind(this), () => {
    //   this.trigger('nodedraged', node);
    // });

    this.trigger('rendernode', {
      el: this.el,
      node,
      component: component.data,
      bindSocket: this.bindSocket.bind(this),
      bindControl: this.bindControl.bind(this)
    });

    this.update();
  }

  dispose() {
    // this._drag.dispose();
  }

  bindSocket(el, type, io) {
    this.sockets.set(io, new Socket$1(el, type, io, this.node, this));
  }

  bindControl(el, control) {
    this.controls.set(control, new Control$1(el, control, this));
  }

  getSocketPosition(io) {
    return this.sockets.get(io).getPosition(this.node);
  }

  onSelect(e) {
    this.onStart();
    this.trigger('selectnode', { node: this.node, accumulate: e.ctrlKey });
  }

  onStart() {
    this._startPosition = [...this.node.position];
  }

  onTranslate(dx, dy) {
    this.trigger('translatenode', { node: this.node, dx, dy });
  }

  onDrag(dx, dy) {
    const x = this._startPosition[0] + dx;
    const y = this._startPosition[1] + dy;

    this.translate(x, y);
  }

  translate(x, y) {
    const node = this.node;
    const params = { node, x, y };

    if (!this.trigger('nodetranslate', params)) return;

    const prev = [...node.position];

    node.position[0] = params.x;
    node.position[1] = params.y;

    this.update();
    this.trigger('nodetranslated', { node, prev });
  }

  update() {
    this.el.style.transform = `translate(${this.node.position[0]}px, ${this.node.position[1]}px)`;
  }
}

class Connection$1 extends Emitter {

  constructor(connection, inputNode, outputNode, emitter) {
    super(emitter);
    this.connection = connection;
    this.inputNode = inputNode;
    this.outputNode = outputNode;

    this.el = document.createElement('div');
    this.el.style.position = 'absolute';
    this.el.style.zIndex = '-1';

    this.trigger('renderconnection', {
      el: this.el,
      connection: this.connection,
      points: this.getPoints()
    });
  }

  getPoints() {
    const [x1, y1] = this.outputNode.getSocketPosition(this.connection.output);
    const [x2, y2] = this.inputNode.getSocketPosition(this.connection.input);

    return [x1, y1, x2, y2];
  }

  update() {
    this.trigger('updateconnection', {
      el: this.el,
      connection: this.connection,
      points: this.getPoints()
    });
  }
}

class EditorView extends Emitter {

  constructor(container, components, emitter) {
    super(emitter);

    this.container = container;
    this.components = components;

    this.nodes = new Map();
    this.connections = new Map();

    this.container.addEventListener('click', this.click.bind(this));
    this.container.addEventListener('contextmenu', e => this.trigger('contextmenu', { e, view: this }));
    //  this.boundResize = this.resize.bind(this);
    //  window.addEventListener('resize', this.boundResize);

    //this.on('nodetranslated', this.updateConnections.bind(this));

    this.area = new Area(container, this);
    this.container.appendChild(this.area.el);
  }

  dispose() {
    this.nodes.forEach(e => e.dispose());
    this.area.dispose();
    //  window.removeEventListener('resize', this.boundResize);
  }

  addNode(node) {
    const nodeView = new Node$1(node, this.components.get(node.name), this);

    this.nodes.set(node, nodeView);
    this.area.appendChild(nodeView.el);
    return nodeView;
  }

  removeNode(node) {
    const nodeView = this.nodes.get(node);

    nodeView.dispose();
    this.nodes.delete(node);
    this.area.removeChild(nodeView.el);
  }

  addConnection(connection) {
    const viewInput = this.nodes.get(connection.input.node);
    const viewOutput = this.nodes.get(connection.output.node);
    const connView = new Connection$1(connection, viewInput, viewOutput, this);

    this.connections.set(connection, connView);
    this.area.appendChild(connView.el);
  }

  removeConnection(connection) {
    const connView = this.connections.get(connection);

    this.connections.delete(connection);
    this.area.removeChild(connView.el);
  }

  updateConnections({ node }) {
    node.getConnections().map(conn => {
      this.connections.get(conn).update();
    });
  }

  click(e) {
    const container = this.container;

    if (container !== e.target) return;
    if (!this.trigger('click', { e, container })) return;
  }
}

class Selected {

  constructor() {
    this.list = [];
  }

  add(item, accumulate = false) {
    if (!accumulate)
      this.list = [item];
    else if (!this.contains(item))
      this.list.push(item);
  }

  clear() {
    this.list = [];
  }

  remove(item) {
    this.list.splice(this.list.indexOf(item), 1);
  }

  contains(item) {
    return this.list.indexOf(item) !== -1;
  }

  each(callback) {
    this.list.forEach(callback);
  }
}

class NodeEditor extends Context {

  constructor(id, container) {
    super(id, new EditorEvents());

    this.nodes = [];
    this.components = new Map();

    this.silent = false;
    this.selected = new Selected();
    this.view = new EditorView(container, this.components, this);

    this.boundTriggerKeydown = e => this.trigger('keydown', e);
    this.boundTriggerKeyup = e => this.trigger('keyup', e);
    window.addEventListener('keydown', this.boundTriggerKeydown);
    window.addEventListener('keyup', this.boundTriggerKeyup);
    this.on('selectnode', ({ node, accumulate }) => this.selectNode(node, accumulate));
    this.on('nodeselected', () => this.selected.each(n => this.view.nodes.get(n).onStart()));
    this.on('translatenode', ({ dx, dy }) => this.selected.each(n => this.view.nodes.get(n).onDrag(dx, dy)));
  }

  dispose() {
    this.view.dispose();
    window.removeEventListener('keydown', this.boundTriggerKeydown);
    window.removeEventListener('keyup', this.boundTriggerKeyup);
  }

  addNode(node) {
    if (!this.trigger('nodecreate', node)) return null;

    this.nodes.push(node);
    const nodeView = this.view.addNode(node);

    this.trigger('nodecreated', node);
    return nodeView;
  }

  removeNode(node) {
    if (!this.trigger('noderemove', node)) return;

    node.getConnections().forEach(c => this.removeConnection(c));

    this.nodes.splice(this.nodes.indexOf(node), 1);
    this.view.removeNode(node);

    this.trigger('noderemoved', node);
  }

  connect(output, input, data = {}) {
    if (!this.trigger('connectioncreate', { output, input })) return;

    try {
      const connection = output.connectTo(input);

      connection.data = data;
      this.view.addConnection(connection);

      this.trigger('connectioncreated', connection);
    } catch (e) {
      this.trigger('warn', e);
    }
  }

  removeConnection(connection) {
    if (!this.trigger('connectionremove', connection)) return;

    this.view.removeConnection(connection);
    connection.remove();

    this.trigger('connectionremoved', connection);
  }

  selectNode(node, accumulate = false) {
    if (this.nodes.indexOf(node) === -1)
      throw new Error('Node not exist in list');

    if (!this.trigger('nodeselect', node)) return;

    this.selected.add(node, accumulate);

    this.trigger('nodeselected', node);
  }

  getComponent(name) {
    const component = this.components.get(name);

    if (!component)
      throw `Component ${name} not found`;

    return component;
  }

  register(component) {
    component.editor = this;
    this.components.set(component.name, component);
    this.trigger('componentregister', component);
  }

  clear() {
    [...this.nodes].map(node => this.removeNode(node));
  }

  beforeImport(data, clear = false) {
    this.silent = true;
    if (clear) this.clear();
    if (data) this.trigger('import', data);
  }

  afterImport() {
    this.silent = false;
    this.trigger('afterImport');
  }

  isSilent() {
    return this.silent;
  }
}

/**
 * A vue mixin, that allows a dropdown or multiselect element
 * (or any dom element that takes an "options" property) to be populated
 * with OH Model data. The data is fetched on-demand from the Model Store
 * as soon as the element has been rendered by vue.
 * 
 * This is realized by the following vue directive called "v-dynamicload",
 * which as soon as the element binding happens, calls "performLoad".
 * 
 * The data is fetched once and not updated if the underlying model changes.
 * The data is cached, as long the the parent root vue is existing.
 * 
 * If you want the data to be refreshed when another vue element changed, you can
 * use a reactive variable instead of a static filter object as value.
 *
 * @example Example for a dropdown box that shows all available bindings, using the model table "bindings".
 * <ui-dropdown viewkey="name" desckey="description" valuekey="id" v-dynamicload:bindings="" ></ui-dropdown>
 * 
 * @example You can filter items of a table by using the directives value.
 * The value is an array of filter objects with a "name" and a regex "value".
 * <ui-dropdown viewkey="name" desckey="description" valuekey="id" v-dynamicload:bindings="[{ name: 'id', value: '^mqtt:' }]" ></ui-dropdown>
 * 
 * @example Use a reactive variable "bindingids". The directive will be executed again
 * when the variable changes.
 * <ui-dropdown viewkey="name" desckey="description" valuekey="id" v-dynamicload:bindings="bindingids" ></ui-dropdown>
 */
const DynamicLoadMixin = {
  directives: {
    dynamicload: {
      bind: (el, binding) => performLoad(el, binding),
      // Avoid to re-populate the dropdown/multiselect with same values by diffing old and old new filter array
      update: (el, binding) => {
        const newIsArray = Array.isArray(binding.value);
        const oldIsArray = Array.isArray(binding.oldValue);
        if (!newIsArray && !oldIsArray) return; // Both no valid values: exit
        if (newIsArray != oldIsArray) { // One is an array the other not: Perform an option recomputation
          performLoad(el, binding);
          return;
        }

        // Compute a string out of the filters and compare to saved filters string
        const filterString = binding.value.reduce((acc, filter) => acc += filter.name + filter.value, "");
        if (el.dataset.dynload_filterString != filterString) {
          performLoad(el, binding);
        }
      }
    }
  },
};

/**
 * This is the cache for all "v-dynamicload"s of one root vue instance.
 * There is no way to force a cache refresh, so use this mixin only for
 * static cases like selecting an Item for a Rule action or similar.
 */
const dynamicallyFetchedSharedData = {};

/**
 * Load a table from the backend store (like "rules","things" and so on)
 * and assign the asynchronously gathered data to the target dom element.
 * The target element is assumed to be a dropdown or multiselect element.
 * 
 * @param {Element} el A dom element
 * @param {Object} binding A vue directive binding object
 */
async function performLoad(el, binding) {
  el.dynamicLoadBind = binding;
  // The user wants the element to be deliberately empty
  if (binding.value === null) {
    el.options = [];
    return;
  }

  // First try to get a cached value
  let tabledata = dynamicallyFetchedSharedData[binding.arg];
  if (!tabledata) {
    const ischannel = binding.arg == "channels";
    if (!store.connected) {
      console.warn(`Dynamic load of ${binding.arg} failed. Not connected`);
      return;
    }
    // A lot of dom elements can ask for the same dynamically loaded data. We therefore store
    // the fetch promise in the cache object. Any consecutive load requests will receive the promise
    // (as long as the fetch is not resolved) instead of performing a parallel second, third.. fetch.
    const fetchPromise = store.get(ischannel ? "things" : binding.arg, null, { force: true });
    dynamicallyFetchedSharedData[binding.arg] = fetchPromise;
    tabledata = await fetchPromise.catch(e => console.warn(`Dynamic load of ${binding.arg} failed`, e));
    if (!tabledata) return;
    if (ischannel) {
      let channels = [];
      for (let thing of tabledata) {
        channels = channels.concat(thing.channels);
      }
      tabledata = channels;
    }
    // Assign value to the cache 
    dynamicallyFetchedSharedData[binding.arg] = tabledata;
  }

  // If cached data is a promise, resolve it now
  if (tabledata.then) tabledata = await tabledata;

  // Apply filters. This is for example used to filter "channels" by their "kind" (STATE, TRIGGER).
  // A filter looks like this: {"value": "TRIGGER","name": "kind"}
  let filters = Array.isArray(binding.value) ? binding.value : [];
  let filterString = "";
  for (let filter of filters) {
    const regex = new RegExp(filter.value);
    tabledata = tabledata.filter(item => item[filter.name].match(regex));
    filterString += filter.name + filter.value;
  }

  // Assign value to the target dom
  el.options = tabledata;
  el.dataset.dynload_filterString = filterString;
}

//

var script = {
  // If condensed is true: Render an "edit" button instead of inlining the component.
  // Useful for multi-line inputs and map widgets.
  props: {
    param: Object,
    value: [String, Number, Boolean, Object],
    condensed: {
      type: Boolean,
      default: false
    },
    desc: {
      type: Boolean,
      default: true
    }
  },
  computed: {
    canremove() {
      this.allowremove && this.param.defaultValue;
    }
  },
  mixins: [DynamicLoadMixin],
  methods: {
    get() {
      return this.value || this.param.defaultValue;
    },
    remove() {
      this.$emit("remove", this.param);
    },
    set(event) {
      this.$emit("input", event.target.value);
    },
    mapChanged(event) {
      this.$refs.mapcoordinates.value =
        event.target.value[0] + "," + event.target.value[1];
      this.$emit("input", this.$refs.mapcoordinates.value);
    }
  }
};

function normalizeComponent(template, style, script, scopeId, isFunctionalTemplate, moduleIdentifier /* server only */, shadowMode, createInjector, createInjectorSSR, createInjectorShadow) {
    if (typeof shadowMode !== 'boolean') {
        createInjectorSSR = createInjector;
        createInjector = shadowMode;
        shadowMode = false;
    }
    // Vue.extend constructor export interop.
    const options = typeof script === 'function' ? script.options : script;
    // render functions
    if (template && template.render) {
        options.render = template.render;
        options.staticRenderFns = template.staticRenderFns;
        options._compiled = true;
        // functional template
        if (isFunctionalTemplate) {
            options.functional = true;
        }
    }
    // scopedId
    if (scopeId) {
        options._scopeId = scopeId;
    }
    let hook;
    if (moduleIdentifier) {
        // server build
        hook = function (context) {
            // 2.3 injection
            context =
                context || // cached call
                    (this.$vnode && this.$vnode.ssrContext) || // stateful
                    (this.parent && this.parent.$vnode && this.parent.$vnode.ssrContext); // functional
            // 2.2 with runInNewContext: true
            if (!context && typeof __VUE_SSR_CONTEXT__ !== 'undefined') {
                context = __VUE_SSR_CONTEXT__;
            }
            // inject component styles
            if (style) {
                style.call(this, createInjectorSSR(context));
            }
            // register component module identifier for async chunk inference
            if (context && context._registeredComponents) {
                context._registeredComponents.add(moduleIdentifier);
            }
        };
        // used by ssr in case component is cached and beforeCreate
        // never gets called
        options._ssrRegister = hook;
    }
    else if (style) {
        hook = shadowMode
            ? function () {
                style.call(this, createInjectorShadow(this.$root.$options.shadowRoot));
            }
            : function (context) {
                style.call(this, createInjector(context));
            };
    }
    if (hook) {
        if (options.functional) {
            // register for functional component in vue file
            const originalRender = options.render;
            options.render = function renderWithStyleInjection(h, context) {
                hook.call(context);
                return originalRender(h, context);
            };
        }
        else {
            // inject component registration as beforeCreate hook
            const existing = options.beforeCreate;
            options.beforeCreate = existing ? [].concat(existing, hook) : [hook];
        }
    }
    return script;
}

/* script */
const __vue_script__ = script;

/* template */
var __vue_render__ = function() {
  var _vm = this;
  var _h = _vm.$createElement;
  var _c = _vm._self._c || _h;
  return _c(
    "div",
    {
      staticClass: "element",
      class: { isboolean: _vm.param.type == "BOOLEAN" }
    },
    [
      _vm.param.type != "BOOLEAN"
        ? _c("label", { attrs: { title: _vm.param.description } }, [
            _vm._v(_vm._s(_vm.param.label))
          ])
        : _vm._e(),
      _vm._v(" "),
      _c(
        "button",
        {
          staticClass: "btn btn-outline-danger btn-sm resetdefault",
          attrs: { disabled: !_vm.value, title: "Reset to default" },
          on: {
            click: function($event) {
              $event.preventDefault();
              return _vm.remove()
            }
          }
        },
        [_c("i", { staticClass: "fas fa-undo" })]
      ),
      _vm._v(" "),
      _vm.param.type == "BOOLEAN"
        ? _c("ui-switch", {
            staticClass: "configcontrol",
            attrs: {
              label: _vm.param.label || _vm.param.name,
              title: "Default value: " + _vm.param.defaultValue
            },
            domProps: { value: _vm.get() },
            on: { input: _vm.set }
          })
        : _vm.param.type == "DECIMAL" || _vm.param.type == "INTEGER"
        ? _c("input", {
            staticClass: "form-control configcontrol",
            attrs: {
              type: "number",
              min: _vm.param.min,
              max: _vm.param.max,
              title: "Default value: " + _vm.param.defaultValue
            },
            domProps: { value: _vm.get() },
            on: { input: _vm.set }
          })
        : _vm.param.type == "TEXT" &&
          ["time", "tel", "email", "url", "password"].includes(
            _vm.param.context
          )
        ? _c("input", {
            staticClass: "form-control configcontrol",
            attrs: {
              type: _vm.param.context,
              title: "Default value: " + _vm.param.defaultValue
            },
            domProps: { value: _vm.get() },
            on: { input: _vm.set }
          })
        : _vm.param.context == "tags"
        ? _c("ui-tags", {
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue
            },
            on: { input: _vm.set }
          })
        : _vm.param.type == "TEXT" &&
          _vm.param.limitToOptions === true &&
          _vm.param.options &&
          _vm.param.options.length > 0
        ? _c("ui-dropdown", {
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue,
              placeholder: "Please select",
              valuekey: "value",
              viewkey: "label"
            },
            domProps: { options: _vm.param.options },
            on: { input: _vm.set }
          })
        : _vm.param.type == "TEXT" &&
          _vm.param.limitToOptions === true &&
          _vm.param.options &&
          _vm.param.options.length > 0 &&
          _vm.param.multiple
        ? _c("ui-multiselect", {
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue,
              placeholder: "Please select",
              valuekey: "value",
              viewkey: "label"
            },
            domProps: { options: _vm.param.options },
            on: { input: _vm.set }
          })
        : _vm.param.context == "script"
        ? _c(
            "a",
            {
              staticClass: "btn btn-primary-hover configcontrol",
              attrs: {
                href: "#editor",
                title: "Default value: " + _vm.param.defaultValue
              },
              on: {
                click: function($event) {
                  return this.$emit("showeditor")
                }
              }
            },
            [_vm._v("Edit script")]
          )
        : _vm.param.context == "json"
        ? _c(
            "a",
            {
              staticClass: "btn btn-primary-hover configcontrol",
              attrs: {
                href: "#editor",
                title: "Default value: " + _vm.param.defaultValue
              },
              on: {
                click: function($event) {
                  return this.$emit("showeditor", {
                    mimetype: "application/json"
                  })
                }
              }
            },
            [_vm._v("Edit json")]
          )
        : _vm.param.context == "date"
        ? _c("ui-time-picker", {
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue
            },
            on: { input: _vm.set }
          })
        : _vm.param.context == "datetime"
        ? _c("ui-time-picker", {
            staticClass: "configcontrol",
            attrs: {
              "enable-time": "true",
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue
            },
            on: { input: _vm.set }
          })
        : _vm.param.context == "rule" && _vm.param.multiple
        ? _c("ui-multiselect", {
            directives: [
              {
                name: "dynamicload",
                rawName: "v-dynamicload:rules",
                value: _vm.param.filterCriteria,
                expression: "param.filterCriteria",
                arg: "rules"
              }
            ],
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue,
              valuekey: "uid",
              viewkey: "name"
            },
            on: { input: _vm.set }
          })
        : _vm.param.context == "rule"
        ? _c("ui-dropdown", {
            directives: [
              {
                name: "dynamicload",
                rawName: "v-dynamicload:rules",
                value: _vm.param.filterCriteria,
                expression: "param.filterCriteria",
                arg: "rules"
              }
            ],
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue,
              valuekey: "uid",
              viewkey: "name"
            },
            on: { input: _vm.set }
          })
        : _vm.param.context == "channel" && _vm.param.multiple
        ? _c("ui-multiselect", {
            directives: [
              {
                name: "dynamicload",
                rawName: "v-dynamicload:channels",
                value: _vm.param.filterCriteria,
                expression: "param.filterCriteria",
                arg: "channels"
              }
            ],
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue,
              valuekey: "uid",
              viewkey: "label"
            },
            on: { input: _vm.set }
          })
        : _vm.param.context == "channel"
        ? _c("ui-dropdown", {
            directives: [
              {
                name: "dynamicload",
                rawName: "v-dynamicload:channels",
                value: _vm.param.filterCriteria,
                expression: "param.filterCriteria",
                arg: "channels"
              }
            ],
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue,
              valuekey: "uid",
              viewkey: "label"
            },
            on: { input: _vm.set }
          })
        : _vm.param.context == "item" && _vm.param.multiple
        ? _c("ui-multiselect", {
            directives: [
              {
                name: "dynamicload",
                rawName: "v-dynamicload:items",
                value: _vm.param.filterCriteria,
                expression: "param.filterCriteria",
                arg: "items"
              }
            ],
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue,
              valuekey: "name",
              viewkey: "label"
            },
            on: { input: _vm.set }
          })
        : _vm.param.context == "item"
        ? _c("ui-dropdown", {
            directives: [
              {
                name: "dynamicload",
                rawName: "v-dynamicload:items",
                value: _vm.param.filterCriteria,
                expression: "param.filterCriteria",
                arg: "items"
              }
            ],
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue,
              valuekey: "name",
              desckey: "name",
              viewkey: "label"
            },
            on: { input: _vm.set }
          })
        : _vm.param.context == "cronexpression"
        ? _c("ui-cron-expression", {
            staticClass: "configcontrol",
            attrs: {
              value: _vm.get(),
              title: "Default value: " + _vm.param.defaultValue
            },
            on: { input: _vm.set }
          })
        : _vm.param.context == "location"
        ? _c(
            "div",
            { attrs: { title: "Default value: " + _vm.param.defaultValue } },
            [
              _c("input", {
                ref: "mapcoordinates",
                staticClass: "form-control configcontrol",
                domProps: { value: _vm.get() },
                on: { input: _vm.set }
              }),
              _vm._v(" "),
              !_vm.condensed
                ? _c("ui-maps", { on: { change: _vm.mapChanged } })
                : _vm._e()
            ],
            1
          )
        : _c("input", {
            staticClass: "form-control configcontrol",
            attrs: { title: "Default value: " + _vm.param.defaultValue },
            domProps: { value: _vm.get() },
            on: { input: _vm.set }
          }),
      _vm._v(" "),
      _vm.desc
        ? _c("div", {
            staticClass: "configdesc",
            domProps: { innerHTML: _vm._s(_vm.param.description) }
          })
        : _vm._e()
    ],
    1
  )
};
var __vue_staticRenderFns__ = [];
__vue_render__._withStripped = true;

  /* style */
  const __vue_inject_styles__ = undefined;
  /* scoped */
  const __vue_scope_id__ = undefined;
  /* module identifier */
  const __vue_module_identifier__ = undefined;
  /* functional template */
  const __vue_is_functional_template__ = false;
  /* style inject */
  
  /* style inject SSR */
  

  
  var VueConfigElement = normalizeComponent(
    { render: __vue_render__, staticRenderFns: __vue_staticRenderFns__ },
    __vue_inject_styles__,
    __vue_script__,
    __vue_scope_id__,
    __vue_is_functional_template__,
    __vue_module_identifier__,
    undefined,
    undefined
  );

const replace = s => s.toLowerCase().replace(/ /g, '-');

const RuleNode = {
  template: '#rulenode',
  props: ['node', 'editor', 'bindSocket', 'bindControl'],
  components: {
    'vue-config-element': VueConfigElement
  },
  methods: {
    edit() {

    },
    showEditor(control) {
      this.editor.trigger('showeditor', { control });
    },
    sanitizedName(name) {
      return replace(name);
    },
    inputs() {
      return Array.from(this.node.inputs.values())
    },
    outputs() {
      return Array.from(this.node.outputs.values())
    },
    controls(n = null) {
      let v = Array.from(this.node.controls.values());
      if (n) {
        this.hasmore |= v.length > n;
        return v.slice(0, n);
      }
      return v;
    },
    selected() {
      return this.editor.selected.contains(this.node) ? 'selected' : '';
    },
    remove() {
      this.node.remove();
    },
    move(rel = 0) {
      let index = this.editor.nodes.findIndex(e => e == this.node);
      if (index == -1) return;
      const newindex = index + rel;
      // Check array bounds
      if (newindex < 0 || newindex > this.editor.nodes.length) return;
      // Check if the other element is still from the same type
      // (remember that we have triggers, conditions, actions and labels in the same nodes array.)
      if (this.editor.nodes[newindex].data.type != this.node.data.type) return;
      // Swap elements
      const temp = this.editor.nodes[newindex];
      this.editor.nodes[newindex] = this.node;
      this.editor.nodes[index] = temp;
      this.editor.trigger('nodetranslated', { node: this.node });
      console.log("MOVE", index, this.node, temp);
    }
  },
  data: () => ({
    islast: false,
    isfirst: false,
    hasmore: false
  }),
  directives: {
    // If a configuration uses this directive, the edit button
    // will be shown, even if all controls could be rendered.
    requirelarge: {
      bind() {
        this.hasmore = true;
      }
    },
    socket: {
      bind(el, binding, vnode) {
        vnode.context.bindSocket(el, binding.arg, binding.value);
      }
    },
    control: {
      bind(el, binding, vnode) {
        if (!binding.value) return;

        vnode.context.bindControl(el, binding.value);
      }
    }
  },
  computed: {
    classes: function () {
      return [replace(this.selected()), this.node.data.type];
    },
    title: function () {
      return this.node.name + '\n' + this.node.data.hint;
    }
  }
};

function createVue(el, vueComponent, vueProps) {
  const nodeEl = document.createElement('div');
  el.appendChild(nodeEl);
  const app = Object.assign(new Vue(vueComponent), vueProps);
  app.$mount(nodeEl);
  return app;
}

function createNode(editor, { el, node, component, bindSocket, bindControl }) {
  const vueComponent = component.component || RuleNode;
  const vueProps = { ...component.props, node, editor, bindSocket, bindControl };
  const app = createVue(el, vueComponent, vueProps);
  node.vueContext = app;
  if (node.mounted) node.mounted();
  return app;
}

const update = (entity) => {
  if (entity.vueContext)
    entity.vueContext.$forceUpdate();
};

function install(editor, params) {
  editor.on('rendernode', ({ el, node, component, bindSocket, bindControl }) => {
    node.vueContext = createNode(editor, { el, node, component, bindSocket, bindControl });
    node.update = () => update(node);
  });

  editor.on('rendercontrol', ({ el, control }) => {
    //control.vueContext = createControl(editor, { el, control });
    //control.update = () => update(control)
  });

  editor.on('connectioncreated connectionremoved', connection => {
    update(connection.output.node);
    update(connection.input.node);
  });

  editor.on('nodeselected', () => {
    editor.nodes.forEach(update);
  });
}

var VueRenderPlugin = {
  name: 'vue-render',
  install
};

function toTrainCase(str) {
    return str.toLowerCase().replace(/ /g, '-');
}

function defaultPath(points, curvature) {
    const [x1, y1, x2, y2] = points;
    const hx1 = x1 + Math.abs(x2 - x1) * curvature;
    const hx2 = x2 - Math.abs(x2 - x1) * curvature;

    return `M ${x1} ${y1} C ${hx1} ${y1} ${hx2} ${y2} ${x2} ${y2}`;
}

function renderPathData(emitter, points, connection) {
    const data = { points, connection, d: '' };
    
    emitter.trigger('connectionpath', data);
    
    return data.d || defaultPath(points, 0.4);
}

function updateConnection({ el, d }) {
    const path = el.querySelector('.connection path');

    if (!path) throw new Error('Path of connection was broken');

    path.setAttribute('d', d);
}

function renderConnection({ el, d, connection }) {
    const classed = !connection?[]:[
        'input-' + toTrainCase(connection.input.name),
        'output-' + toTrainCase(connection.output.name),
        'socket-input-' + toTrainCase(connection.input.socket.name),
        'socket-output-' + toTrainCase(connection.output.socket.name)
    ];

    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');

    svg.classList.add('connection', ...classed);
    path.classList.add('main-path');
    path.setAttribute('d', d);

    svg.appendChild(path);
    el.appendChild(svg);

    updateConnection({ el, d });
}

class Picker {

    constructor(editor) {
        this.el = document.createElement('div');
        this.editor = editor;
        this._output = null;
    }

    get output() {
        return this._output;
    }

    set output(val) {
        const { area } = this.editor.view;

        this._output = val;
        if (val !== null) {
            area.appendChild(this.el);
            this.renderConnection();
        } else if (this.el.parentElement) {
            area.removeChild(this.el);
            this.el.innerHTML = '';
        }
    }

    getPoints() {
        const mouse = this.editor.view.area.mouse;
        const node = this.editor.view.nodes.get(this.output.node);
        const [x1, y1] = node.getSocketPosition(this.output);

        return [x1, y1, mouse.x, mouse.y];
    }

    updateConnection() {
        if (!this.output) return;

        const d = renderPathData(this.editor, this.getPoints());

        updateConnection({ el: this.el, d });
    }

    renderConnection() {
        if (!this.output) return;

        const d = renderPathData(this.editor, this.getPoints());

        renderConnection({ el: this.el, d, connection: null });
    }

}

function install$1(editor) {
  editor.bind('connectionpath');

  const picker = new Picker(editor);

  function pickOutput(output) {
    if (output && !picker.output) {
      picker.output = output;
      return;
    }
  }

  function pickInput(input) {
    if (picker.output === null) {
      if (input.hasConnection()) {
        picker.output = input.connections[0].output;
        editor.removeConnection(input.connections[0]);
      }
      return true;
    }

    if (!input.multipleConnections && input.hasConnection())
      editor.removeConnection(input.connections[0]);

    if (!picker.output.multipleConnections && picker.output.hasConnection())
      editor.removeConnection(picker.output.connections[0]);

    if (picker.output.connectedTo(input)) {
      const connection = input.connections.find(c => c.output === picker.output);

      editor.removeConnection(connection);
    }

    editor.connect(picker.output, input);
    picker.output = null;
  }

  function pickConnection(connection) {
    const { output } = connection;

    editor.removeConnection(connection);
    picker.output = output;
  }

  editor.on('rendersocket', ({ el, input, output }) => {

    let prevent = false;

    function mouseHandle(e) {
      if (prevent) return;
      e.stopPropagation();
      e.preventDefault();

      if (input)
        pickInput(input);
      else if (output)
        pickOutput(output);
    }

    el.addEventListener('mousedown', e => (mouseHandle(e), prevent = true));
    el.addEventListener('mouseup', mouseHandle);
    el.addEventListener('click', e => (mouseHandle(e), prevent = false));
    el.addEventListener('mousemove', () => (prevent = false));
  });

  editor.on('mousemove', () => { picker.updateConnection(); });

  editor.view.container.addEventListener('mousedown', () => {
    picker.output = null;
  });

  editor.on('renderconnection', ({ el, connection, points }) => {
    const d = renderPathData(editor, points, connection);

    el.addEventListener('contextmenu', e => {
      e.stopPropagation();
      e.preventDefault();

      pickConnection(connection);
    });

    renderConnection({ el, d, connection });
  });

  editor.on('updateconnection', ({ el, connection, points }) => {
    const d = renderPathData(editor, points, connection);

    updateConnection({ el, connection, d });
  });
}

var ConnectionPlugin = {
  install: install$1,
  defaultPath
};

const captionHeight = 32;
const captionMargin = 16;
const nodeGap = 64;

/**
 * Responsible for importing OH rule json objects and exporting those objects.
 * 
 * @param {NodeEditor} editor The rete editor
 * @param {Object} Settings The settings
 * @param {Number} Settings.size The grid pattern size
 * @category Rules
 * @memberof module:rule
 */
class LayoutManager {
  constructor(editor, { size = 16 }) {
    this.editor = editor;
    this.size = size;
    this.actionY = 0;

    //  editor.on('nodetranslate', this._onTranslate.bind(this))
    editor.on('nodecreated', this._onNodeCreated.bind(this));
    editor.on('noderemoved', this._onNodeRemoved.bind(this));
    editor.on('noderemove', this._onNodeRemove.bind(this));
    editor.on('afterImport', this.relayout.bind(this));
    editor.on('nodetranslated', this.fullrelayout.bind(this));
    // editor.on('cleared', async () => await this.initEditor());

    this.initEditor();
  }

  dispose() {
    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound, { passive: true });
    if (this.debounceResizeTimer) clearInterval(this.debounceResizeTimer);
    delete this.debounceResizeTimer;
    this.editor.view.container.removeEventListener("dragover", this.boundDragover, true);
    this.editor.view.container.removeEventListener("drop", this.boundDrop, true);
  }

  /**
   * Creates the inital text nodes (labels) to show the user where the triggers, conditions and actions go.
   */
  async initEditor() {
    this.nodes = { trigger: [], condition: [], action: [] };
    this.editor.beforeImport(null, false);
    this.triggerCaption = this.editor.addNode(await this.editor.getComponent("trigger").createNode());
    this.conditionCaption = this.editor.addNode(await this.editor.getComponent("condition").createNode());
    this.actionCaption = this.editor.addNode(await this.editor.getComponent("action").createNode());
    this.editor.afterImport();

    if (this.resizeBound) window.removeEventListener('resize', this.resizeBound, { passive: true });
    this.resizeBound = () => {
      if (this.debounceResizeTimer) {
        clearTimeout(this.debounceResizeTimer);
        delete this.debounceResizeTimer;
      }
      this.debounceResizeTimer = setTimeout(() => {
        let newOffset = { width: this.editor.view.container.offsetWidth, height: this.editor.view.container.offsetHeight - 50 };
        if (this.offset.height != newOffset.height || this.offset.width != newOffset.width) {
          this.relayout();
        }
      }, 500);
    };
    window.addEventListener('resize', this.resizeBound, { passive: true });
  }

  _onTranslate(data) {
    return false;
    // let { x, y, node } = data;
    // if (node.data.fixed) return false;
    // if (["trigger", "condition"].includes(node.data.type)) return false;

    // if (x < nodeGap) x = nodeGap;
    // if (y < this.actionY) y = this.actionY;

    // data.x = this._snap(x);
    // data.y = this._snap(y);
  }

  _snap(value) {
    return Math.round(value / this.size) * this.size;
  }

  _onNodeCreated(node) {
    if (node.data.type) this.nodes[node.data.type].push(node);
    if (!this.editor.silent) this.relayout();
  }

  _onNodeRemove(node) {
    if (node == this.triggerCaption.node ||
      node == this.conditionCaption.node ||
      node == this.actionCaption.node) return false;
    return true;
  }

  _onNodeRemoved(node) {
    if (!node.data.type) return;
    this.nodes[node.data.type] = this.nodes[node.data.type].filter(e => e !== node);
    if (!this.editor.silent) this.relayout();
  }

  _normalizeRow(nodeViews, mRowHeight) {
    if (nodeViews.length < 2) return;
    for (let nodeView of nodeViews) nodeView.el.style.minHeight = mRowHeight + "px";
  }

  _layoutNodes(nodes, pos, xStart, editorwidth) {
    let { x, y } = pos;
    let i = 0;
    let nodesInRow = [];
    let mRowHeight = 0;

    for (let item of nodes) {
      const nodeView = this.editor.view.nodes.get(item);
      const r = nodeView.el.getBoundingClientRect();

      if (x + nodeGap + r.width > editorwidth) {
        this._normalizeRow(nodesInRow, mRowHeight);
        x = xStart;
        y += mRowHeight + nodeGap;
        nodesInRow = [];
        mRowHeight = 0;
      }

      item.position = [x, y];
      nodeView.el.style.minHeight = "";
      item.vueContext.isfirst = i == 0;
      item.vueContext.islast = i == nodes.length - 1;
      nodeView.update();
      nodesInRow.push(nodeView);
      x += Math.round(r.width) + nodeGap;
      mRowHeight = Math.max(mRowHeight, r.height);
      ++i;
    }
    y += mRowHeight;
    this._normalizeRow(nodesInRow, mRowHeight);
    return { x, y };
  }

  _widthBiggerThen(nodes, remainingWidth, xStart) {
    let w = xStart;
    for (let item of nodes) {
      const nodeView = this.editor.view.nodes.get(item);
      const r = nodeView.el.getBoundingClientRect();
      w += r.width + nodeGap;
      if (w > remainingWidth) return true;
    }
    return false;
  }

  fullrelayout() {
    this.nodes = {};
    for (let node of this.editor.nodes) this.nodes[node.data.type].push(node);
    this.relayout();
  }

  relayout() {
    // Triggers first
    const editorwidth = this.editor.view.container.getBoundingClientRect().width;
    this.triggerCaption.node.position = [0, 0];
    this.triggerCaption.update();
    let pos = { x: nodeGap, y: captionHeight + captionMargin };
    pos = this._layoutNodes(this.nodes.trigger, pos, nodeGap, editorwidth);

    // Conditions either in the same row or starting in a separate one
    if (this._widthBiggerThen(this.nodes.condition, editorwidth - pos.x, nodeGap)) { // Separate row
      pos.x = nodeGap;
      this.conditionCaption.node.position = [0, pos.y + captionMargin];
      this.conditionCaption.update();
      pos.y += captionHeight + captionMargin * 2;
      pos = this._layoutNodes(this.nodes.condition, pos, nodeGap, editorwidth);
    } else { // Same row
      this.conditionCaption.node.position = [pos.x, 0];
      this.conditionCaption.update();
      pos.x += nodeGap;
      // For rendering the actions after the conditions and triggers, we need to remember the
      // y coordinate after the trigger components, reset Y and render conditions and then take
      // the maximum y of both parts.
      let triggersY = pos.y;
      pos.y = captionHeight + captionMargin;
      pos = this._layoutNodes(this.nodes.condition, pos, nodeGap, editorwidth);
      pos.y = Math.max(triggersY, pos.y);
    }

    pos.x = nodeGap;
    this.actionCaption.node.position = [0, pos.y + captionMargin];
    this.actionCaption.update();
    pos.y += captionHeight + captionMargin * 2;
    this.actionY = pos.y;
    pos = this._layoutNodes(this.nodes.action, pos, nodeGap, editorwidth);

    const view = this.editor.view;
    const rectContainer = view.container.getBoundingClientRect();
    view.area.el.style.width = (rectContainer.width - 50) + 'px';
    view.area.el.style.height = pos.y + 'px';

    this.offset = { width: view.container.offsetWidth, height: view.container.offsetHeight - 50 };

    for (let [conn, connV] of this.editor.view.connections) {
      connV.update();
    }
  }

  showDropzone(moduletype) {

  }

  removeDrop() {

  }
}

class BaseControl extends Control {
  constructor(emitter, key, desc) {
    super(key);
    this.render = 'vue';
    this.emitter = emitter;
    this.desc = desc;
    this.label = "";
    this.description = "";
    this.value = "";
  }
}

/**
 * A rete component. Represets a OH Rule component (trigger,condition,action) and contains rete controls
 * for each OH rule component configuration and rete sockets for inputs and outputs.
 * 
 * @param {String} moduletype The module type. Need to correspond to a OH rule module-type.
 * @category Rules
 * @memberof module:rule
 */
class OHRuleComponent extends Component$1 {
  constructor(moduletype) {
    super(moduletype.uid);
    this.moduletype = moduletype;
  }

  remove(node) {
    this.editor.removeNode(node);
  }

  builder(node) {
    node.remove = () => this.remove(node);
    node.id = (Node.latestId + Date.now()) + ""; // A rule component (trigger,cond,action) has a unique string-based id within the rule
    Node.latestId += 1;
    node.data = { type: this.moduletype.type, label: this.moduletype.label, description: this.moduletype.description };
    node.moduletype = this;

    if (this.moduletype.inputs) this._buildInputs(node);
    if (this.moduletype.outputs) this._buildOutputs(node);
    if (this.moduletype.configDescriptions) this._buildControls(node);
  }

  _buildControls(node) {
    for (const configDesc of this.moduletype.configDescriptions) {
      if (!configDesc.type) return;
      const id = configDesc.name;
      const label = configDesc.label || id;
      const desc = configDesc.description;

      const control = new BaseControl(this.editor, id, configDesc);
      control.label = label;
      control.description = desc;
      node.addControl(control);
    }
  }

  _buildOutputs(node) {
    for (const output of this.moduletype.outputs) {
      if (!output.type) return;
      const socket = new Socket(output.type, { hint: output.description });
      if (output.compatibleTo) {
        const compatible = Object.keys(output.compatibleTo);
        for (let c of compatible) {
          socket.combineWith(c);
        }
      }
      node.addOutput(new Output(output.name, output.label, socket));
    }
  }

  _buildInputs(node) {
    for (const input of this.moduletype.inputs) {
      if (!input.type) return;
      const socket = new Socket(input.type, { hint: input.description });
      if (input.compatibleTo) {
        const compatible = Object.keys(input.compatibleTo);
        for (let c of compatible) {
          socket.combineWith(c);
        }
      }
      node.addInput(new Input(input.name, input.label, socket));
    }
  }
}

/**
 * Responsible for importing OH rule json objects and exporting those objects.
 * 
 * @param {NodeEditor} editor The rete editor
 * @category Rules
 * @memberof module:rule
 */
class ImportExport {
  constructor(editor) {
    this.editor = editor;
  }

  /**
   * @typedef {Object} resultingNode
   * @property {Object} temporary A temporary field was created by {@link ImportExport#_addNode()}.
   * @property {Object.<string, string>} [temporary.inputs] The inputs of the entry, only existing for conditions and actions
   */

  /**
   * Adds a rule component to the editor.
   * 
   * @param {Object} entry An trigger, condition, action entry of a rule
   * @param {String} entry.type The module-type
   * @param {String} entry.label The label of the entry
   * @param {String} entry.description The description of the entry
   * @param {Object.<string, String|Number>} [entry.configuration] The configuration of the entry
   * @param {Object.<string, string>} [entry.inputs] The inputs of the entry, only existing for conditions and actions
   * @private
   * @return {resultingNode} The node that has been created and was added to the editor is returned.
   */
  async _addNode(entry) {
    const component = this.editor.getComponent(entry.type);
    if (!component) {
      throw new Error("Did not find component " + entry.type);
    }
    const node = await component.createNode({ label: entry.label, description: entry.description, type: entry.type });
    node.id = entry.id;
    if (entry.configuration) {
      Object.keys(entry.configuration).forEach(controlKey => {
        let control = node.controls.get(controlKey);
        if (control) {
          const value = entry.configuration[controlKey];
          control.value = value;
        }
      });
    }

    node.temporary = { inputs: entry.inputs };
    this.editor.addNode(node);
    return node;
  }

  /**
   * Connect the input and output sockets of the given node.
   * 
   * A rule condition and action can have a field "inputs". That might look like the following:
   * ```
   * "inputs":{
   *    "conditionInput":"SampleTriggerID.triggerOutput"
   * }
   * ```
   * 
   * It means that the, in the moduletypes defined, input "conditionInput" is connected to
   * an output of a component in the same rule. That component has the id "SampleTriggerID"
   * and the output can be found with "triggerOutput".
   * 
   * @param {Object} node A trigger, condition, action node
   * @param {Map} node.inputs The nodes inputs
   * @param {Map} node.outputs The nodes outputs
   * @param {OHRuleComponent} node.moduletype The module type of this node, see {@link OHRuleComponent}.
   * @param {Object} node.temporary This temporary field was created by {@link ImportExport#_addNode()}.
   * @param {Object.<string, string>} [node.temporary.inputs] The inputs of the entry, only existing for conditions and actions
   * @private
   */
  _connectSockets(node, nodes) {
    // Don't do anything if the nodes moduletype does not have inputs or the rule has no inputs for this node
    if (!node.moduletype.inputs || !node.temporary.inputs) return;
    // Extract the temporarly injected rule components' input mapping
    const ruleComponentInputMapping = node.temporary.inputs;
    delete node.temporary;

    // For every input of this nodes moduletype try to find the output
    for (let inputid of node.moduletype.inputs) {
      const inputMapping = ruleComponentInputMapping.get(inputid);
      if (!inputMapping) continue; // no connection for an input

      // Determine output
      const [targetnodeid, outputid] = inputMapping.split("\.");
      const targetNode = nodes[targetnodeid];
      if (!targetNode) {
        throw new Error("Connection failed: Target node not found!", targetNode);
      }
      const output = targetNode.outputs.get(outputid);
      if (!output) {
        throw new Error("Connection failed: Target node output not found!", outputid);
      }

      this.editor.connect(output, node.inputs.get(inputid));
    }
  }

  /**
   * Adds all triggers, conditions and actions from a rule object to the editor.
   * Does not prune the editor before!
   * 
   * @param {Object} rule An OH rule object
   * @param {Boolean} clearEditor Clears the editor before importing
   * @returns A promise that resolves on success
   */
  async fromJSON(rule, clearEditor = false) {
    this.editor.beforeImport(rule, clearEditor);
    const nodes = {};

    try {
      if (rule.triggers && rule.triggers.length > 0) {
        for (const entry of rule.triggers) {
          nodes[entry.id] = await this._addNode(entry);
        }
      }

      if (rule.conditions && rule.conditions.length > 0) {
        for (const entry of rule.conditions) {
          nodes[entry.id] = await this._addNode(entry);
        }
      }

      if (rule.actions && rule.actions.length > 0) {
        for (const entry of rule.actions) {
          nodes[entry.id] = await this._addNode(entry);
        }
      }

      Object.keys(nodes).forEach(id => {
        this._connectSockets(nodes[id], nodes);
      });
    }
    catch (e) {
      this.editor.trigger('warn', e);
      this.editor.afterImport();
      return false;
    }
    this.editor.afterImport();
    return true;
  }

  /**
   * Exports the editor nodes to an OH rule json partial containing the
   * trigger, condition and action part.
   * 
   * @returns An object with trigger, condition and action part
   */
  toJSON() {
    const data = { triggers: [], conditions: [], actions: [] };

    for (let node of this.editor.nodes) {
      if (!node.data.type) continue; // Skip any auxilary nodes like captions

      let ruleComponent = { label: node.data.label, description: node.data.description, type: node.moduletype.name, id: node.id, configuration: {} };

      for (let [key, control] of node.controls) {
        ruleComponent.configuration[control.key] = control.value;
      }

      const inputs = Array.from(node.inputs);
      if (inputs.length) {
        ruleComponent.inputs = {};
        for (let [key, input] of inputs) {
          for (let connection of input.connections) {
            ruleComponent.inputs[key] = connection.output.node.id + "." + connection.output.key;
          }
        }
      }
      if (!data[node.data.type + "s"]) {
        console.warn("Unexpected node type!", node);
        continue;
      }
      data[node.data.type + "s"].push(ruleComponent);
    }

    this.editor.trigger('export', data);
    return data;
  }
}

/**
 * A rete component. Renders a text.
 * 
 * @param {String} id Either trigger, condition or action.
 * @param {String} label The text to render
 * @category Rules
 * @memberof module:rule
 */
class OHCaptionComponent extends Component$1 {
  constructor(id, label) {
    super(id);
    const component = { // Vue component
      data: function () { return { label: label } },
      template: '<h4 v-html="label"></h4>'
    };
    this.data = { component };
  }
  async builder(node) {
    node.data.fixed = true;
  }
}

/**
 * @category Web Components
 * @customelement oh-rule-editor
 * 
 * @description A rule editor component
 * @example <caption>An example</caption>
 * <oh-rule-editor></oh-rule-editor>
 */
class OhRuleEditor extends HTMLElement {
  constructor() {
    super();
    this._moduletypes = [];
  }

  set moduletypes(val) {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => {
      delete this.debounceTimer;
      this._moduletypes = val;
      if (this.editor) this.buildComponents();
    }, 50);
  }

  set rule(val) {
    this._rule = val;
    this.checkIfModuleTypesAndRule();
  }

  checkIfModuleTypesAndRule() {
    if (this.editor && this.componentsBuild) {
      if (this._rule) {
        console.log("IMPORT NOW", this.editor.isSilent());
        this.importExport.fromJSON(this._rule, true)
          .catch(e => {
            createNotification(null, `Rule import failed: ${this._rule.name}. ${e.toString()}`, true, 1500);
          });
      }
    }
  }

  buildComponents() {
    if (!this._moduletypes.length) return;
    for (const moduletype of this._moduletypes) {
      this.editor.register(new OHRuleComponent(moduletype));
    }
    this.componentsBuild = true;
    this.checkIfModuleTypesAndRule();
  }

  connectedCallback() {
    const editor = new NodeEditor('openhabrule@1.0.0', this);
    editor.use(ConnectionPlugin, { curvature: 0.4 });
    editor.use(VueRenderPlugin);

    editor.register(new OHCaptionComponent("trigger", "When &hellip;"));
    editor.register(new OHCaptionComponent("condition", "But only if &hellip;"));
    editor.register(new OHCaptionComponent("action", "Then &hellip;"));

    this.layoutManager = new LayoutManager(editor, { size: 32 });
    this.importExport = new ImportExport(editor, this.areaManager);

    editor.on('connectioncreated connectionremoved nodecreated noderemoved nodetranslated', (m) => {
      if (editor.isSilent()) return;
      this.dispatchEvent(new Event("input"));
    });

    editor.on('connectioncreate', ({ output, input }) => {
      const indexOut = editor.nodes.findIndex(e => e == output.node);
      const indexIn = editor.nodes.findIndex(e => e == input.node);
      console.log(indexIn, indexOut);
      if (indexIn == -1 || indexOut == -1) return true;
      return (indexIn > indexOut && !(output.node.data.type === "action" && input.node.data.type !== "action"));
    });

    editor.on("showeditor", (obj) => {
      this.dispatchEvent(new CustomEvent("showeditor", { detail: { ...obj } }));
    });

    this.boundDragover = e => this.dragover(e);
    this.boundDrop = e => this.drop(e);
    this.boundDragEnter = e => this.dragEnter(e);
    this.boundDragExit = e => this.dragExit(e);
    this.addEventListener("dragenter", this.boundDragEnter, true);
    this.addEventListener("dragleave", this.boundDragExit, true);
    this.addEventListener("dragover", this.boundDragover, true);
    this.addEventListener("drop", this.boundDrop, true);

    this.editor = editor;
    if (!this.componentsBuild) this.buildComponents();
  }

  disconnectedCallback() {
    if (this.layoutManager) this.layoutManager.dispose();
    if (!this.editor) return;
    this.editor.dispose();
    delete this.editor;
  }

  getRuleJson() {
    return this.importExport.toJSON();
  }

  dragEnter(event) {
    event.target.classList.add("haschanges");
  }

  dragExit(event) {
    event.target.classList.remove("haschanges");
  }

  dragover(event) {
    event.preventDefault();
    event.dataTransfer.dropEffect = "copy";
  }

  async add(componentType) {
    const component = this.editor.getComponent(componentType);
    if (!component) {
      createNotification(null, `Component ${data} not known`, false, 1500);
      return;
    }
    this.editor.addNode(await component.createNode({}));
  }

  drop(event) {
    event.preventDefault();
    event.target.classList.remove("haschanges");
    const data = event.dataTransfer.getData("oh/rulecomponent");
    if (!data) return;
    this.add(data);
  }
}

customElements.define('oh-rule-editor', OhRuleEditor);

/**
 * Rule module
 * 
 * This module is used on the Rule editing page and embeds Rete.js for rendering.
 * 
 * @category Rules
 * @module rule
 */

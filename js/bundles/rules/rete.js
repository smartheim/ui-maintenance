class Component {
    constructor(name) {
        if (this.constructor === Component)
            throw new TypeError('Can not construct abstract class.');
        
        this.name = name;
        this.data = {};
        this.engine = null;
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
    
    removeConnection(connection            ) {
        this.connections.splice(this.connections.indexOf(connection), 1);
    }

    removeConnections() {
        this.connections.map(connection => this.removeConnection(connection));
    }
}

class Socket {

    constructor(name        , data = {}) {
        this.name = name;
        this.data = data;
        this.compatible = [];
    }

    combineWith(socket        ) {
        this.compatible.push(socket);
    }

    compatibleWith(socket        ) {
        return this === socket || this.compatible.includes(socket);
    }
}

class Input extends IO {
   
    constructor(key        , title        , socket        , multiConns          = false) {
        super(key, title, socket, multiConns);
        this.control = null;
    }

    hasConnection() {
        return this.connections.length > 0;
    }

    addConnection(connection            ) {
        if (!this.multipleConnections && this.hasConnection())
            throw new Error('Multiple connections not allowed');
        this.connections.push(connection);
    }

    addControl(control         ) {
        this.control = control;
        control.parent = this;
    }

    showControl() {
        return !this.hasConnection() && this.control !== null;
    }

    toJSON() {
        return {
            'connections': this.connections.map(c => {
                return {
                    node: c.output.node.id,
                    output: c.output.key,
                    data: c.data
                };
            })
        };
    }
}

class Output extends IO {
  
    constructor(key        , title        , socket        , multiConns          = true) {
        super(key, title, socket, multiConns);
    }
    
    hasConnection() {
        return this.connections.length > 0;
    }

    connectTo(input       ) {
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

    connectedTo(input       ) {
        return this.connections.some((item) => {
            return item.input === input;
        });
    }

    toJSON() {
        return {
            'connections': this.connections.map(c => {
                return {
                    node: c.input.node.id,
                    input: c.input.key,
                    data: c.data
                }
            })
        };
    }
}

class Node {
   
    constructor(name        ) {
        this.name = name;
        this.id = Node.incrementId();
        this.position = [0.0, 0.0];

        this.inputs = new Map();
        this.outputs = new Map();
        this.controls = new Map();
        this.data = {};
        this.meta = {};
    }

    addControl(control         ) {
        control.parent = this;

        this.controls.set(control.key, control);
        return this;
    }

    removeControl(control         ) {
        control.parent = null;

        this.controls.delete(control.key);
    }

    addInput(input       ) {
        if (input.node !== null)
            throw new Error('Input has already been added to the node');
 
        input.node = this;

        this.inputs.set(input.key, input);
        return this;
    }

    removeInput(input       ) {
        input.removeConnections();
        input.node = null;

        this.inputs.delete(input.key);
    }

    addOutput(output        ) {
        if (output.node !== null)
            throw new Error('Output has already been added to the node');
        
        output.node = this;

        this.outputs.set(output.key, output);
        return this;
    }

    removeOutput(output        ) {
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

    update() {}

    static incrementId() {
        if (!this.latestId)
            this.latestId = 1;
        else
            this.latestId++;
        return this.latestId
    }

    toJSON() {
        return {
            'id': this.id,
            'data': this.data,
            'inputs': Array.from(this.inputs).reduce((obj, [key, input]) => (obj[key] = input.toJSON(), obj), {}),
            'outputs': Array.from(this.outputs).reduce((obj, [key, output]) => (obj[key] = output.toJSON(), obj), {}),
            'position': this.position,
            'name': this.name
        }
    }

    static fromJSON(json        ) {
        const node = new Node(json.name);

        node.id = json.id;
        node.data = json.data;
        node.position = json.position;
        node.name = json.name;
        Node.latestId = Math.max(node.id, Node.latestId);

        return node;
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

    async build(node      ) {
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

    constructor(events                  ) {
        this.events = events instanceof Emitter ? events.events : events.handlers;
        this.silent = false;
    }

    on(names        , handler          ) {
        names.split(' ').forEach(name => {
            if (!this.events[name])
                throw new Error(`The event ${name} does not exist`);
            this.events[name].push(handler);
        });

        return this;
    }

    trigger(name        , params) {
        if (!(name in this.events))
            throw new Error(`The event ${name} cannot be triggered`);

        return this.events[name].reduce((r, e) => {
            return (e(params) !== false) && r
        }, true); // return false if at least one event is false        
    }

    bind(name        ) {
        if (this.events[name])
            throw new Error(`The event ${name} is already bound`);

        this.events[name] = [];
    }

    exist(name        ) {
        return Array.isArray(this.events[name]);
    }
}

class Validator {

    static isValidData(data) {
        return typeof data.id === 'string' &&
            this.isValidId(data.id) &&
            data.nodes instanceof Object && !(data.nodes instanceof Array);
    }

    static isValidId(id) {
        return /^[\w-]{3,}@[0-9]+\.[0-9]+\.[0-9]+$/.test(id);
    }

    static validate(id, data) {
        var msg = '';
        var id1 = id.split('@');
        var id2 = data.id.split('@');

        if (!this.isValidData(data))
            msg += 'Data is not suitable. '; 
        if (id !== data.id)
            msg += 'IDs not equal. ';
        if (id1[0] !== id2[0])
            msg += 'Names don\'t match. ';
        if (id1[1] !== id2[1])
            msg += 'Versions don\'t match';

        return { success: msg ==='', msg };
    }
}

class Context extends Emitter {

    constructor(id, events) {
        super(events);

        if (!Validator.isValidId(id))
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

class EngineEvents extends Events {

    constructor() {
        super({
            componentregister: []
        });
    }    
}

var State = { AVALIABLE:0, PROCESSED: 1, ABORT: 2 };

class Engine extends Context {

    constructor(id        ) {
        super(id, new EngineEvents());

        this.components = [];
        this.args = [];
        this.data = null;
        this.state = State.AVALIABLE;
        this.onAbort = () => { };
    }

    clone() {
        const engine = new Engine(this.id);

        this.components.map(c => engine.register(c));

        return engine;
    }

    register(component           ) {
        this.components.push(component);
        this.trigger('componentregister', component);
    }

    async throwError (message, data = null) {
        await this.abort();
        this.trigger('error', { message, data });
        this.processDone();

        return 'error';
    }

    extractInputNodes(node, nodes) {
        return Object.keys(node.inputs).reduce((a, key) => {
            return [...a, ...(node.inputs[key].connections || []).reduce((b, c) => [...b, nodes[c.node]], [])]
        }, []);
    }

    detectRecursions(nodes) {
        const nodesArr = Object.keys(nodes).map(id => nodes[id]);
        const findSelf = (node, inputNodes) => {
            if (inputNodes.some(n => n === node))
                return node;
            
            for (var i = 0; i < inputNodes.length; i++) {
                if (findSelf(node, this.extractInputNodes(inputNodes[i], nodes)))
                    return node;
            }

            return null;
        };

        return nodesArr.map(node => {
            return findSelf(node, this.extractInputNodes(node, nodes))
        }).filter(r => r !== null);
    }

    processStart() {
        if (this.state === State.AVALIABLE) {  
            this.state = State.PROCESSED;
            return true;
        }

        if (this.state === State.ABORT) {
            return false;
        }

        console.warn(`The process is busy and has not been restarted.
                Use abort() to force it to complete`);
        return false;
    }

    processDone() {
        var success = this.state !== State.ABORT;

        this.state = State.AVALIABLE;
        
        if (!success) {
            this.onAbort();
            this.onAbort = () => { };
        }    

        return success;
    }

    async abort() {
        return new Promise(ret => {
            if (this.state === State.PROCESSED) {
                this.state = State.ABORT;
                this.onAbort = ret;
            }
            else if (this.state === State.ABORT) {
                this.onAbort();
                this.onAbort = ret;
            }
            else
                ret();
        });
    }

    async lock(node) {
        return new Promise(res => {
            node.unlockPool = node.unlockPool || [];
            if (node.busy && !node.outputData)
                node.unlockPool.push(res);
            else 
                res();
            
            node.busy = true;
        });    
    }

    unlock(node) {
        node.unlockPool.forEach(a => a());
        node.unlockPool = [];
        node.busy = false;
    }

    async extractInputData(node) {
        const obj = {};

        for (let key of Object.keys(node.inputs)) {
            let input = node.inputs[key];
            var conns = input.connections;
            let connData = await Promise.all(conns.map(async (c) => {
                const prevNode = this.data.nodes[c.node];

                let outputs = await this.processNode(prevNode);

                if (!outputs) 
                    this.abort();
                else
                    return outputs[c.output];
            }));

            obj[key] = connData;
        }

        return obj;
    }

    async processWorker(node) {
        var inputData = await this.extractInputData(node);
        var component = this.components.find(c => c.name === node.name);
        var outputData = {};

        try {
            await component.worker(node, inputData, outputData, ...this.args);
        } catch (e) {
            this.abort();
            this.trigger('warn', e);
        }

        return outputData;
    }

    async processNode(node) {
        if (this.state === State.ABORT || !node)
            return null;
        
        await this.lock(node);

        if (!node.outputData) {
            node.outputData = this.processWorker(node);
        }

        this.unlock(node);
        return node.outputData;
    }

    async forwardProcess(node) {
        if (this.state === State.ABORT)
            return null;

        return await Promise.all(Object.keys(node.outputs).map(async (key) => {
            const output = node.outputs[key];

            return await Promise.all(output.connections.map(async (c) => {
                const nextNode = this.data.nodes[c.node];

                await this.processNode(nextNode);
                await this.forwardProcess(nextNode);
            }));
        }));
    }

    copy(data) {
        data = Object.assign({}, data);
        data.nodes = Object.assign({}, data.nodes);
        
        Object.keys(data.nodes).forEach(key => {
            data.nodes[key] = Object.assign({}, data.nodes[key]);
        });
        return data;
    }

    async validate(data) {
        var checking = Validator.validate(this.id, data);

        if (!checking.success)
            return await this.throwError(checking.msg);  
        
        var recurentNodes = this.detectRecursions(data.nodes);

        if (recurentNodes.length > 0)
            return await this.throwError('Recursion detected', recurentNodes);      
         
        return true;
    }

    async processStartNode(id) {
        if (id) {
            let startNode = this.data.nodes[id];

            if (!startNode)
                return await this.throwError('Node with such id not found');   
            
            await this.processNode(startNode);
            await this.forwardProcess(startNode);
        }
    }

    async processUnreachable() {
        for (var i in this.data.nodes) // process nodes that have not been reached
            if (typeof this.data.nodes[i].outputData === 'undefined') {
                var node = this.data.nodes[i];

                await this.processNode(node);
                await this.forwardProcess(node);
            }
    }

    async process(data        , startId          = null, ...args) {
        if (!this.processStart()) return;
        if (!this.validate(data)) return;    
        
        this.data = this.copy(data);
        this.args = args;

        await this.processStartNode(startId);
        await this.processUnreachable();
        
        return this.processDone()?'success':'aborted';
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
            export: [],
            process: []
        });
    }    
}

class Drag {

    constructor(el, onTranslate = () => {}, onStart = () => {}, onDrag = () => {}) {
        this.mouseStart = null;

        this.el = el;
        this.onTranslate = onTranslate;
        this.onStart = onStart;
        this.onDrag = onDrag;

        this.initEvents(el);
    }

    initEvents(el) {
        el.addEventListener('mousedown', this.down.bind(this));
        window.addEventListener('mousemove', this.move.bind(this));
        window.addEventListener('mouseup', this.up.bind(this));

        el.addEventListener('touchstart', this.down.bind(this));
        window.addEventListener('touchmove', this.move.bind(this), {
            passive: false
        });
        window.addEventListener('touchend', this.up.bind(this));
    }

    getCoords(e) {
        const props = e.touches ? e.touches[0] : e;

        return [props.pageX, props.pageY];
    }

    down(e) {
        e.stopPropagation();
        this.mouseStart = this.getCoords(e);

        this.onStart(e);
    }

    move(e) {
        if (!this.mouseStart) return;
        e.preventDefault();
        e.stopPropagation();

        let [x, y] = this.getCoords(e);
        let delta = [x - this.mouseStart[0], y - this.mouseStart[1]];
        let zoom = this.el.getBoundingClientRect().width / this.el.offsetWidth;

        this.onTranslate(delta[0] / zoom, delta[1] / zoom, e);
    }

    up(e) {
        if (!this.mouseStart) return;
        
        this.mouseStart = null;
        this.onDrag(e);
    }
}

class Zoom {

    constructor(container, el, intensity, onzoom) {
        this.el = el;
        this.intensity = intensity;
        this.onzoom = onzoom;

        this.distance = null;

        container.addEventListener('wheel', this.wheel.bind(this));
        container.addEventListener('touchmove', this.move.bind(this));
        container.addEventListener('touchend', this.end.bind(this));
        container.addEventListener('touchcancel', this.end.bind(this));
        container.addEventListener('dblclick', this.dblclick.bind(this));
    }

    wheel(e) {
        e.preventDefault();
        
        var rect = this.el.getBoundingClientRect();
        var delta = (e.wheelDelta ? e.wheelDelta / 120 : - e.deltaY / 3) * this.intensity;

        var ox = (rect.left - e.clientX) * delta;
        var oy = (rect.top - e.clientY) * delta;

        this.onzoom(delta, ox, oy, 'wheel');
    }

    touches(e) {
        let [x1, y1] = [e.touches[0].clientX, e.touches[0].clientY];
        let [x2, y2] = [e.touches[1].clientX, e.touches[1].clientY];
        let distance = Math.sqrt(Math.pow(x1 - x2, 2) + Math.pow(y1 - y2, 2));

        return {
            cx: (x1 + x2)/2,
            cy: (y1 + y2)/2,
            distance
        };
    }

    move(e) {
        if (e.touches.length < 2) return;
        
        let rect = this.el.getBoundingClientRect();
        let { cx, cy, distance } = this.touches(e);

        if (this.distance !== null) {
            let delta = distance / this.distance - 1;
    
            var ox = (rect.left - cx) * delta;
            var oy = (rect.top - cy) * delta;

            this.onzoom(delta, ox, oy, 'touch');
        }
        this.distance = distance;
    }

    end() {
        this.distance = null;
    }

    dblclick(e) {
        e.preventDefault();
        
        var rect = this.el.getBoundingClientRect();
        var delta = 4 * this.intensity;

        var ox = (rect.left - e.clientX) * delta;
        var oy = (rect.top - e.clientY) * delta;

        this.onzoom(delta, ox, oy, 'dblclick'); 
    }
}

class Area extends Emitter {

    constructor(container, emitter         ) {
        super(emitter);
        
        const el = this.el = document.createElement('div');

        this.container = container;
        this.transform = { k: 1, x: 0, y: 0 };
        this.mouse = { x: 0, y: 0 };

        el.style.transformOrigin = '0 0';

        this._startPosition = null;
        this._zoom = new Zoom(container, el, 0.1, this.onZoom.bind(this));
        this._drag = new Drag(container, this.onTranslate.bind(this), this.onStart.bind(this));
        this.container.addEventListener('mousemove', this.mousemove.bind(this));

        this.update();
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
        this.el.style.position = 'absolute';

        this.el.addEventListener('contextmenu', e => this.trigger('contextmenu', { e, node: this.node }));

        this._startPosition = null;
        this._drag = new Drag(this.el, this.onTranslate.bind(this), this.onSelect.bind(this), () => {
            this.trigger('nodedraged', node);
        });

        this.trigger('rendernode', {
            el: this.el, 
            node, 
            component: component.data, 
            bindSocket: this.bindSocket.bind(this),
            bindControl: this.bindControl.bind(this)
        });

        this.update();
    }

    bindSocket(el             , type        , io    ) {
        this.sockets.set(io, new Socket$1(el, type, io, this.node, this));
    }

    bindControl(el             , control         ) {
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

    remove() {
        
    }
}

class Connection$1 extends Emitter {

    constructor(connection, inputNode          , outputNode          , emitter) {
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

    constructor(container             , components        , emitter         ) {
        super(emitter);

        this.container = container;
        this.components = components;

        this.container.style.overflow = 'hidden';

        this.nodes = new Map();
        this.connections = new Map();

        this.container.addEventListener('click', this.click.bind(this));
        this.container.addEventListener('contextmenu', e => this.trigger('contextmenu', { e, view: this }));
        window.addEventListener('resize', this.resize.bind(this));

        this.on('nodetranslated', this.updateConnections.bind(this));
            
        this.area = new Area(container, this);
        this.container.appendChild(this.area.el);
    }

    addNode(node      ) {
        const nodeView = new Node$1(node, this.components.get(node.name), this);

        this.nodes.set(node, nodeView);
        this.area.appendChild(nodeView.el);
    }

    removeNode(node      ) {
        const nodeView = this.nodes.get(node);

        this.nodes.delete(node);
        this.area.removeChild(nodeView.el);
    }

    addConnection(connection            ) {
        const viewInput = this.nodes.get(connection.input.node);
        const viewOutput = this.nodes.get(connection.output.node);
        const connView = new Connection$1(connection, viewInput, viewOutput, this);

        this.connections.set(connection, connView);
        this.area.appendChild(connView.el);
    }

    removeConnection(connection            ) {
        const connView = this.connections.get(connection);

        this.connections.delete(connection);
        this.area.removeChild(connView.el);
    }

    updateConnections({ node }) {
        node.getConnections().map(conn => {
            this.connections.get(conn).update();
        });
    }

    resize() {
        const { container } = this;
        const width = container.parentElement.clientWidth;
        const height = container.parentElement.clientHeight;

        container.style.width = width + 'px';
        container.style.height = height + 'px';
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

    add(item      , accumulate = false) {
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

    constructor(id        , container             ) {
        super(id, new EditorEvents());
        
        this.nodes = [];
        this.components = new Map();

        this.selected = new Selected();
        this.view = new EditorView(container, this.components, this);

        window.addEventListener('keydown', e => this.trigger('keydown', e));
        window.addEventListener('keyup', e => this.trigger('keyup', e));
        this.on('selectnode', ({ node, accumulate }) => this.selectNode(node, accumulate));
        this.on('nodeselected', () => this.selected.each(n => this.view.nodes.get(n).onStart()));
        this.on('translatenode', ({ dx, dy }) => this.selected.each(n => this.view.nodes.get(n).onDrag(dx, dy)));
    }

    addNode(node      ) {
        if (!this.trigger('nodecreate', node)) return;

        this.nodes.push(node);
        this.view.addNode(node);
        
        this.trigger('nodecreated', node);
    }

    removeNode(node      ) {
        if (!this.trigger('noderemove', node)) return;

        node.getConnections().forEach(c => this.removeConnection(c));

        this.nodes.splice(this.nodes.indexOf(node), 1);
        this.view.removeNode(node);

        this.trigger('noderemoved', node);
    }

    connect(output        , input       , data = {}) {
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

    removeConnection(connection            ) {
        if (!this.trigger('connectionremove', connection)) return;
            
        this.view.removeConnection(connection);
        connection.remove();

        this.trigger('connectionremoved', connection);
    }

    selectNode(node      , accumulate          = false) {
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

    register(component           ) {
        component.editor = this;
        this.components.set(component.name, component);
        this.trigger('componentregister', component);
    }

    clear() {
        [...this.nodes].map(node => this.removeNode(node));
    }

    toJSON() {
        const data = { id: this.id, nodes: {} };
        
        this.nodes.forEach(node => data.nodes[node.id] = node.toJSON());
        this.trigger('export', data);
        return data;
    }

    beforeImport(json        ) {
        var checking = Validator.validate(this.id, json);
        
        if (!checking.success) {
            this.trigger('warn', checking.msg);
            return false;
        }
        
        this.silent = true;
        this.clear();
        this.trigger('import', json);
        return true;
    }

    afterImport() {
        this.silent = false;
        return true;
    }

    async fromJSON(json        ) {
        if (!this.beforeImport(json)) return false;
        var nodes = {};

        try {
            await Promise.all(Object.keys(json.nodes).map(async id => {
                var node = json.nodes[id];
                var component = this.getComponent(node.name);

                nodes[id] = await component.build(Node.fromJSON(node));
                this.addNode(nodes[id]);
            }));
        
            Object.keys(json.nodes).forEach(id => {
                var jsonNode = json.nodes[id];
                var node = nodes[id];
                
                Object.keys(jsonNode.outputs).forEach(key => {
                    var outputJson = jsonNode.outputs[key];

                    outputJson.connections.forEach(jsonConnection => {
                        var nodeId = jsonConnection.node;
                        var data = jsonConnection.data;
                        var targetOutput = node.outputs.get(key);
                        var targetInput = nodes[nodeId].inputs.get(jsonConnection.input);

                        this.connect(targetOutput, targetInput, data);
                    });
                });

            });
        }
        catch (e) {
            this.trigger('warn', e);
            return !this.afterImport();
        } finally {
            return this.afterImport();
        }
    }
}

var index = {
    Component: Component$1,
    Control,
    NodeEditor,
    Emitter,
    Engine,
    Input,
    Node,
    Output,
    Socket
};

/**
 * For creating a single rete ES6 file.
 * Move this to js/bundles/rete/, compile and get the dist/rete.js file as result.
 */

export { index as Rete };

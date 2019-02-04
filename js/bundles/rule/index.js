import { createNotification } from './app.js';
import VueRenderPlugin from './renderer/index';
import ReteArea from './area/index';
import ConnectionPlugin from './connection/index';
import { Rete } from "./rete";


class TextControl extends Rete.Control {
    constructor(emitter, key, label, description, msg) {
        super(key);
        this.render = 'vue';
        this.emitter = emitter;
        this.component = { // Vue component
            data: function () { return { value: '', label: label, description: description } },
            props: ['change'],
            template: '<label :title="description">{{label}}: <input :value="value" @input="change($event)"/></label>'
        };
        this.props = { change: this.change.bind(this) };
        this.msg = msg;
    }

    change(e) {
        this.setValue(e.target.value);
    }

    update() {
        this.emitter.trigger('process');
    }

    mounted() {
        this.setValue(this.msg);
    }

    setValue(val) {
        if (!this.vueContext) {
            this.msg = val;
            return;
        }
        this.vueContext.value = val;
        this.update();
    }
}

class OHRuleComponent extends Rete.Component {
    constructor(moduletype) {
        super(moduletype.uid);
        this.moduletype = moduletype;
    }

    remove(node) {
        this.editor.removeNode(node);
    }
    builder(node) {
        node.remove = () => this.remove(node);
        node.id = Rete.Node.latestId + 1;
        Rete.Node.latestId = Math.max(node.id, Rete.Node.latestId);
        node.data = { type: this.moduletype.type, label: this.moduletype.label, description: this.moduletype.description };
        if (this.moduletype.inputs)
            for (const input of this.moduletype.inputs) {
                if (!input.type) return;
                node.addInput(new Rete.Input(input.name, input.label, new Rete.Socket(input.type, { hint: input.description })));
            }
        if (this.moduletype.outputs)
            for (const output of this.moduletype.outputs) {
                if (!output.type) return;
                node.addOutput(new Rete.Output(output.name, output.label, new Rete.Socket(output.type, { hint: output.description })));
            }
        if (this.moduletype.configDescriptions)
            for (const configDesc of this.moduletype.configDescriptions) {
                if (!configDesc.type) return;
                const label = configDesc.label ? configDesc.label : configDesc.name;
                let control = new TextControl(this.editor, configDesc.name, label,
                    configDesc.description, "test");
                node.addControl(control);
            }
    }
}

class ImportExport {
    static async addNode(nodeEditor, entry, x, y) {
        const node = new Rete.Node(entry.type);
        node.position = [x, y];
        var component = nodeEditor.getComponent(entry.type);
        if (!component) {
            console.warn("Did not find component", entry);
            return;
        }
        const c = await component.build(node);
        node.id = entry.id;
        node.data.label = entry.label;
        node.data.description = entry.description;
        if (entry.configuration) {
            Object.keys(entry.configuration).forEach(controlKey => {
                let control = node.controls.get(controlKey);
                if (control) {
                    const value = entry.configuration[controlKey];
                    control.setValue(value);
                }
            });
        }

        nodeEditor.addNode(c);
        return node;
    }
    static async fromJSON(nodeEditor, rule) {
        nodeEditor.beforeImport(rule);
        var nodes = {};

        var x = 0;
        var y = 0;
        try {
            y = 32;
            x = 32;
            if (rule.triggers && rule.triggers.length > 0)
                for (const entry of rule.triggers) {
                    nodes[entry.id] = await ImportExport.addNode(nodeEditor, entry, x, y);
                    y += 32 * 4;
                }
            y = 32;
            if (rule.conditions && rule.conditions.length > 0) {
                x += 32 * 9;
                for (const entry of rule.conditions) {
                    nodes[entry.id] = await ImportExport.addNode(nodeEditor, entry, x, y);
                    y += 32 * 4;
                }
            }
            y = 32;
            if (rule.actions && rule.actions.length > 0) {
                x += 32 * 10;
                for (const entry of rule.actions) {
                    nodes[entry.id] = await ImportExport.addNode(nodeEditor, entry, x, y);
                    y += 32 * 4;
                }
            }

            // Socket connections
            Object.keys(nodes).forEach(id => {
                var cnode = nodes[id];
                if (!cnode.inputs) return;
                const inputs = Object.keys(cnode.inputs);
                Object.keys(inputs).forEach(inputid => {
                    const temp = inputs[inputid].split("\.");
                    const nodeid = temp[0];
                    const outputid = temp[1];
                    const targetNode = node[nodeid];
                    const output = targetNode.outputs.get(outputid);
                    const input = cnode.inputs.get(inputid);
                    nodeEditor.connect(output, input, data);
                });
            });
        }
        catch (e) {
            nodeEditor.trigger('warn', e);
            nodeEditor.afterImport();
            return false;
        }
        nodeEditor.afterImport();
        return true;
    }

    static toJSON(nodeEditor) {
        const data = { id: nodeEditor.id, nodes: {} };

        nodeEditor.nodes.forEach(node => data.nodes[node.id] = {
            'id': node.id,
            'data': node.data,
            'inputs': Array.from(node.inputs).reduce((obj, [key, input]) => (obj[key] = {
                'connections': input.connections.map(c => {
                    return {
                        node: c.output.node.id,
                        output: c.output.key,
                        data: c.data
                    };
                })
            }, obj), {}),
            'outputs': Array.from(node.outputs).reduce((obj, [key, output]) => (obj[key] = {
                'connections': output.connections.map(c => {
                    return {
                        node: c.input.node.id,
                        input: c.input.key,
                        data: c.data
                    }
                })
            }, obj), {}),
            'position': node.position,
            'name': node.name
        });
        nodeEditor.trigger('export', data);
        return data;
    }
}

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
            if (this.editor) this.buildComponents(this.editor);
        }, 50);
    }
    set rule(val) {
        this._rule = val;
    }
    buildComponents(editor) {
        this.componentsBuild = true;
        for (const moduletype of this._moduletypes) {
            editor.register(new OHRuleComponent(moduletype));
        }
        if (this._rule) {
            ImportExport.fromJSON(editor, this._rule).then(() => {
                editor.view.resize();
            });
        }
    }
    connectedCallback() {
        var editor = new Rete.NodeEditor('tasksample@0.1.0', this);
        editor.use(ConnectionPlugin, { curvature: 0.4 });
        editor.use(VueRenderPlugin);
        editor.use(ReteArea, { scaleExtent: true, snap: true, translateExtent: true, background: true });

        console.log("starting rule editor", this._moduletypes);

        editor.on('connectioncreate connectionremove nodecreate noderemove', () => {
            if (editor.silent) return;
        });

        this.editor = editor;
        if (!this.componentsBuild) this.buildComponents(this.editor);
        this.boundDragover = e => this.dragover(e);
        this.boundDrop = e => this.drop(e);
        this.addEventListener("dragover", this.boundDragover, true);
        this.addEventListener("drop", this.boundDrop, true);
    }
    disconnectedCallback() {
        this.removeEventListener("dragover", this.boundDragover, true);
        this.removeEventListener("drop", this.boundDrop, true);
        if (!this.editor) return;
        this.editor.dispose();
        delete this.editor;
    }
    dragover(event) {
        event.preventDefault();
        event.dataTransfer.dropEffect = "copy"
    }
    async drop(event) {
        event.preventDefault();
        var data = event.dataTransfer.getData("oh/rulecomponent");
        if (!data) return;
        var component = this.editor.getComponent(data);
        if (!component) {
            createNotification(null, `Component ${data} not known`, false, 1500);
            return;
        }

        const node = new Rete.Node(data);
        node.position = [event.offsetX, event.offsetY];
        const c = await component.build(node);
        this.editor.addNode(c);
    }
}

customElements.define('oh-rule-editor', OhRuleEditor);

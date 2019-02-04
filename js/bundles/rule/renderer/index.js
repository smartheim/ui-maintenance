import { Vue } from '../vue.js';
import mixin from './mixin';

var Socket = {
    template: `<div :class="classes" :title="title"></div>`,
    props: ['type', 'socket'],
    computed: {
        classes: function () {
            const str = ["socket", this.type, this.socket.name];
            const replace = s => s.toLowerCase().replace(/ /g, '-');
            return Array.isArray(str) ? str.map(replace) : replace(str);
        },
        title: function () {
            return this.socket.name + '\n' + this.socket.data.hint;
        }
    }
};

const replace = s => s.toLowerCase().replace(/ /g, '-');

var Node = {
    template: '#rulenode',
    mixins: [mixin],
    components: {
        Socket
    },
    computed: {
        classes: function () {
            return [replace(this.selected()), this.node.data.type];
        },
        title: function () {
            return this.node.name + '\n' + this.node.data.hint;
        }
    }
}

function createVue(el, vueComponent, vueProps) {
    const app = new Vue({
        render: h => h(vueComponent, { props: vueProps })
    });

    const nodeEl = document.createElement('div');

    el.appendChild(nodeEl);
    app.$mount(nodeEl);

    return app;
}

function createNode(editor, { el, node, component, bindSocket, bindControl }) {
    const vueComponent = component.component || Node;
    const vueProps = { ...component.props, node, editor, bindSocket, bindControl };
    const app = createVue(el, vueComponent, vueProps);

    node.vueContext = app.$children[0];
    if (node.mounted) node.mounted();
    return app;
}

function createControl(editor, { el, control }) {
    const vueComponent = control.component;
    const vueProps = { ...control.props, getData: control.getData.bind(control), putData: control.putData.bind(control) };
    const app = createVue(el, vueComponent, vueProps);
    control.vueContext = app.$children[0];
    if (control.mounted) control.mounted();
    return app;
}

const update = (entity) => {
    if (entity.vueContext)
        entity.vueContext.$forceUpdate();
}

function install(editor, params) {
    editor.on('rendernode', ({ el, node, component, bindSocket, bindControl }) => {
        node._vue = createNode(editor, { el, node, component, bindSocket, bindControl });
        node.update = () => update(node);
    });

    editor.on('rendercontrol', ({ el, control }) => {
        control._vue = createControl(editor, { el, control });
        control.update = () => update(control)
    });

    editor.on('connectioncreated connectionremoved', connection => {
        update(connection.output.node)
        update(connection.input.node)
    });

    editor.on('nodeselected', () => {
        editor.nodes.map(update);
    });
}

export default {
    name: 'vue-render',
    install,
    mixin,
    Node,
    Socket
}

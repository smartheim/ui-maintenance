import { Vue } from '../vue.js';
import { RuleNode } from './rulenode';

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

function createControl(editor, { el, control }) {
  const vueComponent = control.component;
  const vueProps = { ...control.props, getData: control.getData.bind(control), putData: control.putData.bind(control) };
  const app = createVue(el, vueComponent, vueProps);
  control.vueContext = app;
  if (control.mounted) control.mounted();
  return app;
}

const update = (entity) => {
  if (entity.vueContext)
    entity.vueContext.$forceUpdate();
}

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
    update(connection.output.node)
    update(connection.input.node)
  });

  editor.on('nodeselected', () => {
    editor.nodes.forEach(update);
  });
}

export default {
  name: 'vue-render',
  install
}

import { Component, Node, Socket, Output, Input, Control } from "../../_rete";

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
class OHRuleComponent extends Component {
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

export { OHRuleComponent };
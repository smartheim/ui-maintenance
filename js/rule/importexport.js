import { NodeEditor } from "../_rete";
import { OHRuleComponent } from './components/ohrule'; // just for documentation

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
    const node = await component.createNode({ label: entry.label, description: entry.description, type: entry.type })
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

export { ImportExport };
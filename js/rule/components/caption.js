import { Component } from "../../_rete";

/**
 * A rete component. Renders a text.
 * 
 * @param {String} id Either trigger, condition or action.
 * @param {String} label The text to render
 * @category Rules
 * @memberof module:rule
 */
class OHCaptionComponent extends Component {
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

export { OHCaptionComponent };
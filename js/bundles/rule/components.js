import { Rete } from "./rete";

var actionSocket = new Rete.Socket('Action');
var dataSocket = new Rete.Socket('Data');

class MessageControl extends Rete.Control {
  constructor(emitter, msg) {
    super('akey');
    this.render = 'vue';
    this.emitter = emitter;
    this.component = { // Vue component
      data: function () { return { value: '' } },
      props: ['change'],
      template: '<input :value="value" @input="change($event)"/>'
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
    this.vueContext.value = val;
    this.update();
  }
}

class KeydownComponent extends Rete.Component {
  constructor() {
    super('MQTT Receive Trigger');
  }

  builder(node) {
    node.addOutput(new Rete.Output('act', 'Topic name', actionSocket))
    node.addOutput(new Rete.Output('key', 'Payload', dataSocket));
  }
}

class EnterPressComponent extends Rete.Component {
  constructor() {
    super('Enter pressed');
  }

  builder(node) {
    node
      .addInput(new Rete.Input('act', 'Topic name', actionSocket))
      .addInput(new Rete.Input('key', 'Payload', dataSocket))
      .addOutput(new Rete.Output('then', 'Then', actionSocket))
      .addOutput(new Rete.Output('else', 'Else', actionSocket));
  }
}

class AlertComponent extends Rete.Component {
  constructor() {
    super('Alert');
  }

  builder(node) {
    var ctrl = new MessageControl(this.editor, node.data.msg);
    node
      .addControl(ctrl)
      .addInput(new Rete.Input('act', '', actionSocket, true));
  }
}

export { KeydownComponent, EnterPressComponent, AlertComponent };

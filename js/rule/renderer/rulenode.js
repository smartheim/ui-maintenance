const replace = s => s.toLowerCase().replace(/ /g, '-');

const RuleNode = {
  template: '#rulenode',
  props: ['node', 'editor', 'bindSocket', 'bindControl'],
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
}

export { RuleNode };
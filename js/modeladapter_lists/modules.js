import { store } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("uid");
    this.runtimeKeys = []; this.triggers = []; this.conditions = []; this.actions = [];
  }
  stores() { return { "module-types": "items" } };
  getall(options = null) {
    return this.get(null, null, options);
  }
  get(table = null, objectid = null, options = {}) {
    return Promise.resolve()
      .then(() => store.get("module-types", null, Object.assign(options, { filter: "type:trigger" }))
        .then(triggers => this.triggers = triggers))
      .then(() => store.get("module-types", null, Object.assign(options, { filter: "type:condition" }))
        .then(conditions => this.conditions = conditions))
      .then(() => store.get("module-types", null, Object.assign(options, { filter: "type:action" }))
        .then(actions => this.actions = actions))
  }
  dispose() {
  }
}


const ModulesMixin = {
  computed: {
    isTrigger() {
      return this.item.type == "trigger";
    },
    isCondition() {
      return this.item.type == "condition";
    },
    isAction() {
      return this.item.type == "action";
    },
    triggersFiltered() {
      if (!this.filter) return this.triggers;
      return this.triggers.filter(i => i.match(this.filter));
    },
    conditionsFiltered() {
      if (!this.filter) return this.conditions;
      return this.conditions.filter(i => i.match(this.filter));
    },
    actionsFiltered() {
      if (!this.filter) return this.actions;
      return this.actions.filter(i => i.match(this.filter));
    },
  },
  methods: {
    dragstart(event) {
      event.dataTransfer.setData("oh/rulecomponent", event.target.dataset.uid);
      event.dataTransfer.dropEffect = "copy";
    },
    addToEditor() {
      const editorEl = document.querySelector("oh-rule-editor");
      console.log("DOUBLE CLICK", editorEl);
      if (!editorEl) return;
      editorEl.add(this.item.uid);
    }
  }
};


const ListMixin = {
  computed: {
    triggersFiltered() {
      if (!this.filter) return this.triggers;
      return this.triggers.filter(i => i.label.match(this.filter));
    },
    conditionsFiltered() {
      if (!this.filter) return this.conditions;
      return this.conditions.filter(i => i.label.match(this.filter));
    },
    actionsFiltered() {
      if (!this.filter) return this.actions;
      return this.actions.filter(i => i.label.match(this.filter));
    },
  },
  data: function () {
    return {
      filter: null
    }
  },
};

const mixins = [ModulesMixin];
const listmixins = [ListMixin];

export { mixins, listmixins, ModelAdapter };

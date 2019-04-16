import { store, fetchMethodWithTimeout, createNotification } from '../app.js';

class ModelAdapter {
  constructor() {
    this.STORE_ITEM_INDEX_PROP = Object.freeze("uid");
    this.runtimeKeys = [];
    this.value = {}; this.moduletypes = []; this.about = {};
  }
  stores() { return { "rules": "value", "module-types": "moduletypes" } };
  get(table = null, objectid = null, options = null) {
    return (objectid ? store.get("rules", objectid, options) : Promise.resolve({}))
      .then(v => this.value = v)
      .then(() => this.value.configDescriptions && this.value.configDescriptions.length > 0 ?
        store.get("config-descriptions", this.value.configDescriptions[0], { force: true }) : null)
      .then(v => this.config = v)
      .then(() => store.get("about", null, options))
      .then(v => this.about = Array.isArray(v) ? v[0] : {})
      .then(() => store.get("module-types", null, { force: true }))
      .then(v => this.moduletypes = v);
  }
  dispose() {
  }
  getConfig() {
    return this.config;
  }
}

const ServiceMixin = {
  computed: {
    nextStatus() {
      return (this.value && this.value.status) ? this.value.status.status : "";
    },
    cannotcreate() {
      return !(this.valuecopy && this.valuecopy.name && this.valuecopy.name.length > 0 && this.valuecopy.description && this.valuecopy.description.length > 0);
    }
  },
  data: function () {
    return {
      status: this.nextStatus,
      recentRun: false,
      nodescript: null,
      isNew: false
    }
  },
  watch: {
    value() {
      if (this.isFirstTimeValueSet) return;
      this.isFirstTimeValueSet = true;
      this.isNew = this.value.uid === undefined;
      if (!this.isNew) return;

      function S4() {
        return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
      }

      this.value.uid = (S4() + S4() + "-" + S4() + "-4" + S4().substr(0, 3) + "-" + S4() + "-" + S4() + S4() + S4()).toLowerCase();
      this.value.visibility = "VISIBLE"; // Default is visibility visible
      this.changed = false;
    },
    nextStatus() {
      // Add a bit of delay before changing the rule status so that the user can see the change
      if (!this.statusChangeTimer) {
        this.status = this.nextStatus;
        this.statusChangeTimer = setTimeout(() => {
          this.status = this.nextStatus;
          delete this.statusChangeTimer;
        }, 300);
      }
    }
  },
  methods: {
    /**
     * This is called by the editor widget, responsible for all module-types that embed scripts,
     * as soon as the user changed anything.
     * The actual value of the editor is assigned back to the respective control.
     * 
     * @param {String} value The editor value
     */
    editorContentChanged(value) {
      this.changed = true;
      document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: true }));
      this.nodescript.control.value = value;
    },
    /**
     * Calling this method will set the "nodescript" value, which in turn
     * makes the editor widget visible and display whatever is provided as "value".
     * 
     * @param {Object} event The event
     * @param {Object} event.detail The event details
     * @param {Object} event.detail.control The rete "control" object
     * @param {String} event.detail.control.value The rete "control" object value
     */
    showEditor(event) {
      this.nodescript = { control: event.detail.control, value: event.detail.control.value, language: 'javascript', modeluri: null };
    },
    /**
     * Called by the oh-rule-editor on change.
     */
    setChanged() {
      console.log("CHANGED=TRUE setChanged");
      this.changed = true;
      document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: true }));
    },
    create() {
      if (this.cannotcreate) return;
      const rule = Object.assign(this.valuecopy, this.$refs.ruleeditor.getRuleJson());
      console.log("CREATE RULE", rule);
      fetchMethodWithTimeout(store.host + "/rest/rules", "POST", JSON.stringify(rule))
        .then(r => {
          document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: false }));
          createNotification(null, `${rule.name} saved`, false, 2000);
          this.isNew = false;
        }).catch(e => {
          createNotification(null, `Failed to save ${rule.name}: ${e}`, false, 4000);
        });
    },
    save() {
      if (!this.changed) return;
      this.changed = false;
      const rule = Object.assign({}, this.valuecopy, this.$refs.ruleeditor.getRuleJson());
      fetchMethodWithTimeout(store.host + "/rest/rules/" + rule.uid, "PUT", JSON.stringify(rule))
        .then(r => {
          document.dispatchEvent(new CustomEvent("unsavedchanges", { detail: false }));
          createNotification(null, `${rule.name} saved`, false, 2000);
        }).catch(e => {
          this.changed = true;
          createNotification(null, `Failed to save ${rule.name}: ${e}`, false, 4000);
        });
    },

    run() {
      if (this.changed && recentRun) return;
      this.recentRun = true;
      fetchMethodWithTimeout(store.host + "/rest/rules/" + this.value.uid + "/runnow", "POST", "", null)
        .then(r => {
          setTimeout(() => this.recentRun = false, 1000);
          createNotification(null, `Run ${this.value.name}`, false, 1500);
        }).catch(e => {
          setTimeout(() => this.recentRun = false, 1000);
          createNotification(null, `Failed ${this.value.name}: ${e}`, false, 4000);
        });
    },

    copyClipboard(event, itemid) {
      if (!itemid) return;
      const range = document.createRange();
      range.selectNode(event.target);
      window.getSelection().removeAllRanges();
      window.getSelection().addRange(range);
      document.execCommand("copy");
      createNotification("clipboard", `Copied ${itemid} to clipboard`, false, 3000);
    },

    generateCommunityHelpLink(event) {
      const title = `Need help with rule ${this.value.name}`;
      const ruleString = JSON.stringify(this.value, null, 2);
      const link = `https://community.openhab.org/new-topic?title=${encodeURIComponent(title)}&category=setup-configuration-and-use/scripts-rules&tags=ngre,helplink`;
      if (ruleString.length > 400) {
        const body = encodeURIComponent(
          `Platform information: ${this.store.about.name} ${this.store.about.version} (${new Date(this.store.about.builddate).toLocaleDateString()})<hr>\nThe problematic rule:\n[Paste your rule here!]`).replace(/%20/g, ' ');
        createNotification("clipboard", `Your rule has been copied to the clipboard. Paste your code in the created forum topic.<br>
          <a target="_blank" href="${link}&body=${body}" class="btn btn-primary w-100 mt-2">Create topic</a>`, true, 3000);
        let el = document.createElement("textarea");
        el.style.display = "none";
        el.value = ruleString;
        el = document.body.appendChild(el);
        const range = document.createRange();
        range.selectNode(el);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand("copy");
        el.remove();
        event.target.target = "";
        event.preventDefault();
        return;
      }
      const body = encodeURIComponent(`Explain your problem... Your rule code:\n\n\`\`\`${ruleString}\`\`\``).replace(/%20/g, ' ');
      event.target.target = "_blank";
      event.target.href = link + "&body=" + body;
    }
  }
};

const mixins = [ServiceMixin];

export { mixins, ModelAdapter };

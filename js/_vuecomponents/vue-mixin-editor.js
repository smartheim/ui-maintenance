import { MultiRestError } from '../js/app.js'; // Pre-bundled, external reference
import { determineDifference } from '../_common/determineDifference'
import { generateTemplateForSchema } from '../_common/generate_demo'

const EditorMixin = {
  mounted: function () {
    this.editorActionsBar = document.querySelector("ui-filter");
    if (this.editorActionsBar) {
      this.editorEventBound = (event) => this.updateSelectMode(event);
      this.editorActionsBar.addEventListener("editor", this.filterbarEditorEvent);
    }
    this.editorSaveAllInteraction = ((mixin) => {
      return {
        confirmedFn: (r) => mixin.saveAllConfirmed(r.detail),
        selectedFn: (symbol) => mixin.symbolSelected(symbol),
        editorClosed(editor) {
          delete this.lastSymbol;
          editor.setCompletionHelper();
          editor.removeEventListener("confirmed", this.confirmedFn);
        },
        editorOpened(editor) {
          editor.setCompletionHelper((symbols, trigger) => {
            if (!mixin.modelschema) return [];
            const schema = mixin.modelschema.schema.definitions.item;
            if (!symbols || symbols.length == 1) {
              let content = generateTemplateForSchema(schema.properties,
                null, null, null, null, null, true);
              if (mixin.runtimeKeys) {
                for (const runtimeKey of mixin.runtimeKeys)
                  delete content[runtimeKey];
              }
              // Sets a valid unique id for the id property
              content[mixin.STORE_ITEM_INDEX_PROP] = Math.random().toString(12).slice(2);

              return [{
                label: 'New ' + schema.description,
                documentation: 'Creates a new object template',
                insertText: content,
              }];
            } else if (mixin.editorCompletion)
              return mixin.editorCompletion(symbols, trigger);
            else
              return [];
          });
          editor.addEventListener("confirmed", this.confirmedFn);
          if (mixin.symbolSelected) editor.addEventListener("selected", this.selectedFn);
        }
      }
    })(this);
    this.addEditorReadyListener(this.editorSaveAllInteraction);
  },
  beforeDestroy: function () {
    if (this.editorActionsBar) {
      this.editorActionsBar.removeEventListener("editor", this.editorEventBound);
      delete this.editorActionsBar;
    }
    this.removeEditorReadyListener(this.editorThingInteraction);
  },
  methods: {
    async saveAllConfirmed(r) {
      if (r.dialogid != "confirmsave" || !r.result) return;
      try {
        console.trace("saveAllConfirmed");
        this.$refs.editor.readonly = true;
        this.$refs.editor.haschanges = false;
        await this.saveAll(
          this.confirmedToBeSaved.updated,
          this.confirmedToBeSaved.created,
          this.confirmedToBeSaved.removed
        );
        this.$refs.editor.readonly = false;
        this.$refs.editor.content = this.toTextual();
        this.editorActionsBar.setEditorContentChanged(false);

      } catch (e) {
        console.warn(e);
        let errorMessage;
        if (e instanceof MultiRestError) {
          errorMessage = "<ul>";
          for (let item of e.failedItems) {
            errorMessage += `<li>${item}</li>`;
          }
          errorMessage += "</ul>";
        } else
          errorMessage = `<div>${e.message}</div>`;
        this.$refs.editor.showConfirmDialog("error", null, "Understood", `<h2>Some errors have happened</h2>${errorMessage}`);
        const msg = `Errors have happened!`;
        this.editorActionsBar.setEditorContentChanged(true, msg);
      }
    },
    requestConfirmation() {
      try {
        this.$refs.editor.readonly = true;
        this.confirmedToBeSaved = determineDifference(this.$refs.editor.content,
          this.$refs.editor.originalcontent, this.STORE_ITEM_INDEX_PROP);
        let message = "<ul>";
        this.confirmedToBeSaved.updated.forEach(l => message += "<li>" + l[this.STORE_ITEM_INDEX_PROP] + " (updated)</li>")
        this.confirmedToBeSaved.created.forEach(l => message += "<li class='text-info'>" + l[this.STORE_ITEM_INDEX_PROP] + " (created)</li>")
        this.confirmedToBeSaved.removed.forEach(l => message += "<li class='text-danger'>" + l[this.STORE_ITEM_INDEX_PROP] + " (removed)</li>")
        message += "</ul>";
        this.$refs.editor.showConfirmDialog("confirmsave", "Save", "Cancel",
          `<h2>Please confirm</h2>${message}`);

      } catch (e) {
        console.warn(e);
        this.$refs.editor.showConfirmDialog("error", null, "Understood", `<h2>Syntax errors!</h2><div>${e}</div>`);
        const msg = `Syntax errors!`;
        this.editorActionsBar.setEditorContentChanged(true, msg);
      }
    },
    filterbarEditorEvent(event) {
      if (event.detail.discard) {
        this.$refs.editor.haschanges = false;
        this.$refs.editor.content = this.toTextual();
        this.editorActionsBar.setEditorContentChanged(false);
      } else if (event.detail.save) {
        this.requestConfirmation();
      }
    },
    editorContentChanged(editor) {
      const msg = `The selected ${editor.originalcontent.length} objects are now protected from external changes. Submit when you are ready.`;
      this.editorActionsBar.setEditorContentChanged(true, msg);
    },
    toTextual() {
      if (this.$refs.editor && this.$refs.editor.haschanges) {
        console.warn("Editor content protected from change!");
        return null;
      }

      let items;
      if (Array.isArray(this.items)) {
        items = JSON.parse(JSON.stringify(this.items));
        // Filter out the runtime keys in each item
        if (this.runtimeKeys) {
          for (var item of items) {
            for (const runtimeKey of this.runtimeKeys)
              delete item[runtimeKey];
          }
        }
      } else if (this.valuecopy) {
        items = JSON.parse(JSON.stringify(this.valuecopy));
      } else {
        return null;
      }

      return { value: items, language: 'yaml', modeluri: this.modelschema ? this.modelschema.uri : null };
    },
  }
};

export { EditorMixin };
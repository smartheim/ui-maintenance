import Vue from 'vue/dist/vue.esm.js';

const ListModeMixin = {
  data: function () {
    return {
      viewmode: "list",
      hasMore: false
    }
  },
  watch: {
    viewmode: function (val, lastVal) {
      if (val !== "textual") {
        if (lastVal == "textual" && this.$refs.editor) {
          for (let v of this.editorListeners.values()) v.editorClosed(this.$refs.editor);
        }
        return;
      }
      Vue.nextTick(() => {
        if (!this.$refs.editor) return;
        for (let v of this.editorListeners.values()) v.editorOpened(this.$refs.editor);
      });
    }
  },
  mounted: function () {
    this.editorListeners = new Set();
    this.filterbar = document.querySelector("ui-filter");
    if (this.filterbar) {
      this.viewmode = this.filterbar.mode;
      this.updateViewModeBound = (event) => this.updateViewMode(event);
      this.filterbar.addEventListener("mode", this.updateViewModeBound);
    }
  },
  beforeDestroy: function () {
    if (this.filterbar) {
      this.filterbar.removeEventListener("mode", this.updateViewModeBound);
      delete this.filterbar;
    }
  },
  methods: {
    showMore: function () {
      if (this.filterbar) this.filterbar.dispatchEvent(new Event("showmore"));
    },
    updateViewMode: function (event) {
      this.viewmode = event.detail.mode;
    },
    addEditorReadyListener(callback) {
      this.editorListeners.add(callback);
    },
    removeEditorReadyListener(callback) {
      this.editorListeners.delete(callback);
    }
  }
};

export { ListModeMixin };
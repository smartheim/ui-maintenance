
const ItemSelectionMixin = {
  data: function () {
    return {
      selected: false
    }
  },
  mounted: function () {
    this.clickSelectedBound = () => {
      if (!this.$root.selectmode) return;
      this.selected = !this.selected;
      this.updateSelection();
    }
    this.$el.addEventListener("click", this.clickSelectedBound);
  },
  beforeDestroy: function () {
    this.$el.removeEventListener("click", this.clickSelectedBound);
    if (this.selected) this.$root.selectedcounter -= 1;
  },
  methods: {
    updateSelection() {
      if (this.selected) {
        this.$el.classList.add("selected");
        this.$root.selectedcounter += 1;
      } else {
        this.$el.classList.remove("selected");
        this.$root.selectedcounter -= 1;
      }
    }
  }
}

const ListViewSelectionModeMixin = {
  data: function () {
    return {
      selectedcounter: 0,
      selectmode: false,
    }
  },
  watch: {
    selectedcounter: function () {
      document.dispatchEvent(new CustomEvent("selectionchanged", { detail: this.selectedcounter }));
    }
  },
  mounted: function () {
    this.filterbar = document.querySelector("ui-filter");
    if (this.filterbar) {
      this.selectmode = this.filterbar.selectmode;
      this.updateSelectModeBound = (event) => this.updateSelectMode(event);
      this.filterbar.addEventListener("selection", this.updateSelectModeBound, { passive: true });
    }
  },
  beforeDestroy: function () {
    if (this.filterbar) {
      this.filterbar.removeEventListener("selection", this.updateSelectModeBound, { passive: true });
      delete this.filterbar;
    }
  },
  methods: {
    itemsChangedInSelectionMode() {
      console.log("items changed while in selection mode");
    },
    updateSelectMode: function (event) {
      if (event.detail.action) {
        const action = event.detail.action;
        // There is one transition-group child and then all the item children
        const selected = this.$root.$children[0].$children.filter(e => e.selected);
        for (let child of selected) {
          if (child[action]) child[action]();
        }
      }
      if (event.detail.selectmode !== undefined) {
        this.selectmode = event.detail.selectmode;
        if (this.selectWatcher) {
          this.selectWatcher();
          delete this.selectWatcher;
        }
        if (this.selectmode) {
          // The return value is a function to dispose the watcher again
          this.selectWatcher = this.$watch('items', this.itemsChangedInSelectionMode);
          let count = 0;
          var items = document.querySelectorAll("#listcontainer .listitem");
          for (var item of items)
            if (item.classList.contains("selected"))++count;
          this.selectedcounter = count;
        }
      }
    },
  }
}

export { ListViewSelectionModeMixin, ItemSelectionMixin };
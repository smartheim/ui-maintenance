import Yaml from '../../common/yaml/yaml';

const UIFilterbarMixin = {
    props: ['filtercriteria'],
    data: function () {
        return {
            selectedcounter: 0,
            viewmode: "list",
            selectmode: false,
            filter: null
        }
    },
    mounted: function () {
        this.filterbar = document.querySelector("ui-filter");
        if (this.filterbar) {
            this.viewmode = this.filterbar.mode;
            this.selectmode = this.filterbar.selectmode;
            this.updateViewModeBound = (event) => this.updateViewMode(event);
            this.updateSelectModeBound = (event) => this.updateSelectMode(event);
            this.updateFilterBound = (event) => this.updateFilter(event);
            this.filterbar.addEventListener("filter", this.updateFilterBound);
            this.filterbar.addEventListener("mode", this.updateViewModeBound);
            this.filterbar.addEventListener("selectmode", this.updateSelectModeBound);
        }
    },
    beforeDestroy: function () {
        if (this.filterbar) {
            this.filterbar.removeEventListener("filter", this.updateFilterBound);
            this.filterbar.removeEventListener("mode", this.updateViewModeBound);
            this.filterbar.removeEventListener("selectmode", this.updateSelectModeBound);
            delete this.filterbar;
        }
    },
    computed: {
        containerclasses: function () {
            var classes = [this.viewmode];
            if (this.selectmode) classes.push("selectionmode");
            return classes;
        },
        filtered: function () {
            if (!this.filter) return this.items;
            return this.items.filter(item => {
                var value = item[this.filtercriteria];
                if (!value) return false;
                return value.toLowerCase().match(this.filter);
            });
        }
    },
    methods: {
        updateFilter: function (event) {
            // Don't type-and-search if over 100 items in list
            if (this.items.length > 100 && event.detail.typing) return;
            this.filter = event.detail.value.toLowerCase();
        },
        updateSelectMode: function (event) {
            this.selectmode = event.detail.selectmode;
            this.updateSelectCounter();
        },
        updateViewMode: function (event) {
            this.viewmode = event.detail.mode;
        },
        updateSelectCounter: function (event) {
            if (!this.selectmode) return;
            var item = event ? event.target.closest('.listitem') : null;
            if (item) {
                if (item.classList.contains("selected")) {
                    item.classList.remove("selected");
                    this.selectedcounter = this.selectedcounter - 1;
                } else {
                    item.classList.add("selected");
                    this.selectedcounter = this.selectedcounter + 1;
                }
            } else {
                this.selectedcounter = 0;
                var items = document.querySelectorAll("#listcontainer .listitem");
                for (var item of items)
                    if (item.classList.contains("selected"))++this.selectedcounter;
            }
            document.querySelectorAll(".selectcounter").forEach(e => e.textContent = this.selectedcounter);
        }

    }
};

const UIEditorMixin = {
    props: ['modelschema', 'modeluri', 'runtimeKeys'],
    data: function () {
        return {
            editorstate: "original"
        }
    },
    computed: {
        editorclasses: function () {
            return this.editorstate == "original" ? "" : "changed";
        },
    },
    methods: {
        editorstateChanged: function (state) {
            this.editorstate = state;
        },
        toTextual: function () {
            // First get all filtered items
            var items = JSON.parse(JSON.stringify(this.filtered));
            // Then filter out the runtime keys in each item
            if (this.runtimeKeys) {
                for (var item of items) {
                    delete item.changed_; // We annotate UI changed items.
                    for (const runtimeKey of this.runtimeKeys)
                        delete item[runtimeKey];
                }
            }
            return {
                raw: items, value: Yaml.stringify(items, 2, 2).replace(/-   /g, "- "),
                language: 'yaml', modeluri: this.modeluri
            };
        },
    }
};

export { UIFilterbarMixin, UIEditorMixin };
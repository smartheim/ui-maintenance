import Yaml from '../../common/yaml/yaml';

const UIFilterbarMixin = {
    data: function () {
        return {
            selectedcounter: 0,
            viewmode: "list",
            selectmode: false,
            filtered: [],
            hasMore: false,
        }
    },
    created: function () {
        this.props = ['filtercriteria'];
        this.filter = null;
        this.customcriteria = null;
        if (!this.maxFilteredItems) this.maxFilteredItems = 100;
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
        }
    },
    methods: {
        showMore: function () {
            this.maxFilteredItems += 50;
            this.rebuildList();
        },
        updateFilter: function (event) {
            var filter = event.detail.value.trim();
            if (filter.length == 0)
                this.filter = null;
            else {
                var parts = filter.split(":");
                if (parts.length > 1) {
                    this.customcriteria = parts[0];
                    this.filter = parts[1].trim().toLowerCase();
                } else {
                    this.customcriteria = null;
                    this.filter = filter.toLowerCase();
                }
            }

            if (this.filterThrottleTimer) {
                clearTimeout(this.filterThrottleTimer);
            }
            this.filterThrottleTimer = setTimeout(() => {
                delete this.filterThrottleTimer;
                this.rebuildList();
            }, 80);
        },
        rebuildList: function () {
            if (!this.filter) {
                this.hasMore = this.items.length > this.maxFilteredItems;
                this.filtered = this.items.slice(0, this.maxFilteredItems);
                return;
            }
            const criteria = this.customcriteria ? this.customcriteria : this.filtercriteria;
            var c = 0;
            var filtered = [];
            // Filter list. The criteria item property can be an array in which case we check
            // if the filter string is within the array
            for (var item of this.items) {
                var value = item[criteria];
                if (!value) continue;
                if (Array.isArray(value)) {
                    if (!value.some(element => element.toLowerCase().match(this.filter)))
                        continue;
                } else if (value instanceof Object) {
                    if (!Object.keys(value).some(key => value[key].toLowerCase().match(this.filter)))
                        continue;
                } else if (!value.toLowerCase().match(this.filter))
                    continue;
                c += 1;
                if (c > this.maxFilteredItems) break;
                filtered.push(item);
            }
            this.hasMore = c >= this.maxFilteredItems;
            this.filtered = filtered;
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
                raw: items, value: Yaml.dump(items, 10, 4).replace(/-     /g, "-\n    "),
                language: 'yaml', modeluri: this.modelschema ? this.modelschema.uri : null
            };
        },
    }
};

export { UIFilterbarMixin, UIEditorMixin };
import { treeService } from "./testdata";
import { hasChildren } from "./utils";
import { calculateFullTree } from "./position";
import Vue from 'vue/dist/vue.esm.js';

/*** COMPONENTS ***/
var nodeTemplate = {
    template: '#node-template',
    props: ['node'],
    computed: {
        transform: function () {
            var x = this.node.x - 50;
            var y = this.node.y - 25;
            return `translate(${x}, ${y})`;
        }
    }
};

var linkTemplate = {
    template: '#link-template',
    props: ['link'],
    computed: {
        path: function () {
            const treeService = this.$root.service;
            const moveTo = 'M' + this.link.start.x + ',' + this.link.start.y;
            const verticalFirst = 'V' + (this.link.end.y - (treeService.verticalSpacing / 2) - (treeService.componentHeight / 2));
            const horizontal = 'H' + this.link.end.x;
            const verticalSecond = 'V' + this.link.end.y;

            const a = moveTo + verticalFirst + horizontal + verticalSecond;
            return a;
        }
    }
};

function start() {
    if (!document.getElementById("rulesapp")) return;
    new Vue({
        el: '#rulesapp',
        template: "#container-template",
        data: {
            service: treeService
        },
        created: function () {
            calculateFullTree(treeService);
        },
        methods: {
            getAllNodes: function () {
                var nodes = [];
                for (var level of this.service.data) {
                    for (var node of level) {
                        nodes.push(node);
                    };
                };
                return nodes;
            },
            getAllLinks: function () {
                var links = [];
                for (var level of this.service.data) {
                    for (var node of level) {
                        if (!hasChildren(node)) continue;
                        for (var child of node.children) {
                            var childNode = this.service.data[child.level][child.index];
                            links.push({
                                id: 'link' + node.level + node.index + childNode.level + childNode.index,
                                start: {
                                    x: node.x,
                                    y: node.y
                                },
                                end: {
                                    x: childNode.x,
                                    y: childNode.y
                                }
                            });
                        };

                    };
                };
                return links;
            }
        },
        components: {
            'node-template': nodeTemplate,
            'link-template': linkTemplate
        }
    });
}

document.addEventListener("DOMContentLoaded", () => start());
if (['interactive', 'complete'].includes(document.readyState)) start();

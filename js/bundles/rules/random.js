import { hasChildren, hasParents } from "./utils";

/** START RANDOM **/

function reCalculateIndices(data, newNodeLevel, newNodeIndex) {
    data.forEach(function (level) {
        level.forEach(function (node) {
            if (node.level == newNodeLevel && node.index >= newNodeIndex) {
                ++node.index;
            }
            if (hasParents(node)) {
                node.parents.forEach(function (parent) {
                    if (parent.level == newNodeLevel && parent.index >= newNodeIndex) {
                        ++parent.index;
                    }
                });
            }
            if (hasChildren(node)) {
                node.children.forEach(function (child) {
                    if (child.level == newNodeLevel && child.index >= newNodeIndex) {
                        ++child.index;
                    }
                });
            }
        });
    });
}

var index = 0;

function random(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function insertRandomNode(treedata) {
    var newNodeLevel = random(1, treedata.length);
    var newNodeIndex = 0;

    if (treedata[newNodeLevel]) {
        newNodeIndex = random(0, treedata[newNodeLevel].length);
    }

    reCalculateIndices(treedata, newNodeLevel, newNodeIndex);

    // Add a parent to the newNode
    var parents = [];
    var parentLevel = newNodeLevel - 1;
    var parentIndex = random(0, treedata[parentLevel].length - 1);

    parents.push({
        level: parentLevel,
        index: parentIndex
    });
    if (!treedata[parentLevel][parentIndex].children) {
        treedata[parentLevel][parentIndex].children = [];
    }

    treedata[parentLevel][parentIndex].children.push({
        level: newNodeLevel,
        index: newNodeIndex
    });

    // Add a child to the newNode
    var children = [];
    if (newNodeLevel < treedata.length - 1) {
        var childLevel = random(newNodeLevel + 1, treedata.length - 1);
        var childIndex = random(0, treedata[childLevel].length - 1);

        children.push({
            level: childLevel,
            index: childIndex
        });
        treedata[childLevel][childIndex].parents.push({
            level: newNodeLevel,
            index: newNodeIndex
        });
    }

    var newNode = {
        level: newNodeLevel,
        index: newNodeIndex,
        label: 'random' + index++,
        parents: parents,
        children: children,
        x: 0,
        y: 0,
        weight: 0
    };

    if (!treedata[newNodeLevel]) {
        treedata.$set(newNodeLevel, []);
    }
    treedata[newNodeLevel].splice(newNodeIndex, 0, newNode);
}

/** END RANDOM **/


/** START TOOLS FUNCTIONS **/
function hasParents(node) {
    return node.parents && node.parents.length > 0;
}

function hasChildren(node) {
    return node.children && node.children.length > 0;
}

function firstParent(node) {
    var firstParent = node;
    var savedX = treeService.svgWidth + treeService.svgPadding.left + treeService.svgPadding.right;

    if (hasParents(node)) {
        node.parents.forEach(function (parent) {
            if (treeService.data[parent.level][parent.index].x < savedX) {
                savedX = treeService.data[parent.level][parent.index].x;
                firstParent = treeService.data[parent.level][parent.index];
            }
        });
    }
    return firstParent;
}

function lastParent(node) {
    var lastParent = node;
    var savedX = 0;

    if (hasParents(node)) {
        node.parents.forEach(function (parent) {
            if (treeService.data[parent.level][parent.index].x > savedX) {
                savedX = treeService.data[parent.level][parent.index].x;
                lastParent = treeService.data[parent.level][parent.index];
            }
        });
    }
    return lastParent;
}

function firstChild(node) {
    var firstChild = node;
    var savedX = treeService.svgWidth + treeService.svgPadding.left + treeService.svgPadding.right;

    if (hasChildren(node)) {
        node.children.forEach(function (child) {
            if (treeService.data[child.level][child.index].x < savedX) {
                savedX = treeService.data[child.level][child.index].x;
                firstChild = treeService.data[child.level][child.index];
            }
        });
    }
    return firstChild;
}

function lastChild(node) {
    var lastChild = node;
    var savedX = 0;

    if (hasChildren(node)) {
        node.children.forEach(function (child) {
            if (treeService.data[child.level][child.index].x > savedX) {
                savedX = treeService.data[child.level][child.index].x;
                lastChild = treeService.data[child.level][child.index];
            }
        });
    }
    return lastChild;
}

function isSameNode(node1, node2) {
    return node1.level == node2.level && node1.index == node2.index;
}

function areSiblings(node1, node2) {
    var siblings = false;

    node1.parents.forEach(function (parent1) {
        node2.parents.forEach(function (parent2) {
            if (parent1.level == parent2.level && parent1.index == parent2.index) {
                siblings = true;
                return;
            }
        });
        if (siblings) {
            return;
        }
    });
    return siblings;
}

function getParentPosition(treeService, node) {
    var index = 0;

    for (var i = 1; node.index - i >= 0; ++i) {
        if (areSiblings(node, treeService.data[node.level][node.index - i])) {
            ++index;
        }
    }

    return index;
}

function hasPreviousSibling(treeService, node) {
    // if node is not first child of its first parent
    return getParentPosition(treeService, node) != 0;
}

/** END TOOLS FUNCTIONS **/

export { hasPreviousSibling, hasChildren, hasParents };
import { hasPreviousSibling, hasChildren } from "./utils";

/***** ALGO DRAW TREE *****/

function calculateWeight(treedata, level, index) {
    var node = treedata[level][index];

    if (!node) console.error(level, index);

    if (!hasChildren(node)) {
        node.weight = 1;
        return node.weight;
    }

    node.weight = 0;
    for (var child of node.children) {
        node.weight += calculateWeight(treedata, child.level, child.index);
    }
    return node.weight;
}

function calculatePositionX(treeService, node) {
    var result = 0;

    // root
    if (!node.parents || node.parents.length == 0) {
        result = (treeService.svgWidth / 2);
    } else {
        var firstParent = treeService.data[node.parents[0].level][node.parents[0].index];
        var lastParent = treeService.data[node.parents[node.parents.length - 1].level][node.parents[node.parents.length - 1].index];
        var previousSibling = treeService.data[node.level][node.index - 1];
        var halfComponentSize = (treeService.componentWidth + treeService.componentMargin) / 2;

        var centerX = (firstParent.x + lastParent.x) / 2;
        var halfSiblingSize = firstParent.weight * halfComponentSize;
        var halfOwnSpace = node.weight * halfComponentSize;

        if (hasPreviousSibling(treeService, node)) {
            var previousEnd = previousSibling.x + (previousSibling.weight * halfComponentSize);
        }

        result = halfOwnSpace;

        if (hasPreviousSibling(treeService, node)) {
            result += previousEnd;
        } else {
            result += centerX - halfSiblingSize;
        }
    }

    return result;
}

function calculatePositionY(treeService, levelIndex) {
    return ((treeService.verticalSpacing + treeService.componentHeight) * levelIndex) + (treeService.componentHeight / 2);
}

function placeNodes(treeService) {
    for (var levelIndex in treeService.data) {
        var level = treeService.data[levelIndex];
        for (var node of level) {
            node.x = calculatePositionX(treeService, node) + treeService.svgPadding.left;
            node.y = calculatePositionY(treeService, levelIndex) + treeService.svgPadding.top;
        }
    }
}

function computeRootX(treeService) {
    var halfComponentSize = (treeService.componentWidth + treeService.componentMargin) / 2;
    var firstChildHalfSpace = treeService.data[1][0].weight * halfComponentSize;
    var lastChildHalfSpace = treeService.data[1][treeService.data[1].length - 1].weight * halfComponentSize;

    return ((treeService.svgWidth - firstChildHalfSpace - lastChildHalfSpace) / 2) + firstChildHalfSpace;
}

function calculateFullTree(treeService) {
    calculateWeight(treeService.data, 0, 0);
    treeService.svgWidth = (treeService.data[0][0].weight * (treeService.componentWidth + treeService.componentMargin)) + treeService.svgPadding.left + treeService.svgPadding.right;
    treeService.svgHeight = (treeService.data.length * treeService.componentHeight) + ((treeService.data.length - 1) * treeService.verticalSpacing) + treeService.svgPadding.top + treeService.svgPadding.bottom;
    placeNodes(treeService);
    treeService.data[0][0].x = computeRootX(treeService);
}

export { calculateFullTree };

/** DATA + SERVICE **/

var data = [
    [{
        level: 0,
        index: 0,
        label: 'root',
        children: [{
            level: 1,
            index: 0
        }, {
            level: 1,
            index: 1
        }]
    }],
    [{
        level: 1,
        index: 0,
        label: 'node1',
        parents: [{
            level: 0,
            index: 0
        }],
        children: [{
            level: 2,
            index: 0
        }]
    }, {
        level: 1,
        index: 1,
        label: 'node2',
        parents: [{
            level: 0,
            index: 0
        }],
        children: [{
            level: 2,
            index: 0
        }]
    }],
    [{
        level: 2,
        index: 0,
        label: 'node3',
        parents: [{
            level: 1,
            index: 0
        }, {
            level: 1,
            index: 1
        }],
    }]
];

var treeService = {
    data: data,
    verticalSpacing: 50,
    componentMargin: 25,
    componentHeight: 50,
    componentWidth: 100,
    svgWidth: 0,
    svgHeight: 0,
    svgPadding: {
        top: 50,
        bottom: 0,
        left: 0,
        right: 0
    }
};

export {treeService};
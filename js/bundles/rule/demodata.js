
var data = {
    'id': 'tasksample@0.1.0',
    'nodes': {
        '2': {
            'id': 2,
            'data': {},
            'group': null,
            'inputs': {},
            'outputs': {
                'act': {
                    'connections': [
                        {
                            'node': 3,
                            'input': 'act'
                        }
                    ]
                },
                'key': {
                    'connections': [
                        {
                            'node': 3,
                            'input': 'key'
                        }
                    ]
                }
            },
            'position': [
                32, 32*5
            ],
            'name': 'MQTT Receive Trigger'
        },
        '3': {
            'id': 3,
            'data': {},
            'group': null,
            'inputs': {
                'act': {
                    'connections': [
                        {
                            'node': 2,
                            'output': 'act'
                        }
                    ]
                },
                'key': {
                    'connections': [
                        {
                            'node': 2,
                            'output': 'key'
                        }
                    ]
                }
            },
            'outputs': {
                'then': {
                    'connections': [
                        {
                            'node': 10,
                            'input': 'act'
                        }
                    ]
                },
                'else': {
                    'connections': [
                        {
                            'node': 11,
                            'input': 'act'
                        }
                    ]
                }
            },
            'position': [
                32*10, 32*4
            ],
            'name': 'Enter pressed'
        },
        '10': {
            'id': 10,
            'data': {
                'msg': 'Enter!'
            },
            'group': null,
            'inputs': {
                'act': {
                    'connections': [
                        {
                            'node': 3,
                            'output': 'then'
                        }
                    ]
                }
            },
            'outputs': [],
            'position': [
                32*20, 32*3
            ],
            'name': 'Alert'
        },
        '11': {
            'id': 11,
            'data': {
                'msg': 'Another key pressed'
            },
            'group': null,
            'inputs': {
                'act': {
                    'connections': [
                        {
                            'node': 3,
                            'output': 'else'
                        }
                    ]
                }
            },
            'outputs': [],
            'position': [
                32*20, 32*10
            ],
            'name': 'Alert'
        }
    },
    'groups': {}
}

export { data };
import VueRenderPlugin from './renderer/index';
import ReteArea from './area/index';
import ConnectionPlugin from './connection/index';
import { Rete } from "./rete";
import { data } from "./demodata";
import { KeydownComponent, EnterPressComponent, AlertComponent } from "./components";

function start() {
    var container = document.getElementById('rulesapp')
    if (!container) return;

    var editor = new Rete.NodeEditor('tasksample@0.1.0', container);
    editor.use(ConnectionPlugin, { curvature: 0.4 });
    editor.use(VueRenderPlugin);
    editor.use(ReteArea, { scaleExtent: true, snap: true, translateExtent: true, background:true });

    var components = [new KeydownComponent, new EnterPressComponent, new AlertComponent];
    components.map(c => {
        editor.register(c);
    });

    editor.on('connectioncreate connectionremove nodecreate noderemove', () => {
        if (editor.silent) return;
    });

    editor.fromJSON(data).then(() => {
        editor.view.resize();
    });
}

document.addEventListener("DOMContentLoaded", () => start());
if (['interactive', 'complete'].includes(document.readyState)) start();

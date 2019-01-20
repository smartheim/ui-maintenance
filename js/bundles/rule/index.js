import VueRenderPlugin from './renderer/index';
import ReteArea from './area/index';
import ConnectionPlugin from './connection/index';
import { Rete } from "./rete";
import { data } from "./demodata";
import { KeydownComponent, EnterPressComponent, AlertComponent } from "./components";


class OhRuleEditor extends HTMLElement {
    constructor() {
        super();
    }
    connectedCallback() {
        var editor = new Rete.NodeEditor('tasksample@0.1.0', this);
        editor.use(ConnectionPlugin, { curvature: 0.4 });
        editor.use(VueRenderPlugin);
        editor.use(ReteArea, { scaleExtent: true, snap: true, translateExtent: true, background: true });

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
        this.editor = editor;
    }
    disconnectedCallback() {
        if (!this.editor) return;
        this.editor.dispose();
        delete this.editor;
    }
}

customElements.define('oh-rule-editor', OhRuleEditor);

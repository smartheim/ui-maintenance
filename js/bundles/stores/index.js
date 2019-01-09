import Vue from 'vue/dist/vue.esm.js';
import Vuex from 'vuex/dist/vuex.esm.js';
export { mapState, mapActions } from 'vuex/dist/vuex.esm.js';
import {demoList, demoPost} from './demo';

Vue.use(Vuex);

const store = new Vuex.Store({
    modules: {
        "demo": demoList,
        "demoPost": demoPost
    }
});

export { Vue, Vuex, store };
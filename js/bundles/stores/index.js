import Vue from 'vue/dist/vue.esm.js';
import Vuex from 'vuex/dist/vuex.esm.js';
import Vapi from './rest/index.js';
export { mapState, mapActions } from 'vuex/dist/vuex.esm.js';

Vue.use(Vuex);

const demo = new Vapi({
    cacheName: "store_demo",
    baseURL: "https://jsonplaceholder.typicode.com",
    state: {
        posts: []
    }
}).get({
    action: "getPost",
    property: "post",
    path: ({ id }) => `/posts/${id}`
}).get({
    action: "listPosts",
    property: "posts",
    path: "/posts"
}).post({
    action: "updatePost",
    property: "post",
    path: ({ id }) => `/posts/${id}`
}).getStore({});
demo.namespaced = true;

const store = new Vuex.Store({
    modules: {
        "demo": demo
    }
});

export { Vue, Vuex, store };
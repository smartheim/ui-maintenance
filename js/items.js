import { Vuex, Vue, store, mapState, mapActions } from './stores.js'

function start() {
    if (!document.getElementById("#items-app")) return;
    new Vue({
        store,
        el: '#items-app',
        template: '#postTemplate',
        created() {
            this.getPosts();
        },
        // make states available
        computed: Vuex.mapState("demo", {
            posts: state => state.posts,
            pending: state => state.pending,
            error: state => state.error
        }),
        methods: {
            ...Vuex.mapActions({
                getPosts: "demo/listPosts"
            })
        }
    });
}

document.addEventListener("DOMContentLoaded", () => start());
if (['interactive', 'complete'].includes(document.readyState)) start();

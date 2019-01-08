import { Vuex, Vue, store, mapState, mapActions } from './stores.js'

function start() {
    if (!document.getElementById("itemsapp")) return;
    new Vue({
        store,
        el: '#itemsapp',
        template: '#postTemplate',
        created() {
            this.getPosts();
        },
        // make states available
        computed: mapState("demo", {
            posts: state => state.posts,
            pending: state => state.pending,
            error: state => state.error
        }),
        methods: {
            ...mapActions({
                getPosts: "demo/listPosts"
            })
        }
    });
}

document.addEventListener("DOMContentLoaded", () => start());
if (['interactive', 'complete'].includes(document.readyState)) start();

# Developer guideline for javascript

You can add your independant javascript files (ES6 modules!) into this directory.
During the build all files in this directory are minified and made available under
`js/filename.js`.

If you want to use npm dependencies (ES6-modules-only!)
and bundle multiple files into a single file, put your files under `js/bundles/your-bundle-name/`.
The entry point file must be `index.js`.
During the build, a single, tree-shaked, minified file is created under `js/your-bundle-name.js`.

No transpiling is performed during the build, as **all** javascript capable browsers
support ES6 modules and async/await by now. (This app is not targeting Internet Explorer).
Use only JS features that are available for all evergreen browsers.

Embed your js files into a webpage by either adding it to `partials/head.html` or
by adding it to the `<body>` section of a page.

* Do NOT add a javascript link to the indivial `<head>` tag of a page.
* Do NOT add inline javascript to pages.

#### State management

State management for REST data is done via the [`Vuex`](https://vuex.vuejs.org/) library.
In `js/bundles/stores/*.js` *Vuex* stores are available that automatically interact with the openHAB
REST Api for Things, Items, Discovery, Addons.

Because the Vuex stores are used mostly together with Vue for rendering dynamic lists,
Vue is included as well.

#### Reactive parts like Lists

Vue is used for reactive parts of the App like rendering a reactive list of Things from the Things-Store.
The templates are not prerendered with a bundler, they are in `<template>` tags within the
respective html file. Each file should contain one Vue instance that mounts to one anchor only. If you would
need more, that is probably a sign that your page need to be split in multiple html files.

An example. Add this to your html pages main section:

```
    <div id="app"></div>
    <template id="postTemplate">
      <div>
        <ul>
          <li v-for="post in posts">{{post.title}}:<div>{{post.body}}</div>
          </li>
        </ul>
        <p v-if="pending.posts">loading posts...</p>
        <p v-if="error.posts">loading failed</p>
      </div>
    </template>
```

Embed a javascript file for your page: `<script type="module" src="js/your-file.js" async></script>`.

Your javascript will establish the Vue instance and mount to `#app`:

```
import { Vuex, Vue, store, mapState, mapActions } from './stores.js'

function start() {
    new Vue({
        store,
        el: '#app',
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
```

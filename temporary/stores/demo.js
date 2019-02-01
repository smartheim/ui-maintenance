import {RestServer,StoreBuilder} from './rest/index.js';

const demoList = new StoreBuilder(new RestServer({
    cacheName: "store_demo",
    baseURL: "https://jsonplaceholder.typicode.com",
    state: {
        posts: []
    }
}).addResource({
    collectionIdentifier: "id",
    property: "posts",
    path: ({ id }) => id ? `/posts/${id}` : "/posts"
})).build({namespaced:true});

const demoPost = new StoreBuilder(new RestServer({
    baseURL: "https://jsonplaceholder.typicode.com",
    state: {
        post: {}
    }
}).addResource({
    property: "post",
    path: ({ id }) => `/posts/${id}`
})).build({namespaced:true});

export {demoList, demoPost};
import Vapi from './rest/index.js';

const demo = new Vapi({
    cacheName: "demo",
    baseURL: "./dummydata",
    pathSuffix: ".js",
    state: {
        things: []
    }
}).get({
    action: "getThing",
    property: "thing",
    path: ({ id }) => `/things/${id}`
}).get({
    action: "list",
    property: "things",
    path: "/things"
}).post({
    action: "updatePost",
    property: "post",
    path: ({ id }) => `/posts/${id}`
}).getStore({});
demo.namespaced = true;

export default demo;
# Developer guideline for javascript

You can add your independant javascript files (ES6 modules!) into any `js/my-subdirectory`.
During the build each directory is build, minified and made available under
`js/my-subdirectory.js`. 

You can use npm dependencies (ES6-modules-only!) in your javascript files.

If you want to bundle multiple files into a single file,
put your files under `js/your-bundle-name/` with an entry point file called `index.js`.
During the build, a single, tree-shaked, minified file is created under `js/your-bundle-name.js`.

Embed your js files into a webpage by either adding it to `partials/head.html` or
by adding it to the `<body>` section of a page.

* Do NOT add a javascript link to the indivial `<head>` tag of a page. Those will not be considered
  when a fetch-based page change happens.
* Do NOT add inline javascript to pages (exception: Theme handling in `<head>`).


## Code style

No old javascript please! The codebase is "var" free and uses ES6 classes and ES8 async/await
and is JSDoc commented/annotated. An external library MUST comply to these standards or cannot
be used.

Use only JS features that have been available for all evergreen browsers for at least 3 months though.
(At the moment that means for example no dynamic `import`. A polyfill is in place.)

Libraries written in Typescript, coffescript, flow, closure and other meta languages
must be transpiled into ES8 or newer.

At the moment not all external libraries provide non-transpiled modules via npm. Those libraries
have been added in a bundled, non-transpiled variant to the codebase and an Issue has been opened.
The idea is to use all external libraries from npm at some point.

Especially chart.js and the VS code monaco editor must be observed for native ES8 variants in the future.

## Web components

Webcomponents for

* fetching and displaying a context help,
* the openHAB community forum,
* github openHAB addons repository for documentation fetching
* navigation components (breadcrumb, prev/next-buttons)

are available in the {@link module:uicomponents} module and can be used in other projects as well.

The html dom API alone is a bit clumsy for more complex reactive components though.
I have used [lit-html](https://lit-html.polymer-project.org/guide/writing-templates) in
some more complex components as renderer.
It has a very similar syntax to the vue renderer, but is not "reactive" like vue
and therefore adds only 1.7KB (tree shaking not even considered) to the `uicomponents` module.

We could think about using `lit-elements` in the future, which uses `lit-html` for
rendering but also offers one-way and two-way bindings. Or we directly use
[Vue 3](https://medium.com/the-vue-point/plans-for-the-next-iteration-of-vue-js-777ffea6fabf), which thanks
to tree-shaking and building up on modern standards only, will also come with a low
footprint.

### Data components / Data model: How does interaction with openHAB works

A Model-View-Adapter (MVA) concept is in place and illustrated in
the following diagram:

![Model-View-Adapter](docs/paperui-ng-dataflow.png "Model-View-Adapter Architecture")

[Image source](https://drive.google.com/file/d/1lqg5GJHdkVk5PlnCgbheggQ7MSwSDHfj/view?usp=sharing)

#### The views

There are several components used as **View**:
* The `ui-dropdown` for a dropdown (e.g. selection of *Items* or *Profiles*)
* The `VueJS` based `oh-vue-list` for reactive lists with model state in mind (Things list, Items list etc)
* The `VueJS` based `oh-vue-form` for a reactive form with model state in mind (New item, New Scene, configuration pages etc)
* The `VueJS` based `oh-vue` for a simple vue rendered template. Cannot be used with most of the controllers.

#### Controllers

The `oh-vue-list-bind`, `oh-vue-form-bind` and `oh-vue-bind` classes serve as **Controllers**.
They observe the *Model* and *Adapter* for any changes.

You will find all controllers in {@link module:ohcomponents}.

#### Adapters

The `modeladapter_lists/*`, `modeladapter_forms/*` and `modeladapter_mixins/*`
classes provide Mixins for the *View*, but also provide
Model **Adapters** that communicate with the *Model* (aka Store).

You will find all adapters in the respective category.

#### The Model

The `app/*` bundle finally provides the frontend database, the **Model**,
for this architecture. All requested REST endpoints are cached in a Index DB and kept
in sync via SSE (Server Send Events). The storage follows a State-While-Revalidate strategy.

The Index DB access and REST updates happen in a web-worker.
Heavy operations like table joining and sorting is outsourced into the worker.

This architecture provides us with low-latency rendering performance.

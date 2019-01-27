# openHAB Paper UI (New generation)

This repository contains a design theme study for a new generation of openHAB paper UI.
See https://davidgraeff.github.io/paperui-ng/.

Please participate by editing files in this repository and make pull requests.
Especially the help texts and introduction text, graphics and potential videos require help.

## Local development

* Install `npm` (node package manager)

1. Check this repository out
2. Call `npm install`
3. Call `npm run dev` to start a local webserver
4. Enter the IP:Port of your openHAB installation in paperui-ng

OR

1. Check this repository out into your openHAB static html directory, usually under `/etc/openhab2/html`.
2. Call `npm install`
3. Call `npm run build`
4. Browse to http://127.0.0.1:8080/static/paperui-ng/dist (replace the IP and Port with your openHAB installation).

## Paper UI

The original Paper UI is a Single Page Application (SPA) developed using a js framework called Angular.

The downside of chosing a js framework is that those come and go. Angular has a step learning
curve, is not versioned semantically, does breaking changes regulary
and people familiar with the framework are rare because of the many existing and partly easier to
use competitors like Reactive, VueJS, Ember, Backbone, Aurelia, Meteor.js.

SPAs require most libraries and interfaces to be loaded and initialized during startup,
although only a fraction is used on every rendered page.

Paper UI therefore suffered from feeling unresponsive in certain situations and is hard to extend.

## New approach: Architecture and used technology

This new approch uses Web components (v1), static html pages, progressive enhancement
and progressive webapps (PWA) technologies like advanced caching.

Web components allow to define own html tags like "oh-binding-doc".
Such an "oh-binding-doc" custom component for example would load and display the documentation for a given binding:
```
<html>
  <head>
    <!-- include the component -->
    <script type="module" src="js/oh-binding-doc.js"></script>
  </head>
  <body>
    <oh-binding-doc binding="mqtt" collapsable collapsed></oh-binding-doc>
  </body>
</html>
```

* Web components (v1) are a standard web technology and work in
  all evergreen-browsers (Chrome, Firefox, Samsung Internet, Opera, Safari, Edge).
  No framework is required and at the same time every framework is compatible.
* Static Html pages (/index.html, /items.html, /things.html) allow to only load the
  exact subset of necessary libraries and style sheets per page.
  Memory consumption is reduced, because of a small DOM. This is especially
  useful, because the VS-Code editor for example weights 7 MB, and is only loaded
  on pages that require them.

### Page layout and page changing

There is a responsive css grid layout in place, therefore the html layout need to
be similar on all pages. Have a look at `src/newpage_template.html` for a commented
html layout that need to be conformed to.

The advantage of SPAs are that the shell of the application stays, so there is no
flickering while changing to another subpage.
This is realised in this project as a progressive enhancement, by adding
the custom component `<nav-ajax-page-load></nav-ajax-page-load>` to the page.
Clicks are intercepted and only parts of the current shown page are replaced.

### Static pages 

Each html file in `src/` is an independant html file.

A build system (Gulp) is in place to copy, but also process html files. For one to implement i18n
(translations) and the other reason is to save us from repetitive html like navigation areas.
Html partials are used like this:

1. Store your html fragment into `partials/*.html`.
2. Use it in your `src/*.html` page via `<partial src="your-partial-filename.html"></partial>`.

Nested partials are supported but should be avoided.
Partials do support basic variables. Just use attributes on the markup (like `key="value"`)
and use `@@key` within your partial.

#### Why no Markdown / other markup language

Most of the time in this application you are not presenting just text
(the tuturial section is an exception), but you are presenting interactive content, forms,
or need custom html tags (Web components).

The context help texts are written in Markdown though. You find them in `assets/contexthelp`.
They are dynamically fetched when required (and cached as html in the localstorage).

### Caching

A service worker cache is in place. While you develop, you should open the DevTools of your
browser and tick the checkbox "Disable cache" (in the tab Network on Chrome) or disable the
service worker (Tab "Application" -> "Service Worker" -> "Bypass for network" in Chrome.)

All dynamically fetched contents like forum posts, help texts and github data is cached
in the users localstorage as prerendered html. The cache has an expire duration of 1 day.

### Web component

Webcomponents for

* fetching and displaying a context help,
* the openHAB REST interface,
* the openHAB community forum,
* github openHAB addons repository for documentation fetching
* navigation components (breadcrumb, prev/next-buttons)

are available in `js/bundles/ohcomponents/*.js` and `js/bundles/uicomponents/*.js`
and can be used in other projects as well.

The html dom API alone is a bit clumsy for more complex reactive components though.
I have used [lit-html](https://lit-html.polymer-project.org/guide/writing-templates) in
some more complex components as renderer.
It has a very similar syntax to the vue renderer, but is not "reactive" like vue
and therefore adds only 1.7KB (tree shaking not even considered) to the ui-components bundle.

We could think about using `lit-elements` in the future, which uses `lit-html` for
rendering but also offers one-way and two-way bindings. Or we directly use
[Vue 3](https://medium.com/the-vue-point/plans-for-the-next-iteration-of-vue-js-777ffea6fabf), which thanks
to tree-shaking and building up on modern standards only, will also come with a low
footprint.

### Icons / Fonts / Styling

See [Styling Readme](scss/readme.md).

### Javascript

See [Javascript Readme](js/readme.md).

#### Used external libraries

* Date/Time picker: https://flatpickr.js.org/
* Ajax page reload: https://github.com/oom-components/page-loader
* Charts: https://www.chartjs.org
* OpenStreetMaps: https://github.com/Leaflet/Leaflet
* Web components: [lit-html](https://lit-html.polymer-project.org/guide/writing-templates)

### How does interaction with openHAB works

A Model-View-Adapter (MVA) concept is in place.

There are several components used as **View**:
* The `VueJS` based `ohcomponents/oh-vue-list` for reactive list
* The `uicomponents/ui-dropdown` for a dropdown (e.g. selection of *Items* or *Profiles*)
* The `VueJS` based `ohcomponents/oh-vue` for configuration pages

The `ohcomponents/oh-vue-list-bind` and `ohcomponents/oh-vue-bind` classes serve as **Controllers**.
They receive all *remove* and *change* requests of the *Views* and also observe the *Model*
and *Adapter* for any changes.

The `listadapter/*` classes provide Mixins for the *View*, but also provide
Model **Adapters** that communicate with the *Model* (aka Store).

The `store/*` bundle finally provides the frontend database, the **Model**,
for this architecture. All requested REST endpoints are cached in a Index DB and kept
in sync via SSE (Server Send Events). Any sorting will not happen
in the *View*, but directly in the Index DB.

This architecture should provide us with low-latency rendering performance.
We can outsource heavy operations like sorting into web-workers at any
point without changing any of the *Adapters* or *Views*.

## Missing openHAB functionality

This design study incorporates functionality, that is not yet implemented in openHAB.

See [Missing services and functionality](assets/roadmap.md).

## Pitfals

* Vue v-model does not work with custom components: https://github.com/vuejs/vue/issues/7830

Cheers,
David Graeff

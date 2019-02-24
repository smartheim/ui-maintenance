# openHAB Setup & Maintenance UI

This repository contains a new generation openHAB Setup & Maintenance UI.

See https://davidgraeff.github.io/paperui-ng/.

![Application screenshot](docs/screenshot.png "Application screenshot")

Please participate by editing files in this repository and make pull requests.
Especially the help texts and introduction text, graphics and potential videos require help.

## Is this a full Paper UI replacement?

Not yet. "Things" cannot be edited and "Rules" cannot be created or saved.

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

Build the javascript documentation for the entire codebase with

* `npm run doc`

Open the generated documentation in "out/index.html".

You can find a pre-build documentation here: https://davidgraeff.github.io/paperui-ng/out

## Paper UI

The original Paper UI is a Single Page Application (SPA) developed using a js framework called Angular.

The downside of using a js framework is that you bind yourself to its API and concepts.
Angular has a step learning curve, is not versioned semantically, does breaking changes regulary
and people familiar with the framework are rare, because of the many existing and partly easier to
use competitors like Reactive, VueJS, Ember, Backbone, Aurelia, Meteor.js.

SPAs require most libraries and interfaces to be loaded and initialized during startup,
although only a fraction is used on every rendered page. The browser is optimized in rendering
html and SPAs are usually 10 lines of html and the rest is javascript generated DOM nodes.

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

#### Context help

The context help texts are written in Markdown. You find them in `assets/contexthelp`.
They are dynamically fetched, converted and cached.

### Caching

All dynamically fetched contents like forum posts, help texts and github data is cached
in the users localstorage as prerendered html. The cache has an expire duration of 1 day.

A service worker cache is in place. While you develop, you should open the DevTools of your
browser and tick the checkbox "Disable cache" (in the tab Network on Chrome) or disable the
service worker (Tab "Application" -> "Service Worker" -> "Bypass for network" in Chrome.)

### Icons / Fonts / Styling

See [Styling Readme](scss/readme.md).

## Missing openHAB functionality

This design study incorporates functionality, that is not yet implemented in openHAB.

See [Missing services and functionality](assets/roadmap.md).

## Pitfals

* Vue v-model does not work with custom components: https://github.com/vuejs/vue/issues/7830

Cheers,
David Graeff

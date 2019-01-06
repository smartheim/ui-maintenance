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

The downside of chosing a js framework is that those come and go. Angular has an extremly step learning
curve and people familiar with the framework are rare because of the many existing and partly easier to
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
  exact subset of necessary libraries and style sheets per page
  and reduces memory consumption and first-time load impression.

### Page layout and page changing

There is a responsive css grid layout in place, therefore the html layout need to
be similar on all pages. Have a look at `src/newpage_template.html` for a commented
html layout that need to be conformed to.

The advantage of SPAs are that the shell of the application stays, so there is no
flickering while changing to another subpage. This is also realised in this version as a
progressive enhancement. Have a look at `js/bundles/app/index.js` where you find
the @oom/page-loader library to be loaded and setup to intercept clicks and
perform page changes via only replacing parts of the current shown page.

### Static pages 

Each html file in `src/` is an independant html file. That means that `head` need to 
be defined for each page and the html markup for the basic layout need to be repeated
for each page as well. Thanks to css, that is minimal though.

Still a build system (Gulp) is in place to process html files. For one to implement i18n
(translations) and the other reason is to save us from repetitive html markup. This is
done via a build system plugin to support html partials.

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

are available in `js/bundles/ohcomponents/*.js` and can be used in other projects as well.

Those components are developed with [hybrid.js](https://github.com/hybridsjs/hybrids),
which allows declarative definitions of Webcomponents. This adds 4KB, but saves with each
new component, because a pure Web Component requires quite a bit of repetitive boilerplate.

### Icons / Fonts / Styling

FontAwesome icons are used. Just use the `<i>` tag like `<i class="fa fas-heart"></i>`.

All fonts are embedded, no external fonts are referenced. Included are font-awesome, roboto and 'smart.icons'.

Styles are defined in sass files in `scss/`.
Sass files are normal css but allow nesting, imports and variables.

The bootstrap 4 default theme is automatically imported.
The primary and "-orange" colors are changed to the openHAB orange theme though.
A new responsive breakpoint has been added ("xxl").

Each file in `scss/` is compiled into a corresponding minified *css/.css* file. Subdirectories are ignored.
A file should be named like the html page that includes it (index.scss, tutorial.scss etc).

### Javascript

You can add your independant javascript files (ES6 modules!) into the `js/` directory.
During the build all files in this directory are minified.

If you want to use npm dependencies
and bundle multiple files into a single file, put your files under `js/bundles/your-bundle-name/`. The entry point
file must be `index.js`. During the build a single, tree-shaked, minified file is created under `js/your-bundle-name.js`.

All javascript files and npm dependencies must be valid ES6 modules (no commonjs, no amd).
No transpiling is performed during the build, as **all** javascript capable browsers
support ES6 modules by now. (This app is not targeting Internet Explorer).

Embed your js files into a webpage by either adding it to `partials/head.html` or
by adding it to the `<body>` section of a page. Do NOT add it to the indivial `<head>` tag
of a page.

#### State management

State management for REST data is done via the [`Vuex`](https://vuex.vuejs.org/) library.
In `js/bundles/stores/*.js` *Vuex* stores are available that automatically interact with the openHAB
REST Api for Things, Items, Discovery, Addons.

Because the Vuex stores are used mostly together with Vue for rendering dynamic lists,
Vue is included as well.

#### Reactive parts like Lists

Vue is used for reactive parts of the App like rendering a reactive list of Things from the Things-Store.
The templates are not prerendered with a bundler, they are in `<template>` tags within the
respective html file.

## Missing openHAB functionality

This design study incorporates functionality, that is not yet implemented in openHAB.

Missing services:

* Backup service: Configure a local or cloud backup destination and intervals.
* SSL certificate management service: Add/Remove trusted (D)TLS certificates for peer devices and setup own certificate.
* Rules/scripts files REST service: Alter files on disk via the REST API.
* Items files REST service: Alter files on disk via the REST API.
* Things files REST service: Alter files on disk via the REST API.
* Manual Addons managment: Manual Jar upload, download, (de)activate via the REST API
* Average and longtime resource observe service:
  Detects thread abuse and memory leaks for long time stability
* OSGI bundles info/start/stop REST interface

Missing core functionality:

* Notification infrastructure
* Thing Handler actions: For example to have a "Start pairing" or "Firmware reset" action.
* Timer/Alarm configuration:
  - Add/edit/remove/list/activate/deactivate singleshot and reoccurring alarms to be used in scripts/rules.
  - Behaviour/Expire timers for Profiles: To replace the OH1 expire binding
* Maintenance fragment architecture: REST endpoints for framework maintenance. Example fragments are:
  - System info: CPU, Memory, Threads, Disk space Usage
  - Average and longtime resource observe service fragment with warnings.
  - log feed: The last x log lines and link to Logtail if existing
  - openHabian fragment: Update/package status

## Development links

Visit https://www.htmlelements.com/demos.html to see the API for htmlelements Webcomponents.

Cheers,
David Graeff

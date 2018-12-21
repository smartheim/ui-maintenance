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
Angular loads over 1 MB of Javascript which needs to be parsed.

Paper UI therefore suffered from feeling unresponsive in certain situations and is hard to extend.

## Architecture and used technology

This new approch uses Web components (v1) and static html pages.

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
* Static Html pages (/index.html, /items.html, /things.html) allow to only load the exact subset of necessary libraries and style sheets per page
  and reduces memory consumption and first-time load impression.
* A service worker cache and ajax partial page reloads are in place, implemented
  as progressive enhancements instead of fixed requirements.

### Web component

Some predefined Webcomponents from https://www.htmlelements.com are used (Apache 2 license).
No virtual DOM, Themeable, no polyfills, no further dependencies.

Webcomponents to interact with

* the openHAB REST interface,
* the openHAB community forum,
* github openHAB addons repository for documentation fetching

are available in `js/oh-*.js` and can be used from other projects as well.

### State management

State management is done via the lightweight, framework independent `Redux` library.
In `js/state-*.js` some *Redux* stores are available that automatically interact with the openHAB
REST Api for Things, Items, Discovery, Addons.

### Styling / Icons

FontAwesome icons are used. Styles are defined as Scss files (css with nesting, imports and some other goodies)
in `scss/`. Each file in this directory is compiled into a corresponding *css/.css* file. Subdirectories are ignored.

### Javascript

You can add your independant javascript modules into the `js/` directory. During the build all files in this directory
are minified.

If you want to use npm dependencies
and bundle your module to a single file, put your module files under `js/bundles/your-bundle-name/`. The entry point
file must be `index.js`. During the build a single, minified file is created under `js/your-bundle-name.js`.

All javascript files and npm dependencies must be valid ES6 modules (no commonjs, no amd).
No transpiling is performed during the build, as **all** javascript capable browsers
support ES6 modules by now.

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

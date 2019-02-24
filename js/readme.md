# Developer guideline for javascript

You can add your independant javascript files (ES6 modules!) into any `js/*` subdirectory.
During the build each directory is build, minified and made available under
`js/subdirectory-name.js`. 

You can use npm dependencies (ES6-modules-only!) in your javascript files.

If you want to bundle multiple files into a single file,
put your files under `js/your-bundle-name/` with an entry point file called `index.js`.
During the build, a single, tree-shaked, minified file is created under `js/your-bundle-name.js`.

No transpiling is performed during the build, as **all** javascript capable browsers
support ES6 modules and async/await by now. (This app is not targeting Internet Explorer).
Use only JS features that have been available for all evergreen browsers for at least 3 months.

Embed your js files into a webpage by either adding it to `partials/head.html` or
by adding it to the `<body>` section of a page.

* Do NOT add a javascript link to the indivial `<head>` tag of a page. Those will not be considered
  when a fetch-based page change happens.
* Do NOT add inline javascript to pages (exception: Theme handling in `<head>`).

#### Reactive parts like Lists

Vue is used for reactive parts of the App like rendering a reactive list of Things from the Things-Store.
The templates are not prerendered with a bundler, they are in `<template>` tags within the
respective html file.

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

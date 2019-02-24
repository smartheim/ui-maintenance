/**
 * This is a simple build script for Gulp 4. We compile and minify styles and javascript,
 * include partials into html pages, create translated variants of html pages and copy
 * assets to the "dist" folder.
 * 
 * All sub-directories in "js/bundels/" are bundled via rollup.
 * A sub-directory need an "index.js" as entry point. The file is compiled to "{directory-name}.js"
 * You can use npm dependencies in those bundles.
 * 
 * A local webserver with live reload is started with the gulp task "serve".
 */
'use strict';

// Gulp + browser opening plugin + web server
var gulp = require('gulp');
var open = require('gulp-open');
var connect = require('gulp-connect');
// Gulp utils
var del = require('del');
var rename = require('gulp-rename');
const fs = require("fs");
// Process html+sass+js
var csso = require('./gulp/gulp-csso.js');
var htmlPartial = require('./gulp/gulp-html-partial.js');
var htmlmin = require('gulp-htmlmin');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify-es').default;
var csslint = require('gulp-csslint');
// Server worker generator
const workboxBuild = require('workbox-build');
// Rollup (bundles js, includes npm dependencies, includes referenced style sheets)
const rollup = require('gulp-better-rollup');
const rollupEach = require('gulp-rollup-each');
const rollupPluginNodeModuleResolve = require('rollup-plugin-node-resolve');
const rollupPluginCss = require('rollup-plugin-css-only');
const rollupPluginReplace = require('rollup-plugin-replace');
// Rete requires some more plugins
const rollupPluginSass = require('rollup-plugin-sass'); // Rete is using sass imports

var config = {
  paths: {
    src: {
      html: './src/**/*.html',
      html_watch: ['./src/**/*.html', './partials/**/*.html'],
      scss: './scss/*.scss', // only consider top level files, others are included
      scss_watch: './scss/**/*.scss',
      js: ['./js/+(modeladapter|modelsimulation)*/**/*.js'],
      js_bundles_entry: ['./js/*/index.js', '!js/_*/index.js'],
      js_bundles_watch: ['./js/**/*.js', '!./js/+(modeladapter*|modelsimulation|_)*/**/*.js'],
      js_common: ['js/_*/*'],
      assets: [
        './assets/**/*',
        './package.json',
        './README.md',
        './LICENSE'
      ],
      assetsDoc: [
        './docs/*'
      ]
    },
    partials: './partials/',
    dist: './dist',
    distjs: './dist/js',
    destsw: './dist/sw.js',
  },
  external_js: [
    './app.js', '../app.js', '../js/app.js',
    './vue.js', '../vue.js', '../js/vue.js',
    './uicomponents.js', '../uicomponents.js',
    './ohcomponents.js', '../ohcomponents.js'
  ],
  localServer: {
    port: 8001,
    url: 'http://localhost:8001/',
    // url: 'https://localhost:8001/',
    // https : {
    //      key: fs.readFileSync('devcert/server-key.pem'), 
    //      cert: fs.readFileSync('devcert/server-crt.pem'), 
    //      ca: fs.readFileSync('devcert/ca-crt.pem')
    // }
  }
};

const copyHtml = () =>
  gulp.src(config.paths.src.html)
    .pipe(htmlPartial({ basePath: config.paths.partials }))
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(config.paths.dist))
    .pipe(connect.reload());
copyHtml.displayName = "Copying html files"

const generateServiceWorker = () =>
  workboxBuild.generateSW({ globDirectory: config.paths.dist, globPatterns: ['**\/*.{html,js,css}'], swDest: config.paths.destsw })

const lintStylesCss = () =>
  gulp.src(config.paths.src.css)
    .pipe(csslint())
    .pipe(csslint.formatter());

const lintStyles = () =>
  gulp.src(config.paths.src.scss)
    .pipe(sassLint())
    .pipe(sassLint.format())
    .pipe(sassLint.failOnError())

const compileStyles = () =>
  gulp.src(config.paths.src.scss)
    .pipe(sass({  // Compile SASS files
      outputStyle: 'compressed',
      precision: 10,
      includePaths: ['.'],
      onError: console.error.bind(console, 'Sass error:')
    }))
    .pipe(csso({ comments: false })) // Minify the file
    .pipe(gulp.dest(config.paths.dist + '/css'))
    .pipe(connect.reload());
compileStyles.displayName = "Generating css from scss"

const copyAssets = () =>
  gulp.src(config.paths.src.assets)
    .pipe(gulp.dest(config.paths.dist))
    .pipe(connect.reload());
copyAssets.displayName = "Copy assets"

const copyDocAssets = () =>
  gulp.src(config.paths.src.assetsDoc)
    .pipe(gulp.dest(config.paths.dist + "/docs"))
    .pipe(connect.reload());
copyDocAssets.displayName = "Copy doc assets"

const compileBundle = (dir, _rollup, modulename, singleFileBundle) =>
  gulp.src(dir)
    .pipe(_rollup({
      external: config.external_js,
      cache: false,
      plugins: [
        rollupPluginNodeModuleResolve({ main: false, browser: false, modulesOnly: true }),
        rollupPluginSass({ output: false, insert: false, options: { includePaths: [".", "./scss"] } }),
        rollupPluginCss({}),
        rollupPluginReplace({ 'process.env.NODE_ENV': '"development"' }) // // production
      ]
    }, { format: "esm" }, require('rollup')))
    .pipe(rename(path => {
      // Input is: js/bundles/{bundle-name}/index.js. Output is: js/{bundle-name}.js
      if (path.basename === "index") {
        path.basename = modulename || path.dirname;
        path.dirname = '';
      } else if (singleFileBundle) {
        if (modulename) path.dirname = modulename;
      } else {
        // Input is: node_modules/monaco-editor/esm/vs/language/json/json.worker.js. Output is: json.worker.js
        path.dirname = '';
      }
      console.log('Build: ' + path.dirname + "/" + path.basename);
      return path;
    }))
    //        .pipe(uglify())
    .pipe(gulp.dest(config.paths.distjs)).pipe(connect.reload());

const compileBundles = () => compileBundle(config.paths.src.js_bundles_entry, rollupEach, null, false);
const compileBundles2 = () => compileBundle(config.paths.src.js, rollupEach, null, true);
compileBundles.displayName = "Creating js bundles"
compileBundles2.displayName = "Creating js single-file bundles"

const startLocalWebserver = () => connect.server(
  {
    root: 'dist', https: config.localServer.https, port: config.localServer.port,
    middleware: () => [require('compression')({})], // , require('connect-livereload')()
    livereload: false
  });
startLocalWebserver.description = "Starting live reload webserver"

const openPageInBrowser = () => gulp.src('dist/index.html').pipe(open({ uri: config.localServer.url }));
openPageInBrowser.displayName = "Opening page in browser"

const clean = () => del([config.paths.dist]);
clean.displayName = "Cleaning dist/"

const watchTask = () => { // Watch the file system and rebuild automatically
  gulp.watch(config.paths.src.html_watch, copyHtml);
  gulp.watch(config.paths.src.scss_watch, compileStyles);
  gulp.watch(config.paths.src.assets, copyAssets);
  gulp.watch(config.paths.src.assetsDoc, copyDocAssets);

  var filename = ""; // Only rebuild the bundle where a file changed

  // Watch and rebuild complex bundle directories defined in paths.src.js_bundles_watch
  const rebuildOneBundle = (callback) => {
    var bundlename = filename.match(/(.*?)\/(.*?)\//);
    filename = "";
    var result = compileBundle(`./js/${bundlename[2]}/index.js`, rollup, bundlename[2], false);
    return result.on('error', e => console.error("An error happened", e));
  };
  gulp.watch(config.paths.src.js_bundles_watch, rebuildOneBundle).on("change", (file) => filename = file);

  // Watch and rebuild single js files defined in paths.src.js
  const rebuildOneFile = (callback) => {
    var bundlename = filename.match(/(.*?)\/(.*?)\//);
    const theFilename = filename;
    filename = "";
    var result = compileBundle(theFilename, rollupEach, bundlename[2], true);
    return result.on('error', e => console.error("An error happened", e));
  };
  gulp.watch(config.paths.src.js, rebuildOneFile).on("change", (file) => filename = file);

  // Rebuild everything if one of the private js files changed
  gulp.watch(config.paths.src.js_common, gulp.parallel(compileBundles, compileBundles2));
}
watchTask.displayName = "Start watching files"

const lint = gulp.parallel(lintStyles, lintStylesCss)
lint.displayName = 'Lint all source'

const compile = gulp.series(clean, gulp.parallel(copyHtml, compileBundles, compileBundles2, copyAssets, copyDocAssets, compileStyles), generateServiceWorker)

gulp.task('build', compile);
gulp.task('serveonly', gulp.series(compile, gulp.parallel(watchTask, startLocalWebserver)));
gulp.task('serve', gulp.series(compile, gulp.parallel(watchTask, openPageInBrowser, startLocalWebserver)));
gulp.task('lint', lint);

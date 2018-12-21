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

var gulp = require('gulp');
var open = require('gulp-open'); // Gulp browser opening plugin
var connect = require('gulp-connect'); // Gulp Web server runner plugin
var csso = require('./gulp/gulp-csso.js');
var htmlPartial = require('./gulp/gulp-html-partial.js');
var htmlmin = require('gulp-htmlmin');
var sass = require('gulp-sass');
var uglify = require('gulp-uglify-es').default;
var del = require('del');
var csslint = require('gulp-csslint');
var rename = require('gulp-rename');
const resolveNodeModules = require('rollup-plugin-node-resolve');
const rollupEach = require('gulp-rollup-each')
const workboxBuild = require('workbox-build'); // service worker generating
const fs = require('fs');

var config = {
    paths: {
        src: {
            html: './src/**/*.html',
            html_watch: ['./src/**/*.html','./partials/**/*.html'],
            scss: './scss/*.scss', // only consider top level files, others are included
            scss_watch: './scss/**/*.scss',
            js: ['js/**/*.js', '!js/bundles/**/*'] ,
            js_bundles_entry: './js/bundles/**/index.js',
            js_bundles_watch: './js/bundles/**/*.js',
            assets: './assets/**/*'
        },
        partials: './partials/',
        dist: './dist',
        distjs: './dist/js',
        destsw: './dist/js/sw.js',
    },
    localServer: {
        port: 8001,
        url: 'https://localhost:8001/',
        https : {
            key: fs.readFileSync('devcert/server-key.pem'), 
            cert: fs.readFileSync('devcert/server-crt.pem'), 
            ca: fs.readFileSync('devcert/ca-crt.pem')
          }
    }
};

const copyHtml = () =>
    gulp.src(config.paths.src.html)
    .pipe(htmlPartial({ basePath: config.paths.partials }))
    .pipe(htmlmin({ collapseWhitespace: true, removeComments: true }))
    .pipe(gulp.dest(config.paths.dist))
    .pipe(connect.reload());
copyHtml.description = "Copying html files"

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
    .pipe(csso()) // Minify the file
    .pipe(gulp.dest(config.paths.dist + '/css'))
    .pipe(connect.reload());
compileStyles.description = "Generating css from scss"

const copyAssets = () =>
    gulp.src(config.paths.src.assets).pipe(gulp.dest(config.paths.dist)).pipe(connect.reload());
copyAssets.description = "Copy assets"

const minifyUnbundledScripts = () =>
    gulp.src(config.paths.src.js).pipe(uglify()).pipe(gulp.dest(config.paths.distjs)).pipe(connect.reload());
    minifyUnbundledScripts.description = "Minify unbundled scripts"

const compileBundles = () =>
    gulp.src(config.paths.src.js_bundles_entry)
    .pipe(rollupEach({plugins: [resolveNodeModules({browser:true})] },{format: "esm"},require('rollup')))
    .pipe(rename(path => { // Input is: js/bundles/{bundle-name}/index.js. Output is: js/{bundle-name}.js
        path.basename = path.dirname; path.dirname = '';
        return path;
      }))
    .pipe(uglify()).pipe(gulp.dest(config.paths.distjs)).pipe(connect.reload());
compileBundles.description = "Creating bundles"

const startLocalWebserver = () => connect.server(
    { root: 'dist', https: config.localServer.https, port: config.localServer.port, 
        middleware: () => [ require('connect-gzip').gzip({ matchType: /css|javascript/ }) ], livereload: true
    });
startLocalWebserver.description = "Starting live reload webserver"

const openPageInBrowser = () => gulp.src('dist/index.html').pipe(open({uri: config.localServer.url}));
openPageInBrowser.description = "Opening page"

const clean = () => del([config.paths.dist]);
clean.description = "Cleaning"

const watchTask = () => { // Watch the file system and reload the website automatically
    gulp.watch(config.paths.src.html_watch, copyHtml);
    gulp.watch(config.paths.src.scss_watch, compileStyles);
    gulp.watch(config.paths.src.js, minifyUnbundledScripts);
    gulp.watch(config.paths.src.js_bundles_watch, compileBundles);
    gulp.watch(config.paths.src.assets, copyAssets);
}
watchTask.description = "Start watching files"

const lint = gulp.parallel(lintStyles, lintStylesCss)
lint.description = 'lint all source'

const compile = gulp.series(clean, gulp.parallel(copyHtml, minifyUnbundledScripts, compileBundles, copyAssets, compileStyles), generateServiceWorker)
compile.description = 'Compile'

const serve = gulp.series(compile, gulp.parallel(watchTask, startLocalWebserver, openPageInBrowser))
serve.description = 'serve compiled source on local server at port 3000'

gulp.task('build', compile);
gulp.task('serve', serve);
gulp.task('lint', lint);

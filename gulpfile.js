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
const rollupEach = require('gulp-rollup-each');
const rollupPluginNodeModuleResolve = require('rollup-plugin-node-resolve');
const rollupPluginCss = require('rollup-plugin-css-only');
const rollupPluginReplace = require('rollup-plugin-replace');

var config = {
    paths: {
        src: {
            html: './src/**/*.html',
            html_watch: ['./src/**/*.html', './partials/**/*.html'],
            scss: './scss/*.scss', // only consider top level files, others are included
            scss_watch: './scss/**/*.scss',
            js: ['js/**/*.js', '!js/bundles/**/*'],
            js_bundles_entry: ['./js/bundles/**/index.js'],
            js_bundles_watch: './js/bundles/**/*.js',
            assets: [
                './assets/**/*',
                './node_modules/monaco-editor/min/**/*'
            ]
        },
        partials: './partials/',
        dist: './dist',
        distjs: './dist/js',
        destsw: './dist/sw.js',
    },
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
        .pipe(csso({ comments: false })) // Minify the file
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
        .pipe(rollupEach({
            plugins: [
                rollupPluginNodeModuleResolve({ browser: true }),
                rollupPluginCss({}),
                rollupPluginReplace({ 'process.env.NODE_ENV': '"development"' }) // // production
            ]
        }, { format: "esm" }, require('rollup')))
        .pipe(rename(path => {
            // Input is: js/bundles/{bundle-name}/index.js. Output is: js/{bundle-name}.js
            if (path.dirname != ".") {
                path.basename = path.dirname;
                path.dirname = '';
            } else {
                // Input is: node_modules/monaco-editor/esm/vs/language/json/json.worker.js. Output is: json.worker.js
                path.dirname = '';
            }
            return path;
        }))
        //        .pipe(uglify())
        .pipe(gulp.dest(config.paths.distjs)).pipe(connect.reload());
compileBundles.description = "Creating bundles"

const startLocalWebserver = () => connect.server(
    {
        root: 'dist', https: config.localServer.https, port: config.localServer.port,
        middleware: () => [require('compression')({})], // , require('connect-livereload')()
        livereload: false
    });
startLocalWebserver.description = "Starting live reload webserver"

const openPageInBrowser = () => gulp.src('dist/index.html').pipe(open({ uri: config.localServer.url }));
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

const serve = gulp.series(compile, gulp.parallel(watchTask, startLocalWebserver))
serve.description = 'serve compiled source on local server at port 3000'

gulp.task('build', compile);
gulp.task('serveonly', serve);
gulp.task('serve', gulp.parallel(serve, openPageInBrowser));
gulp.task('lint', lint);

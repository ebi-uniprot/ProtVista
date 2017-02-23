/*
 * ProtVista
 * https://github.com/ebi-uniprot/ProtVista
 *
 * Copyright (c) 2014 Xavier Watkins
 * Licensed under the Apache 2 license.
 */


// browserify build config
var buildDir = "build";
var outputFile = "protvista";

// packages
var gulp     = require('gulp');

// browser builds
var browserify = require('browserify');
var watchify = require('watchify');
var uglify = require('gulp-uglify');
var minifyCss = require('gulp-minify-css');
var concat = require('gulp-concat');

// testing
var mocha = require('gulp-mocha');
var mochaPhantomJS = require('gulp-mocha-phantomjs');
var env = require('gulp-env');

// code coverage
var istanbul = require('gulp-istanbul');

// code style
var jshint = require('gulp-jshint');

// gulp helper
var source = require('vinyl-source-stream'); // converts node streams into vinyl streams
var gzip = require('gulp-gzip');
var rename = require('gulp-rename');
var chmod = require('gulp-chmod');
var streamify = require('gulp-streamify'); // converts streams into buffers (legacy support for old plugins)
var watch = require('gulp-watch');

// path tools
var fs = require('fs');
var path = require('path');
var join = path.join;
var mkdirp = require('mkdirp');
var del = require('del');

// auto config
var outputFileMin = join(buildDir,outputFile + ".min.js");
var packageConfig = require('./package.json');

// a failing test breaks the whole build chain
gulp.task('build', ['build-browser', 'build-browser-gzip']);
gulp.task('default', ['lint', 'test', 'build']);

//test tasks
gulp.task('lint', function() {
    return gulp.src('./src/*.js')
        .pipe(jshint())
        .pipe(jshint.reporter('default'));
});

gulp.task('test', ['test-unit']);

gulp.task('test-unit', ['test-env'], function () {
    return gulp.src(['./src/**/*.js', './lib/**/*.js'])
        .pipe(istanbul())
        .pipe(istanbul.hookRequire())
        .on('finish', function() {
            gulp.src('./test/unit/**/*.js', {
                read: false
            })
                .pipe(mocha({
                    reporter: 'xunit-file'
                }))
                .pipe(istanbul.writeReports());
        });
});

gulp.task('test-env', ['init-test-reports'], function() {
    env({
        vars: {
            XUNIT_FILE: 'reports/TEST-FeaturesViewerTest.xml',
            LOG_XUNIT: true
        }
    });
});

gulp.task('init-test-reports', ['clean-test-reports'], function() {
    mkdirp('reports', function (err) {
        if (err) console.error(err);
    });
});

gulp.task('clean-test-reports', function(cb) {
    del(['reports'], cb);
});


gulp.task('test-dom', ['build-test'], function () {
    return gulp
    .src('test/index.html')
    .pipe(mochaPhantomJS({
        phantomjs:{
            ignoreSslErrors: true
        }
    }));
});

// browserify debug
gulp.task('build-test',['init'], function() {
    var b = browserify({debug: true});
    b.add('./test/dom/index');
    return b.bundle()
        .pipe(source("test.js"))
        .pipe(chmod(644))
        .pipe(gulp.dest(buildDir));
});

gulp.task('test-watch', function() {
     gulp.watch(['./src/**/*.js','./lib/**/*.js', './test/**/*.js', './style/main.css'], ['test']);
});

//build tasks
// will remove everything in build
gulp.task('clean', function(cb) {
    del([buildDir], cb);
});

// just makes sure that the build dir exists
gulp.task('init', ['clean'], function() {
    mkdirp(buildDir, function (err) {
        if (err) console.error(err);
    });
});

gulp.task('copy-resources', ['init'], function() {
    gulp.src(["./SVG/**/*.*"])
            .pipe(gulp.dest(buildDir + '/SVG/'));
    return gulp.src("./style/*.css")
        .pipe(minifyCss({compatibility: 'ie8'}))
        .pipe(concat('main.css'))
        .pipe(gulp.dest(buildDir + '/css/'));
});

// browserify debug
gulp.task('build-browser',['copy-resources'], function() {
    var b = browserify({debug: true,hasExports: true});
    exposeBundles(b);
    return b.bundle()
        .pipe(source(outputFile + ".js"))
        .pipe(chmod(644))
        .pipe(gulp.dest(buildDir));
});

// browserify min
gulp.task('build-browser-min',['copy-resources'], function() {
    var b = browserify({hasExports: true});
    exposeBundles(b);
    return b.bundle()
        .pipe(source(outputFile + ".min.js"))
        .pipe(chmod(644))
        .pipe(streamify(uglify()))
        .pipe(gulp.dest(buildDir));
});

gulp.task('build-browser-gzip', ['build-browser-min'], function() {
    return gulp.src(outputFileMin)
        .pipe(gzip({append: false, gzipOptions: { level: 9 }}))
        .pipe(rename(outputFile + ".min.gz.js"))
        .pipe(gulp.dest(buildDir));
});

// exposes the main package
// + checks the config whether it should expose other packages
function exposeBundles(b){
    b.add("./" + packageConfig.main, {expose: packageConfig.name });
    if(packageConfig.sniper !== undefined && packageConfig.sniper.exposed !== undefined){
        for(var i=0; i<packageConfig.sniper.exposed.length; i++){
            b.require(packageConfig.sniper.exposed[i]);
        }
    }
}

// watch task for browserify
// watchify has an internal cache -> subsequent builds are faster
gulp.task('watch', ['copy-resources'], function() {
    var util = require('gulp-util');

    var b = browserify({debug: true,hasExports: true, cache: {}, packageCache: {} });
    b.add("./" + packageConfig.main, {expose: packageConfig.name});
    // expose other bundles
    exposeBundles(b);

    function rebundle(ids){
        b.bundle()
        .on("error", function(error) {
            util.log(util.colors.red("Error: "), error);
         })
        .pipe(source(outputFile + ".js"))
        .pipe(chmod(644))
        .pipe(gulp.dest(buildDir));
    }

    var watcher = watchify(b);
    watcher.on("update", rebundle)
     .on("log", function(message) {
            util.log("Refreshed:", message);
    });
    return rebundle();
});

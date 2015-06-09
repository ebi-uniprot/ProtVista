/*
 * Protein Features Viewer
 * https://github.com/ebi-uniprot/biojs-vis-proteinFeaturesViewer
 *
 * Copyright (c) 2014 Xavier Watkins
 * Licensed under the Apache 2 license.
 */


// browserify build config
var buildDir = "build";
var outputFile = "featuresviewer";

// packages
var gulp   = require('gulp');

// browser builds
var browserify = require('browserify');
var watchify = require('watchify')
var uglify = require('gulp-uglify');


// testing
var mocha = require('gulp-mocha'); 
var mochaPhantomJS = require('gulp-mocha-phantomjs'); 


// code style 
var jshint = require('gulp-jshint'); 

// gulp helper
var source = require('vinyl-source-stream'); // converts node streams into vinyl streams
var gzip = require('gulp-gzip');
var rename = require('gulp-rename');
var chmod = require('gulp-chmod');
var streamify = require('gulp-streamify'); // converts streams into buffers (legacy support for old plugins)

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
gulp.task('default', ['lint','test',  'build']);



gulp.task('lint', function() {
  return gulp.src('./lib/*.js')
    .pipe(jshint())
    .pipe(jshint.reporter('default'));
});




gulp.task('test', ['test-unit', 'test-dom']);


gulp.task('test-unit', function () {
    return gulp.src('./test/unit/**/*.js', {read: false})
        .pipe(mocha({reporter: 'spec',
                    useColors: true}));
});


gulp.task('test-dom', ["build-test"], function () {
  return gulp
  .src('test/index.html')
  .pipe(mochaPhantomJS());
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
   gulp.watch(['./src/**/*.js','./lib/**/*.js', './test/**/*.js'], ['test']);
});





// will remove everything in build
gulp.task('clean', function(cb) {
  del([buildDir], cb);
});

// just makes sure that the build dir exists
gulp.task('init', ['clean'], function() {
  mkdirp(buildDir, function (err) {
    if (err) console.error(err)
  });
});

// browserify debug
gulp.task('build-browser',['init'], function() {
  var b = browserify({debug: true,hasExports: true});
  exposeBundles(b);
  return b.bundle()
    .pipe(source(outputFile + ".js"))
    .pipe(chmod(644))
    .pipe(gulp.dest(buildDir));
});

// browserify min
gulp.task('build-browser-min',['init'], function() {
  var b = browserify({hasExports: true, standalone: "biojs-vis-proteinFeaturesViewer"});
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
gulp.task('watch', function() {
  var util = require('gulp-util')

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

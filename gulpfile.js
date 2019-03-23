//jshint node:true
'use strict';

const
    sass          = require('gulp-sass'),
    sourcemaps    = require('gulp-sourcemaps'),
    browserSync   = require('browser-sync').create(),
    pug           = require('gulp-pug'),
    plumber       = require('gulp-plumber'),
    notify        = require('gulp-notify'),
    autoprefixer  = require('gulp-autoprefixer'),
    del           = require('del'),
    yargs         = require('yargs');

const { series, parallel, watch, src, dest } = require('gulp');


// Recognise `--production` argument
const argv = yargs.argv;
const production = !!argv.production;


const sourcesPath = './process/';

const sources = {
  sass: sourcesPath + '**/*.sass',
  // exclude pug file which starct with underscore!
  pug: sourcesPath + '**/!(_)*.pug',
  pugWatch: sourcesPath + '**/*.pug',
};

const targetsPath = './';

const targets = {
  css: targetsPath,
  html: targetsPath,
};


function css() {
  return src(sources.sass)
    .pipe(sourcemaps.init())
    .pipe(sass({
      outputStyle: production? 'compressed': 'expanded'
    }).on('error', sass.logError))
    .on('error', notify.onError({
        message: "Error: <%= error.message %>",
        title: "Error running sass"
      }))
    .pipe(autoprefixer({
      browsers: ['last 2 versions'],
    }))
    .pipe(sourcemaps.write('.'))
    .pipe(dest(targets.css))
    .pipe(browserSync.stream()); // Compile sass into CSS & auto-inject into browsers
}


function html() {
  return src(sources.pug)
    .pipe(plumber())
    .pipe(pug({
      pretty: true,
      doctype: 'html',
    }))
    .on('error', notify.onError({
        message: "Error: <%= error.message %>",
        title: "Error running pug"
      }))
    .pipe(dest(targets.html));
}


function webserver() {
  browserSync.init({
    server: {
      baseDir: "./"
    }
  });
}

function clean(cb) {
  del(['index.html', 'styles.css']);
  cb();
}

function reload(cb) {
  browserSync.reload();
  cb();
}

const sassWatcher = watch(sources.sass, css);
const htmlWatcher = watch(sources.pugWatch, series(html, reload));


const build = series(parallel(css, html), webserver);


exports.build = build;
exports.default = series(clean, build);

'use strict';

var jsonCss       = require('gulp-json-css'),
    gulp          = require('gulp'),
    clean         = require('gulp-rimraf'),
    rename        = require('gulp-rename'),
    replace       = require('gulp-replace'),
    regexReplace  = require('gulp-regex-replace'),
    yRequire      = require('require-yml'),
    config        = yRequire('./config.yml'),
    paths         = {
      tokens: config.path.tokens,
      dist: config.path.dist,
      temp: config.path.temp,
      assets: config.path.assets
    };

//===========================================//
// Convert JSON to SCSS variables
gulp.task('json-scss-global', ['clean-build'], function() {
  return gulp
    .src([
      paths.tokens + '/**/*.json',
      '!' + paths.tokens + '/**/styles.json'
    ])
    .pipe(replace (/(\s*"name".*)/g, ''))
    .pipe(replace (/(\s*"description".*)/g, ''))
    .pipe(jsonCss({
      targetPre: "scss",
      delim: "-"
    }))
    .pipe(rename({
      prefix: "_",
      extname: ".scss"
    }))
    .pipe(replace('%', '$'))
    .pipe(gulp.dest( paths.dist + '/scss'));
});
gulp.task('json-scss-stylesheet', ['json-scss-global', 'clean-build'], function() {
  return gulp
    .src([
      paths.tokens + '/styles.json'
    ])
    .pipe(replace (/(\s*"name".*)/g, ''))
    .pipe(replace (/(\s*"description".*)/g, ''))
    .pipe(jsonCss({
      targetPre: "scss",
      delim: "/"
    }))
    .pipe(rename({
      prefix: "",
      extname: ".scss"
    }))
    .pipe(replace('$', '@'))
    .pipe(replace('@meta', '/'))
    .pipe(replace('name:', ''))
    .pipe(replace(': ', '/_'))
    .pipe(replace('import', 'import "'))
    .pipe(replace(';', '";'))
    .pipe(replace('version/_', ' Version: '))
    .pipe(regexReplace({regex: '[0-9]/', replace: 'scss/'}))
    .pipe(gulp.dest( paths.dist + '/scss'));
});

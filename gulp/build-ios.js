'use strict';

var jsonCss       = require('gulp-json-css'),
    fs            = require('fs'),
    gulp          = require('gulp'),
    sass          = require('gulp-sass'),
    clean         = require('gulp-rimraf'),
    rename        = require('gulp-rename'),
    wrapper       = require('gulp-wrapper'),
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
// Convert custom written JSON to ios JSON format
gulp.task('json-ios-color', ['clean-build'], function() {
  return gulp
    // Convert JSON to Scss
    .src( paths.tokens + '/**/colors.json')
    .pipe(replace (/(\s*"name".*)/g, ''))
    .pipe(replace (/(\s*"description".*)/g, ''))
    .pipe(jsonCss({
      targetPre: "scss",
      delim: "-"
    }))
    // Replace characters to allow compiling
    // valid CSS in order to convert HEX to RGBA
    .pipe(replace('$', 'div#'))
    .pipe(replace(': #', ' { background-color: rgba(#'))
    .pipe(replace(';', ', 0.999999999); }'))
    // Convert to CSS
    .pipe(sass())
    // Replace temporaty characters with strings
    // that will produce valid swift declarations
    .pipe(replace('div#', '  class func '))
    .pipe(replace(' {', '() -> UIColor {'))
    .pipe(replace('}', '\n  }'))
    .pipe(replace('  background-color: rgba(', '    return UIColor(red: '))
    .pipe(replace(',', '/255.0, green:'))
    .pipe(replace('green: 1)', 'alpha: 1.0)'))
    .pipe(replace('; }', ');\n}'))
    .pipe(replace(/(green:.*?)(\s+green:)/g, '$1blue:'))
    .pipe(replace('blue', ' blue')) // add a space
    .pipe(wrapper({
      header: 'import UIKit\nextension UIColor {\n',
      footer: '}\n'
    }))
    .pipe(rename('colors.swift'))
    .pipe(gulp.dest( paths.dist + '/ios'));
});

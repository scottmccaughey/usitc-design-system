require('events').EventEmitter.prototype._maxListeners = 100;

var gulp          = require('gulp-help')(require('gulp'), { hideDepsMessage: true }),
    plumber       = require('gulp-plumber'),
    sequence      = require('gulp-sequence'),
    browserSync   = require('browser-sync').create(),
    autoprefixer  = require('gulp-autoprefixer'),
    clone         = require('gulp-clone').sink(),
    del           = require('del'),
    rename        = require('gulp-rename'),
    replace       = require('gulp-replace'),
    yamlToJson    = require('gulp-yaml'),
    jsonToSass    = require('./json-to-sass'),
    sassToCss     = require('gulp-sass'),
    yRequire      = require('require-yml'),
    config        = yRequire('config.yml'),
    mixer         = require('./mixer'),
    svgo          = require('gulp-svgo'),
    svgSprite     = require('gulp-svg-sprite')
    convert       = [];


/*
  TASK: 'clean'

  Delete contents of distribution folders.
*/
gulp.task(
  'clean',
  'Delete contents of distribution folders.',
  function() {
    return del(config.path.clean)
  }
);


/*
  GENERATOR: 'convert' formats list

  Compile a list of the file formats to be converted into and push those onto an array
  called "convert".
*/
config.formats.forEach(function(format) {
  convert.push('convert:' + format);
});


/*
  TASK: 'convert'

  Run the "convert" tasks.
*/
gulp.task(
  'convert',
  'Convert YAML Design Tokens into formats specified in config.yml.',
  convert
);


/*
  TASK: 'convert:json'

  Empty the JSON distribution folder, then convert the YAML Design Tokens into JSON so that they
  can be used in JavaScript.
*/
gulp.task(
  'convert:json',
  'Convert YAML Design Tokens into JSON.',
  function() {
    return gulp
      .src(config.path.tokens.src)
      .pipe(plumber())
      .pipe(yamlToJson())
      .pipe(gulp.dest(config.path.tokens.dist.json));
  }
);


/*
  TASK: 'convert:scss'

  Convert the YAML Design Tokens into SCSS so that they
  can be used in SCSS (Sass).
*/
gulp.task(
  'convert:scss',
  'Convert YAML Design Tokens into SCSS.',
  function() {
    return gulp
      .src(config.path.tokens.src)
      .pipe(plumber())
      .pipe(yamlToJson())
      .pipe(jsonToSass())
      .pipe(clone)
      .pipe(mixer('tokens'))
      .pipe(clone.tap())
      .pipe(rename(function(path) {
        path.basename = '_' + path.basename;
      }))
      .pipe(gulp.dest(config.path.tokens.dist.scss));
  }
);


/*
  TASK: 'build'

  Run the "copy", "convert" and "compile" tasks.
*/
gulp.task(
  'build',
  'Copy and compile SCSS, copy fonts, and convert icons.',
  sequence('copy:fonts', 'convert:icons', 'compile:scss')
);


/*
  TASK: 'copy:fonts'

  Copy fonts from the source folder to the destination folder.
*/
gulp.task(
  'copy:fonts',
  'Copy fonts from the source folder to the destination folder.',
  function() {
    return gulp
    .src(config.path.fonts.src)
    .pipe(plumber())
    .pipe(gulp.dest(config.path.fonts.dist))
  }
);


/*
  TASK: 'convert:icons'

  Optimize SVG icons and save them, then convert them all into a single SVG sprite for easy use.
*/
gulp.task(
  'convert:icons',
  'Convert SVG icons into an SVG sprite.',
  function() {
    return gulp
    .src(config.path.icons.src)
    .pipe(plumber())
    .pipe(svgo())
    .pipe(gulp.dest(config.path.icons.dist))
    .pipe(svgSprite(config.settings.icons))
    .pipe(gulp.dest(config.path.icons.dist));
  }
);


/*
  TASK: 'copy:scss'

  Copy SCSS from the source folder to the destination folder.
*/
gulp.task(
  'copy:scss',
  'Copy SCSS from the source folder to the destination folder.',
  function() {
    return gulp
    .src(config.path.scss.src)
    .pipe(plumber())
    .pipe(gulp.dest(config.path.scss.dist))
  }
);


/*
  TASK: 'compile:scss'

  Run the "convert:scss" task, then copy the SCSS to the distribution folder and compile SCSS
  styles into CSS. If the BrowserSync server is running, inject the new CSS files into the
  open page.
*/
gulp.task(
  'compile:scss',
  'Compile SCSS into CSS and auto-inject into browsers.',
  ['convert:scss', 'copy:scss'],
  function() {
    return gulp
      .src(config.path.scss.src)
      .pipe(plumber())
      .pipe(gulp.dest(config.path.scss.dist))
      .pipe(sassToCss({
        includePaths: config.settings.scss.includePaths
      }))
      .pipe(autoprefixer({
        browsers: config.settings.scss.browsers
      }))
      .pipe(gulp.dest(config.path.css.dist))
      .pipe(replace(config.settings.scss.fontPath.prod, config.settings.scss.fontPath.dev))
      .pipe(rename(function(path) {
        path.basename = path.basename + config.settings.scss.devSuffix;
      }))
      .pipe(gulp.dest(config.path.css.dist))
      .pipe(browserSync.stream());
  }
);


/*
  TASK: "serve"

  Run the "clean" task, then run the "convert" task, then run the "compile" task.
*/
gulp.task(
  'serve',
  'Empty the distribution folder, convert tokens, then build.',
  sequence('clean', 'convert', 'build')
);


/*
  TASK: "default"

  Run the "serve" task, then start a BrowserSync server for the Design System style guide.
*/
gulp.task(
  'default',
  'Set up BrowserSync server and watch files for changes.',
  ['serve'],
  function() {
    browserSync.init(config.settings.browserSync);
    gulp.watch(config.path.tokens.src,  ['convert']);
    gulp.watch(config.path.scss.watch,  ['compile:scss']);
    gulp.watch(config.path.fonts.src,   ['copy:fonts']);
    gulp.watch(config.path.icons.src,   ['convert:icons']);
    gulp.watch(config.path.html).on('change', browserSync.reload);
  }
);

var gulp          = require('gulp-help')(require('gulp'), { hideDepsMessage: true }),
    plumber       = require('gulp-plumber'),
    sequence      = require('gulp-sequence')
    browserSync   = require('browser-sync').create(),
    add           = require('gulp-add'),
    autoprefixer  = require('gulp-autoprefixer'),
    clone         = require('gulp-clone').sink(),
    rename        = require('gulp-rename'),
    replace       = require('gulp-replace'),
    copy          = require('gulp-copy'),
    clean         = require('gulp-clean'),
    yamlToJson    = require('gulp-yaml'),
    jsonToSass    = require('./json-to-sass'),
    sassToCss     = require('gulp-sass'),
    yRequire      = require('require-yml'),
    config        = yRequire('config.yml'),
    mixer         = require('./mixer'),
    svgSprite     = require('gulp-svg-sprite'),
    convert       = [];

config.formats.forEach(function(format) {
  convert.push('convert:' + format);
});

gulp.task(
  'serve',
  'Convert tokens, then compile SCSS.',
  sequence('convert', 'scss')
);

gulp.task(
  'scss',
  'Compile SCSS into CSS and auto-inject into browsers.',
  ['icons'],
  function() {
    return gulp
      .src(config.path.scss.src)
      .pipe(plumber())
      .pipe(sassToCss({
        includePaths: [
          'node_modules'
        ]
      }))
      .pipe(autoprefixer({
        browsers: ['last 2 versions']
      }))
      .pipe(gulp.dest(config.path.scss.dest))
      .pipe(replace(config.path.fonts.loc.prod, config.path.fonts.loc.dev))
      .pipe(rename(function(path) {
        path.basename = path.basename + '-dev';
      }))
      .pipe(gulp.dest(config.path.scss.dest))
      .pipe(browserSync.stream());
  }
);

gulp.task(
  'icons',
  'Convert SVG Icons into an SVG sprite.',
  function() {
    return gulp
    .src(config.path.icons.src)
    .pipe(plumber())
    .pipe(svgSprite(config.settings.icons))
    .pipe(gulp.dest(config.path.icons.dest));
  }
);

gulp.task(
  'clean',
  'Delete contents of distribution folders.',
  clean
);

config.formats.forEach(function(format) {
  gulp.task('clean:' + format, 'Delete contents of ' + format.toUpperCase() + ' distribution folder.', function() {
    return gulp
      .src(config.path[format].tokens, { read: false })
      .pipe(plumber())
      .pipe(clean());
  });
});

gulp.task(
  'convert',
  'Convert YAML Design Tokens into formats specified in config.yml file.',
  convert
);

gulp.task(
  'convert:json',
  'Convert YAML Design Tokens into JSON.',
  ['clean:json'],
  function() {
    return gulp
      .src(config.path.tokens)
      .pipe(plumber())
      .pipe(yamlToJson())
      .pipe(gulp.dest(config.path.json.tokens));
  }
);

gulp.task(
  'convert:scss',
  'Convert YAML Design Tokens into SCSS.',
  ['clean:scss'],
  function() {
    return gulp
      .src(config.path.tokens)
      .pipe(plumber())
      .pipe(yamlToJson())
      .pipe(jsonToSass())
      .pipe(clone)
      .pipe(mixer('tokens'))
      .pipe(clone.tap())
      .pipe(rename(function(path) {
        path.basename = '_' + path.basename;
      }))
      .pipe(gulp.dest(config.path.scss.tokens));
  }
);

gulp.task(
  'default',
  'Set up BrowserSync server and watch files for changes.',
  ['serve'],
  function() {
    browserSync.init({
      cors: true,
      server: '.'
    });
    gulp.watch(config.path.tokens, ['convert']);
    gulp.watch(config.path.scss.src, ['scss']);
    gulp.watch(config.path.icons.src, ['icons']);
    gulp.watch(config.path.html).on('change', browserSync.reload);
  }
);

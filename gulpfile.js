'use strict'
var gulp = require('gulp')
  , source = require('vinyl-source-stream')
  , streamify = require('gulp-streamify')
  , browserify = require('browserify')
  , less = require('gulp-less')
  , jade = require('gulp-jade')
  , uglify = require('gulp-uglify')
  , livereload = require('gulp-livereload')
  , gutil = require('gulp-util')
  , concat = require('gulp-concat')

var PORT        = 3333
  , SRC         = './src'
  , DEST        = './public'
  , LESS_PATHS  = [ './src/css'
                  , './bower_components/bootstrap/less'
                  ]
  , LEGACY_JS   = [ './bower_components/jquery/dist/jquery.js'
                  , './bower_components/bootstrap/dist/js/bootstrap.js'
                  ]

// wrap a stream in an error catcher
function catchErrors(stream) {
  stream.on('error', function(err) {
    gutil.log(gutil.colors.red('Error'), err.message)
    stream.end()
  })
  return stream
}

// compile jade file
gulp.task('jade', function() {
  gulp.src(SRC + '/pages/**/*.jade')
    .pipe(catchErrors(jade()))
    .pipe(gulp.dest(DEST))
})

// compile js as a browserify bundle
gulp.task('js', function() {
  catchErrors(browserify(SRC + '/js/index.js').bundle())
    .pipe(source('bundle.js'))
    // .pipe(streamify(uglify()))
    .pipe(gulp.dest(DEST + '/js'))
})

// concatenate legacy vendor js libraries
gulp.task('vendor-js', function() {
  gulp.src (LEGACY_JS)
    .pipe(concat('vendor.js'))
    .pipe(gulp.dest(DEST + '/js'))
})

// compile less
gulp.task('less', function() {
  gulp.src(SRC + '/css/main.less')
    .pipe(catchErrors(less({paths: LESS_PATHS})))
    .pipe(gulp.dest(DEST + '/css'))
})

// build all assets
gulp.task('build', ['jade', 'less', 'js', 'vendor-js'])

// start a simple static asset server
gulp.task('server', function(next) {
  var connect = require('connect')
    , server = connect()
  console.log('Starting static file server on port', PORT)
  server.use(connect.static(DEST)).listen(PORT, next)
})

// rebuild on changes + livereload
gulp.task('watch', ['build', 'server'], function() {
  var server = livereload()

  gulp.watch(SRC + '/css/**', ['less'])
  gulp.watch(SRC + '/js/**', ['js'])
  gulp.watch(SRC + '/**/*.jade', ['jade'])

  gulp.watch(DEST + '/**').on('change', function(file) {
    server.changed(file.path)
  })
})

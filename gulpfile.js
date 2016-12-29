var gulp            = require('gulp');
var autoprefixer    = require('gulp-autoprefixer');
var gutil           = require('gulp-util');
var imagemin        = require('gulp-imagemin');
var pngquant        = require('imagemin-pngquant');
var download        = require('gulp-download');

// Get the latest analytics so we donm;t get penalised by Google
gulp.task('fetch-newest-analytics', function() {
  return download('https://www.google-analytics.com/analytics.js')
    .pipe(gulp.dest('public/js'));
});

// Creates optimized versions of images,
// then outputs to appropriate location(s)
gulp.task('images', function () {
    return gulp.src('images/*')
        .pipe(imagemin({
            progressive: true,
            svgoPlugins: [{removeViewBox: false}],
            use: [pngquant()]
        }))
        .pipe(gulp.dest('images'));
});

// Watch files
gulp.task('watch', function () {
    gulp.watch(['images/*']);
});

gulp.task('default', ['images', 'watch', 'fetch-newest-analytics'])
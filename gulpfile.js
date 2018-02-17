var gulp = require('gulp');
var plugins = require('gulp-load-plugins');
var browser = require('browser-sync').create();
var del = require('del');

var $ = plugins();

var src = './src';
var dest = './dist';

var config = {
	src: src,
	dest: dest,
  sass: {
    src: src + '/assets/scss/**/*.scss',
    dest: dest + '/assets/css/',
    opts: {
    	indentType: 'tab',
      indentWidth: 1,
      outputStyle: 'expanded',
    }
  },
  ejs: {
  	src: src + '/**/*.+(html|ejs)',
  	dest: dest,
  	exc: '!' + src + '/{partials,partials/**}'
  },
  images: {
  	src: src + '/assets/img/**',
  	dest: dest + '/assets/img/'
  },
  autoprefixer: {
		browsers: ['last 2 versions'],
    cascade: false,
  },
  browserSync: {
  	server: dest,
    port: 8000
  },
  data: src + '/assets/data/data.json',
  scripts: {
  	src: src + '/assets/js/**/*.js',
  	dest: dest + '/assets/js/'
  }
}

// Compile Sass files
function sass() {
  return gulp.src(config.sass.src)
    .pipe($.plumber()) // Prevent termination on error
    .pipe($.sass(config.sass.opts))
    	.on('error', $.sass.logError)
    .pipe($.autoprefixer(config.autoprefixer))
    .pipe($.groupCssMediaQueries()) // Group media queries
    .pipe(gulp.dest(config.sass.dest)) // Output compiled files
    .pipe(browser.stream()); // Stream to browserSync
}

// Compile ejs into html files
function ejs() {
	return gulp.src([config.ejs.src, config.ejs.exc])
		.pipe($.plumber())
		.pipe($.data(function() {
      return require(config.data);
    }))
    .pipe($.ejs({}, {}, {ext: '.html'})
    	.on('error', function(err) {
    		console.log(err);
    	}))
    .pipe($.prettyUrl())
    .pipe(gulp.dest(config.ejs.dest));
}

function scripts() {
  return gulp.src(config.scripts.src)
  	.pipe($.concat('main.js'))
  	.pipe(gulp.dest(config.scripts.dest))
}

function images() {
  return gulp.src(config.images.src)
	  .pipe($.newer(config.images.dest))
	  .pipe($.imagemin())
	  .pipe(gulp.dest(config.images.dest));
}

// Start a server with BrowserSync
function server(done) {
	browser.init(config.browserSync);
	done();
}

// Watch for changes to Sass and Pages
function watch() {
  gulp.watch(config.sass.src).on('all', gulp.series(sass));
  gulp.watch(config.ejs.src).on('all', gulp.series(ejs, browser.reload));
  gulp.watch(config.scripts.src).on('all', gulp.series(scripts, browser.reload));
  gulp.watch(config.images.src).on('all', gulp.series(images, browser.reload));
}

function clean(done) {
	del.sync([config.dest + '/**/*']);
	done();
}

// Default task
gulp.task('default',
  gulp.series(gulp.parallel(sass, ejs, scripts, images), server, watch));

gulp.task('build', gulp.series(clean, gulp.parallel(sass, ejs, scripts, images)));
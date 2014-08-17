var program = require('commander');
var browserify = require('browserify');
var chalk = require('chalk');
var express = require('express');
var path = require('path');
var rimraf = require('rimraf');
var fs = require('fs');

var gulp = require('gulp');
var gutil = require('gulp-util');
var gulpif = require('gulp-if');
var buffer = require('gulp-buffer');
var concat = require('gulp-concat');
var cssmin = require('gulp-cssmin');
var eslint = require('gulp-eslint');
var htmlmin = require('gulp-htmlmin');
var less = require('gulp-less');
var micro = require('gulp-micro');
var size = require('gulp-size');
var uglify = require('gulp-uglify');
var zip = require('gulp-zip');
var source = require('vinyl-source-stream');

program.on('--help', function() {
	console.log('  Tasks:');
	console.log();
	console.log('    build       build the game');
	console.log('    clean       delete generated files');
	console.log('    dist        generate archive');
	console.log('    serve       launch development server');
	console.log('    watch       watch for file changes and rebuild automatically');
	console.log();
});

var badList = ["build_system", "node_modules", ".git", "crashes", "build", "app.js"];

function isGoodFile(file) {
	"use strict";
	for (var i = 0; i < badList.length; i++) {
		if (file.indexOf(badList[i]) > -1) {
			return false;
		}
	}
	return true;
}

var walk = function(dir) {
	"use strict";
	var results = [];
	var list = fs.readdirSync(dir);
	var pending = list.length;
	if (!pending) {
		return results;
	}
	for (var i = 0; i < list.length; i++) {
		var file = list[i];
		file = dir + "/" + file;
		var stat = fs.statSync(file);
		if (stat && stat.isDirectory()) {
			var res = walk(file);
			results = results.concat(res);
			if (!--pending) {
				return results;
			}
		} else {
			if (isGoodFile(file)) {
				results.push(file);
			}
			if (!--pending) {
				return results;
			}
		}
	}
};

program
	.usage('<task> [options]')
	.option('-P, --prod', 'generate production assets')
	.parse(process.argv);

var prod = !!program.prod;

gulp.task('default', ['build']);
gulp.task('build', ['build_source', 'build_styles']);

gulp.task('build_source', function() {
	var rootDir = "D:/GitHub/js13kgames-2014/";
	var files = walk(rootDir + "source");
	var data = "";
	for (var i = 0; i < files.length; i++) {
		if (files[i].indexOf(".js") > 0 && files[i].indexOf(".json") === -1) {
			data += fs.readFileSync(files[i], "utf8");
		}
	}
	fs.writeFileSync(rootDir + 'source/app.js', data);
	var bundler = browserify('./source/app.js', {
		debug: !prod
	});
	if (prod) {
		bundler.plugin(require('bundle-collapser/plugin'));
	}

	return bundler
		.bundle()
		.on('error', browserifyError)
		.pipe(source('build.js'))
		.pipe(buffer())
		.pipe(gulpif(prod, uglify()))
		.pipe(gulp.dest('build'));
});

gulp.task('build_index', function() {
	return gulp.src('source/index.html')
		.pipe(gulpif(prod, htmlmin({
			collapseWhitespace: true,
			removeAttributeQuotes: true,
			removeComments: true,
		})))
		.pipe(gulp.dest('build'));
});

gulp.task('build_styles', function() {
	return gulp.src('source/styles.less')
		.pipe(less())
		.pipe(concat('style.css'))
		.pipe(gulpif(prod, cssmin()))
		.pipe(gulp.dest('build'));
});

gulp.task('clean', function() {
	rimraf.sync('build');
	rimraf.sync('dist');
});

gulp.task('lint', function() {
	return gulp.src(['*.js', 'source/**/*.js'])
		.pipe(eslint())
		.pipe(eslint.format());
});

gulp.task('dist', ['build'], function() {
	if (!prod) {
		gutil.log(chalk.yellow('WARNING'), chalk.gray('Missing flag --prod'));
		gutil.log(chalk.yellow('WARNING'), chalk.gray('You should generate production assets to lower the archive size'));
	}

	return gulp.src('build/*')
		.pipe(zip('archive.zip'))
		.pipe(size())
		.pipe(micro({
			limit: 13 * 1024
		}))
		.pipe(gulp.dest('dist'));
});

gulp.task('watch', function() {
	gulp.watch('source/**/*.js', ['lint', 'build_source']);
	gulp.watch('source/styles.less', ['build_styles']);
	// gulp.watch('source/index.html', ['build_index']);
});

gulp.task('serve', ['build'], function() {
	var htdocs = path.resolve(__dirname, 'build');
	var app = express();

	app.use(express.static(htdocs));
	app.listen(3000, function() {
		gutil.log("Server started on '" + chalk.green('http://localhost:3000') + "'");
	});
});

function browserifyError(err) {
	gutil.log(chalk.red('ERROR'), chalk.gray(err.message));
	this.emit('end');
}
'use strict';

// [TEMP] workaround gulp-jscs Windows issue - https://github.com/es6rocks/slush-es6/issues/4
if (require('os').platform() === 'win32') process.argv.push('--no-color');

var path = require('path'),
	gulp = require('gulp'),
	plugins = require('gulp-load-plugins')(),
	vinylPaths = require('vinyl-paths'),
	rimraf = require('rimraf'),
	through = require('through'),
	mergeStream = require('merge-stream'),
	reverseStream = require('reversepoint'),
	uniqueStream = require('unique-stream'),
	lazypipe = require('lazypipe'),
	globManip = require('glob-manipulate'),
	chalk = require('chalk'),
	build = require('./build'),
	copySrc = ['**'].concat(globManip.negate(build.src.js)),
	writePipe = lazypipe()
		.pipe(gulp.dest, build.distBase),
	jsPipe = lazypipe()
		.pipe(plugins.jshint)
		.pipe(plugins.jshint.reporter, 'jshint-stylish')
		.pipe(plugins.jshint.reporter, 'fail')
		.pipe(plugins.jscs, build.config.jscs)
		.pipe(plugins['6to5'], build.config['6to5'])
		.pipe(writePipe),
	runTests = lazypipe()
		.pipe(gulp.src, build.distBase + 'test/*.js', { read: false })
		.pipe(plugins.mocha, build.config.mocha);

function runAfterEnd(cb) {
	// This is basically a passThrough stream for the callback's stream.
	// It waits until all data is finished being piped into it and discards this data,
	// then passes through the data from the stream provided by the callback.
	return through(function() {}, function() {
		var cbStream = cb();
		['data', 'end'/*, 'error'*/].forEach(function(event) {
			cbStream.on(event, this.emit.bind(this, event));
		}, this);
	});
}

gulp.task('build', function() {
	rimraf.sync(build.distBase);
	return mergeStream(
			plugins.srcOrderedGlobs(globManip.prefix(build.src.js, build.srcBase), { base: build.srcBase }).pipe(jsPipe()),
			plugins.srcOrderedGlobs(globManip.prefix(copySrc, build.srcBase), { base: build.srcBase }).pipe(writePipe())
		)
		.pipe(runAfterEnd(runTests));
});

// `neverEnd` receives a task conclusion callback which is never called as to signal that this watch task should never end.
// We don't return gulp-watch's endless stream as it would fail the task in the first stream error.
gulp.task('default', ['build'], function(neverEnd) {
	// The odd indentation here is to better illustrate the stream branching/forking flow.
	// Diagram reference: https://github.com/es6rocks/slush-es6/issues/5#issue-52701608
	var uniqueFilter = lazypipe()
			.pipe(reverseStream)
			.pipe(uniqueStream, 'path'),

			existsFilter = lazypipe()
				.pipe(plugins.filter, filterEvent.bind(null, ['changed', 'added'])),

				handleJs = lazypipe()
					.pipe(plugins.filter, build.src.js)
					.pipe(jsPipe),

				handleCopy = lazypipe()
					.pipe(plugins.filter, copySrc)
					.pipe(writePipe),

			handleDeletion = lazypipe()
				.pipe(plugins.filter, filterEvent.bind(null, ['deleted']))
				.pipe(plugins.rename, function(filePath) {
					// we can't change/remove the filePath's `base`, so cd out of it in the dirname
					filePath.dirname = path.join(path.relative(build.srcBase, '.'), build.distBase, filePath.dirname);
				})
				.pipe(vinylPaths, rimraf);

	function filterEvent(events, file) {
		return ~events.indexOf(file.event);
	}

	plugins.watch(build.srcBase + '**', { base: build.srcBase }, plugins.batch(function(files) {
		files = files.pipe(uniqueFilter());
		var existingFiles = files.pipe(existsFilter());

		return mergeStream(
				existingFiles.pipe(handleJs()),
				existingFiles.pipe(handleCopy()),
				files.pipe(handleDeletion())
			)
			.pipe(runAfterEnd(runTests));
	}, function(err) {
		// [TEMP] makeshift error reporting for gulp-jscs until gulp-jscs implements proper reporters
		console.error(err.message);
	})).on('ready', function() {
		plugins.util.log('Watching ' + chalk.magenta(build.srcBase) + ' directory for changes...');
	});
});

'use strict';

var path = require('path');
var gulp = require('gulp');
var plugins = require('gulp-load-plugins')();
var rimraf = require('rimraf');
var mergeStream = require('merge-stream');
var globManip = require('glob-manipulate');
var build = require('./build');
var copySrc = ['**'].concat(globManip.negate(build.src.js));
// this allows global gulp (CLI) to find local mocha
var TEST_ENV = { PATH: path.join(__dirname, 'node_modules/.bin') + path.delimiter + process.env.PATH };

// Run unit tests in complete isolation, see https://github.com/es6rocks/harmonic/issues/122#issuecomment-85333442
function runTests(opt, cb) {
	plugins.shell.task('mocha ' + build.config.mocha + ' "' + build.distBase + 'test"', opt)()
		.on('end', cb)
		.resume();
}

gulp.task('clean', function(cb) {
	rimraf(build.distBase, cb);
});

gulp.task('build', ['clean'], function(cb) {
	// [[gulp4]] TODO remove srcOrderedGlobs
	mergeStream(
		plugins.srcOrderedGlobs(globManip.prefix(build.src.js, build.srcBase), { base: build.srcBase })
			.pipe(plugins.eslint())
			.pipe(plugins.eslint.format())
			.pipe(plugins.eslint.failAfterError())
			.pipe(plugins.babel(build.config.babel))
			.on('error', function(err) {
				// Improve error logging:
				// workaround cmd.exe color issue, show timestamp and error type, hide call stack.
				plugins.util.log(err.toString());
				process.exit(1);
			}),
		plugins.srcOrderedGlobs(globManip.prefix(copySrc, build.srcBase), { base: build.srcBase })
	)
		.pipe(gulp.dest(build.distBase))
		.on('end', function() {
			runTests({ env: TEST_ENV }, cb);
		})
		.resume();
});

gulp.task('default', ['clean'], function(cb) {
	var vinylPaths = require('vinyl-paths');
	var streamify = require('stream-array');
	var through2 = require('through2');
	var chalk = require('chalk');

	var srcToDistRelativePath = path.relative(build.srcBase, build.distBase);
	var SIGINTed = false;

	var filesFailingLint = [];
	var filesFailingCompile = [];
	function addToFailingList(list, filePath) {
		if (list.indexOf(filePath) === -1) list.push(filePath);
	}
	function removeFromFailingList(list, filePath) {
		var idx = list.indexOf(filePath);
		if (idx !== -1) list.splice(idx, 1);
	}

	// Diagram reference: https://github.com/es6rocks/slush-es20xx/issues/5#issue-52701608 // TODO update diagram
	var batched = batch(function(files, cb) {
		files = files
			.pipe(plugins.plumber(function(err) {
				if (err.plugin === 'gulp-babel') {
					addToFailingList(filesFailingCompile, err.fileName);
				}

				plugins.util.log(err.toString());
			}));

		var existingFiles = files
			.pipe(plugins.filter(function(file) {
				return file.event === 'change' || file.event === 'add';
			}));

		mergeStream(
			// js pipe
			existingFiles
				.pipe(plugins.filter(build.src.js))
				.pipe(plugins.eslint())
				.pipe(plugins.eslint.format())
				.pipe(through2.obj(function(file, enc, cb) {
					if (file.eslint && file.eslint.messages && file.eslint.messages.length) {
						addToFailingList(filesFailingLint, file.path);
					} else {
						removeFromFailingList(filesFailingLint, file.path);
					}
					cb(null, file);
				}))
				.pipe(plugins.babel(build.config.babel))
				.pipe(through2.obj(function(file, enc, cb) {
					removeFromFailingList(filesFailingCompile, file.path);
					cb(null, file);
				}))
				.pipe(gulp.dest(build.distBase)),

			// copy pipe
			existingFiles
				.pipe(plugins.filter(copySrc))
				.pipe(gulp.dest(build.distBase)),

			// deletion pipe
			files
				.pipe(plugins.filter(function(file) {
					return file.event === 'unlink';
				}))
				.pipe(through2.obj(function(file, enc, cb) {
					removeFromFailingList(filesFailingLint, file.path);
					removeFromFailingList(filesFailingCompile, file.path);
					cb(null, file);
				}))
				.pipe(plugins.rename(function(filePath) {
					// we can't change/remove the filePath's `base`, so cd out of it in the dirname
					filePath.dirname = path.join(srcToDistRelativePath, filePath.dirname);
				}))
				.pipe(vinylPaths(rimraf))
		)
			.on('end', function() {
				if (filesFailingCompile.length) {
					var plural = filesFailingCompile.length !== 1;
					plugins.util.log(
						chalk.yellow((plural ? 'These files are' : 'This file is') + ' failing compilation:\n')
						+ chalk.red(filesFailingCompile.join('\n'))
						+ chalk.yellow('\nSkipping unit tests until ' + (plural ? 'these files are' : 'this file is') + ' fixed.')
					);
					endBatch();
					return;
				}

				runTests({ env: TEST_ENV, ignoreErrors: true }, endBatch);

				function endBatch() {
					if (filesFailingLint.length) {
						plugins.util.log(
							chalk.yellow((filesFailingLint.length !== 1 ? 'These files have' : 'This file has') + ' linting issues:\n')
							+ chalk.red(filesFailingLint.join('\n'))
						);
					}

					cb(); // must call batch's cb before checking `batched.isActive()`
					plugins.util.log(
						chalk.green('Batch completed.')
						+ (!SIGINTed && !batched.isActive() ? ' Watching ' + chalk.magenta(build.srcBase) + ' directory for changes...' : '')
					);
					maybeEndTask();
				}
			})
			.resume();
	});

	var watchStream = plugins.watch(build.srcBase + '**', { base: build.srcBase, ignoreInitial: false }, batched)
		.on('ready', function() {
			plugins.util.log('Watching ' + chalk.magenta(build.srcBase) + ' directory for changes...');
		})
		.on('end', maybeEndTask);

	var rl;
	if (process.platform === 'win32') {
		rl = require('readline').createInterface({
			input: process.stdin,
			output: process.stdout,
		}).on('SIGINT', function() {
			process.emit('SIGINT');
		});
	}

	process.on('SIGINT', function() {
		if (SIGINTed) return;
		SIGINTed = true;
		watchStream.close();
	});

	function maybeEndTask() {
		if (!SIGINTed || batched.isActive()) return;
		if (rl) rl.close();
		cb();
		process.exit(0);
	}

	// Simplified fork of gulp-batch, with removed domains (async-done) and added most recent unique('path') deduping logic.
	// Added isActive() method which returns whether the callback is currently executing or if there are any batched/queued files waiting for execution.
	function batch(cb) {

		var batch = [];
		var isRunning = false;
		var timeout;
		var delay = 100; // ms

		function setupFlushTimeout() {
			if (!isRunning && batch.length) {
				timeout = setTimeout(flush, delay);
			}
		}

		function flush() {
			isRunning = true;
			cb(streamify(batch), function() {
				isRunning = false;
				setupFlushTimeout();
			});
			batch = [];
		}

		function doBatch(newFile) {
			if (!batch.some(function(file, idx) {
				if (newFile.path === file.path) {
					batch[idx] = newFile;
					return true;
				}
			})) batch.push(newFile);

			clearTimeout(timeout);
			setupFlushTimeout();
		};

		doBatch.isActive = function() {
			return isRunning || !!batch.length;
		};

		return doBatch;
	};
});

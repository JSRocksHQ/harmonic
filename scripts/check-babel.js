'use strict';

try {
	var runtimeVersion = require('babel-runtime/package.json').version;
} catch (err) {
	console.error('Could not get `babel-runtime` version.');
	throw err;
}

try {
	require('gulp-babel');
	var compilerVersion = module.children.slice(-1)[0].require('babel-core/package.json').version;
} catch (err) {
	console.error('Could not get `babel-core` version.');
	throw err;
}

if (runtimeVersion !== compilerVersion) {
	throw new Error('Babel compiler and runtime versions mismatch.\nbabel-core: ' + compilerVersion + '\nbabel-runtime: ' + runtimeVersion);
}

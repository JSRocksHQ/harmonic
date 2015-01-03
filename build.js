'use strict';

module.exports = {
	srcBase: 'src/',
	src: {
		// TODO handleCopy should copy the negated files here but it is apparently not working
		js: ['**/*.js', '!bin/skeleton/**/*.js']
	},
	distBase: 'dist/',
	config: {
		jscs: { configPath: '.jscsrc', esnext: true },
		'6to5': { blacklist: ['generators'] },
		mocha: { bail: true, timeout: 5000 }
	}
};

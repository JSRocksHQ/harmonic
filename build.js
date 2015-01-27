'use strict';

module.exports = {
	srcBase: 'src/',
	src: {
		js: ['**/*.js', '!bin/skeleton/**/*.js']
	},
	distBase: 'dist/',
	config: {
		jscs: { configPath: '.jscsrc', esnext: true },
		'6to5': { modules: 'commonStrict'/*, experimental: true*/ },
		mocha: { bail: true, timeout: 5000 }
	}
};

'use strict';

module.exports = {
	srcBase: 'src/',
	src: {
		js: ['**/*.js', '!bin/skeleton/**/*.js']
	},
	distBase: 'dist/',
	config: {
		jscs: { configPath: '.jscsrc', esnext: true },
		'6to5': { blacklist: ['generators'] },
		mocha: { bail: true, timeout: 5000 }
	}
};

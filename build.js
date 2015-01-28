'use strict';

module.exports = {
	srcBase: 'src/',
	src: {
		js: ['**/*.js', '!bin/skeleton/**/*.js']
	},
	distBase: 'dist/',
	config: {
		//JSCS should be re-enabled soon
		//jscs: { configPath: '.jscsrc', esnext: true },
		'6to5': { /*experimental: true*/ },
		mocha: { bail: true, timeout: 5000 }
	}
};

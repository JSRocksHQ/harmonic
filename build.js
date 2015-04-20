'use strict';

module.exports = {
	srcBase: 'src/',
	src: {
		js: ['**/*.js', '!bin/skeleton/**/*.js']
	},
	distBase: 'dist/',
	config: {
		babel: { optional: ['runtime'], stage: 0 },
		mocha: '--colors --bail --timeout 15000'
	}
};

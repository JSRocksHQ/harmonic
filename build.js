'use strict';

module.exports = {
	srcBase: 'src/',
	src: {
		js: ['**/*.js', '!bin/skeleton/**/*.js']
	},
	distBase: 'dist/',
	config: {
		babel: { optional: ['runtime'] },
		mocha: '--colors --bail --timeout 5000'
	}
};

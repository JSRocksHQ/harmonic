'use strict';

module.exports = {
    srcBase: 'src/',
    src: {
        js: ['**/*.js', '!bin/skeleton/**/*.js']
    },
    distBase: 'dist/',
    config: {
        babel: {
            presets: ['es2015'],
            plugins: [
                'syntax-async-functions', 'transform-async-to-generator',
                'syntax-function-bind', 'transform-function-bind',
                'transform-runtime'
            ]
        },
        mocha: '--colors --bail --timeout 15000'
    }
};

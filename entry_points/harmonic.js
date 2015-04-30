#!/usr/bin/env node
'use strict';

require('babel-runtime/core-js').default.Promise = require('bluebird');
process.on('unhandledRejection', function(reason/*, promise*/) {
    console.log('Possibly Unhandled Rejection:');
    console.log(reason instanceof Error ? reason.stack || reason.toString() : reason);
});

module.exports = require('../dist/bin/cli/harmonic');

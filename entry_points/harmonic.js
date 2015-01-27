#!/usr/bin/env node
'use strict';

require('./lib/polyfill');
module.exports = require('../dist/bin/cli/harmonic');

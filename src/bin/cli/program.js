require('grunt-6to5/node_modules/6to5/polyfill');
var program = require('commander');

import { version } from '../config';
import { cliColor } from '../helpers';
import logo from './logo';
import { init, config, newFile, run } from './util';

program
    .version(version);

program
    .command('init [path]')
    .description('Init your static website')
     // [BUG] https://github.com/jshint/jshint/issues/1849 - can't use arrow function
    .action(function(path = '.') {
        console.log(logo);
        init(path);
    });

program
    .command('config [path]')
    .description('Config your static website')
     // [BUG] https://github.com/jshint/jshint/issues/1849 - can't use arrow function
    .action(function(path = '.') {
        console.log(logo);
        config(path);
    });

program
    .command('build')
    .description('Build your static website')
    .action(() => {
        let core = require('../core');
        core.init();
    });

program
    .command('new_post ["title"]')
    .description('Create a new post')
    .action((title) => {
        newFile('post', title);
    });

program
    .command('new_page ["title"]')
    .description('Create a new page')
    .action((title) => {
        newFile('page', title);
    });

program
    .command('run [port]')
    .description('Run you static site locally. Port is optional')
     // [BUG] https://github.com/jshint/jshint/issues/1849 - can't use arrow function
    .action(function(port = 9356) {
        let core = require('../core'),
            build = core.init();
        if (build) {
            build.then(function() {
                run(port);
            });
        }
    });

program.on('*', (args) => {
    let clc = cliColor();
    console.error('Unknown command: ' + clc.error(args[0]));
    process.exit(1);
});

program.parse(process.argv);

// Not enough arguments
if (!program.args.length) {
    console.log(logo);
    program.help();
}

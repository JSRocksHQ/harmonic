require('gulp-6to5/node_modules/6to5/polyfill');
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
    .command('build [path]')
    .description('Build your static website')
    // [BUG] https://github.com/jshint/jshint/issues/1849 - can't use arrow function
    .action(function(path = '.') {
        let core = require('../core');
        core.init(path);
    });

program
    .command('new_post <title> [path]')
    .option('--no-open', 'Don\'t open the markdown file(s) in editor')
    .description('Create a new post')
    // [BUG] https://github.com/jshint/jshint/issues/1849 - can't use arrow function
    .action(function(title, path = '.', options = {}) {
        newFile(path, 'post', title, options.open);
    });

program
    .command('new_page <title> [path]')
    .option('--no-open', 'Don\'t open the markdown file(s) in editor')
    .description('Create a new page')
    // [BUG] https://github.com/jshint/jshint/issues/1849 - can't use arrow function
    .action(function(title, path = '.', options = {}) {
        newFile(path, 'page', title, options.open);
    });

program
    .command('run [port] [path]')
    .option('--no-open', 'Don\'t open a new browser window')
    .description('Run you static site locally. Port is optional')
     // [BUG] https://github.com/jshint/jshint/issues/1849 - can't use arrow function
    .action(function(port = 9356, path = '.', options = {}) {
        let core = require('../core'),
            build = core.init(path);
        if (build) {
            build.then(function() {
                run(path, port, options.open);
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

require('grunt-6to5/node_modules/6to5/polyfill');

var localconfig = require('../config'),
    helpers = require('../helpers'),
    program = require('commander'),
    logo = require('../cli/logo');

program
    .version(localconfig.version);

program
    .command('init')
    .description('Init your static website')
    .action(function(path) {
        var util = require('../cli/util');
        console.log(logo);
        util.init(typeof path === 'string' ? path : './');
    });

program
    .command('config')
    .description('Config your static website')
    .action(function() {
        var util = require('../cli/util');
        console.log(logo);
        util.config();
    });

program
    .command('build')
    .description('Build your static website')
    .action(function() {
        var core = require('../core');
        core.init();
    });

program
    .command('new_post ["title"]')
    .description('Create a new post')
    .action(function(title) {
        require('../cli/util').newFile('post', title);
    });

program
    .command('new_page ["title"]')
    .description('Create a new page')
    .action(function(title) {
        require('../cli/util').newFile('page', title);
    });

program
    .command('run [port]')
    .description('Run you static site locally. Port is optional')
    .action(function(port = 9356) {
        var util = require('../cli/util'),
            core = require('../core'),
            build = core.init();
        if (build) {
            build.then(function() {
                util.run(port);
            });
        }
    });

program.on('*', function(args) {
    var clc = helpers.cliColor();
    console.error('Unknown command: ' + clc.error(args[0]));
    process.exit(1);
});

program.parse(process.argv);

// Not enough arguments
if (!program.args.length) {
    console.log(logo);
    program.help();
}

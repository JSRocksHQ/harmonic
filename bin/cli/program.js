var program = require('commander');
var util = require('../cli/util');

program
	.version('0.0.3')

	/* Options */
	.option('-b, --build', 'Build your static website');

program
	.command('init')
	.description('Init your new static website')
	.action(function () {
		util.init();
	});

program
	.command('build')
	.description('Build your static website')
	.action(function(env, options) {
		var core = require('../core');
		core.init();
	});

program
	.command('new_post ["title"]')
	.description('Create a new post')
	.action(function(title) {
		util.new_post(title).then(function (data) {
			console.log(data);
		});
	});

program
	.command('run [port]')
	.description('Run you static site locally. Port is optional')
	.action(function(_port) {		
		var port = _port ? _port : '9356';
		util.run(port);
	});

program.parse(process.argv);

/* Not enough arguments */
if (!program.args.length) {
	program.help();
}
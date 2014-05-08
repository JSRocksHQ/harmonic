var program = require('commander');

program
	.version('0.0.1')

	/* Options */
	.option('-b, --build', 'Build your static website');

program
	.command('build')
	.description('Build your static website')
	.action(function(env, options) {
		let core = require('../core');
		core.init();
	});

 program
	.command('new_post ["title"]')
	.description('Create a new post')
	.action(function(title){
		let util = require('../cli/util')
		util.new_post(title).then(function (data) {
			console.log(data);
		});
	});

program.parse(process.argv);

/* Not enough arguments */
if (!program.args.length) {
	program.help();
}
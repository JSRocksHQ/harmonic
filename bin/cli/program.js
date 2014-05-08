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
	.command('new_post [post]')
	.description('Create a new post')
	.action(function(post){
		console.log(post);
	});

program.parse(process.argv);

/* Not enough arguments */
if (!program.args.length) {
	program.help();
}
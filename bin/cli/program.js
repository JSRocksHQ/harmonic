var program = require('commander');

program
	.version('0.0.1')

	/* Options */
	.option('-b, --build', 'Build your static website');

program
	.command('build')
	.description('Build your static website')
	.action(function(env, options) {
		let parser = require('../parser');
		parser.parsePosts();
	});

program.parse(process.argv);

/* Not enough arguments */
if (!program.args.length) {
	program.help();	
}
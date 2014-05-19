var Parser = require('./parser');

var parser = new Parser();
module.exports = {

	init : function () {
		parser.start()
			.then(parser.createPublicFolder)
			.then(parser.getConfig)
			.then(parser.getFiles)
			.then(parser.getMarkdownMetadata)
			.then(parser.generateIndex)
			.then(parser.generatePosts)
			.then(parser.copyResources)
			.then(null, function (e) {
				console.log(e);
			});
	}
}
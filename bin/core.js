var Parser = require('./parser');

var parser = new Parser();
module.exports = {

	init : function () {
		parser.start()
			.then(parser.clean)
			.then(parser.getConfig)
			.then(parser.createPublicFolder)
			.then(parser.compileStylus)
			.then(parser.generatePages)
			.then(parser.getFiles)
			//.then(parser.getMarkdownMetadata)
			.then(parser.generatePosts)
			.then(parser.generateIndex)
			.then(parser.generateTagsPages)
			.then(parser.copyResources)
			.then(null, function (e) {
				console.log(e);
			});
	}
}

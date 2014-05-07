let Parser = require('./parser');

let parser = new Parser();
module.exports = {

	init : function () {
		parser.start()
			.then(parser.getFiles)
			.then(parser.getMarkdownMetadata)
			.then(parser.generateIndex)
			.then(parser.generatePosts)
			.then(function (data) {
				console.log(data);
			}, function (e) {
				console.log(e);
			});
	}
}
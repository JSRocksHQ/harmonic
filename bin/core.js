var Parser = require('./parser');
var Promise = require('promise');

var parser = new Parser();
module.exports = {

	init : function () {
		return new Promise(function (resolve, reject) {
			parser.start()
			.then(parser.clean)
			.then(parser.getConfig)
			.then(parser.createPublicFolder)
			.then(parser.compileCSS)
			.then(parser.generatePages)
			.then(parser.getFiles)
            .then(parser.generatePosts)
			.then(parser.compileES6)
			.then(parser.generateIndex)
			.then(parser.generateTagsPages)
			.then(parser.copyResources)
			.then(parser.createCNAMEFile)
			.then(resolve)
			.catch(function (e) {
				console.log(e);
			});
		});
	}
}

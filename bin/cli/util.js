var fs = require('fs');
var path = './src/posts/';
var Promise = require('promise');
var staticServer = require('node-static');

module.exports = {

	new_post : function (title) {
		return new Promise(function (resolve, reject) {
			var template = '<!--\n' +
								'layout: post\n' +
								'title: ' + title + '\n'+
								'date:\n' +
								'comments: true\n' +
								'published: true\n' +
								'keywords:\n' +
								'description:\n' +
								'categories:\n' +
							'-->';
			var filename = path + title.split(' ').join('-') + '.md';

			/* create a new post */
			fs.writeFile(filename, template, function (err) {
				if (err) throw err;
				resolve('Post "' + title + '" was successefuly created. File generated at ' + filename);
			});
		});
	},

	run : function (port) {
		var file = new staticServer.Server('./public');
		console.log('Harmonic site is running on http://localhost:' + port);
		require('http').createServer(function (request, response) {
			request.addListener('end', function () {
				file.serve(request, response);
			}).resume();
		}).listen(port);
	}
}
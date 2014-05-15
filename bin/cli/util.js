var fs = require('fs');
var path = './src/posts/';
var Promise = require('promise');
var staticServer = require('node-static');
var co = require('co');
var prompt = require('co-prompt');
var confirm = prompt.confirm;

module.exports = {

	init : function () {
		co(function *() {
			console.log("This guide will help you to create your Harmonic configuration file\n");
			var config = {
				name : yield prompt('Site name: '),
				title : yield prompt('Title: '),
				subtitle : yield prompt('Subtitle: '),
				description : yield prompt('Description: '),
				author : yield prompt('Author: '),
				bio : yield prompt('Author bio: ')
			}

			/* create the configuration file */
			fs.writeFile('./config.json', JSON.stringify(config, null, 4), function (err) {
				if (err) throw err;
				console.log('Config file was successefuly created');
			});
			
			process.stdin.pause();

		})();
	},

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
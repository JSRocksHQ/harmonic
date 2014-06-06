var fs = require('fs');
var path = './src/posts/';
var Promise = require('promise');
var staticServer = require('node-static');
var co = require('co');
var prompt = require('co-prompt');
var confirm = prompt.confirm;
var _ = require('underscore');

module.exports = {

	config : function () {
		co(function *() {
			console.log("This guide will help you to create your Harmonic configuration file\nJust hit enter if you are ok with the default values");

			var templateObj = {
			    "name": "Awesome website",
			    "title": "My awesome static website",
			    "domain": "http://awesome.com",
			    "subtitle": "Powered by Harmonic",
			    "author": "Jaydson",
			    "description": "This is the description",
			    "bio": "Thats me",
			    "template": "default",
			    "posts_permalink" : ":year/:month/:title",
			    "pages_permalink" : "pages/:title"
			};

			var config = {
				name : (yield prompt('Site name: (' + templateObj.name + ')')) || templateObj.name,
				title : (yield prompt('Title: (' + templateObj.title + ')')) || templateObj.title,
				subtitle : (yield prompt('Subtitle: (' + templateObj.subtitle + ')')) || templateObj.subtitle,
				description : (yield prompt('Description: (' + templateObj.description + ')')) || templateObj.description,
				author : (yield prompt('Author: (' + templateObj.author + ')')) || templateObj.author,
				bio : (yield prompt('Author bio: (' + templateObj.bio + ')')) || templateObj.bio,
				template : (yield prompt('Template: (' + templateObj.template + ')')) || templateObj.template
			}

			/* create the configuration file */
			fs.writeFile('./config.json', JSON.stringify(_.extend(templateObj, config), null, 4), function (err) {
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
								'date: ' + new Date().toJSON() + '\n' +
								'comments: true\n' +
								'published: true\n' +
								'keywords:\n' +
								'description:\n' +
								'categories:\n' +
							'-->';
			var str = title.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase();
			var filename = path + str + '.md';

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
var fs = require('fs');
var marked = require('marked');
var path = './src/posts/';
var markextra = require('markdown-extra');
var _ = require('underscore');
var nunjucks = require('nunjucks');
var co = require('co');
var Promise = require('promise');

var Parser = function () {

	this.start = function () {
		return new Promise(function (resolve, reject) {
			resolve('starting the parser');
		});
	};

	this.generateIndex = function (postsMetadata) {
		return new Promise(function(resolve, reject) {
			var indexTemplate = fs.readFileSync('./src/layouts/index.html');
			var indexTemplateNJ = nunjucks.compile(indexTemplate.toString());
			var indexContent = '';
			indexContent = indexTemplateNJ.render({ posts : postsMetadata });

			/* write index html file */
			fs.writeFile('./public/index.html', indexContent, function (err) {
				if (err) throw err;
				console.log('Successefuly generate index html file');
				resolve(postsMetadata);
			});
		});
	};

	this.generatePosts = function(postsMetadata) {
		return new Promise(function(resolve, reject) {
			postsMetadata.forEach(function (metadata, i) {
				fs.readFile(metadata.file, function (err, data) {
					var postsTemplate = fs.readFileSync('./src/layouts/post.html');
					var postsTemplateNJ = nunjucks.compile(postsTemplate.toString());
					var markfile = data.toString();
					var postHTMLFile = postsTemplateNJ.render({ content : marked(markfile), title : metadata.title.toString() });

					/* Removing header metadata */
					postHTMLFile = postHTMLFile.replace(/<!--[\s\S]*?-->/g, '');

					/* write post html file */
					fs.writeFile('./public/' + metadata.filename + '.html', postHTMLFile, function (err) {
						if (err) throw err;
						console.log('Successefuly generate post html file ' + metadata.filename);
						resolve(postsMetadata);
					});
				});
			});
		});
	};

	this.getFiles = function() {
		return new Promise(function (resolve, reject) {

			/* Reading posts dir */
			fs.readdir(path, function (err, files) {
				if (err) {
					throw err;
				}

				resolve(files);
			});
		});
	};

	this.getMarkdownMetadata = function(data) {
		var posts = [];
		return new Promise(function (resolve, reject) {
			data.forEach(function (file, i) {
				var post = fs.readFileSync( path + "/" + file).toString();
				var postsTemplate = fs.readFileSync('./src/layouts/post.html');
				var postsTemplateNJ = nunjucks.compile(postsTemplate.toString());					
				var markfile = post.toString();
				var filename = file.split('.md')[0];

				/* Markdown extra */
				var metadata = markextra.metadata(markfile, function (md) {
					var retObj = {};
					md.split('\n').forEach(function(line) {
						var data = line.split(':');
						retObj[data[0].trim()] = data[1].trim();
					});
					return retObj;
				});
				metadata['file'] = path + file;
				metadata['filename'] = filename;
				metadata['link'] = '/' + filename + '.html';
				posts.push(metadata);
				
				if (i === data.length - 1) {
					resolve(posts);
				}
			});
		});
	};
}

module.exports = Parser;
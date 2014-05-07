let fs = require('fs');
let marked = require('marked');
let path = './src/posts/';
let markextra = require('markdown-extra');
let _ = require('underscore');
let nunjucks = require('nunjucks');
let co = require('co');
let Promise = require('promise');

let Parser = function () {

	this.start = function () {
		return new Promise(function (resolve, reject) {
			resolve('starting the parser');
		});
	};

	this.generateIndex = function (postsMetadata) {
		return new Promise(function(resolve, reject) {
			let indexTemplate = fs.readFileSync('./src/layouts/index.html');
			let indexTemplateNJ = nunjucks.compile(indexTemplate.toString());
			let indexContent = '';
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
					let postsTemplate = fs.readFileSync('./src/layouts/post.html');
					let postsTemplateNJ = nunjucks.compile(postsTemplate.toString());
					let markfile = data.toString();
					let postHTMLFile = postsTemplateNJ.render({ content : marked(markfile), title : metadata.title.toString() });

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
		let posts = [];
		return new Promise(function (resolve, reject) {
			data.forEach(function (file, i) {
				let post = fs.readFileSync( path + "/" + file).toString();
				let postsTemplate = fs.readFileSync('./src/layouts/post.html');
				let postsTemplateNJ = nunjucks.compile(postsTemplate.toString());					
				let markfile = post.toString();
				let filename = file.split('.md')[0];

				/* Markdown extra */
				let metadata = markextra.metadata(markfile, function (md) {
					let retObj = {};
					md.split('\n').forEach(function(line) {
						let data = line.split(':');
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
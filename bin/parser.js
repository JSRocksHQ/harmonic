var fs = require('fs');
var marked = require('marked');
var postsPath = './src/posts/';
var path = require('path');
var pagesPath = './src/pages/';
var nodePath = require('path');
var markextra = require('markdown-extra');
var _ = require('underscore');
var nunjucks = require('nunjucks');
var co = require('co');
var Promise = require('promise');
var ncp = require('ncp').ncp;
var permalinks = require('permalinks');
var nodefs = require('node-fs');
var stylus = require('stylus');
var mkmeta = require('marked-metadata');
var util = require('./cli/util');
var clc = util.cli_color();

var Helper =  {
	getPagesFiles : function () {
		return new Promise(function (resolve, reject) {
			/* Reading pages dir */
			fs.readdir(pagesPath, function (err, files) {
				if (err) {
					throw err;
				}

				resolve(files);
			});
		});
	},

	parsePages : function (files) {
		return new Promise(function (resolve, reject) {
			var pages = [];
			var curTemplate = GLOBAL.config.template;
			var nunjucksEnv = GLOBAL.config.nunjucksEnv;

			files.forEach(function (file, i) {
				var page = fs.readFileSync( pagesPath + "/" + file).toString();
				var pageTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/page.html');
				var pageTemplateNJ = nunjucks.compile(pageTemplate.toString(), nunjucksEnv);
				var markfile = page.toString();
				var filename = path.extname(file) === '.md' ? path.basename(file, '.md') : path.basename(file, '.markdown');

				/* Markdown extra */
				var metadata = markextra.metadata(markfile, function (md) {
					var retObj = {};
					md.split('\n').forEach(function(line) {
						var data = line.split(':'),
							first = data.splice(0, 1);
						retObj[first[0].trim()] = data.join(':').trim();
					});
					return retObj;
				});
				var pagePermalink = permalinks(config.pages_permalink, { title : filename });

				var _page = {
					content : marked(markfile),
					metadata : metadata
				}

				var pageContent = nunjucks.compile(page, nunjucksEnv);
				var pageHTMLFile = pageTemplateNJ.render({ page : _page, config : GLOBAL.config });
				/* Removing header metadata */
				pageHTMLFile = pageHTMLFile.replace(/<!--[\s\S]*?-->/g, '');

				metadata['content'] = pageHTMLFile;
				metadata['file'] = postsPath + file;
				metadata['filename'] = filename;
				metadata['link'] = '/' + filename + '.html';
				metadata.date = new Date(metadata.date);

				nodefs.mkdir('./public/' + pagePermalink, 0777, true, function (err) {
					if (err) {
						reject(err);
					} else {
						/* write page html file */
						fs.writeFile('./public/' + pagePermalink + '/' + 'index.html', pageHTMLFile, function (err) {
							if (err) throw err;
							console.log(clc.info('Successfully generated page ' + pagePermalink));
						});
					}
				});

				if (i === files.length - 1) {
					resolve(pages);
				}

			});
		});
	},

	normalizeMetaData : function (data) {
		data.title = data.title.replace(/\"/g,'');
		return data;
	},

	normalizeContent : function (data) {
		return data;
	}
}

var Parser = function() {

	this.start = function() {
		return new Promise(function (resolve, reject) {
			resolve('starting the parser');
		});
	};

	this.clean = function() {
		return new Promise(function (resolve, reject) {
			var exec = require('child_process').exec,
				child = null;
			child = exec('rm -rf ./public',function(err,out) { 
			 	console.log(clc.warn('Cleaning up...'));
			 	resolve();
			});
		});
	};

	this.createPublicFolder = function(argument) {
		fs.exists('./public', function(exists) {
			if(!exists){
				fs.mkdirSync("public", 0766, function(err){
					if (err) throw err;
				});
				console.log(clc.info('Successfully generated public folder'));
			}
		});
	};

	this.compileStylus = function() {
		var curTemplate = './src/templates/' + GLOBAL.config.template;
		var __stylDir = curTemplate + '/resources/_stylus';
		var __cssDir = curTemplate + '/resources/css';
		var code = fs.readFileSync(__stylDir + '/index.styl', 'utf8');

		stylus(code)
			.set('paths', [__stylDir, __stylDir + '/engine', __stylDir + '/partials'])
			.render(function(err, css){

				if (err) {
					throw err;
				}

				fs.writeFile(__cssDir + '/main.css', css, function(err) {
					if(err) {
						console.log(clc.error(err));
					} else {
						console.log(clc.info('Successfully generated CSS'));
					}
				});

			});
	};

	this.generateTagsPages = function(postsMetadata) {
		var postsByTag = {};
		var curTemplate = GLOBAL.config.template;
		var nunjucksEnv = GLOBAL.config.nunjucksEnv;
		var tagTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/tag_archives.html');
		var tagTemplateNJ = nunjucks.compile(tagTemplate.toString(), nunjucksEnv);
		var indexContent = '';

		return new Promise(function(resolve, reject) {
			for (var i = 0; i < postsMetadata.length; i += 1) {
				var tags = postsMetadata[i].categories;
				for (var y = 0; y < tags.length; y += 1) {
					var tag = tags[y]
							.toLowerCase()
							.trim()
							.split(' ')
							.join('-');

					if (Array.isArray(postsByTag[tag])) {
						postsByTag[tag].push(postsMetadata[i]);
					} else {
						postsByTag[tag] = [postsMetadata[i]];
					}
				}
			}

			for (var i in postsByTag) {
				tagContent = tagTemplateNJ.render({ posts : postsByTag[i], config : GLOBAL.config });

				nodefs.mkdirSync('./public/categories/' + i, 0777, true);
				/* write tag arcive html file */
				(function (y) {
					fs.writeFile('./public/categories/' + y + '/index.html', tagContent, function (err) {
						if (err) throw err;
						console.log(clc.info('Successfully generated tag[' + y + '] archive html file'));
					});
				}(i));
			}
			resolve(postsMetadata);
		});
	};

	this.generateIndex = function(postsMetadata) {
		return new Promise(function(resolve, reject) {
			var curTemplate = GLOBAL.config.template;
			var nunjucksEnv = GLOBAL.config.nunjucksEnv;
			var indexTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/index.html');
			var indexTemplateNJ = nunjucks.compile(indexTemplate.toString(), nunjucksEnv);
			var indexContent = '';
			indexContent = indexTemplateNJ.render({ posts : postsMetadata, config : GLOBAL.config });

			/* write index html file */
			fs.writeFile('./public/index.html', indexContent, function (err) {
				if (err) throw err;
				console.log(clc.info('Successfully generated index html file'));
				resolve(postsMetadata);
			});
		});
	};

	this.copyResources = function() {

		var imagesP = new Promise(function(resolve, reject) {
			ncp('./src/img', './public/img', function (err) {
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
		});

		var resourcesP = new Promise(function(resolve, reject) {
			var curTemplate = './src/templates/' + GLOBAL.config.template;
			ncp(curTemplate + '/resources', './public', function (err) {
				if (err) {
					reject(err);
					return;
				}
				resolve();
			});
		});

		return new Promise(function (resolve, reject) {
			Promise.all([resourcesP, imagesP])
			.then(function() {
				resolve('Resources copied');
			});
		});
	};

	this.generatePages = function (pagesMetadata) {
		return new Promise(function(resolve, reject) {
			Helper.getPagesFiles()
				.then(Helper.parsePages)
				.then(function(data) {
					resolve(data);
				}, function(e) {
					reject(e);
				})
		});
	};

	this.generatePosts = function (files) {
		return new Promise(function(resolve, reject) {
			var config = GLOBAL.config,
				posts = [],
				curTemplate = config.template,
				postsTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/post.html'),
				nunjucksEnv = config.nunjucksEnv,
				postsTemplateNJ = nunjucks.compile(postsTemplate.toString(), nunjucksEnv);

			files.forEach(function(file, i) {
				var md = new mkmeta(postsPath + '/' + file);
				md.defineTokens(config.header_tokens[0] || '<!--', config.header_tokens[1] || '-->');
				var metadata = Helper.normalizeMetaData(md.metadata());
				var post = Helper.normalizeContent(md.markdown());
				var postCropped = md.markdown( { crop : '<!--more-->'});
				var filename = path.extname(file) === '.md' ? path.basename(file, '.md') : path.basename(file, '.markdown');
				var checkDate = new Date(filename.substr(0,10));
				filename = isNaN(checkDate.getDate()) ? filename : filename.substr(11, filename.length);
				var postPath = permalinks(config.posts_permalink, { title : filename });
				var categories = metadata.categories.split(',');
				metadata.link = postPath;
				metadata.categories = categories;
				var _post = {
					content : post,
					metadata : metadata
				}
				var postHTMLFile = postsTemplateNJ
					.render({ post : _post, config : GLOBAL.config })
					.replace(/<!--[\s\S]*?-->/g, '');

				nodefs.mkdir('./public/' + postPath, 0777, true, function (err) {
					if (err) {
						reject(err);
					} else {
						/* write post html file */
						fs.writeFile('./public/' + postPath + '/index.html', postHTMLFile, function (err) {
							if (err) {
								reject(err);
							}
							console.log(clc.info('Successfully generated post ' + postPath));
						});
					}
				});
				metadata['content'] = postCropped;
				metadata['file'] = postsPath + file;
				metadata['filename'] = filename;
				metadata['link'] = postPath;
				metadata.date = new Date(metadata.date);
				posts.push(metadata);

				if (i === files.length - 1) {
					resolve(posts);
				}
			});

		});
	};

	this.getFiles = function() {
		return new Promise(function (resolve, reject) {

			/* Reading posts dir */
			fs.readdir(postsPath, function (err, files) {
				if (err) {
					throw err;
				}

				resolve(files);
			});
		});
	};

	this.getConfig = function() {
		return new Promise(function (resolve, reject) {
			var config = JSON.parse(fs.readFileSync( "./config.json").toString());
			GLOBAL.config = config;
			GLOBAL.config.nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader('./src/templates/' + config.template));
			resolve(config);
		});
	};
}

module.exports = Parser;

var localconfig = require('./config');
var helpers = require('./helpers');
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
var traceur = require('traceur');
var clc = helpers.cli_color();

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

	sortPosts : function (posts) {
        var new_posts = {};

        for (var p in posts) {
            posts[p].sort(function(a,b) {
                return new Date(b.date) - new Date(a.date);
            });
            new_posts[p] = posts[p];
        }
        return new_posts;
	},

	parsePages : function (files) {
		return new Promise(function (resolve, reject) {
			var pages = [];
			var curTemplate = GLOBAL.config.template;
			var nunjucksEnv = GLOBAL.nunjucksEnv;
			var config = GLOBAL.config;
			var tokens = [config.header_tokens ? config.header_tokens[0] : '<!--',
						  config.header_tokens ? config.header_tokens[1] : '-->'];

			files.forEach(function (file, i) {
				var page = fs.readFileSync( pagesPath + "/" + file).toString();
				var pageTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/page.html');
				var pageTemplateNJ = nunjucks.compile(pageTemplate.toString(), nunjucksEnv);
				var markfile = page.toString();
				var filename = path.extname(file) === '.md' ? path.basename(file, '.md') : path.basename(file, '.markdown');
				var md = new mkmeta(pagesPath + '/' + file);
				md.defineTokens(tokens[0], tokens[1]);

				/* Markdown extra */
				var metadata = md.metadata();
				var pagePermalink = permalinks(config.pages_permalink, { title : filename });

				var _page = {
					content : md.markdown(),
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
	},

	compileES6 : function (context, data) {
		var result = '',
			traceur_runtime = fs.readFileSync(localconfig.rootdir + '/bin/client/traceur-runtime.js').toString(),
			config = fs.readFileSync('./harmonic.json').toString(),
			harmonic_client = fs.readFileSync(localconfig.rootdir + '/bin/client/harmonic-client.js').toString();

		harmonic_client =
			harmonic_client.replace(/\{\{posts\}\}/, JSON.stringify(Helper.sortPosts(data)))
							.replace(/\{\{config\}\}/, config);

		switch (context) {
			case 'posts' :
				result = traceur.compile(harmonic_client, {
					filename : 'harmonic-client.js'
				});

				if (result.error) {
				  throw result.error;
				}

				fs.writeFileSync('./public/harmonic.js', '//traceur runtime\n' + traceur_runtime + '\n//harmonic code\n' +result.js);
			break;
		}
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
		return new Promise(function(resolve, reject) {
			fs.exists('./public', function(exists) {
				if(!exists) {
					fs.mkdirSync("public", 0766);
					console.log(clc.info('Successfully generated public folder'));
					resolve();
				}
			});
		});
	};

	this.compileStylus = function() {
		return new Promise(function (resolve, reject) {
			var subDirs = ['./src/templates/default/resources/_stylus/'];
			var curTemplate = './src/templates/' + GLOBAL.config.template;
			var stylDir = curTemplate + '/resources/_stylus';
			var cssDir = curTemplate + '/resources/css';
			var code = fs.readFileSync(stylDir + '/index.styl', 'utf8');

				stylus(code)
					.set('paths', [stylDir, stylDir + '/engine', stylDir + '/partials'])
					.render(function(err, css) {
						if (err) {
							reject(err);
						} else {
							fs.writeFileSync(cssDir + '/main.css', css);
							console.log(clc.info('Successfully generated CSS'));
							resolve();
						}
					});
		});
	};

	this.generateTagsPages = function(postsMetadata) {
		var postsByTag = {};
		var curTemplate = GLOBAL.config.template;
		var nunjucksEnv = GLOBAL.nunjucksEnv;
		var tagTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/index.html');
		var tagTemplateNJ = nunjucks.compile(tagTemplate.toString(), nunjucksEnv);
		var indexContent = '';
		var tagPath = null;

		return new Promise(function(resolve, reject) {
			for (var lang in postsMetadata) {
				for (var i = 0; i < postsMetadata[lang].length; i += 1) {
					var tags = postsMetadata[lang][i].categories;
					for (var y = 0; y < tags.length; y += 1) {
						var tag = tags[y]
								.toLowerCase()
								.trim()
								.split(' ')
								.join('-');

						if (Array.isArray(postsByTag[tag])) {
							postsByTag[tag].push(postsMetadata[lang][i]);
						} else {
							postsByTag[tag] = [postsMetadata[lang][i]];
						}
					}
				}

				for (var i in postsByTag) {
					tagContent = tagTemplateNJ.render({ posts : _.where(postsByTag[i], { lang: lang}), config : GLOBAL.config, category: i });

					/* If is the default language, generate in the root path */
					if (config.i18n.default === lang) {
						tagPath = './public/categories/' + i;
					} else {
						tagPath = './public/categories/' + lang + '/' + i;
					}

					nodefs.mkdirSync(tagPath, 0777, true);
					fs.writeFileSync(tagPath + '/index.html', tagContent);
					console.log(clc.info('Successfully generated tag[' + i + '] archive html file'));
				}
				resolve(postsMetadata);
			}
		});
	};

	this.generateIndex = function(postsMetadata) {
		return new Promise(function(resolve, reject) {
			var _posts = null;
			var curTemplate = GLOBAL.config.template;
			var nunjucksEnv = GLOBAL.nunjucksEnv;
			var indexTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/index.html');
			var indexTemplateNJ = nunjucks.compile(indexTemplate.toString(), nunjucksEnv);
			var indexContent = '';
			var indexPath = null;

			for (var lang in postsMetadata) {
				postsMetadata[lang].sort(function(a,b) {
					return new Date(b.date) - new Date(a.date);
				});
				_posts = postsMetadata[lang].slice(0,GLOBAL.config.index_posts || 10);
				indexContent = indexTemplateNJ.render({ posts : _posts, config : GLOBAL.config });

				if (config.i18n.default === lang) {
					indexPath = './public/';
				} else {
					indexPath = './public/' + lang;
				}
				nodefs.mkdirSync(indexPath, 0777, true);
				fs.writeFileSync(indexPath + '/index.html', indexContent);
				console.log(clc.info(lang + '/index file successfully created'));
			}
			resolve(postsMetadata);
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
				posts = {},
				curTemplate = config.template,
				postsTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/post.html'),
				nunjucksEnv = GLOBAL.nunjucksEnv,
				postsTemplateNJ = nunjucks.compile(postsTemplate.toString(), nunjucksEnv),
                tokens = [config.header_tokens ? config.header_tokens[0] : '<!--',
                          config.header_tokens ? config.header_tokens[1] : '-->'];

			for (var lang in files) {
				files[lang].forEach(function(file, i) {
					var md = new mkmeta(postsPath + lang + '/' + file);
					md.defineTokens(tokens[0], tokens[1]);
					var metadata = Helper.normalizeMetaData(md.metadata());
					var post = Helper.normalizeContent(md.markdown());
					var postCropped = md.markdown( { crop : '<!--more-->'});
					var filename = path.extname(file) === '.md' ? path.basename(file, '.md') : path.basename(file, '.markdown');
					var checkDate = new Date(filename.substr(0,10));
					filename = isNaN(checkDate.getDate()) ? filename : filename.substr(11, filename.length);
					var postPath = null;
					var categories = metadata.categories.split(',');

					/* If is the default language, generate in the root path */
					if (config.i18n.default === lang) {
						postPath = permalinks(config.posts_permalink.split(':language/')[1], { title : filename });
					} else {
						postPath = permalinks(config.posts_permalink, { title : filename, language : lang });
					}
					metadata.link = postPath;
					metadata.categories = categories;
					metadata['content'] = postCropped;
					metadata['file'] = postsPath + file;
					metadata['filename'] = filename;
					metadata['link'] = postPath;
					metadata['lang'] = lang;
					metadata['default_lang'] = config.i18n.default === lang ? false : true;
					metadata.date = new Date(metadata.date);

					var _post = {
						content : post,
						metadata : metadata
					}
					var postHTMLFile = postsTemplateNJ
						.render({ post : _post, config : GLOBAL.config })
						.replace(/<!--[\s\S]*?-->/g, '');

					if(metadata.published && metadata.published === 'false') {
						return;
					}

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
					if (posts[lang]) {
						posts[lang].push(metadata);
					} else {
						posts[lang] = [metadata];
					}

					if (i === files[lang].length - 1) {
						Helper.compileES6('posts', posts);
						resolve(posts);
					}
				});
			}
		});
	};

	this.getFiles = function() {
		return new Promise(function (resolve, reject) {

			var config = GLOBAL.config,
				langs = config.i18n.languages,
				langsLen = langs.length,
				i = 0,
				files = {};

			for (i; i < langsLen; i += 1) {
				files[langs[i]] = fs.readdirSync(postsPath  + langs[i]);
			}

			resolve(files);
		});
	};

	this.getConfig = function() {
		return new Promise(function (resolve, reject) {
			var config = JSON.parse(fs.readFileSync("./harmonic.json").toString());
			var custom = null;
			var newConfig = null;

			try {
				custom = JSON.parse(fs.readFileSync("./src/templates/" + config.template + "/harmonic.json").toString());
			} catch (e) {
			}
			if (custom) {
				newConfig = _.extend(config, custom);
			} else {
				newConfig = config;
			}
			GLOBAL.config = newConfig;
			GLOBAL.nunjucksEnv = new nunjucks.Environment(new nunjucks.FileSystemLoader('./src/templates/' + config.template));
			resolve(newConfig);
		});
	};
}

module.exports = Parser;

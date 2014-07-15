var localconfig = require('./config'),
    helpers = require('./helpers'),
    fs = require('fs'),
    marked = require('marked'),
    postsPath = './src/posts/',
    path = require('path'),
    pagesPath = './src/pages/',
    nodePath = require('path'),
    markextra = require('markdown-extra'),
    _ = require('underscore'),
    nunjucks = require('nunjucks'),
    co = require('co'),
    Promise = require('promise'),
    ncp = require('ncp').ncp,
    permalinks = require('permalinks'),
    nodefs = require('node-fs'),
    stylus = require('stylus'),
    mkmeta = require('marked-metadata'),
    util = require('./cli/util'),
    traceur = require('traceur'),
    clc = helpers.cli_color();

var Helper = {
    getPagesFiles: function() {
        return new Promise(function(resolve, reject) {
            /* Reading pages dir */
            fs.readdir(pagesPath, function(err, files) {
                if (err) {
                    throw err;
                }

                resolve(files);
            });
        });
    },

    sortPosts: function(posts) {
        var p,
            new_posts = {};

        for (p in posts) {
            posts[p].sort(function(a, b) {
                return new Date(b.date) - new Date(a.date);
            });
            new_posts[p] = posts[p];
        }
        return new_posts;
    },

    parsePages: function(files) {
        return new Promise(function(resolve, reject) {
            var pages = [],
                curTemplate = GLOBAL.config.template,
                nunjucksEnv = GLOBAL.nunjucksEnv,
                config = GLOBAL.config,
                tokens = [config.header_tokens ? config.header_tokens[0] : '<!--',
                config.header_tokens ? config.header_tokens[1] : '-->'];

            GLOBAL.pages = [];

            files.forEach(function(file, i) {
                var metadata, pagePermalink, _page, pageContent, pageHTMLFile,
                    page = fs.readFileSync(pagesPath + '/' + file).toString(),
                    pageTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/page.html'),
                    pageTemplateNJ = nunjucks.compile(pageTemplate.toString(), nunjucksEnv),
                    markfile = page.toString(),
                    md = new mkmeta(pagesPath + '/' + file),
                    filename = path.extname(file) === '.md' ?
                        path.basename(file, '.md') :
                        path.basename(file, '.markdown');

                md.defineTokens(tokens[0], tokens[1]);

                /* Markdown extra */
                metadata = md.metadata();
                pagePermalink = permalinks(config.pages_permalink, {
                    title: filename
                });

                _page = {
                    content: md.markdown(),
                    metadata: metadata
                }

                pageContent = nunjucks.compile(page, nunjucksEnv);
                pageHTMLFile = pageTemplateNJ.render({
                    page: _page,
                    config: GLOBAL.config
                });
                /* Removing header metadata */
                pageHTMLFile = pageHTMLFile.replace(/<!--[\s\S]*?-->/g, '');

                metadata['content'] = pageHTMLFile;
                metadata['file'] = postsPath + file;
                metadata['filename'] = filename;
                metadata['link'] = '/' + filename + '.html';
                metadata.date = new Date(metadata.date);

                GLOBAL.pages.push(metadata);

                nodefs.mkdir('./public/' + pagePermalink, 0777, true, function(err) {
                    if (err) {
                        reject(err);
                    } else {
                        /* write page html file */
                        fs.writeFile('./public/' + pagePermalink + '/' + 'index.html', pageHTMLFile, function(err) {
                            if (err)
                                throw err;
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

    normalizeMetaData: function(data) {
        data.title = data.title.replace(/\"/g, '');
        return data;
    },

    normalizeContent: function(data) {
        return data;
    }
}

var Parser = function() {

    this.start = function() {
        return new Promise(function(resolve, reject) {
            resolve('starting the parser');
        });
    };

    this.clean = function() {
        return new Promise(function(resolve, reject) {
            var rimfaf = require('rimraf');
            rimfaf('./public', function(err) {
                if (err) {
                    reject(err);
                } else {
                    console.log(clc.warn('Cleaning up...'));
                }
            });
        });
    };

    this.createPublicFolder = function(argument) {
        return new Promise(function(resolve, reject) {
            fs.exists('./public', function(exists) {
                if (!exists) {
                    fs.mkdirSync('public', 0766);
                    console.log(clc.info('Successfully generated public folder'));
                    resolve();
                }
            });
        });
    };

    this.compileCSS = function() {
        var currentCSSCompiler = GLOBAL.config.preprocessor || 'stylus',
            compiler = {

            /* Less */
            less: function() {
                console.log('Less is not implemented yet');
            },

            /* Stylus */
            stylus: function() {
                return new Promise(function(resolve, reject) {
                    var subDirs = ['./src/templates/default/resources/_stylus/'],
                        curTemplate = './src/templates/' + GLOBAL.config.template,
                        stylDir = curTemplate + '/resources/_stylus',
                        cssDir = curTemplate + '/resources/css',
                        code = fs.readFileSync(stylDir + '/index.styl', 'utf8');

                    stylus(code)
                        .set('paths', [stylDir, stylDir + '/engine', stylDir + '/partials'])
                        .render(function(err, css) {
                        if (err) {
                            reject(err);
                        } else {
                            fs.writeFileSync(cssDir + '/main.css', css);
                            console.log(clc.info('Successfully generated CSS with Stylus preprocessor'));
                            resolve();
                        }
                    });
                });
            }
        };

        compiler[currentCSSCompiler]();
    }

    this.compileES6 = function(postsMetadata) {
        return new Promise(function(resolve, reject) {
            var result = '',
                traceur_runtime = fs.readFileSync(localconfig.rootdir + '/bin/client/traceur-runtime.js').toString(),
                config = GLOBAL.config,
                harmonic_client = fs.readFileSync(localconfig.rootdir + '/bin/client/harmonic-client.js').toString();

            harmonic_client = harmonic_client.replace(/\{\{posts\}\}/, JSON.stringify(Helper.sortPosts(postsMetadata)))
            .replace(/\{\{config\}\}/, JSON.stringify(config));

            result = traceur.compile(harmonic_client, {
                filename: 'harmonic-client.js'
            });

            if (result.error) {
                throw result.error;
            }

            fs.writeFileSync('./public/harmonic.js', '//traceur runtime\n' + traceur_runtime + '\n//harmonic code\n' + result.js);
            resolve(postsMetadata);
        });
    };

    this.generateTagsPages = function(postsMetadata) {
        var postsByTag = {},
            curTemplate = GLOBAL.config.template,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            tagTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/index.html'),
            tagTemplateNJ = nunjucks.compile(tagTemplate.toString(), nunjucksEnv),
            indexContent = '',
            tagPath = null;

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
                    tagContent = tagTemplateNJ.render({
                        posts: _.where(postsByTag[i], {
                            lang: lang
                        }),
                        config: GLOBAL.config,
                        category: i
                    });

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
            var lang,
                _posts = null,
                curTemplate = GLOBAL.config.template,
                nunjucksEnv = GLOBAL.nunjucksEnv,
                indexTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/index.html'),
                indexTemplateNJ = nunjucks.compile(indexTemplate.toString(), nunjucksEnv),
                indexContent = '',
                indexPath = null;

            for (lang in postsMetadata) {
                postsMetadata[lang].sort(function(a, b) {
                    return new Date(b.date) - new Date(a.date);
                });
                _posts = postsMetadata[lang].slice(0, GLOBAL.config.index_posts || 10);

                indexContent = indexTemplateNJ.render({
                    posts: _posts,
                    config: GLOBAL.config,
                    pages: GLOBAL.pages
                });

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
        var imagesP, resourcesP;

        imagesP = new Promise(function(resolve, reject) {
            ncp('./src/img', './public/img', function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });

        resourcesP = new Promise(function(resolve, reject) {
            var curTemplate = './src/templates/' + GLOBAL.config.template;
            ncp(curTemplate + '/resources', './public', function(err) {
                if (err) {
                    reject(err);
                    return;
                }
                resolve();
            });
        });

        return new Promise(function(resolve, reject) {
            Promise.all([resourcesP, imagesP])
                .then(function() {
                resolve('Resources copied');
            });
        });
    };

    this.generatePages = function(pagesMetadata) {
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

    this.generatePosts = function(files) {
        return new Promise(function(resolve, reject) {
            var config = GLOBAL.config,
                posts = {},
                currentDate = new Date(),
                curTemplate = config.template,
                postsTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/post.html'),
                nunjucksEnv = GLOBAL.nunjucksEnv,
                postsTemplateNJ = nunjucks.compile(postsTemplate.toString(), nunjucksEnv),
                tokens = [config.header_tokens ? config.header_tokens[0] : '<!--',
                    config.header_tokens ? config.header_tokens[1] : '-->'];

            for (var lang in files) {
                files[lang].forEach(function(file, i) {
                    var metadata, post, postCropped, filename, checkDate, postPath, categories,
                        _post, postHTMLFile,
                        md = new mkmeta(postsPath + lang + '/' + file);

                    md.defineTokens(tokens[0], tokens[1]);
                    metadata = Helper.normalizeMetaData(md.metadata());
                    post = Helper.normalizeContent(md.markdown());
                    postCropped = md.markdown({
                        crop: '<!--more-->'
                    });

                    filename = path.extname(file) === '.md' ? path.basename(file, '.md') : path.basename(file, '.markdown');
                    checkDate = new Date(filename.substr(0, 10));
                    filename = isNaN(checkDate.getDate()) ? filename : filename.substr(11, filename.length);
                    postPath = null;
                    categories = metadata.categories.split(',');

                    /* If is the default language, generate in the root path */
                    if (config.i18n.default === lang) {
                        postPath = permalinks(config.posts_permalink.split(':language/')[1], {
                            title: filename
                        });
                    } else {
                        postPath = permalinks(config.posts_permalink, {
                            title: filename,
                            language: lang
                        });
                    }

                    metadata.categories = categories;
                    metadata['content'] = postCropped;
                    metadata['file'] = postsPath + file;
                    metadata['filename'] = filename;
                    metadata['link'] = postPath;
                    metadata['lang'] = lang;
                    metadata['default_lang'] = config.i18n.default === lang ? false : true;
                    metadata.date = new Date(metadata.date);

                    _post = {
                        content: post,
                        metadata: metadata
                    }
                    postHTMLFile = postsTemplateNJ
                    .render({
                        post: _post,
                        config: GLOBAL.config
                    })
                    .replace(/<!--[\s\S]*?-->/g, '');

                    if (metadata.published && metadata.published === 'false') {
                        return;
                    }

                    if (metadata.date && metadata.date > currentDate) {
                        console.log(clc.info('Skipping future post ' + metadata.filename));
                        return;
                    }

                    nodefs.mkdir('./public/' + postPath, 0777, true, function(err) {
                        if (err) {
                            reject(err);
                        } else {
                            /* write post html file */
                            fs.writeFile('./public/' + postPath + '/index.html', postHTMLFile, function(err) {
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
                        resolve(posts);
                    }
                });
            }
        });
    };

    this.getFiles = function() {
        return new Promise(function(resolve, reject) {

            var config = GLOBAL.config,
                langs = config.i18n.languages,
                langsLen = langs.length,
                i = 0,
                files = {};

            for (i; i < langsLen; i += 1) {
                files[langs[i]] = fs.readdirSync(postsPath + langs[i]);
            }

            resolve(files);
        });
    };

    this.getConfig = function() {
        return new Promise(function(resolve, reject) {
            var config = JSON.parse(fs.readFileSync('./harmonic.json').toString()),
                custom = null,
                newConfig = null;

            try {
                custom = JSON.parse(fs.readFileSync('./src/templates/' + config.template + '/harmonic.json').toString());
            } catch (e) {}
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

    this.generateRSS = function(postsMetadata) {
        return new Promise(function(resolve, reject) {
            var _posts = null,
                curTemplate = GLOBAL.config.template,
                nunjucksEnv = GLOBAL.nunjucksEnv,
                rssTemplate = fs.readFileSync(__dirname + '/resources/rss.xml'),
                rssTemplateNJ = nunjucks.compile(rssTemplate.toString(), nunjucksEnv),
                rssContent = '',
                rssPath = null,
                rssLink = '',
                rssAuthor = '';

            fs.exists(__dirname + '/resources/rss.xml', function() {
                for (var lang in postsMetadata) {
                    postsMetadata[lang].sort(function(a, b) {
                        return new Date(b.date) - new Date(a.date);
                    });
                    _posts = postsMetadata[lang].slice(0, GLOBAL.config.index_posts || 10);

                    if (GLOBAL.config.author_email) {
                        rssAuthor = GLOBAL.config.author_email + ' (' + GLOBAL.config.author + ')';
                    } else {
                        rssAuthor = GLOBAL.config.author;
                    }

                    if (config.i18n.default === lang) {
                        rssPath = './public/';
                        rssLink = GLOBAL.config.domain + '/rss.xml';
                    } else {
                        rssPath = './public/' + lang;
                        rssLink = GLOBAL.config.domain + '/' + lang + '/rss.xml';
                    }

                    rssContent = rssTemplateNJ.render({
                        rss: {
                            date: new Date().toUTCString(),
                            link: rssLink,
                            author: rssAuthor,
                            lang: lang
                        },
                        posts: _posts,
                        config: GLOBAL.config,
                        pages: GLOBAL.pages
                    });


                    nodefs.mkdirSync(rssPath, 0777, true);
                    fs.writeFileSync(rssPath + '/rss.xml', rssContent);
                    console.log(clc.info(lang + '/rss.xml file successfully created'));
                }
                resolve(postsMetadata);
            });
        });
    };
}

module.exports = Parser;

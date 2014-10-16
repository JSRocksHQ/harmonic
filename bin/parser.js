var Helper, Parser,
    localconfig = require('./config'),
    helpers = require('./helpers'),
    fs = require('fs'),
    postsPath = './src/posts/',
    path = require('path'),
    pagesPath = './src/pages/',
    _ = require('underscore'),
    nunjucks = require('nunjucks'),
    ncp = require('ncp').ncp,
    permalinks = require('permalinks'),
    nodefs = require('node-fs'),
    stylus = require('stylus'),
    less = require('less'),
    MkMeta = require('marked-metadata'),
    traceur = require('traceur'),
    clc = helpers.cliColor(),

    // JSHint ESNext option doesn't allow redefinition of Promise
    // But it's not supported yet in node --harmony
    Promise = require('promise'); // jshint ignore: line

Helper = {
    getPagesFiles: function() {
        var config = GLOBAL.config,
            langs = config.i18n.languages,
            langsLen = langs.length,
            i = 0,
            files = {};

        for (i; i < langsLen; i += 1) {
            if (!fs.existsSync(pagesPath + langs[i])) {
                fs.mkdirSync(pagesPath + langs[i], 0766);
            } else {
                files[langs[i]] = fs.readdirSync(pagesPath + langs[i]);
            }
        }

        return files;
    },

    sort: function _sort(a, b) {
        return new Date(b.date) - new Date(a.date);
    },

    sortPosts: function(posts) {
        var p,
            newPosts = {};

        for (p in posts) {
            posts[p].sort(Helper.sort);
            newPosts[p] = posts[p];
        }
        return newPosts;
    },

    parsePages: function(files) {
        var langs = Object.keys(files),
            curTemplate = GLOBAL.config.template,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            config = GLOBAL.config,
            tokens = [config.header_tokens ? config.header_tokens[0] : '<!--',
            config.header_tokens ? config.header_tokens[1] : '-->'],
            writePromises = [];

        GLOBAL.pages = [];

        langs.forEach(function(lang) {
            if (files[lang].length > 0) {
                files[lang].forEach(function(file) {
                    var metadata, pagePermalink, _page, pageContent, pageHTMLFile,
                        page = fs.readFileSync(pagesPath + lang + '/' + file).toString(),
                        tplSrc = './src/templates/' + curTemplate + '/page.html',
                        pageTpl = fs.readFileSync(tplSrc),
                        pageTplNJ = nunjucks.compile(pageTpl.toString(), nunjucksEnv),
                        md = new MkMeta(pagesPath + lang + '/' + file),
                        pageSrc = '',
                        filename = path.extname(file) === '.md' ?
                            path.basename(file, '.md') :
                            path.basename(file, '.markdown');

                    md.defineTokens(tokens[0], tokens[1]);

                    // Markdown extra
                    metadata = md.metadata();
                    pagePermalink = permalinks(config.pages_permalink, {
                        title: filename
                    });

                    _page = {
                        content: md.markdown(),
                        metadata: metadata
                    };

                    pageContent = nunjucks.compile(page, nunjucksEnv);
                    pageHTMLFile = pageTplNJ.render({
                        page: _page,
                        config: GLOBAL.config
                    });

                    // Removing header metadata
                    pageHTMLFile = pageHTMLFile.replace(/<!--[\s\S]*?-->/g, '');

                    metadata.content = pageHTMLFile;
                    metadata.file = postsPath + file;
                    metadata.filename = filename;
                    metadata.link = '/' + filename + '.html';
                    metadata.date = new Date(metadata.date);
                    pageSrc = './public/' + pagePermalink + '/' + 'index.html';

                    GLOBAL.pages.push(metadata);

                    writePromises.push(new Promise(function(resolve, reject) {
                        nodefs.mkdir('./public/' + pagePermalink, 0777, true, function(err) {
                            if (err) {
                                reject(err);
                                return;
                            }
                            // write page html file
                            fs.writeFile(pageSrc, pageHTMLFile, function(err) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                console.log(
                                    clc.info('Successfully generated page ' + pagePermalink)
                                );
                                resolve();
                            });
                        });
                    }));
                });
            }
        });
        return Promise.all(writePromises);
    },

    normalizeMetaData: function(data) {
        data.title = data.title.replace(/\"/g, '');
        return data;
    },

    normalizeContent: function(data) {
        return data;
    }
};

Parser = function() {

    this.start = function() {
        console.log(clc.info('starting the parser'));
        return Promise.resolve();
    };

    this.clean = function() {
        console.log(clc.warn('Cleaning up...'));
        var rimraf = require('rimraf');
        rimraf.sync('./public');
    };

    this.createPublicFolder = function() {
        if (!fs.existsSync('./public')) {
            fs.mkdirSync('public', 0766);
            console.log(clc.info('Successfully generated public folder'));
        }
    };

    this.compileCSS = function() {
        var compiler,
            currentCSSCompiler = GLOBAL.config.preprocessor || 'stylus';

        compiler = {

            // Less
            less: function() {
                return new Promise(function(resolve, reject) {
                    var curTemplate = './src/templates/' + GLOBAL.config.template,
                        lessDir = curTemplate + '/resources/_less',
                        cssDir = curTemplate + '/resources/css';

                    fs.readFile(lessDir + '/index.less', function(error, data) {

                        var dataString = data.toString();
                        var options = {
                            paths: [lessDir],              // .less file search paths
                            outputDir: cssDir,           // output directory, note the '/'
                            optimization: 1,            // optimization level, higher is better but more volatile - 1 is a good value
                            filename: "main.less",      // root .less file
                            compress: false,            // compress?
                            yuicompress: false          // use YUI compressor?
                        };

                        options.outputfile = options.filename.split(".less")[0] + (options.compress ? ".min" : "") + ".css";
                        options.outputDir = path.resolve(process.cwd(), options.outputDir) + "/";
                        verifyDirectory(options.outputDir);


                        var parser = new less.Parser(options);
                        parser.parse(dataString, function(error, cssTree) {

                            if (error) {
                                less.writeError(error, options);
                                reject(err);
                            }

                            var cssString = cssTree.toCSS({
                                compress: options.compress,
                                yuicompress: options.yuicompress
                            });

                            fs.writeFileSync(options.outputDir + options.outputfile, cssString, 'utf8');
                            console.log(
                                clc.info('Successfully generated CSS with LESS preprocessor')
                            );
                            resolve();
                        });
                    });

                    var verifyDirectory = function(filepath) {

                        var dir = filepath;
                        var existsSync = fs.existsSync || path.existsSync;

                        if ( !existsSync(dir) ) {
                            fs.mkdirSync(dir);
                        }
                    };

                });
            },

            // Stylus
            stylus: function() {
                return new Promise(function(resolve, reject) {
                    var curTemplate = './src/templates/' + GLOBAL.config.template,
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
                                console.log(
                                    clc.info('Successfully generated CSS with Stylus preprocessor')
                                );
                                resolve();
                            }
                        });
                });
            }
        };

        compiler[currentCSSCompiler]();
    };

    this.compileES6 = function(postsMetadata) {
        var result = '',
            traceurRuntime =
                fs.readFileSync(localconfig.rootdir + '/bin/client/traceur-runtime.js')
                    .toString(),
            config = GLOBAL.config,
            pages = GLOBAL.pages,
            harmonicClient =
                fs.readFileSync(localconfig.rootdir + '/bin/client/harmonic-client.js')
                    .toString();

        harmonicClient = harmonicClient
            .replace(/\/\*\{\{posts\}\}\*\//, JSON.stringify(Helper.sortPosts(postsMetadata)))
            .replace(/\/\*\{\{pages\}\}\*\//, JSON.stringify(pages))
            .replace(/\/\*\{\{config\}\}\*\//, JSON.stringify(config));

        result = traceur.compile(harmonicClient, {
            filename: 'harmonic-client.js'
        });

        if (result.error) {
            throw result.error;
        }

        fs.writeFileSync('./public/harmonic.js', '//traceur runtime\n' + traceurRuntime +
            '\n//harmonic code\n' + result.js);

        return postsMetadata;
    };

    this.generateTagsPages = function(postsMetadata) {
        var postsByTag = {},
            curTemplate = GLOBAL.config.template,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            tagTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/index.html'),
            tagTemplateNJ = nunjucks.compile(tagTemplate.toString(), nunjucksEnv),
            tagPath = null,
            lang, i, tags, y, tag, tagContent,
            config = GLOBAL.config;

        for (lang in postsMetadata) {
            for (i = 0; i < postsMetadata[lang].length; i += 1) {
                tags = postsMetadata[lang][i].categories;
                for (y = 0; y < tags.length; y += 1) {
                    tag = tags[y]
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

            for (i in postsByTag) {
                tagContent = tagTemplateNJ.render({
                    posts: _.where(postsByTag[i], {
                        lang: lang
                    }),
                    config: config,
                    category: i
                });

                // If is the default language, generate in the root path
                if (config.i18n.default === lang) {
                    tagPath = './public/categories/' + i;
                } else {
                    tagPath = './public/categories/' + lang + '/' + i;
                }

                nodefs.mkdirSync(tagPath, 0777, true);
                fs.writeFileSync(tagPath + '/index.html', tagContent);
                console.log(
                    clc.info('Successfully generated tag[' + i + '] archive html file')
                );
            }
        }
    };

    this.generateIndex = function(postsMetadata) {
        var lang,
            _posts = null,
            curTemplate = GLOBAL.config.template,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            indexTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/index.html'),
            indexTemplateNJ = nunjucks.compile(indexTemplate.toString(), nunjucksEnv),
            indexContent = '',
            indexPath = null,
            config = GLOBAL.config;

        for (lang in postsMetadata) {
            postsMetadata[lang].sort(Helper.sort);

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
        return postsMetadata;
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

        return Promise.all([resourcesP, imagesP])
            .then(function() {
                console.log(clc.info('Resources copied'));
            });
    };

    this.generatePages = function() {
        return Promise.resolve()
            .then(Helper.getPagesFiles)
            .then(Helper.parsePages);
    };

    this.generatePosts = function(files) {
        var langs = Object.keys(files),
            config = GLOBAL.config,
            posts = {},
            currentDate = new Date(),
            curTemplate = config.template,
            postsTemplate = fs.readFileSync('./src/templates/' + curTemplate + '/post.html'),
            nunjucksEnv = GLOBAL.nunjucksEnv,
            postsTemplateNJ = nunjucks.compile(postsTemplate.toString(), nunjucksEnv),
            tokens = [
                config.header_tokens ? config.header_tokens[0] : '<!--',
                config.header_tokens ? config.header_tokens[1] : '-->'
            ],
            writePromises = [];

        langs.forEach(function(lang) {
            files[lang].forEach(function(file) {
                var metadata, post, postCropped, filename, checkDate, postPath, categories,
                    _post, postHTMLFile, postDate, month, year, options,
                    md = new MkMeta(postsPath + lang + '/' + file);

                md.defineTokens(tokens[0], tokens[1]);
                metadata = Helper.normalizeMetaData(md.metadata());
                post = Helper.normalizeContent(md.markdown());
                postCropped = md.markdown({
                    crop: '<!--more-->'
                });

                filename = path.extname(file) === '.md' ?
                    path.basename(file, '.md') :
                    path.basename(file, '.markdown');

                checkDate = new Date(filename.substr(0, 10));

                filename = isNaN(checkDate.getDate()) ?
                    filename :
                    filename.substr(11, filename.length);

                postPath = null;
                categories = metadata.categories.split(',');
                postDate = new Date(metadata.date);
                year = postDate.getFullYear();
                month = (postDate.getMonth() + 1) < 10 ? '0' + (postDate.getMonth() + 1) :
                postDate.getMonth() + 1;

                // If is the default language, generate in the root path
                options = {
                    replacements: [{
                        pattern: ':year',
                        replacement: year
                    },
                    {
                        pattern: ':month',
                        replacement: month
                    },
                    {
                        pattern: ':title',
                        replacement: filename
                    },
                    {
                        pattern: ':language',
                        replacement: lang
                    }]
                };
                if (config.i18n.default === lang) {
                    options.structure = config.posts_permalink.split(':language/')[1];
                    postPath = permalinks(options);
                } else {
                    options.structure = config.posts_permalink;
                    postPath = permalinks(options);
                }

                metadata.categories = categories;
                metadata.content = postCropped;
                metadata.file = postsPath + file;
                metadata.filename = filename;
                metadata.link = postPath;
                metadata.lang = lang;
                metadata.default_lang = config.i18n.default === lang ? false : true;
                metadata.date = new Date(metadata.date);

                _post = {
                    content: post,
                    metadata: metadata
                };

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

                writePromises.push(new Promise(function(resolve, reject) {
                    nodefs.mkdir('./public/' + postPath, 0777, true, function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        // write post html file
                        fs.writeFile('./public/' + postPath + '/index.html', postHTMLFile,
                            function(err) {
                                if (err) {
                                    reject(err);
                                    return;
                                }
                                console.log(
                                    clc.info('Successfully generated post ' + postPath)
                                );
                                resolve();
                            }
                        );
                    });
                }));

                if (posts[lang]) {
                    posts[lang].push(metadata);
                } else {
                    posts[lang] = [metadata];
                }
            });
        });
        return Promise.all(writePromises)
            .then(function() {
                return posts;
            });
    };

    this.getFiles = function() {
        var config = GLOBAL.config,
            langs = config.i18n.languages,
            langsLen = langs.length,
            i = 0,
            files = {};

        for (i; i < langsLen; i += 1) {
            files[langs[i]] = fs.readdirSync(postsPath + langs[i]);
        }

        return files;
    };

    this.getConfig = function() {
        var config = JSON.parse(fs.readFileSync('./harmonic.json').toString()),
            custom = null,
            newConfig = null;

        try {
            custom =
                JSON.parse(
                    fs.readFileSync('./src/templates/' + config.template + '/harmonic.json')
                        .toString()
                );
        } catch (e) {}

        if (custom) {
            newConfig = _.extend(config, custom);
        } else {
            newConfig = config;
        }

        GLOBAL.config = newConfig;
        GLOBAL.nunjucksEnv = new nunjucks.Environment(
            new nunjucks.FileSystemLoader('./src/templates/' + config.template)
        );

        return newConfig;
    };

    this.generateRSS = function(postsMetadata) {
        var _posts = null,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            rssTemplate = fs.readFileSync(__dirname + '/resources/rss.xml'),
            rssTemplateNJ = nunjucks.compile(rssTemplate.toString(), nunjucksEnv),
            rssContent = '',
            rssPath = null,
            rssLink = '',
            rssAuthor = '',
            config = GLOBAL.config,
            lang;

        for (lang in postsMetadata) {
            postsMetadata[lang].sort(Helper.sort);
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
        return postsMetadata;
    };
};

module.exports = Parser;

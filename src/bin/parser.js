import path from 'path';
import fs from 'fs';
import nunjucks from 'nunjucks';
import _ from 'underscore';
import permalinks from 'permalinks';
import MkMeta from 'marked-metadata';
import mkdirp from 'mkdirp';
import { ncp } from 'ncp';
import { sync as rimrafSync } from 'rimraf';
import stylus from 'stylus';
import less from 'less';
import { rootdir, postspath, pagespath } from './config';
import { cliColor, isHarmonicProject, getConfig, titleToFilename } from './helpers';
import Theme from './theme';

let clc = cliColor();
let rMarkdownExt = /\.(?:md|markdown)$/;

let Helper = {
    getPagesFiles: function(sitePath) {
        var config = GLOBAL.config,
            files = {};

        config.i18n.languages.forEach(function(lang) {
            let langPath = path.join(sitePath, pagespath, lang);
            if (!fs.existsSync(langPath)) {
                fs.mkdirSync(langPath);
            } else {
                files[lang] = fs.readdirSync(langPath).filter((p) => rMarkdownExt.test(p));
            }
        });

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

    parsePages: function(sitePath, files) {
        var langs = Object.keys(files),
            curTemplate = GLOBAL.config.template,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            config = GLOBAL.config,
            tokens = [config.header_tokens ? config.header_tokens[0] : '<!--',
            config.header_tokens ? config.header_tokens[1] : '-->'],
            writePromises = [];

        GLOBAL.pages = [];

        langs.forEach(function(lang) {
            files[lang].forEach(function(file) {
                var metadata, pagePermalink, _page, pageContent, pageHTMLFile,
                    pagePath = path.join(sitePath, pagespath, lang, file),
                    page = fs.readFileSync(pagePath).toString(),
                    pageTpl = fs.readFileSync(
                        path.join(sitePath, 'node_modules', curTemplate, 'page.html')
                    ),
                    pageTplNJ = nunjucks.compile(pageTpl.toString(), nunjucksEnv),
                    md = new MkMeta(pagePath),
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
                metadata.file = postspath + file; // TODO check whether this needs sitePath
                metadata.filename = filename;
                metadata.link = `/${filename}.html`;
                metadata.date = new Date(metadata.date);
                pageSrc = path.join(sitePath, 'public', pagePermalink, 'index.html');

                GLOBAL.pages.push(metadata);

                writePromises.push(new Promise(function(resolve, reject) {
                    mkdirp(path.join(sitePath, 'public', pagePermalink), function(err) {
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
                                clc.info(`Successfully generated page  ${pagePermalink}`)
                            );
                            resolve();
                        });
                    });
                }));
            });
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

export default class Parser {

    constructor() {
    }

    start(sitePath) {
        console.log(clc.info('starting the parser'));
        return Promise.resolve();
    }

    clean(sitePath) {
        console.log(clc.warn('Cleaning up...'));
        rimrafSync(path.join(sitePath, 'public'));
    }

    createPublicFolder(sitePath) {
        let publicDirPath = path.join(sitePath, 'public');
        if (!fs.existsSync(publicDirPath)) {
            fs.mkdirSync(publicDirPath);
            console.log(clc.info('Successfully generated public folder'));
        }
    }

    compileCSS(sitePath) {
        var compiler,
            currentCSSCompiler = GLOBAL.config.preprocessor || 'stylus';

        compiler = {

            // Less
            less: function() {
                return new Promise(function(resolve, reject) {
                    var curTemplate = path.join(sitePath, 'src/templates', GLOBAL.config.template),
                        lessDir = `${curTemplate}/resources/_less`,
                        cssDir = `${curTemplate}/resources/css`,
                        verifyDirectory = function(filepath) {
                            var dir = filepath;

                            if (!fs.existsSync(dir)) {
                                fs.mkdirSync(dir);
                            }
                        };

                    fs.readFile(`${lessDir}/index.less`, function(error, data) {

                        var dataString = data.toString(),
                            options = {
                                paths: [lessDir],
                                outputDir: cssDir,
                                optimization: 1,
                                filename: 'main.less',
                                compress: true,
                                yuicompress: true
                            },
                            optionFile,
                            parser;

                        options.outputfile = `${options.filename.split('.less')[0]}.css`;
                        options.outputDir = path.resolve(sitePath, options.outputDir) + '/';
                        verifyDirectory(options.outputDir);

                        parser = new less.Parser(options);
                        parser.parse(dataString, function(error, cssTree) {

                            if (error) {
                                less.writeError(error, options);
                                reject(error);
                            }

                            var cssString = cssTree.toCSS({
                                compress: options.compress,
                                yuicompress: options.yuicompress
                            });

                            optionFile = options.outputDir + options.outputfile;

                            fs.writeFileSync(optionFile, cssString, 'utf8');
                            console.log(
                                clc.info('Successfully generated CSS with LESS preprocessor')
                            );
                            resolve();
                        });
                    });
                });
            },

            // Stylus
            stylus: function() {
                return new Promise(function(resolve, reject) {
                    var curTemplate = path.join(sitePath, 'src/templates', GLOBAL.config.template),
                        stylDir = `${curTemplate}/resources/_stylus`,
                        cssDir = `${curTemplate}/resources/css`,
                        code = fs.readFileSync(`${stylDir}/index.styl`, 'utf8');

                    stylus(code)
                        .set('paths', [stylDir, `${stylDir}/engine`, `${stylDir}/partials`])
                        .render(function(err, css) {
                            if (err) {
                                reject(err);
                            } else {
                                fs.writeFileSync(`${cssDir}/main.css`, css);
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
    }

    compileJS(sitePath, postsMetadata) {
        var result,
            config = GLOBAL.config,
            pages = GLOBAL.pages,
            harmonicClient =
                fs.readFileSync(`${rootdir}/bin/client/harmonic-client.js`).toString();

        harmonicClient = harmonicClient
            .replace(/__HARMONIC\.POSTS__/g, JSON.stringify(Helper.sortPosts(postsMetadata)))
            .replace(/__HARMONIC\.PAGES__/g, JSON.stringify(pages))
            .replace(/__HARMONIC\.CONFIG__/g, JSON.stringify(config));

        fs.writeFileSync(path.join(sitePath, 'public/harmonic.js'), harmonicClient);

        return postsMetadata;
    }

    generateTagsPages(sitePath, postsMetadata) {
        var postsByTag = {},
            curTemplate = GLOBAL.config.template,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            tagTemplate = null,
            tagTemplateNJ = null,   
            tagPath = null,
            lang, i, tags, y, tag, tagContent,
            config = GLOBAL.config;

        try {
            tagTemplate = fs.readFileSync(
                path.join(sitePath, 'node_modules', curTemplate, 'index.html')
            )
            tagTemplateNJ = nunjucks.compile(tagTemplate.toString(), nunjucksEnv);
        } catch (templateError) {
            console.log(clc.error(`Harmonic failed to load the template file. Check your template in harmonic.json`));
            return;
        }

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
                    tagPath = path.join(sitePath, 'public/categories', i);
                } else {
                    tagPath = path.join(sitePath, 'public/categories', lang, i);
                }

                mkdirp.sync(tagPath);
                fs.writeFileSync(path.join(tagPath, 'index.html'), tagContent);
                console.log(
                    clc.info(`Successfully generated tag[${i}] archive html file`)
                );
            }
        }
    }

    generateIndex(sitePath, postsMetadata) {
        var lang,
            _posts = null,
            curTemplate = GLOBAL.config.template,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            indexTemplate = null,
            indexTemplateNJ = null,    
            indexContent = '',
            indexPath = null,
            config = GLOBAL.config;

        try {
            indexTemplate = fs.readFileSync(
                path.join(sitePath, 'node_modules', curTemplate, 'index.html')
            )
            indexTemplateNJ = nunjucks.compile(indexTemplate.toString(), nunjucksEnv);
        } catch (templateError) {
            console.log(clc.error(`Harmonic failed to load the template file. Check your template in harmonic.json`));
            return;
        }

        for (lang in postsMetadata) {
            postsMetadata[lang].sort(Helper.sort);

            _posts = postsMetadata[lang].slice(0, GLOBAL.config.index_posts || 10);

            indexContent = indexTemplateNJ.render({
                posts: _posts,
                config: GLOBAL.config,
                pages: GLOBAL.pages
            });

            if (config.i18n.default === lang) {
                indexPath = path.join(sitePath, 'public');
            } else {
                indexPath = path.join(sitePath, 'public', lang);
            }
            mkdirp.sync(indexPath);
            fs.writeFileSync(path.join(indexPath, 'index.html'), indexContent);
            console.log(clc.info(`${lang}/index file successfully created`));
        }
        return postsMetadata;
    }

    copyResources(sitePath) {
        var resourcesP;

        resourcesP = new Promise(function(resolve, reject) {
            var curTemplate = path.join(sitePath, 'node_modules', GLOBAL.config.template);
            ncp(path.join(curTemplate, 'resources'), path.join(sitePath, 'public'), function(err) {
                if (err) {
                    console.log(clc.error(`Harmonic failed to copy the template resources. Check your template in harmonic.json`));
                    return;
                }
                resolve();
            });
        });

        return Promise.all([resourcesP])
            .then(function() {
                console.log(clc.info('Resources copied'));
            });
    }

    generatePages(sitePath) {
        return Promise.resolve()
            .then(Helper.getPagesFiles.bind(Helper, sitePath))
            .then(Helper.parsePages.bind(Helper, sitePath));
    }

    generatePosts(sitePath, files) {
        var langs = Object.keys(files),
            config = GLOBAL.config,
            posts = {},
            currentDate = new Date(),
            curTemplate = config.template,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            postsTemplate = null,
            postsTemplateNJ = null,
            tokens = [
                config.header_tokens ? config.header_tokens[0] : '<!--',
                config.header_tokens ? config.header_tokens[1] : '-->'
            ],
            writePromises = [];

        try {
            postsTemplate = fs.readFileSync(
                path.join(sitePath, 'node_modules', curTemplate, 'post.html')
            )
            postsTemplateNJ = nunjucks.compile(postsTemplate.toString(), nunjucksEnv);
        } catch (templateError) {
            console.log(clc.error(`Harmonic failed to load the template file. Check your template in harmonic.json`));
            return;
        }

        langs.forEach(function(lang) {
            files[lang].forEach(function(file) {
                var metadata, post, postCropped, filename, checkDate, postPath, categories,
                    _post, postHTMLFile, postDate, month, year, options,
                    md = new MkMeta(path.join(sitePath, postspath, lang, file));

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
                month = ('0' + (postDate.getMonth() + 1)).slice(-2);

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
                metadata.file = postspath + file;
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
                    console.log(clc.info(`Skipping future post ${metadata.filename}`));
                    return;
                }

                writePromises.push(new Promise(function(resolve, reject) {
                    mkdirp(path.join(sitePath, 'public', postPath), function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        // write post html file
                        fs.writeFile(path.join(sitePath, 'public', postPath, 'index.html'),
                            postHTMLFile, function(err) {
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
    }

    getFiles(sitePath) {
        var config = GLOBAL.config,
            files = {};

        config.i18n.languages.forEach(function(lang) {
            files[lang] = fs.readdirSync(path.join(sitePath, postspath, lang))
                .filter((p) => rMarkdownExt.test(p));
        });

        return files;
    }

    getConfig(sitePath) {
        var config = getConfig(sitePath);

        // TODO replace try with fs.exists check so that invalid JSON does not fail silently
        try {
            _.extend(config, JSON.parse(fs.readFileSync(
                path.join(sitePath, 'node_modules', config.template, 'harmonic.json')
            ).toString()));
        } catch (e) {}

        GLOBAL.config = config;
        GLOBAL.nunjucksEnv = nunjucks.configure(
            path.join(sitePath, 'node_modules', config.template), { watch: false }
        );

        return config;
    }

    generateRSS(sitePath, postsMetadata) {
        var _posts = null,
            nunjucksEnv = GLOBAL.nunjucksEnv,
            rssTemplate = fs.readFileSync(`${__dirname}/resources/rss.xml`),
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
                rssAuthor = `${GLOBAL.config.author_email} ( ${GLOBAL.config.author} )`;
            } else {
                rssAuthor = GLOBAL.config.author;
            }

            if (config.i18n.default === lang) {
                rssPath = path.join(sitePath, 'public');
                rssLink = `${GLOBAL.config.domain}/rss.xml`;
            } else {
                rssPath = path.join(sitePath, 'public', lang);
                rssLink = `${GLOBAL.config.domain}/${lang}/rss.xml`;
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

            mkdirp.sync(rssPath);
            fs.writeFileSync(`${rssPath}/rss.xml`, rssContent);
            console.log(clc.info(`${lang}/rss.xml file successfully created`));
        }
        return postsMetadata;
    }
};


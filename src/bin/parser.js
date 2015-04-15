import path from 'path';
import fs from 'fs';
import nunjucks from 'nunjucks';
import permalinks from 'permalinks';
import MkMeta from 'marked-metadata';
import mkdirp from 'mkdirp';
import { ncp } from 'ncp';
import { sync as rimrafSync } from 'rimraf';
import stylus from 'stylus';
import less from 'less';
import { rootdir, postspath, pagespath } from './config';
import { cliColor, getConfig } from './helpers';
import Theme from './theme';

const clc = cliColor();
const rMarkdownExt = /\.(?:md|markdown)$/;

const Helper = {

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

    normalizeMetaData: function(data) {
        data.title = data.title.replace(/\"/g, '');
        return data;
    },

    normalizeContent: function(data) {
        return data;
    }
};

export default class Harmonic {

    constructor(sitePath, { quiet = true } = {}) {
        this.sitePath = path.resolve(sitePath);
        this.quiet = !!quiet;

        const config = getConfig(this.sitePath);
        this.theme = new Theme(config.theme, this.sitePath);

        if (fs.existsSync(path.join(this.theme.themePath, 'config.json'))) {
            Object.assign(config, JSON.parse(this.theme.getFileContents('config.json')));
        }

        this.config = config;
        this.nunjucksEnv = nunjucks.configure(this.theme.themePath, { watch: false });
    }

    start() {
        console.log(clc.info('starting the parser'));
        return Promise.resolve();
    }

    clean() {
        console.log(clc.warn('Cleaning up...'));
        rimrafSync(path.join(this.sitePath, 'public'));
    }

    createPublicFolder() {
        let publicDirPath = path.join(this.sitePath, 'public');
        if (!fs.existsSync(publicDirPath)) {
            fs.mkdirSync(publicDirPath);
            console.log(clc.info('Successfully generated public folder'));
        }
    }

    async compileCSS() {
        const currentCSSCompiler = this.config.preprocessor;
        if (!currentCSSCompiler) return;

        const compiler = {

            less: () => {
                return new Promise((resolve, reject) => {
                    const curTemplate = this.theme.themePath;
                    const lessDir = `${curTemplate}/resources/_less`;
                    const cssDir = `${curTemplate}/resources/css`;
                    const verifyDirectory = (dir) => {
                        if (!fs.existsSync(dir)) {
                            fs.mkdirSync(dir);
                        }
                    };

                    fs.readFile(`${lessDir}/index.less`, (error, data) => {

                        const dataString = data.toString();
                        const options = {
                            paths: [lessDir],
                            outputDir: cssDir,
                            optimization: 1,
                            filename: 'main.less',
                            compress: true,
                            yuicompress: true
                        };

                        options.outputfile = `${options.filename.split('.less')[0]}.css`;
                        options.outputDir = path.resolve(this.sitePath, options.outputDir) + '/';
                        verifyDirectory(options.outputDir);

                        const parser = new less.Parser(options);
                        parser.parse(dataString, (error, cssTree) => {

                            if (error) {
                                less.writeError(error, options);
                                reject(error);
                                return;
                            }

                            const cssString = cssTree.toCSS({
                                compress: options.compress,
                                yuicompress: options.yuicompress
                            });

                            const optionFile = options.outputDir + options.outputfile;

                            fs.writeFileSync(optionFile, cssString, 'utf8');
                            console.log(
                                clc.info('Successfully generated CSS with LESS preprocessor')
                            );
                            resolve();
                        });
                    });
                });
            },

            stylus: () => {
                return new Promise((resolve, reject) => {
                    const curTemplate = this.theme.themePath;
                    const stylDir = `${curTemplate}/resources/_stylus`;
                    const cssDir = `${curTemplate}/resources/css`;
                    const code = fs.readFileSync(`${stylDir}/index.styl`, 'utf8');

                    stylus(code)
                        .set('paths', [stylDir, `${stylDir}/engine`, `${stylDir}/partials`])
                        .render((err, css) => {
                            if (err) {
                                reject(err);
                                return;
                            }

                            fs.writeFileSync(`${cssDir}/main.css`, css);
                            console.log(
                                clc.info('Successfully generated CSS with Stylus preprocessor')
                            );
                            resolve();
                        });
                });
            }
        };

        if (!compiler.hasOwnProperty(currentCSSCompiler)) {
            throw new Error(`Unsupported CSS preprocessor: ${currentCSSCompiler}`);
        }

        await compiler[currentCSSCompiler]();
    }

    compileJS(postsMetadata, pagesMetadata) {
        const harmonicClient = fs.readFileSync(`${rootdir}/bin/client/harmonic-client.js`)
            .toString()
            .replace(/__HARMONIC\.POSTS__/g, JSON.stringify(Helper.sortPosts(postsMetadata)))
            .replace(/__HARMONIC\.PAGES__/g, JSON.stringify(pagesMetadata))
            .replace(/__HARMONIC\.CONFIG__/g, JSON.stringify(this.config));

        fs.writeFileSync(path.join(this.sitePath, 'public/harmonic.js'), harmonicClient);
    }

    generateTagsPages(postsMetadata) {
        var postsByTag = {},
            nunjucksEnv = this.nunjucksEnv,
            tagTemplate = this.theme.getFileContents('index.html'),
            tagTemplateNJ = nunjucks.compile(tagTemplate, nunjucksEnv),
            tagPath = null,
            lang, i, tags, y, tag, tagContent,
            config = this.config;

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
                    posts: postsByTag[i].filter((post) => post.lang === lang),
                    config: config,
                    category: i
                });

                // If is the default language, generate in the root path
                if (config.i18n.default === lang) {
                    tagPath = path.join(this.sitePath, 'public/categories', i);
                } else {
                    tagPath = path.join(this.sitePath, 'public/categories', lang, i);
                }

                mkdirp.sync(tagPath);
                fs.writeFileSync(path.join(tagPath, 'index.html'), tagContent);
                console.log(
                    clc.info(`Successfully generated tag[${i}] archive html file`)
                );
            }
        }
    }

    generateIndex(postsMetadata, pagesMetadata) {
        var lang,
            _posts = null,
            nunjucksEnv = this.nunjucksEnv,
            indexTemplate = this.theme.getFileContents('index.html'),
            indexTemplateNJ = nunjucks.compile(indexTemplate, nunjucksEnv),
            indexContent = '',
            indexPath = null,
            config = this.config;

        for (lang in postsMetadata) {
            postsMetadata[lang].sort(Helper.sort);

            _posts = postsMetadata[lang].slice(0, config.index_posts || 10);

            indexContent = indexTemplateNJ.render({
                posts: _posts,
                config: config,
                pages: pagesMetadata
            });

            if (config.i18n.default === lang) {
                indexPath = path.join(this.sitePath, 'public');
            } else {
                indexPath = path.join(this.sitePath, 'public', lang);
            }
            mkdirp.sync(indexPath);
            fs.writeFileSync(path.join(indexPath, 'index.html'), indexContent);
            console.log(clc.info(`${lang}/index file successfully created`));
        }
    }

    async copyResources() {
        await new Promise((resolve, reject) => {
            const curTemplate = this.theme.themePath;
            ncp(path.join(curTemplate, 'resources'), path.join(this.sitePath, 'public'), (err) => {
                if (err) {
                    throw new Error(`Harmonic failed to copy the theme's resources.`);
                }
                resolve();
            });
        });

        console.log(clc.info('Resources copied'));
    }

    async generatePosts(files) {
        var langs = Object.keys(files),
            config = this.config,
            posts = {},
            currentDate = new Date(),
            nunjucksEnv = this.nunjucksEnv,
            postsTemplate = this.theme.getFileContents('post.html'),
            postsTemplateNJ = nunjucks.compile(postsTemplate, nunjucksEnv),
            tokens = [
                config.header_tokens ? config.header_tokens[0] : '<!--',
                config.header_tokens ? config.header_tokens[1] : '-->'
            ],
            writePromises = [];

        langs.forEach((lang) => {
            files[lang].forEach((file) => {
                var metadata, post, postCropped, filename, checkDate, postPath, categories,
                    _post, postHTMLFile, postDate, month, year, options,
                    md = new MkMeta(path.join(this.sitePath, postspath, lang, file));

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
                        config: config
                    })
                    .replace(/<!--[\s\S]*?-->/g, '');

                if (metadata.published && metadata.published === 'false') {
                    return;
                }

                if (metadata.date && metadata.date > currentDate) {
                    console.log(clc.info(`Skipping future post ${metadata.filename}`));
                    return;
                }

                writePromises.push(new Promise((resolve, reject) => {
                    mkdirp(path.join(this.sitePath, 'public', postPath), (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        // write post html file
                        fs.writeFile(path.join(this.sitePath, 'public', postPath, 'index.html'),
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
        await* writePromises;
        return posts;
    }

    async generatePages(files) {
        const langs = Object.keys(files);
        const config = this.config;
        const tokens = [
            config.header_tokens ? config.header_tokens[0] : '<!--',
            config.header_tokens ? config.header_tokens[1] : '-->'
        ];
        const writePromises = [];
        const pages = [];

        langs.forEach((lang) => {
            files[lang].forEach((file) => {
                var metadata, pagePermalink, _page, pageHTMLFile,
                    pagePath = path.join(this.sitePath, pagespath, lang, file),
                    pageTpl = this.theme.getFileContents('page.html'),
                    pageTplNJ = nunjucks.compile(pageTpl, this.nunjucksEnv),
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

                pageHTMLFile = pageTplNJ.render({
                    page: _page,
                    config: config
                });

                // Removing header metadata
                pageHTMLFile = pageHTMLFile.replace(/<!--[\s\S]*?-->/g, '');

                metadata.content = pageHTMLFile;
                metadata.file = postspath + file; // TODO check whether this needs sitePath
                metadata.filename = filename;
                metadata.link = `/${filename}.html`;
                metadata.date = new Date(metadata.date);
                pageSrc = path.join(this.sitePath, 'public', pagePermalink, 'index.html');

                pages.push(metadata);

                writePromises.push(new Promise((resolve, reject) => {
                    mkdirp(path.join(this.sitePath, 'public', pagePermalink), (err) => {
                        if (err) {
                            reject(err);
                            return;
                        }
                        // write page html file
                        fs.writeFile(pageSrc, pageHTMLFile, (err) => {
                            if (err) {
                                reject(err);
                                return;
                            }
                            console.log(
                                clc.info(`Successfully generated page ${pagePermalink}`)
                            );
                            resolve();
                        });
                    });
                }));
            });
        });
        await* writePromises;
        return pages;
    }

    getPostFiles() {
        const files = {};

        for (const lang of this.config.i18n.languages) {
            files[lang] = fs.readdirSync(path.join(this.sitePath, postspath, lang))
                .filter((p) => rMarkdownExt.test(p));
        }

        return files;
    }

    getPageFiles() {
        const files = {};

        for (const lang of this.config.i18n.languages) {
            const langPath = path.join(this.sitePath, pagespath, lang);
            if (!fs.existsSync(langPath)) {
                fs.mkdirSync(langPath);
            } else {
                files[lang] = fs.readdirSync(langPath).filter((p) => rMarkdownExt.test(p));
            }
        }

        return files;
    }

    generateRSS(postsMetadata, pagesMetadata) {
        var _posts = null,
            nunjucksEnv = this.nunjucksEnv,
            rssTemplate = fs.readFileSync(`${__dirname}/resources/rss.xml`),
            rssTemplateNJ = nunjucks.compile(rssTemplate.toString(), nunjucksEnv),
            rssContent = '',
            rssPath = null,
            rssLink = '',
            rssAuthor = '',
            config = this.config,
            lang;

        for (lang in postsMetadata) {
            postsMetadata[lang].sort(Helper.sort);
            _posts = postsMetadata[lang].slice(0, config.index_posts || 10);

            if (config.author_email) {
                rssAuthor = `${config.author_email} ( ${config.author} )`;
            } else {
                rssAuthor = config.author;
            }

            if (config.i18n.default === lang) {
                rssPath = path.join(this.sitePath, 'public');
                rssLink = `${config.domain}/rss.xml`;
            } else {
                rssPath = path.join(this.sitePath, 'public', lang);
                rssLink = `${config.domain}/${lang}/rss.xml`;
            }

            rssContent = rssTemplateNJ.render({
                rss: {
                    date: new Date().toUTCString(),
                    link: rssLink,
                    author: rssAuthor,
                    lang: lang
                },
                posts: _posts,
                config: config,
                pages: pagesMetadata
            });

            mkdirp.sync(rssPath);
            fs.writeFileSync(`${rssPath}/rss.xml`, rssContent);
            console.log(clc.info(`${lang}/rss.xml file successfully created`));
        }
    }
}


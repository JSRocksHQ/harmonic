import path from 'path';
import fs from 'fs';
import { promisify, promisifyAll, fromNode as promiseFromNode } from 'bluebird';
import nunjucks from 'nunjucks';
import permalinks from 'permalinks';
import MkMeta from 'marked-metadata';
import mkdirp from 'mkdirp';
import { ncp } from 'ncp';
import rimraf from 'rimraf';
import stylus from 'stylus';
import less from 'less';
import { rootdir, postspath, pagespath } from './config';
import { cliColor, getConfig } from './helpers';
import Theme from './theme';
promisifyAll(fs);
const mkdirpAsync = promisify(mkdirp);
const ncpAsync = promisify(ncp);
const rimrafAsync = promisify(rimraf);

const clc = cliColor();
const rMarkdownExt = /\.(?:md|markdown)$/;

const Helper = {

    sort(a, b) {
        return new Date(b.date) - new Date(a.date);
    },

    sortPosts: function(posts) {
        Object.values(posts).forEach((postsArray) => postsArray.sort(Helper.sort));
        return posts;
    },

    normalizeMetaData(data) {
        data.title = data.title.replace(/\"/g, '');
        return data;
    },

    normalizeContent(data) {
        return data;
    }
};

export default class Harmonic {
    /*eslint-disable camelcase*/

    constructor(sitePath, { quiet = true } = {}) {
        this.sitePath = path.resolve(sitePath);
        this.quiet = !!quiet;

        const config = Object.assign({
            index_posts: 10
        }, getConfig(this.sitePath));
        this.theme = new Theme(config.theme, this.sitePath);

        if (fs.existsSync(path.join(this.theme.themePath, 'config.json'))) {
            Object.assign(config, JSON.parse(this.theme.getFileContents('config.json')));
        }

        this.config = config;
        this.nunjucksEnv = nunjucks.configure(this.theme.themePath, { watch: false });
    }

    async clean() {
        console.log(clc.warn('Cleaning up...'));
        await rimrafAsync(path.join(this.sitePath, 'public'), { maxBusyTries: 20 });
    }

    async compileCSS() {
        const currentCSSCompiler = this.config.preprocessor;
        if (!currentCSSCompiler) {
            return;
        }

        const compiler = {

            less: async () => {
                const lessIndexPath = path.join(this.theme.themePath, 'resources/_less/index.less');
                const cssDir = path.join(this.sitePath, 'public/css');

                const lessInput = await fs.readFileAsync(lessIndexPath, { encoding: 'utf8' });
                const { css } = await less.render(lessInput, { filename: lessIndexPath });

                await mkdirpAsync(cssDir);
                await fs.writeFileAsync(path.join(cssDir, 'main.css'), css);

                console.log(clc.info('Successfully generated CSS with LESS preprocessor'));
            },

            stylus: async () => {
                const stylDir = path.join(this.theme.themePath, 'resources/_stylus');
                const stylIndexPath = path.join(stylDir, 'index.styl');
                const cssDir = path.join(this.sitePath, 'public/css');

                const stylInput = await fs.readFileAsync(stylIndexPath, { encoding: 'utf8' });
                const css = await promiseFromNode((cb) => {
                    stylus(stylInput)
                        .set('filename', stylIndexPath)
                        .set('paths', [path.join(stylDir, 'engine'), path.join(stylDir, 'partials')])
                        .render(cb);
                });

                await mkdirpAsync(cssDir);
                await fs.writeFileAsync(path.join(cssDir, 'main.css'), css);

                console.log(clc.info('Successfully generated CSS with Stylus preprocessor'));
            }
        };

        if (!compiler.hasOwnProperty(currentCSSCompiler)) {
            throw new Error(`Unsupported CSS preprocessor: ${currentCSSCompiler}`);
        }

        await compiler[currentCSSCompiler]();
    }

    async compileJS(postsMetadata, pagesMetadata) {
        const harmonicClient = (await fs.readFileAsync(`${rootdir}/bin/client/harmonic-client.js`, { encoding: 'utf8' }))
            .replace(/__HARMONIC\.POSTS__/g, JSON.stringify(postsMetadata))
            .replace(/__HARMONIC\.PAGES__/g, JSON.stringify(pagesMetadata))
            .replace(/__HARMONIC\.CONFIG__/g, JSON.stringify(this.config));

        await fs.writeFileAsync(path.join(this.sitePath, 'public/harmonic.js'), harmonicClient);
    }

    async generateTagsPages(postsMetadata) {
        const tagTemplateNJ = nunjucks.compile(this.theme.getFileContents('index.html'), this.nunjucksEnv);
        const config = this.config;

        await* [].concat(...Object.entries(postsMetadata).map(([lang, langPosts]) => {
            const postsByTag = {};
            langPosts.forEach((post) => {
                post.categories.forEach((category) => {
                    // TODO replace with kebabCase?
                    const tag = category.toLowerCase().trim().split(' ').join('-');
                    postsByTag[tag] = postsByTag[tag] || [];
                    postsByTag[tag].push(post);
                });
            });

            return Object.entries(postsByTag).map(async ([tag, tagPosts]) => {
                const tagContent = tagTemplateNJ.render({
                    posts: tagPosts,
                    config,
                    category: tag
                });

                const tagPath = path.join(this.sitePath, 'public/categories', ...(config.i18n.default === lang ? [] : [lang]), tag);
                await mkdirpAsync(tagPath);
                await fs.writeFileAsync(path.join(tagPath, 'index.html'), tagContent);
                console.log(clc.info(`Successfully generated tag[${tag}] archive html file`));
            });
        }));
    }

    async generateIndex(postsMetadata, pagesMetadata) {
        const indexTemplateNJ = nunjucks.compile(this.theme.getFileContents('index.html'), this.nunjucksEnv);
        const config = this.config;

        await* Object.entries(postsMetadata).map(async ([lang, langPosts]) => {
            const posts = langPosts.slice(0, config.index_posts);

            const indexContent = indexTemplateNJ.render({
                posts,
                config,
                pages: pagesMetadata
            });

            const indexPath = path.join(this.sitePath, 'public', ...(config.i18n.default === lang ? [] : [lang]));
            await mkdirpAsync(indexPath);
            await fs.writeFileAsync(path.join(indexPath, 'index.html'), indexContent);
            console.log(clc.info(`${lang}/index file successfully created`));
        });
    }

    async copyThemeResources() {
        await ncpAsync(path.join(this.theme.themePath, 'resources'), path.join(this.sitePath, 'public'), { stopOnErr: true });
        console.log(clc.info('Theme resources copied'));
    }

    async copyUserResources() {
        const userResourcesPath = path.join(this.sitePath, 'resources');
        await mkdirpAsync(userResourcesPath);
        await ncpAsync(userResourcesPath, path.join(this.sitePath, 'public'), { stopOnErr: true });
        console.log(clc.info(`User resources copied`));
    }

    async generatePosts(files) {
        const langs = Object.keys(files);
        const config = this.config;
        const posts = {};
        const currentDate = new Date();
        const nunjucksEnv = this.nunjucksEnv;
        const postsTemplate = this.theme.getFileContents('post.html');
        const postsTemplateNJ = nunjucks.compile(postsTemplate, nunjucksEnv);
        const tokens = [
            config.header_tokens ? config.header_tokens[0] : '<!--',
            config.header_tokens ? config.header_tokens[1] : '-->'
        ];

        await* [].concat(...langs.map((lang) => files[lang].map(async (file) => {
            // TODO this can most likely do with some refactoring and code style adjustments
            let metadata, post, postCropped, filename, checkDate, postPath, categories,
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
            if (config.i18n.default === lang && config.posts_permalink.match(':language')) {
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

            await mkdirpAsync(path.join(this.sitePath, 'public', postPath));

            // write post html file
            await fs.writeFileAsync(path.join(this.sitePath, 'public', postPath, 'index.html'), postHTMLFile);
            console.log(clc.info('Successfully generated post ' + postPath));

            posts[lang] = posts[lang] || [];
            posts[lang].push(metadata);
        })));
        return Helper.sortPosts(posts);
    }

    async generatePages(files) {
        const langs = Object.keys(files);
        const config = this.config;
        const tokens = [
            config.header_tokens ? config.header_tokens[0] : '<!--',
            config.header_tokens ? config.header_tokens[1] : '-->'
        ];
        const pages = [];

        await* [].concat(...langs.map((lang) => files[lang].map(async (file) => {
            // TODO this can most likely do with some refactoring and code style adjustments
            let metadata, pagePermalink, _page, pageHTMLFile, options,
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

            options = {
                replacements: [{
                    pattern: ':title',
                    replacement: filename
                },
                {
                    pattern: ':language',
                    replacement: lang
                }]
            };
            if (config.i18n.default === lang) {
                options.structure = config.pages_permalink.split(':language/')[1];
                pagePermalink = permalinks(options);
            } else {
                options.structure = config.pages_permalink;
                pagePermalink = permalinks(options);
                console.log(pagePermalink, options);
            }

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
            metadata.lang = lang;
            metadata.date = new Date(metadata.date);
            pageSrc = path.join(this.sitePath, 'public', pagePermalink, 'index.html');

            pages.push(metadata);

            await mkdirpAsync(path.join(this.sitePath, 'public', pagePermalink));

            // write page html file
            await fs.writeFileAsync(pageSrc, pageHTMLFile);
            console.log(clc.info(`Successfully generated page ${pagePermalink}`));
        })));
        return pages;
    }

    async getPostFiles() {
        const files = {};

        await* this.config.i18n.languages.map(async (lang) => {
            files[lang] = (await fs.readdirAsync(path.join(this.sitePath, postspath, lang)))
                .filter((p) => rMarkdownExt.test(p));
        });

        return files;
    }

    async getPageFiles() {
        const files = {};

        await* this.config.i18n.languages.map(async (lang) => {
            const langPath = path.join(this.sitePath, pagespath, lang);
            await mkdirpAsync(langPath);
            files[lang] = (await fs.readdirAsync(langPath)).filter((p) => rMarkdownExt.test(p));
        });

        return files;
    }

    async generateRSS(postsMetadata, pagesMetadata) {
        const rssTemplate = await fs.readFileAsync(path.join(__dirname, 'resources/rss.xml'), { encoding: 'utf8' });
        const rssTemplateNJ = nunjucks.compile(rssTemplate, this.nunjucksEnv);
        const config = this.config;
        const rssAuthor = config.author_email ? `${config.author_email} ( ${config.author} )` : config.author;

        await* Object.entries(postsMetadata).map(async ([lang, langPosts]) => {
            const posts = langPosts.slice(0, config.index_posts);
            const isDefaultLang = config.i18n.default === lang;
            const rssPath = path.join(this.sitePath, 'public', ...(isDefaultLang ? [] : [lang]));
            const rssLink = `${config.domain}${isDefaultLang ? '' : '/' + lang}/rss.xml`;

            const rssContent = rssTemplateNJ.render({
                rss: {
                    date: new Date().toUTCString(),
                    link: rssLink,
                    author: rssAuthor,
                    lang: lang
                },
                posts,
                config,
                pages: pagesMetadata
            });

            await mkdirpAsync(rssPath);
            await fs.writeFileAsync(`${rssPath}/rss.xml`, rssContent);
            console.log(clc.info(`${lang}/rss.xml file successfully created`));
        });
    }
}

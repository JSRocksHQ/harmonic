import fs from 'fs';
import path from 'path';
import { promisify, promisifyAll, fromNode as promiseFromNode } from 'bluebird';
import chokidar from 'chokidar';
import browserSync from 'browser-sync';
import co from 'co';
import prompt from 'co-prompt';
import mkdirp from 'mkdirp';
import { ncp } from 'ncp';
import open from 'open';
import { load as npmLoad } from 'npm';
import dd from 'dedent';
import { rootdir, postspath, pagespath } from '../config';
import { cliColor, getConfig, titleToFilename, findHarmonicRoot, displayNonInitializedFolderErrorMessage, MissingFileError } from '../helpers';
import { build } from '../core';
promisifyAll(fs);
const npmLoadAsync = promisify(npmLoad);
const mkdirpAsync = promisify(mkdirp);
const ncpAsync = promisify(ncp);
const clc = cliColor();

export { init, config, newFile, run, openFile };

// Open a file using browser, text-editor
function openFile(type, sitePath, file) {
    if (type === 'file') {
        open(path.resolve(sitePath, file));
    } else {
        // TODO unless we add a --no-watch flag, we can just delegate this to browser-sync
        open(file);
    }
}

async function init(sitePath) {
    const skeletonPath = path.join(rootdir, 'bin/skeleton');

    await mkdirpAsync(sitePath);
    await ncpAsync(skeletonPath, sitePath, { stopOnErr: true });
    console.log(clc.message('Harmonic skeleton started at: ' + path.resolve(sitePath)));

    await config(sitePath, true);

    console.log(clc.info('\nInstalling dependencies...'));
    const npm = await npmLoadAsync();
    try {
        await promisify(npm.commands.install)(sitePath, []);
    } catch (e) {
        console.error(dd
            `Command ${clc.error('npm install')} failed.
             Make sure you are connected to the internet and execute the command above in your Harmonic skeleton directory.`
        );
    }

    console.log('\n' + clc.info(dd
        `Your Harmonic website skeleton was successfully created!
         Now, browse the project directory and have fun.`
    ));
}

function config(passedPath, _skipFindRoot = false) {
    const sitePath = _skipFindRoot ? passedPath : findHarmonicRoot(passedPath);

    if (!sitePath) {
        displayNonInitializedFolderErrorMessage();
        throw new MissingFileError();
    }

    const manifest = path.join(sitePath, 'harmonic.json');

    return new Promise((fulfill, reject) => {
        co(function*() {
            console.log(clc.message(
                'This guide will help you to create your Harmonic configuration file\n' +
                'Just hit enter if you are ok with the default values.\n\n'
            ));

            const templateObj = {
                name: 'Awesome website',
                title: 'My awesome static website',
                domain: 'http://awesome.com',
                subtitle: 'Powered by Harmonic',
                author: 'Jaydson',
                description: 'This is the description',
                bio: 'Thats me',
                theme: 'harmonic-theme-default',
                preprocessor: 'stylus',
                posts_permalink: ':language/:year/:month/:title',
                pages_permalink: 'pages/:title',
                header_tokens: ['<!--', '-->'],
                index_posts: 10,
                i18n: {
                    default: 'en',
                    languages: ['en', 'pt-br']
                }
            };

            function _p(message) {
                return prompt(clc.message(message));
            }

            const config = {
                name: (yield _p('Site name: (' + templateObj.name + ') ')) ||
                    templateObj.name,
                title: (yield _p('Title: (' + templateObj.title + ') ')) ||
                    templateObj.title,
                subtitle: (yield _p('Subtitle: (' + templateObj.subtitle + ') ')) ||
                    templateObj.subtitle,
                description: (yield _p('Description: (' + templateObj.description + ') ')) ||
                    templateObj.description,
                author: (yield _p('Author: (' + templateObj.author + ') ')) ||
                    templateObj.author,
                bio: (yield _p('Author bio: (' + templateObj.bio + ') ')) ||
                    templateObj.bio,
                theme: (yield _p('Theme: (' + templateObj.theme + ') ')) ||
                    templateObj.theme,
                preprocessor: (yield _p('Preprocessor: (' + templateObj.preprocessor + ') ')) ||
                    templateObj.preprocessor
            };

            process.stdin.pause();

            // create the configuration file
            fs.writeFile(manifest, JSON.stringify(Object.assign({}, templateObj, config), null, 4), (err) => {
                if (err) {
                    reject(err);
                    return;
                }
                fulfill();
            });
        })();
    });
}

/**
 * @param {string} type - The new file's type. Can be either 'post' or 'page'.
 * @param {string} title - The new file's title.
 */
function newFile(passedPath, type, title, autoOpen) {
    const sitePath = findHarmonicRoot(passedPath);

    if (!sitePath) {
        displayNonInitializedFolderErrorMessage();
        throw new MissingFileError();
    }

    var langs = getConfig(sitePath).i18n.languages,
        template = '<!--\n' +
            'layout: ' + type + '\n' +
            'title: ' + title + '\n' +
            'date: ' + new Date().toJSON() + '\n' +
            'comments: true\n' +
            'published: true\n' +
            'keywords:\n' +
            'description:\n' +
            'categories:\n' +
            '-->\n' +
            '# ' + title,
        filedir = path.join(sitePath, type === 'post' ? postspath : pagespath),
        filename = titleToFilename(title);

    langs.forEach((lang) => {
        const fileLangDir = path.join(filedir, lang);
        const fileW = path.join(fileLangDir, filename);
        mkdirp.sync(fileLangDir);
        fs.writeFileSync(fileW, template);
        if (autoOpen) {
            openFile('text', sitePath, fileW);
        }
    });

    console.log(clc.info(
        type[0].toUpperCase() + type.slice(1) +
        ' "' + title + '" was successefuly created, check your /src/' + type + 's folder'
    ));
}

async function run(passedPath, port, autoOpen) {
    const sitePath = findHarmonicRoot(passedPath);

    if (!sitePath) {
        displayNonInitializedFolderErrorMessage();
        throw new MissingFileError();
    }

    let isBuilding = false;
    let pendingBuild = false;
    const bs = browserSync.create();

    await promiseFromNode((cb) => {
        bs.init({
            server: {
                baseDir: path.join(sitePath, 'public'),
                middleware: [
                    (req, res, next) => {
                        if (isBuilding) {
                            // TODO deliver browser-sync snippet when requesting a html file
                            res.writeHead(503);
                            res.end();
                            return;
                        }
                        next();
                    }
                ]
            },
            port,
            open: autoOpen
        }, cb);
    });

    console.log(clc.info(`Harmonic site is running.`));

    async function buildSite() {
        try {
            await build(sitePath);
            if (!pendingBuild) {
                bs.reload();
            }
        } catch (err) {
            console.error(clc.error('Build error:'));
            console.error(err.stack || err.toString());
        }

        if (pendingBuild) {
            pendingBuild = false;
            await buildSite();
        }
    }

    async function doBuildSite() {
        // TODO watcher.unwatch and watcher.add when selected theme changes in harmonic.json
        if (isBuilding) {
            pendingBuild = true;
            return;
        }

        isBuilding = true;
        await buildSite();
        isBuilding = false;
    }

    const watcher = chokidar.watch(['src', 'harmonic.json', path.join('node_modules', getConfig(sitePath).theme)], {
        // interval: 1000,
        // atomic: false,
        ignoreInitial: true,
        // ignorePermissionErrors: true,
        cwd: sitePath
    })
        .on('add', doBuildSite)
        // .on('addDir', doBuildSite)
        .on('change', doBuildSite)
        .on('unlink', doBuildSite)
        // .on('unlinkDir', doBuildSite)
        .on('error', (error) => console.error('Error occurred', error));

    await promiseFromNode((cb) => watcher.on('ready', cb));
    console.log(clc.info('Watching Harmonic project for changes...'));

    return { watcher };
}

var localconfig = require('../config'),
    helpers = require('../helpers'),
    fs = require('fs'),
    path = require('path'),
    staticServer = require('node-static'),
    co = require('co'),
    prompt = require('co-prompt'),
    _ = require('underscore'),
    ncp = require('ncp').ncp;

// Temporary
// jscs:disable requireCamelCaseOrUpperCaseIdentifiers

module.exports = {

    init: function(p) {
        var sitePath = p,
            skeletonPath = path.normalize(localconfig.rootdir + '/bin/skeleton'),
            copySkeleton = function() {
                return new Promise(function(resolve, reject) {
                    ncp(skeletonPath, sitePath, function(err) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        resolve('Harmonic skeleton started at: ./' + sitePath);
                    });
                });
            },
            clc = helpers.cliColor();

        fs.exists(sitePath, (exists) => {
            if (!exists) {
                fs.mkdirSync(sitePath);
            }
            copySkeleton().then((msg) => {
                console.log(clc.message(msg));
                this.config(sitePath);
            });
        });
    },

    config: function(p) {
        var clc = helpers.cliColor(),
            manifest = p ? p + '/harmonic.json' : './harmonic.json';

        co(function*() {
            console.log(clc.message(
                'This guide will help you to create your Harmonic configuration file\n' +
                'Just hit enter if you are ok with the default values.\n\n'
            ));

            var config,
                templateObj = {
                    name: 'Awesome website',
                    title: 'My awesome static website',
                    domain: 'http://awesome.com',
                    subtitle: 'Powered by Harmonic',
                    author: 'Jaydson',
                    description: 'This is the description',
                    bio: 'Thats me',
                    template: 'default',
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

            config = {
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
                template: (yield _p('Template: (' + templateObj.template + ') ')) ||
                    templateObj.template,
                preprocessor: (yield _p('Preprocessor: (' + templateObj.preprocessor + ') ')) ||
                    templateObj.preprocessor
            };

            // create the configuration file
            fs.writeFile(manifest, JSON.stringify(_.extend(templateObj, config), null, 4),
                function(err) {
                    if (err) {
                        throw err;
                    }
                    console.log(clc.message(
                        '\nYour Harmonic website skeleton was successfully created!' +
                        '\nNow, browse the project dir and have fun.'
                    ));
                }
            );

            process.stdin.pause();

        })();
    },

    /**
     * @param {string} type - The new file's type. Can be either 'post' or 'page'.
     * @param {string} title - The new file's title.
     */
    newFile: function(type, title) {
        var clc = helpers.cliColor(),
            langs = helpers.getConfig().i18n.languages,
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
            path = localconfig[type + 'spath'],
            filename = helpers.titleToFilename(title);

        langs.forEach(function(lang) {
            if (!fs.existsSync(path + lang)) {
                fs.mkdirSync(path + lang);
            }
            fs.writeFileSync(path + lang + '/' + filename, template);
        });

        console.log(clc.info(
            type[0].toUpperCase() + type.slice(1) +
            ' "' + title + '" was successefuly created, check your /src/' + type + 's folder'
        ));
    },

    run: function(port) {
        var clc = helpers.cliColor(),
            file = new staticServer.Server(path.join(process.cwd(), 'public'));
        console.log(clc.info('Harmonic site is running on http://localhost:' + port));
        require('http').createServer(function(request, response) {
            request.addListener('end', function() {
                file.serve(request, response, function(err) {
                    if (err) {
                        console.log(clc.error(
                            'Error serving ' + request.url + ' - ' + err.message
                        ));
                        response.writeHead(err.status, err.headers);
                        response.end();
                    }
                });
            }).resume();
        }).listen(port);
    }
};

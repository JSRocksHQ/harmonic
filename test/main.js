/* jshint mocha: true */
var helpers = require('../bin/helpers.js'),
    fs = require('fs'),
    nodefs = require('node-fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    spawn = require('child_process').spawn;
require('should');

describe('CLI', function() {
    var testDir = path.join(__dirname, 'cli'),
        harmonicBin = '../../harmonic.js';

    before(function() {
        rimraf.sync(testDir);
        nodefs.mkdirSync(testDir, 0777, true);
        process.chdir(testDir);
    });

    after(function() {
        // need to chdir out of testDir before removing it (at least in Windows)
        process.chdir('..');
        rimraf.sync(testDir);
    });

    it('should init a new Harmonic site', function(done) {
        var harmonic = spawn('node', [harmonicBin, 'init']);
        harmonic.stdin.setEncoding('utf8');
        harmonic.stdout.setEncoding('utf8');

        harmonic.stdout.on('data', function(data) {
            if (data.indexOf('successfully created') === -1) {
                harmonic.stdin.write('\n');
                return;
            }
            harmonic.stdin.end();
        });

        harmonic.on('close', function() {
            helpers.isHarmonicProject().should.be.true;
            done();
        });
    });

    it('should build the Harmonic site', function(done) {
        var harmonic = spawn('node', [harmonicBin, 'build']);
        harmonic.stdin.setEncoding('utf8');
        harmonic.stdout.setEncoding('utf8');

        harmonic.on('close', function() {
            fs.existsSync(path.join(testDir, 'public')).should.be.true;
            done();
        });
    });

    it('should create and build a new post', function(done) {
        var localconfig = require('../bin/config.js'),
            config = helpers.getConfig(),
            langs = config.i18n.languages,
            title = 'new_post test',
            fileName = helpers.titleToFilename(title),
            harmonic = spawn('node', [harmonicBin, 'new_post', title]);
        harmonic.stdin.setEncoding('utf8');
        harmonic.stdout.setEncoding('utf8');

        new Promise(function(resolve) {
            harmonic.on('close', function() {
                langs.forEach(function(lang) {
                    fs.readFileSync(path.join(localconfig.postspath, lang, fileName)).toString()
                        .should.containEql(title);
                });
                resolve();
            });
        }).then(function() {
            var harmonicBuild = spawn('node', [harmonicBin, 'build']);
            harmonicBuild.stdin.setEncoding('utf8');
            harmonicBuild.stdout.setEncoding('utf8');
            return new Promise(function(resolve) {
                harmonicBuild.on('close', function() {
                    var date = new Date(),
                        year = date.getFullYear(),
                        month = ('0' + (date.getMonth() + 1)).slice(-2),
                        slug = fileName.replace(/\.md$/, '');
                    langs.forEach(function(lang) {
                        var langSegment = lang === config.i18n.default ? '' : lang + '/';
                        fs.readFileSync('public/' + langSegment + year + '/' + month + '/' +
                            slug + '/index.html').toString().should.containEql(title);
                    });
                    resolve();
                });
            });
        }).then(done);
    });

    // write this test once #73 is resolved
    it('should create and build a new page');
});

describe('helpers', function() {
    it('should transform a post/page title into a filename', function() {
        helpers.titleToFilename('Hello World!').should.equal('hello-world.md');
    });
});

/* jshint mocha: true */
var helpers = require('../bin/helpers.js'),
    parser = new (require('../bin/parser.js'))(),
    fs = require('fs'),
    nodefs = require('node-fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    cprocess = require('child_process'),
    spawn = cprocess.spawn,
    _ = require('underscore'),
    harmonicBin = path.join(__dirname, '..', 'harmonic.js'),
    testDir = path.join(__dirname, 'site'),
    stdoutWrite = process.stdout.write;
require('should');

before(function() {
    rimraf.sync(testDir);
    // [BUG] https://github.com/jshint/jshint/issues/1944
    // Replace parseInt with octal literal once JSHint supports it
    nodefs.mkdirSync(testDir, parseInt(777, 8), true);
    process.chdir(testDir);
});

after(function() {
    // need to chdir out of testDir before removing it (at least in Windows)
    process.chdir(__dirname);
    rimraf.sync(testDir);
});

function disableStdout() {
    process.stdout.write = function() {};
}
function enableStdout() {
    process.stdout.write = stdoutWrite;
}

describe('CLI', function() {
    it('should display an error for unknown commands', function(done) {
        cprocess.exec('node "' + harmonicBin + '" foobarbaz', function(error, stdout, stderr) {
            error.code.should.equal(1);
            stderr.should.containEql('foobarbaz');
            done();
        });
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
                        // [BUG] https://github.com/jscs-dev/node-jscs/issues/735
                        // jscs:disable disallowSpaceBeforeBinaryOperators
                        slug = fileName.replace(/\.md$/, '');
                        // jscs:enable disallowSpaceBeforeBinaryOperators
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

    it('.isHarmonicProject() should return whether the CWD is a Harmonic site', function() {
        process.chdir(__dirname);
        disableStdout();
        var isHarmonicProject = helpers.isHarmonicProject();
        enableStdout();
        isHarmonicProject.should.be.false;
        process.chdir(testDir);
        helpers.isHarmonicProject().should.be.true;
    });

    it('.titleToFilename() should transform a post/page title into a filename', function() {
        helpers.titleToFilename('Hello World!').should.equal('hello-world.md');
    });
});

describe('parser', function() {

    it('.getConfig() should merge the template\'s config into the main config', function() {
        var config = helpers.getConfig(),
            templateConfigPath = 'src/templates/' + config.template + '/harmonic.json',
            templateConfig = { customData: 'test' },
            mergedConfig;

        fs.writeFileSync(templateConfigPath, JSON.stringify(templateConfig));
        mergedConfig = parser.getConfig();
        mergedConfig.should.containDeep(templateConfig);
        mergedConfig.should.eql(_.extend({}, config, templateConfig));
    });
});

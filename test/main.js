/* jshint mocha: true */
var fs = require('fs'),
    nodefs = require('node-fs'),
    path = require('path'),
    rimraf = require('rimraf'),
    spawn = require('child_process').spawn;
require('should');

describe('CLI', function() {
    var testDir = path.join(__dirname, 'cli'),
        harmonicCommand = '../../harmonic.js';

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

    it('should init and run a new Harmonic site', function(done) {
        new Promise(function(resolve) {
            var init = spawn('node', [harmonicCommand, 'init']);
            init.stdin.setEncoding('utf8');
            init.stdout.setEncoding('utf8');

            init.stdout.on('data', function(data) {
                if (data.indexOf('successfully created') === -1) {
                    init.stdin.write('\n');
                    return;
                }
                init.kill();
            });
            init.on('close', function() {
                resolve();
            });
        }).then(function() {
            return new Promise(function(resolve) {
                var run = spawn('node', [harmonicCommand, 'run']);
                run.stdin.setEncoding('utf8');
                run.stdout.setEncoding('utf8');

                run.stdout.on('data', function(data) {
                    console.log(data);
                    if (data.indexOf('http://') !== -1) {
                        // TODO FIXME kill() is not working
                        run.kill();
                        // run.kill('SIGTERM');
                        // run.kill('SIGHUP');
                        // run.kill('SIGINT');
                        // run.kill('SIGKILL');
                    }
                });
                run.on('close', function() {
                    resolve();
                });
            });
        }).then(function() {
            if (!fs.existsSync(path.join(testDir, 'public'))) {
                done(new Error('Failed to generate public dir.'));
                return;
            }
            done();
        });
    });
});

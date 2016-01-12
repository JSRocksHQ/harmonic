/* eslint-env mocha */

import { spawn, exec } from 'child_process';
import { join } from 'path';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import { sync as rimrafSync } from 'rimraf';
import { sync as mkdirpSync } from 'mkdirp';
import 'should';
import Harmonic from '../bin/parser';
import { isHarmonicProject, getConfig, titleToFilename } from '../bin/helpers';
import { postspath, pagespath } from '../bin/config';

const testDir = join(__dirname, 'site');
const harmonicBin = join(__dirname, '../../entry_points/harmonic');
const stdoutWrite = process.stdout.write;

before(() => {
    rimrafSync(testDir);
    mkdirpSync(testDir);
});

after(() => {
    rimrafSync(testDir);
});

function disableStdout() {
    process.stdout.write = () => {};
}
function enableStdout() {
    process.stdout.write = stdoutWrite;
}

describe('CLI', () => {
    it('should display an error for unknown commands', (done) => {
        exec('node "' + harmonicBin + '" foobarbaz', (error, stdout, stderr) => {
            error.code.should.equal(1);
            stderr.should.containEql('foobarbaz');
            done();
        });
    });

    it('should init a new Harmonic site', (done) => {
        const harmonic = spawn('node', [harmonicBin, 'init', testDir]);
        harmonic.stdin.setEncoding('utf8');
        harmonic.stdout.setEncoding('utf8');

        harmonic.stdout.on('data', (data) => {
            if (data.indexOf('successfully created') === -1) {
                harmonic.stdin.write('\n');
                return;
            }
            harmonic.stdin.end();
        });

        harmonic.on('close', () => {
            isHarmonicProject(testDir).should.be.true();
            done();
        });
    });

    it('should build the Harmonic site', (done) => {
        const harmonic = spawn('node', [harmonicBin, 'build', testDir]);
        harmonic.stdin.setEncoding('utf8');
        harmonic.stdout.setEncoding('utf8');

        harmonic.on('close', () => {
            existsSync(join(testDir, 'public')).should.be.true();
            done();
        });
    });

    it('should create and build a new post', async () => {
        const config = getConfig(testDir);
        const langs = config.i18n.languages;
        const title = 'new_post test';
        const fileName = titleToFilename(title);
        const harmonic = spawn('node', [harmonicBin, 'new_post', '--no-open', title, testDir]);
        harmonic.stdin.setEncoding('utf8');
        harmonic.stdout.setEncoding('utf8');

        await new Promise((resolve) => {
            harmonic.on('close', () => {
                for (const lang of langs) {
                    readFileSync(
                        join(testDir, postspath, lang, fileName)
                    ).toString().should.containEql(title);
                }
                resolve();
            });
        });

        const harmonicBuild = spawn('node', [harmonicBin, 'build', testDir]);
        harmonicBuild.stdin.setEncoding('utf8');
        harmonicBuild.stdout.setEncoding('utf8');
        await new Promise((resolve) => {
            harmonicBuild.on('close', () => {
                const date = new Date(),
                    year = String(date.getFullYear()),
                    month = ('0' + (date.getMonth() + 1)).slice(-2),
                    slug = fileName.replace(/\.md$/, '');
                for (const lang of langs) {
                    const langSegment = lang === config.i18n.default ? '.' : lang;
                    readFileSync(join(testDir, 'public', langSegment, year, month,
                        slug, 'index.html')).toString().should.containEql(title);
                }
                resolve();
            });
        });
    });

    it('should create and build a new page', async () => {
        const config = getConfig(testDir);
        const langs = config.i18n.languages;
        const title = 'new_page test';
        const fileName = titleToFilename(title);
        const harmonic = spawn('node', [harmonicBin, 'new_page', '--no-open', title, testDir]);
        harmonic.stdin.setEncoding('utf8');
        harmonic.stdout.setEncoding('utf8');

        await new Promise((resolve) => {
            harmonic.on('close', () => {
                for (const lang of langs) {
                    readFileSync(
                        join(testDir, pagespath, lang, fileName)
                    ).toString().should.containEql(title);
                }
                resolve();
            });
        });

        const harmonicBuild = spawn('node', [harmonicBin, 'build', testDir]);
        harmonicBuild.stdin.setEncoding('utf8');
        harmonicBuild.stdout.setEncoding('utf8');
        await new Promise((resolve) => {
            harmonicBuild.on('close', () => {
                const slug = fileName.replace(/\.md$/, '');
                for (const lang of langs) {
                    const langSegment = lang === config.i18n.default ? '.' : lang;
                    readFileSync(join(testDir, 'public', langSegment, 'pages',
                        slug, 'index.html')).toString().should.containEql(title);
                }
                resolve();
            });
        });
    });
});

describe('helpers', () => {
    it('.isHarmonicProject() should return whether the CWD is a Harmonic site', () => {
        disableStdout();
        const result = isHarmonicProject(__dirname);
        enableStdout();
        result.should.be.false();
        isHarmonicProject(testDir).should.be.true();
    });

    it('.titleToFilename() should transform a post/page title into a filename', () => {
        titleToFilename('Hello World!').should.equal('hello-world.md');
    });
});

describe('API', () => {
    it('should merge the theme\'s config into the main config', () => {
        const config = getConfig(testDir);
        const themeConfigPath = join(testDir, 'node_modules', config.theme, 'config.json');
        const templateConfig = { customData: 'test' };
        writeFileSync(themeConfigPath, JSON.stringify(templateConfig));

        const harmonic = new Harmonic(testDir);
        const mergedConfig = harmonic.config;

        mergedConfig.should.containDeep(templateConfig);
        mergedConfig.should.eql(Object.assign({}, config, templateConfig));
    });
});

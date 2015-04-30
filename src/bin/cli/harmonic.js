import program from 'commander';
import { version } from '../config';
import { cliColor } from '../helpers';
import logo from './logo';
import { init, config, newFile, run } from './util';
import { build } from '../core';
const clc = cliColor();

program
    .version(version);

program
    .command('init [path]')
    .description('Init your static website')
    .action((path = '.') => {
        console.log(logo);
        init(path);
    });

program
    .command('config [path]')
    .description('Config your static website')
    .action(async (path = '.') => {
        console.log(logo);
        await config(path);
        console.log(clc.info('\nharmonic.json successfully updated.'));
    });

program
    .command('build [path]')
    .description('Build your static website')
    .action((path = '.') => {
        build(path);
    });

program
    .command('new_post <title> [path]')
    .option('--no-open', 'Don\'t open the markdown file(s) in editor')
    .description('Create a new post')
    .action((title, path = '.', { open: autoOpen }) => {
        newFile(path, 'post', title, autoOpen);
    });

program
    .command('new_page <title> [path]')
    .option('--no-open', 'Don\'t open the markdown file(s) in editor')
    .description('Create a new page')
    .action((title, path = '.', { open: autoOpen }) => {
        newFile(path, 'page', title, autoOpen);
    });

program
    .command('run [port] [path]')
    .option('--no-open', 'Don\'t open a new browser window')
    .description('Run you static site locally. Port is optional')
    .action(async (port = 9356, path = '.', { open: autoOpen }) => {
        await build(path);
        run(path, port, autoOpen);
    });

program.on('*', (args) => {
    console.error('Unknown command: ' + clc.error(args[0]));
    process.exit(1);
});

program.parse(process.argv);

// Not enough arguments
if (!program.args.length) {
    console.log(logo);
    program.help();
}

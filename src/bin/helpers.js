import { readFileSync } from 'fs';
import { join } from 'path';
import clc from 'cli-color';

export { cliColor, isHarmonicProject, getConfig, titleToFilename };

// CLI color
function cliColor() {
    return {
        info: clc.green,
        error: clc.red,
        warn: clc.yellowBright,
        message: clc.yellow
    };
}

// Check if harmonic.json file exists
function isHarmonicProject(sitePath) {
    var clc = cliColor();

    try {
        getConfig(sitePath);
        return true;
    } catch (e) {
        console.log(
            clc.warn('It seems this is not an Harmonic project yet. \n') +
            clc.warn('Check your directory or run ') +
            clc.info.bgWhite.italic(' harmonic init ') +
            clc.warn(' to start a new Harmonic project.')
        );
        return false;
    }
}

function getConfig(sitePath) {
    return JSON.parse(readFileSync(join(sitePath, 'harmonic.json')).toString());
}

function titleToFilename(title) {
    return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase() + '.md';
}

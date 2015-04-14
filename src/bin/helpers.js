import { readFileSync } from 'fs';
import { join } from 'path';
import _cliColor from 'cli-color';

export { cliColor, isHarmonicProject, getConfig, titleToFilename };

// CLI color
function cliColor() {
    return {
        info: _cliColor.green,
        error: _cliColor.red,
        warn: _cliColor.yellowBright,
        message: _cliColor.yellow
    };
}

// Check if harmonic.json file exists
function isHarmonicProject(sitePath) {
    const clc = cliColor();

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

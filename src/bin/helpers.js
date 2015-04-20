import { readFileSync } from 'fs';
import { join, resolve } from 'path';
import _cliColor from 'cli-color';

export { cliColor, isHarmonicProject, getConfig, titleToFilename,
    findHarmonicRoot, displayNonInitializedFolderErrorMessage };

// CLI color
function cliColor() {
    return {
        info: _cliColor.green,
        error: _cliColor.red,
        warn: _cliColor.yellowBright,
        message: _cliColor.yellow
    };
}

// Friendly message for non-initialized folder
function displayNonInitializedFolderErrorMessage() {
    const clc = cliColor();

    console.log(
        clc.warn('It seems this is not an Harmonic project yet. \n') +
        clc.warn('Check your directory or run ') +
        clc.info.bgWhite.italic(' harmonic init ') +
        clc.warn(' to start a new Harmonic project.')
    );
}

// Find harmonic.json. Returns path or false.
function findHarmonicRoot(sitePath) {
    let currentPath = resolve(sitePath);
    let oldPath = '';

    // Climb directories up until finding a `harmonic.json` file, if it is not found then return false.
    while (!isHarmonicProject(currentPath)) {
        oldPath = currentPath;
        currentPath = resolve(currentPath, '..');

        if (oldPath === currentPath) {
            // reached root folder, return false;
            return false;
        }
    }

    return currentPath;
}

// Check if harmonic.json file exists
function isHarmonicProject(sitePath) {
    try {
        getConfig(sitePath);
        return true;
    } catch (e) {
        return false;
    }
}

function getConfig(sitePath) {
    return JSON.parse(readFileSync(join(sitePath, 'harmonic.json')).toString());
}

function titleToFilename(title) {
    return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase() + '.md';
}

// Note: class declarations are not hoisted, so this can't be listed in the exports statement at the top of this file.
export class MissingFileError extends Error {
    constructor(file = 'harmonic.json') {
        super();
        this.name = 'MissingFileError';
        this.file = file;
        this.message = `Missing file: ${this.file}`;
        delete this.stack;
    }
}

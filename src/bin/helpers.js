import { readFileSync } from 'fs';
import { join, resolve, extname, basename } from 'path';
import strIncludes from 'core-js/library/fn/string/virtual/includes';
import _cliColor from 'cli-color';

// CLI color
export function cliColor() {
    return {
        info: _cliColor.green,
        error: _cliColor.red,
        warn: _cliColor.yellowBright,
        message: _cliColor.yellow
    };
}

// Friendly message for non-initialized folder
export function displayNonInitializedFolderErrorMessage() {
    const clc = cliColor();

    console.log(
        clc.warn('It seems this is not an Harmonic project yet. \n') +
        clc.warn('Check your directory or run ') +
        clc.info.bgWhite.italic(' harmonic init ') +
        clc.warn(' to start a new Harmonic project.')
    );
}

// Check if harmonic.json file exists
export function isHarmonicProject(sitePath) {
    try {
        getConfig(sitePath);
        return true;
    } catch (e) {
        return false;
    }
}

// Find harmonic.json. Returns path or false.
export function findHarmonicRoot(sitePath) {
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

export function getConfig(sitePath) {
    return JSON.parse(readFileSync(join(sitePath, 'harmonic.json')).toString());
}

export function titleToFilename(title) {
    return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-+|-+$/g, '').toLowerCase() + '.md';
}

export function getFileName(file) {
    const filename = basename(file, extname(file));
    const checkDate = new Date(filename.substr(0, 10));
    return isNaN(checkDate.getDate()) ? filename : filename.substr(11, filename.length);
}

export function getStructure(defaultLang, lang, permaLink) {
    // If is the default language, generate in the root path
    if (defaultLang === lang && permaLink::strIncludes(':language')) {
        // TODO allow customizing the permalink format? https://github.com/JSRocksHQ/harmonic/pull/97#issuecomment-67596545
        return permaLink.split(':language/')[1];
    }
    return permaLink;
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

import { readFileSync } from 'fs';
import { join } from 'path';
import _cliColor from 'cli-color';
import { resolve } from 'path';


export { cliColor, isHarmonicProject, getConfig, titleToFilename, findHarmonicRoot };

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

// Find harmonic.json
function findHarmonicRoot(sitePath) {
    
    const clc = cliColor();
    var currentPath = resolve(sitePath);
    var oldPath = "";


    while (!isHarmonicProject(currentPath)) {
        // TODO: Climb folders up until find harmonic.json file, if can't find then error.

        oldPath = currentPath;
        currentPath = resolve(currentPath,"..");

        if (oldPath === currentPath) {
            // reached root folder, throw error;
            displayNonInitializedFolderErrorMessage();
            throw new Error();
        }

    }

    console.log(
        clc.info("harmonic.json found at: " + currentPath)
    );
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

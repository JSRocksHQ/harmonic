let fs = require('fs');
let path = require('path');

export { cliColor, isHarmonicProject, getConfig, titleToFilename };

// CLI color
function cliColor() {
    var clc = require('cli-color');
    return {
        info: clc.green,
        error: clc.red,
        warn: clc.yellowBright,
        message: clc.yellow
    };
}

// Check if harmonic.json file exists
function isHarmonicProject(sitePath = '.') {
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

function getConfig(sitePath = '.') {
    return JSON.parse(fs.readFileSync(path.join(sitePath, 'harmonic.json')).toString());
}

function titleToFilename(title) {
    // [BUG] https://github.com/jscs-dev/node-jscs/issues/735
    // jscs:disable disallowSpaceBeforeBinaryOperators
    return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase() + '.md';
    // jscs:enable disallowSpaceBeforeBinaryOperators
}

var fs = require('fs');

// CLI color
exports.cliColor = function() {
    var clc = require('cli-color');
    return {
        info: clc.green,
        error: clc.red,
        warn: clc.yellowBright,
        message: clc.yellow
    };
};

// Check if harmonic.json file exists
exports.isHarmonicProject = function() {
    var clc = this.cliColor();

    try {
        this.getConfig();
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
};

exports.getConfig = function() {
    return JSON.parse(fs.readFileSync('./harmonic.json').toString());
};

exports.titleToFilename = function(title) {
    return title.replace(/[^a-z0-9]+/gi, '-').replace(/^-*|-*$/g, '').toLowerCase() + '.md';
};

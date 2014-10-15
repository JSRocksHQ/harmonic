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
    var config = null,
        clc = this.cliColor(),
        errorMessage = 'It seems this is not an Harmonic project yet. \n' +
                       'Check your directory or run harmonic init to start a new Harmonic project.';

    try {
        config = this.getConfig();
        return true;
    } catch (e) {
        console.log(clc.warn(errorMessage));
        return false;
    }
};

exports.getConfig = function() {
    try {
        var config = JSON.parse(fs.readFileSync('./harmonic.json').toString());
        return config;
    } catch (e) {
        throw e;
    }
};

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

exports.getConfig = function() {
    try {
        var config = JSON.parse(fs.readFileSync('./harmonic.json').toString());
        return config;
    } catch (e) {
        console.log(e);
    }
};

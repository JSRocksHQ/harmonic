var stylus = require('stylus'),
    fs = require('fs'),
    localconfig = require('../../config'),
    helpers = require('../../helpers'),
    clc = helpers.cliColor();

var Stylus = function() {
    return new Promise(function(resolve, reject) {
        var stylDir = localconfig.rootdir + 'bin/css/stylus/',
            cssDir = './public/css',
            code = fs.readFileSync(stylDir + 'index.styl', 'utf8');

        stylus(code)
            .set('paths', [stylDir, stylDir + '/engine', stylDir + '/partials'])
            .render(function(err, css) {
                if (err) {
                    reject(err);
                } else {
                    fs.writeFileSync(cssDir + '/main.css', css);
                    console.log(
                        clc.info('Successfully generated CSS with Stylus preprocessor')
                    );
                    resolve();
                }
            });
    });
}

module.exports = Stylus;

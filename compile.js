(function mainLessCompile() {


    'use strict';


    var less = require('less');
    var fs = require('fs');
    var path = require('path');


    fs.readFile('src/templates/default/resources/_less/index.less', function(error, data) {

        var dataString = data.toString();
        var options = {
            paths: ["src/templates/default/resources/_less"],            // .less file search paths
            outputDir: "src/templates/default/resources/_css",           // output directory, note the '/'
            optimization: 1,            // optimization level, higher is better but more volatile - 1 is a good value
            filename: "import.less",    // root .less file
            compress: false,            // compress?
            yuicompress: false          // use YUI compressor?
        };


        options.outputfile = options.filename.split(".less")[0] + (options.compress ? ".min" : "") + ".css";
        options.outputDir = path.resolve(process.cwd(), options.outputDir) + "/";
        verifyDirectory(options.outputDir);


        var parser = new less.Parser(options);
        parser.parse(dataString, function(error, cssTree) {

            if (error) {
                less.writeError(error, options);
                return false;
            }

            var cssString = cssTree.toCSS({
                compress: options.compress,
                yuicompress: options.yuicompress
            });

            fs.writeFileSync(options.outputDir + options.outputfile, cssString, 'utf8');

            console.log('Successfully generated CSS with LESS preprocessor');
        });
    });


    var verifyDirectory = function(filepath) {

        var dir = filepath;
        var existsSync = fs.existsSync || path.existsSync;

        if ( !existsSync(dir) ) {
            fs.mkdirSync(dir);
        }
    };


})();
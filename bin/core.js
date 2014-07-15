var Parser = require('./parser'),
    parser = new Parser();

// JSHint ESNext option doesn't allow redefinition of Promise
// But it's not supported yet in node --harmony
var Promise = require('promise'); // jshint ignore: line

module.exports = {

    init: function() {
        return new Promise(function(resolve) {
            parser.start()
                .then(parser.clean)
                .then(parser.getConfig)
                .then(parser.createPublicFolder)
                .then(parser.compileCSS)
                .then(parser.generatePages)
                .then(parser.getFiles)
                .then(parser.generatePosts)
                .then(parser.generateRSS)
                .then(parser.compileES6)
                .then(parser.generateIndex)
                .then(parser.generateTagsPages)
                .then(parser.copyResources)
                .then(resolve)
                .catch(function(e) {
                    console.log(e);
                });
        });
    }
};




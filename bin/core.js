var Parser = require('./parser'),
    parser = new Parser(),
    helpers = require('./helpers');

module.exports = {

    init: function() {
        return helpers.isHarmonicProject() &&
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
            .catch(function(e) {
                console.log(e);
                console.log(e.stack);
                // re-throw to keep promise in rejected state
                throw e;
            });
    }
};

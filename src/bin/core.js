import { isHarmonicProject } from './helpers';
import Parser from './parser';

let parser = new Parser();

export { build };

function build(sitePath) {
    return isHarmonicProject(sitePath) &&
        parser.start()
        .then(parser.clean.bind(parser, sitePath))
        .then(parser.getConfig.bind(parser, sitePath))
        .then(parser.createPublicFolder.bind(parser, sitePath))
        .then(parser.compileCSS.bind(parser, sitePath))
        .then(parser.generatePages.bind(parser, sitePath))
        .then(parser.getFiles.bind(parser, sitePath))
        .then(parser.generatePosts.bind(parser, sitePath))
        .then(parser.generateRSS.bind(parser, sitePath))
        .then(parser.compileJS.bind(parser, sitePath))
        .then(parser.generateIndex.bind(parser, sitePath))
        .then(parser.generateTagsPages.bind(parser, sitePath))
        .then(parser.copyResources.bind(parser, sitePath))
        .catch((e) => {
            console.log(e);
            console.log(e.stack);
            // re-throw to keep promise in rejected state
            throw e;
        });
}

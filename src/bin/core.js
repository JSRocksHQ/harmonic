import { isHarmonicProject } from './helpers';
import Parser from './parser';

let parser = new Parser();

export { init };

function init() {
    return isHarmonicProject() &&
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
        .catch((e) => {
            console.log(e);
            console.log(e.stack);
            // re-throw to keep promise in rejected state
            throw e;
        });
}

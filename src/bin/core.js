import { isHarmonicProject } from './helpers';
import Harmonic from './parser';

export { build };

async function build(sitePath) {
    try {
        // TODO move logging to outside of isHarmonicProject and API functions
        if (!isHarmonicProject(sitePath)) {
            throw new Error();
        }

        const harmonic = new Harmonic(sitePath, { quiet: false });

        harmonic.start(); // useless, remove?
        harmonic.clean();
        harmonic.createPublicFolder();

        await harmonic.compileCSS();
        await harmonic.generatePages(harmonic.getPageFiles());

        const postsMetadata = await harmonic.generatePosts(harmonic.getPostFiles());

        harmonic.generateRSS(postsMetadata);
        harmonic.compileJS(postsMetadata);
        harmonic.generateIndex(postsMetadata);
        harmonic.generateTagsPages(postsMetadata);

        await harmonic.copyResources();
    } catch (e) {
        console.log(e);
        console.log(e.stack);
        // re-throw to keep promise in rejected state
        throw e;
    }
}

import { isHarmonicProject, findHarmonicRoot, displayNonInitializedFolderErrorMessage, MissingFileError } from './helpers';
import Harmonic from './parser';

export { build };

async function build(passedPath) {
    const sitePath = findHarmonicRoot(passedPath);

    if (!sitePath) {
        displayNonInitializedFolderErrorMessage();
        throw new MissingFileError();
    }

    const harmonic = new Harmonic(sitePath, { quiet: false });

    await harmonic.clean();

    await harmonic.compileCSS();

    const pagesMetadata = await harmonic.generatePages(await harmonic.getPageFiles());
    const postsMetadata = await harmonic.generatePosts(await harmonic.getPostFiles());

    await harmonic.generateRSS(postsMetadata, pagesMetadata);
    await harmonic.compileJS(postsMetadata, pagesMetadata);
    harmonic.generateIndex(postsMetadata, pagesMetadata);
    harmonic.generateTagsPages(postsMetadata);

    await harmonic.copyThemeResources();
    await harmonic.copyUserResources();
}

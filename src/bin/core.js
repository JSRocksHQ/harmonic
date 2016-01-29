import prettyMs from 'pretty-ms';
import { findHarmonicRoot, displayNonInitializedFolderErrorMessage, MissingFileError } from './helpers';
import Harmonic from './parser';
import { cliColor } from './helpers';
const clc = cliColor();

export async function build(passedPath) {
    const startTime = Date.now();

    const sitePath = findHarmonicRoot(passedPath);

    if (!sitePath) {
        displayNonInitializedFolderErrorMessage();
        throw new MissingFileError();
    }

    const harmonic = new Harmonic(sitePath, { quiet: false });

    await harmonic.clean();

    const postsDataPromise = (async () => await harmonic.generateFiles(await harmonic.getPostFiles(), 'post'))();
    const pagesDataPromise = (async () => await harmonic.generateFiles(await harmonic.getPageFiles(), 'page'))();

    await Promise.all([
        harmonic.compileCSS(),
        (async () => await harmonic.generateIndex(await postsDataPromise, await pagesDataPromise))(),
        (async () => await harmonic.generateTagsPages(await postsDataPromise))(),
        (async () => await harmonic.compileJS(await postsDataPromise, await pagesDataPromise))(),
        (async () => await harmonic.generateRSS(await postsDataPromise, await pagesDataPromise))(),
        (async () => {
            // finish copying theme resources first to allow user resources to overwrite them.
            await harmonic.copyThemeResources();
            await harmonic.copyUserResources();
        })()
    ]);

    // TODO move logging to outside of this API?
    const endTime = Date.now();
    console.log(clc.info(`Build completed in ${prettyMs(endTime - startTime)}.`));
}

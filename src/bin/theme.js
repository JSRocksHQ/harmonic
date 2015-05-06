import { resolve, join } from 'path';
import { readFileSync } from 'fs';
import dd from 'dedent';

export default class Theme {

    constructor(name, sitePath) {
        if (!name) {
            throw new Error('Invalid theme. Please check your harmonic.json file.');
        }

        this.name = name;
        this.sitePath = resolve(sitePath);
        this.themePath = join(this.sitePath, 'node_modules', name);
    }

    getFileContents(file) {
        try {
            return readFileSync(join(this.themePath, file), { encoding: 'utf8' });
        } catch (e) {
            throw new Error(dd
                `Harmonic failed to load a theme file: "${file}".
                 Please check your selected theme in the harmonic.json, make sure it is correctly installed and has all the necessary files.`
            );
        }
    }
}

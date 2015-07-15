/* exported Harmonic */
/* global __HARMONIC */

// Note: `__HARMONIC` is not an actual identifer,
// it is the prefix of `harmonic build`'s substitution patterns.
// The substitution patterns look like a property access so that
// we can just whitelist `__HARMONIC` as a global identifier
// instead of having to whitelist every single substitution.

// TODO ESLint's `exported` directive seems to not be working correctly
// with the current version.
// We should probably `export` Harmonic using ES2015 module syntax and
// trash the `exported` directive.
class Harmonic { // eslint-disable-line no-unused-vars

    constructor(name) {
        this.name = name;
    }

    getConfig() {
        return __HARMONIC.CONFIG__;
    }

    getPosts() {
        return __HARMONIC.POSTS__;
    }

    getPages() {
        return __HARMONIC.PAGES__;
    }
}

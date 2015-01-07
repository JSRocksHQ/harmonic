/* exported Harmonic */
/* global __HARMONIC */

// Note: `__HARMONIC` is not an actual identifer,
// it is the prefix of `harmonic build`'s substitution patterns.
// The substitution patterns look like a property access so that
// we can just whitelist `__HARMONIC` as a global identifier
// instead of having to whitelist every single substitution.

// [BUG] https://github.com/jscs-dev/node-jscs/issues/706
// jscs: disable disallowSpacesInFunctionExpression, disallowSpacesInAnonymousFunctionExpression

class Harmonic {

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

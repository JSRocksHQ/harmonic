/* exported Harmonic */
/* global __HARMONIC */

// Note: `__HARMONIC` is not an actual identifer,
// it is the prefix of `harmonic build`'s substitution patterns.
// The substitution patterns look like a property access so that
// we can just whitelist `__HARMONIC` as a global identifier
// instead of having to whitelist every single substitution.

// [BUG] https://github.com/jscs-dev/node-jscs/issues/706
// jscs: disable disallowSpacesInFunctionExpression, disallowSpacesInAnonymousFunctionExpression


// slush-es20xx doesn't support front-end transpiling yet,
// so this file is transpiled manually for the time being

/*
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
*/


"use strict";

var _prototypeProperties = function (child, staticProps, instanceProps) { if (staticProps) Object.defineProperties(child, staticProps); if (instanceProps) Object.defineProperties(child.prototype, instanceProps); };

var Harmonic = (function () {
    function Harmonic(name) {
        this.name = name;
    }

    _prototypeProperties(Harmonic, null, {
        getConfig: {
            value: function getConfig() {
                return __HARMONIC.CONFIG__;
            },
            writable: true,
            configurable: true
        },
        getPosts: {
            value: function getPosts() {
                return __HARMONIC.POSTS__;
            },
            writable: true,
            configurable: true
        },
        getPages: {
            value: function getPages() {
                return __HARMONIC.PAGES__;
            },
            writable: true,
            configurable: true
        }
    });

    return Harmonic;
})();

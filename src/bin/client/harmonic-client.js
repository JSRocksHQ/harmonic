/* exported Harmonic */

// [BUG] https://github.com/jscs-dev/node-jscs/issues/706
// jscs: disable disallowSpacesInFunctionExpression, disallowSpacesInAnonymousFunctionExpression

class Harmonic {

    constructor(name) {
        this.name = name;
    }

    getConfig() {
        return /*{{config}}*/;
    }

    getPosts() {
        return /*{{posts}}*/;
    }

    getPages() {
        return /*{{pages}}*/;
    }
}

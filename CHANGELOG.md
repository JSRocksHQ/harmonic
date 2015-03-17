# v0.0.11 released this Mon 10, 2015
- Added Node.js 0.10, 0.12 and io.js support.
- `harmonic run` now opens the site in the default browser automatically, and `new_post`/`new_page` open the created markdown file(s) in the default editor automatically as well (unless the `--no-open` flag is passed).
- All `harmonic` commands now accept an optional project `path` argument, which (still) defaults to the CWD.
- Added Less preprocessor support to templates (this will be moved to a Harmonic plugin in the future).
- Added useful error message when running Harmonic commands in a non-Harmonic project directory.
- Added useful error message when running unrecognized Harmonic commands.

### Bug fixes
- Many fixes regarding Promises and race conditions.
- Fixed crash when posts/pages directory contains non-markdown files (e.g. `.DS_Store`).

### Internal
- Build: all Node.js `.js` files are now compiled with Babel.
- Build: Grunt.js -> gulp, based on the [slush-es20xx](https://github.com/es6rocks/slush-es20xx) workflow.
- ES.next: all the CommonJS syntax has been replaced with ECMAScript Modules syntax.
- Development: fixed `npm link` in Unix-based OS's.
- CI: added unit tests.
- CI: use container-based infrastructure on Travis.
- Streamlining internal functions for soon-to-be-implemented API's consumption.
- ES.next: make use of many more ECMAScript 2015 features.
- Lots of general code refactoring and cleanup.

### Miscellaneous
- Docs: added [Contributing Guide](https://github.com/es6rocks/harmonic/blob/master/CONTRIBUTING.md).
- Docs: updated the Wiki's [Installing page](https://github.com/es6rocks/harmonic/wiki/Installing).
- Docs: revamped the repository's [README](https://github.com/es6rocks/harmonic#the-next-static-site-generator) header.
- Added [Harmonic Gitter room](https://gitter.im/es6rocks/harmonic).


# 0.0.9 released on Oct 10, 2014
- Fully multi-platform support (Linux, Mac, Windows)
- Removed old trash
- Better bootstrap with _init_ command
- i18n support
- Basic documentation
- Create page command
- Bind pages to the browser API
A special thanks to the awesome contributors for this release:  
@leobalter, @UltCombo, @rssilva, @soapdog
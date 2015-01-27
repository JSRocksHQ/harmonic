# Entry points

This directory exists for two reasons:

- Abstract away the polyfills required by 6to5;
- Work around a `npm link` issue in Unix-based OS's -- if these files were inside `dist`, generating a new build would break the symlinks.

Put your `main` entry point's logic in the `src/index.js` file.

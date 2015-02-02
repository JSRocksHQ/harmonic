# Entry points

This directory exists to work around a `npm link` issue in Unix-based OS's -- if these files were inside `dist`, generating a new build would break the symlinks.

Put your entry point's logic in the `src/` directory.

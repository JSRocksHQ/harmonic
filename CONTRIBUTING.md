# Contributing guide

Want to contribute to Harmonic? Awesome!
There are many ways you can contribute, see below.

## Opening issues

Open an issue to report bugs or to propose new features.

- Reporting bugs: describe the bug as clearly as you can, including steps to reproduce, what happened and what you were expecting to happen. Also include Node.js or browser version, OS and other related software's versions when applicable.

- Proposing features: explain the proposed feature, what it should do, why it is useful, how users should use it. Give us as much info as possible so it will be easier to discuss, access and implement the proposed feature. When you're unsure about a certain aspect of the feature, feel free to leave it open for others to discuss and find an appropriate solution.

## Proposing pull requests

Pull requests are very welcome. Note that if you are going to propose drastic changes, be sure to open an issue for discussion first, to make sure that your PR will be accepted before you spend effort coding it.

Fork the Harmonic repository, clone it locally and create a branch for your proposed bug fix or new feature. Avoid working directly on the master branch.

`cd` to your Harmonic repository and run `npm link` to install dependencies, build and symlink your Harmonic repository to the globally installed npm packages. This means `npm link` will do all the work for you and make the `harmonic` command available in your terminal/command prompt.

To start working, `cd` to your Harmonic repository and run `npm run dev` to make a new build and (if the build succeeded) enter watch mode, which will generate incremental builds and run tests whenever you edit files.

Implement your bug fix or feature, write tests to cover it and make sure all tests are passing (run a final `npm test` to make sure everything is correct). Then commit your changes, push your bug fix/feature branch to the origin (your forked repo) and open a pull request to the upstream (the repository you originally forked)'s master branch.

## Documentation

Documentation is extremely important and takes a fair deal of time and effort to write and keep updated. Please submit any and all improvements you can make to the repository's docs and the [Wiki](https://github.com/es6rocks/harmonic/wiki).

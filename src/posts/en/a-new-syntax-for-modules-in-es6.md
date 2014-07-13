<!--
layout: post
title: A new syntax for modules in ES6
date: 2014-07-11T07:18:47.847Z
comments: true
published: true
keywords: JavaScript, ES6, modules
description: Post about module syntax
categories: modules
authorName: Jean Carlo Emer
authorLink: http://twitter.com/jcemer
authorDescription: Internet craftsman, computer scientist and speaker. I am a full-stack web developer for some time and only write code that solves real problems.
authorPicture: https://avatars2.githubusercontent.com/u/353504?s=460
-->

TC39 - ECMAScript group is finishing the sixth version of ECMAScript specification. The [group schedule](http://www.2ality.com/2014/06/es6-schedule.html) points to next June as the release date. By now, no significant differences may appear. It is time to deepen your knowledge into the subject.  
<!-- more -->
This post will not cover the importance of writing modular code. ES6 modules are already well displayed by websites like [JavaScript Modules](http://jsmodules.io), by far the best reference. The objective here is to clarify and justify the necessities of releasing a new syntax to write modules.

## Nowadays formats

The most famous modules formats until now are the [AMD](http://requirejs.org/docs/whyamd.html#amd), that are the most used by client-side libraries, and the [CommonJS](http://wiki.commonjs.org/wiki/Modules/1.1) that was adopted by platforms like Node.js and transported to browsers with Browserify. Each one has characteristics determined by its environment. For example the AMD format wraps each module inside a function to scope and allow asynchronous loading of dependencies at browsers. On the other hand, the CommonJS modules implicitly define the scope of a module making impossible to use this kind of format in browsers without translation.

## Choosing a module format

Libraries are the most affected by this decision. The inconsistency can be normalized using an abstraction that embraces the module code and makes it compatible with more than one format. The project [Universal Module Definition (UMD)](https://github.com/umdjs/umd) keeps a collection of this kind of abstractions.

Observing the formats evolution and adoption the appearance of the UMD project should be interpreted as a unified solution. This is wrong. The UMD project keeps more than ten variations and all of them deflect the module code of its objective: solve the problem that the code is written for. Look at this toy example of the UMD module `add2` that has `add` as dependency:

```javascript
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    define(['add'], factory);
  } else if (typeof exports === 'object') {
    module.exports = factory(require('add'));
  }
}(function (add) {
  return function (param) {
    return add(2, param);
  };
}));
```

Write valid code for two module formats (or more) is not a good option. The solution is to analyse the formats to identify which one has more expressiveness power.

The AMD modules encapsulate the code inside a function and it is a kind of harmfulness that doesn't bring expressiveness. Functions are part of another universe of problem solutions. The new specification should consider that each module file have its own scope. Remember that a new language version can change its behaviour. Saying that, [there are no reasons to adopt AMD anymore](http://blog.millermedeiros.com/amd-is-better-for-the-web-than-commonjs-modules).

CommonJS Modules are more expressive. It is a great advantage to leave aside encapsulation through functions and still be able to indicate which part of the code will be used like this `var debug = require('util').debug;` or even use: `require('util').debug('message on stderr');`.

Let's keep considering CommonJS modules and pointing which are their weak points that gradually lead to the adoption of a new syntax.

## Module encapsulation

Networks protocols currently available in browsers penalize performance when several module files are required. Packing all modules in one file to be used in browser is a good practice. This necessitie does not exist in platforms like Node.js, that have quick access to the filesystem.

CommonJS modules does not consider browser environment and another prove is that different modules can't be part of the same file. By the way, [Browserify](http://browserify.org) enables the use of CommonJS modules in browsers and allow multiple modules in a single file. This is only possible by making use of functions to encapsulate the code of each module. A problem is that the result is hard to read, [look at the file bundler.js](https://gist.github.com/jcemer/b52db6503eebc42a414d).

Nowadays the **only way to define scope in Javascript is beyond functions**. As said, a new specification allows changing the language functionality. The module scope definition could be better solved out than in [Node.js, which still uses functions under the hood](https://github.com/joyent/node/blob/b55c9d68aa713e75ff5077cd425cbaafde010b92/src/node.js#L788-L791).

ES6 specs brings a new exclusive syntax to define module scope. Throught syntax, it is possible to define more than one module in a single file without reaching out to functions that made us give up on AMD format. The result is a significative gain in expressivity:

```javascript
module 'foo' {
    // Module code
}
module 'bar' {
    // Module code
}
```

## Requesting dependencies (imports)

CommonJS modules were conceived to require dependencies synchronously. **Script execution is blocked while a dependency is loaded**. Again, this approach does not bring any inconvenient to Node.js that has quick access to the filesystem.

Considering network protocol evolution and even thinking on present days, a module format which fit to browsers needs to operate by loading async dependencies. For this, modules need to be [statically analised](http://en.wikipedia.org/wiki/Static_program_analysis) to **identify its dependencies before being executed**. By this way, it's possible to download dependencies simultaneously and evaluate the module only when dependencies are ready.

**The module formats that we have nowadays does not allow static analysis**. Getting as an example the CommonJS module format, its [specification points](http://wiki.commonjs.org/wiki/Modules/1.0) that the `require` is just a function that accepts a module identifier. Like any other function, its argument might be evaluated in different ways. Analise the code bellow that suffers by its random argument evaluation and the influence of control flow too:

```javascript
if (type == 'me') {
  var user = require('me');
} else {
  var user = require('module' + Math.random());
}
```

I hope that it proves that it is not possible to identify the dependencies in nowadays formats without code execution. Tools like Browserify [doesn't convert modules that have dynamic dependencies](https://github.com/substack/node-browserify/issues/377) for example. That should cause confusion and break production code. Just with a specific syntax to require  modules is possible to prevent that code end up written like these.

ES6 modules bring all the dependency declaration flexibility of the CommonJS modules allowing static analises of the code:

```javascript
import asap from 'asap';
import { later } from 'asap';
import asap, { later } from 'asap';
```

According to a [comment by Yehuda Katz](https://github.com/wycats/jsmodules/issues/8#issuecomment-47960446), it is not allowed to write code like `if (type == 'me') { import user from 'me'; }`. However, the specification doesn't leave apart the possibility to require dynamic dependencies using promises:

```javascript
if (type == 'me') {
  this.import('me').then(function(user) {
    // do stuff here
  });
}
```

## Code export (exports)

CommonJS module format allow export code through object properties of an object stored at the variable `exports`. The result of module evaluation is just an object with properties. Node.js implementation also allows overwriting the default returned value to others types like functions, look at the `foo` module example:

```javascript
module.exports = exports = function defaultFn() {
  return 'default';
};

exports.another = function () { return 'another'; };
```

The above code should be required like `require('foo')()` and `require('foo').another()`. The side-effect of this approach is the addition of properties in the function object `defaultFn`.

Using the new syntax, it is possible to declare a value to be required as default. In this case, the others exported values doesn't be assigned to properties of `defaultFn`. The code below is the translation to the new ES6 module syntax:

```javascript
export default function defaultFn() {
  return 'default';
};

export function another() { return 'another'; };
```

## Final words

The ES6 specification also defines a module loader that allows to require different module formats. This loader is outside the bounds of this article. The section [The Compilation Pipeline](https://gist.github.com/wycats/51c96e3adcdb3a68cbc3#the-compilation-pipeline) of the article ES6 Modules explains all features and possibilities of the loader.

I expect that this article has convinced you of the superiority of the new syntax against other module formats. A new syntax adds a toll to learn its use. But in this case, the gain of expressiveness and possibilites compensates that.

The new module syntax mastery takes into account all the different JavaScript used environments: web server, desktop, command line and browsers. The modules substantially change the language operation and are undoubtedly the best new feature.

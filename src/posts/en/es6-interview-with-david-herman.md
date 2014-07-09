<!--
layout: post
title: ES6 interview with David Herman
date: 2014-07-04T01:08:30.242Z
comments: true
published: true
keywords: ES6
description: Interview with David Herman about ES6
categories: ES6, Interview
-->
We did a nice interview with [David Herman](https://twitter.com/littlecalculist) about his thoughts about ES6.
David is the principal researcher and founder of Mozilla Research, where he works to expand the foundations of the Open Web. He participates in a number of Web platform projects, including: [task.js](http://taskjs.org/), [sweet.js](http://sweetjs.org/), [asm.js](http://asmjs.org/), [Rust](http://www.rust-lang.org/), [Servo](https://github.com/mozilla/servo/) and Parallel JS.
<!--more-->
He also participates in open standards, in particular as a representative on [TC39](http://www.ecma-international.org/memento/TC39.htm), the committee that standardizes JavaScript.

## Modules! One of the main features in ES6 are modules. Can you, as one of the specification core contributors, explain in a nutshell what modules will bring for JavaScript developers?
Modules are well established as a good way to structure code, especially in Node but more and more in client-side development too.
What we're doing is unifying existing JavaScript module systems into a standard that can work in all platforms.  Additionally, we've provided dedicated syntax and some cleanups in behavior, including asynchronous loading without the need for build tools.
We've also taken into account the most popular patterns, such as modules that have a single or primary export (like jQuery and underscore), and given them sweet syntax to encourage and assist best practices.
We've created a web site giving developers a tutorial on modules, which explains a little bit more what they look like and how to use them:
[http://jsmodules.io](http://jsmodules.io)

## Classes are controversial. There are people who love them and others not so much. Can you tell us your opinion about classes in JavaScript? What's the real purpose and what are the benefits for the language?
I always like to point out first that the class syntax in ES6 is not introducing something new conceptually into JavaScript; it's just a surface syntax for the widespread patterns people already use with constructor functions and prototypes.
Classes are totally dynamic; for example you can write a class literal as an expression:
```javascript
  var myClass = myMixin(class C { /* ... */ });
```

just like you could do with existing patterns:
```javascript
  function C(/* ... */) { /* ... */ }

  C.prototype = /* ... */;

  var myClass = myMixin(C);
```

And classes are fully interoperable with prototypes. For example, classes can inherit from traditional constructors and vice versa:
```javascript
  // extend Node's EventEmitter class
  class MyEventEmitter extends events.EventEmitter {
    constructor() {
      super();
      // ...
    }
    // ...
  }
```

Notice the `super` call in the constructor -- this is way less painful than the patterns people are forced to use for their hand-rolled classes today. [1] ES6 supports `super` for both constructors and methods.

In other words, class syntax adds conveniences for common patterns, and eliminates the need for the various competing class abstractions that exist in the wild today.

Another feature is the ability to subclass built-in classes like Arrays:
```javascript
  class Stack extends Array {
    constructor() { super() }
    top() { return this[this.length - 1]; }
  }

  var s = new Stack();
  s.push("world");
  s.push("hello");
  console.log(s.top());  // "hello"
  console.log(s.length); // 2
```

Personally, my feeling about classes is that they are a useful way to structure certain kinds of programming, but when taken as the central unifying principle for everything they can run you into trouble.
Classes are a nice lightweight way to implement data abstractions in JavaScript, and inheritance is useful for providing good defaults and letting people override those defaults.
But when people start organizing all their abstractions in big elaborate inheritance hierarchies, or when they start throwing functions in classes that really should just be functions, that's when I get off the train.

## Browser vendors have evolved in the last years, implementing new standards and bringing new features much faster. Can you try to "predict the future", and tell us when developers will have the power of ES6 to create theirs applications with native browsers support?
All I can promise you is that we work as hard as we can to bring this future as fast as possible. :)

## December 2014 is the target date for the new standard's ratification. Why did ES6 take so long to be released?
ES6 is in the last stages of a feature-based process that leads to infrequent spec releases.
For post-ES6 work we're moving to a "train model," similar to how browsers ship on timed releases instead of feature-based releases.
Our goal is to move to spec releases once a year. The final version of the spec will probably not be ratified until 2015, in fact, but the ratification date is not important.
What matters is that features stabilize and start shipping in production JavaScript implementations -- and this is already happening.
That said, the standardization process does affect when things get shipped, and some smaller, less controversial features (such as destructuring and rest-args) could have probably shipped sooner if their specifications had stabilized sooner.
So the move to a train model should help ship features when they're ready rather than being gated on entire collections of features.

## There's a plan for the next release, I mean, ES7 is in development, right?
Yes. We'll probably tweak the new model as we go along, but there are a number of post-ES6 features under active discussion, including `Object.observe`, typed objects, value types, `async`/`await`, and async generators.
You can see a list of the current topics here:
[https://github.com/tc39/ecma262/blob/master/README.md](https://github.com/tc39/ecma262/blob/master/README.md)

## Nowadays there are some features of ES6 natively available in some browsers. Transpilers and compilers are the solution to create future's JavaScript applications today. Is that a safe approach, or must developers wait until the final release?
I'm a huge proponent of transpilers playing an active role in standardization, and I'm thrilled to see how far this idea has come in practice.
Transpilers give people a realistic way to give features a test-drive and feed actual hands-on experience into the design process.
It's my hope that as projects like Traceur [2], sweet.js [3], and esnext [4] mature, it will get easier and easier for people to prototype early implementations of features under active discussion.

Here's why transpilers are so important:
- They allow developers to become active participants in the design and standardization process. We can gather real world feedback from communities of early adopters, and the transpiler implementors become subject matter experts who can provide invaluable feedback combining the implementor's perspective with the user developer's perspective.

- They provide a smoother adoption path. Allowing developers to start using features sooner helps provide greater pressure on browser vendors to implement features natively.

In many ways these points echo the philosophy of the Extensible Web [5].

The one caveat, which goes for any polyfill or prollyfill [6], is that implementations may not be fully correct implementations of the standard, and you should be careful not to depend on implementation quirks or non-standard behavior of a transpiler. But it's worth the risk, in my opinion, for the value of getting better and better channels of collaboration and feedback between developers and standards.

- [1] [http://techblog.netflix.com/2014/05/improving-performance-of-our-javascript.html](http://techblog.netflix.com/2014/05/improving-performance-of-our-javascript.html)
- [2] [https://github.com/google/traceur-compiler](https://github.com/google/traceur-compiler)
- [3] [http://sweetjs.org](http://sweetjs.org)
- [4] [https://github.com/square/esnext](https://github.com/square/esnext)
- [5] [http://extensiblewebmanifesto.org/](http://extensiblewebmanifesto.org/)
- [6] [http://prollyfill.org/](http://prollyfill.org/)

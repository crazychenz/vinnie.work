---
slug: 2021-09-18-why-so-hard-testing-with-es6-imports
title: 'Why So Hard?: Testing with ES6 imports in NodeJS.'
draft: false
---

I've been down this road many times, but this time I became a little more determined to get through it. I'm talking about using ESM/ES6/ES7 with test frameworks in NodeJS to do some integration / functional testing of an app backend I've been writing.

<!--truncate-->

## Overview

While I've been writing ES6/ES7 Javascript for NodeJS over the past ~18 months, I generally consider myself a C/Python developer by trade. They all have their issues, but one of the issues I'm finding with Node is the lack of smoothly transitioning from one JS generation to the next. Taking a small step back, I hated CommonJS and have just about sworn it off completely. I only got back into writing javascript with the advent of ES6/ES7. One of the major new features with these is the `import` mechanism that replaces the old `require()` notation.

My goal for my current task was to write some unit tests against my current ES6 style code. I also need to import constants from my code base to make the tests more readable. This ended up being a remarkably non-trivial tasks and my solution is frankly a hack, but good enough that I trust it at the moment. My general constraints were that I wanted to use one of the two kings of test frameworks for Javascript; Jest or Mocha.

Also worth noting, I'm using **Node v14.16.0** and **Mocha v9.1.1**.

## Problems

### Jest

So when I attempted to get Jest going, it of course crapped out from my ES6 styled code. It turns out that in the past when I had it working it was because I babeled it back to ES5. Ugh. Not doing that again. Looking through the googles I came across this [bl.ocks.org article](https://bl.ocks.org/rstacruz/511f43265de4939f6ca729a3df7b001c) on different ways to use ESM code with Jest. That immediately led me to this [GitHub issue](https://github.com/standard-things/esm/issues/706) (that is still open as of 9/18/2021). The takeaway I got was that the Javascript/Jest community is clipping along at such a rate that they dropped support for something they had in the past. Boo. I'm done, what does Mocha got?

### Mocha

To be frank, Mocha didn't work out of the box right away either. All of my test files have to be suffixed with `.mjs`, but that is somewhat tolerable. I also was required to install the `esm` module (which I already had) and use the argument `-r esm` whenever I invoked Mocha. This looked promising and like it was going to do everything I wanted until I got a complaint that Mocha couldn't find my _constants_ modules that I was attempting to import. Whether I did an `import` or `require()` didn't matter. It just wouldn't load it.

### Other Node Observations

Node before v12 allowed mixing `require()` and `import`. IIRC, v12 throws a warning and v13+ will throw an exception. There are workarounds, by overloading the global require function with your own that doesn't throw an error. I'm not even going to go there (unless I have to due to some ridiculous dependency). Either way, why is Node superficially enforcing this constraint on its community? When Python broke a thing, it was because of core changes. This feels more dictated without a fundamental change. Meh, not the hill I choose to die on.

## The Research

### The Google Research

After walking away from this problem twice I finally decided to look into dynamically running Mocha tests. What I mean by this is I would invoke a `js` file with Node that would itself `import` Mocha, initialize it, register the tests, and run them (i.e. not run `mocha` from command line). Some quick googling produced some interesting stackoverflow.com answers:

- [Dynamically Running Mocha Tests](https://stackoverflow.com/a/32849146)
- [How do I dynamically generate Mocha tests in a describe()'s before() block?](https://stackoverflow.com/a/53220378)

This provided a framework for how Mocha is pragmatically constructed, but when I tried to apply them to my situation they seemed to be outdated. The gist is that you need to import mocha, create a mocha object and then add suites or tests to the object's root suite. Additionally, `describe` returned `Suite` objects and `it` returned `Test` objects. I was thinking great, I all I need to do is initialize this new Mocha object, include my describes from my external modules and then run the test suite.

Turns out that whenever I did this I would get some non-sense about _Can not call `describe` property of `undefined`._ Bah! I couldn't find anything on the net about this. In fact, in most cases there was a tinge of snobbery with the assumption that if you import Mocha the `describe`, `it`, and other typical globals are automatically imported and useable. This left me completely lost.

### The Code Research

Finally I got to the point where I knew I was going to have to roll up my sleeves and read the actual Mocha source code. While the Mocha snobs were correct in assuming that `describe`, `it` and friends were brought into global scope when the library is loaded, their comments were out of date in regards to the usability of the imported global calls. They depended on a `currentContext` variable to be initialized. This is what was returning the `undefined` that I previously mentioned in my error. A bit more digging showed that I had to emit a `pre-require` signal with some state parameters to initialize this currentContext variable.

## My Solution

Putting everything together, I was finally able to get everything working. Below is a snippet that shows the various steps taken.

In my project I have a `tests` folder that contains a `test.mjs`:

```javascript
import Mocha, { describe, before, it } from 'mocha';
import { expect } from 'chai';

/* This is where we initialize the Mocha object. We can opt to 
   feed it options like the command line arguments as well. Since
   I am using it to do over the wire tests I change the slow
   threshold up to a full second. */
const testRunner = new Mocha({ slow: 1000 });

/* This line is where the currentContext is initialized, allowing
   the use of the `describe`, `it`, and friends to work. Since I'm
   basically initializing currentContext with testRunner it implicitly
   adds Suites and Tests to the testRunner for us. (i.e. we never need
   to run addTest() or addSuite() if we use `describe` and `it`. */
testRunner.suite.emit('pre-require', global, 'nofile', testRunner);

/* This is where I import and load my integration tests. */
import { integrationSuite } from './integrationSuite.mjs';
integrationSuite();

/* This line is where the tests are run. */
var suiteRun = testRunner.run();

/* Finally, we check if any tests failed and return non-zero from
   the node process in case we're checking for success/failure from
   a shell script or something. */
process.on('exit', (code) => {
  process.exit(suiteRun.stats.failures > 0);
});
```

The `integrationSuite.mjs` as referenced above also lives in the `tests` folder:

```javascript
import { describe, before, it } from 'mocha';
import { expect } from 'chai';

/* This is the user API constants I wanted to use in the tests that
   triggered this whole mess. */
import { VISIBILITY } from '../user/constants.mjs';

/* This function contains all of the tests for simple exporting and
   importing into the test.js file. */
export function integrationSuite() {
  return describe('integration', () => {
    before(async () => {
      /* Do beforeAll stuff here. */
    });

    describe('user api', () => {
      describe('profile class', () => {
        it('should getProfile', async () => {
          /* Make request and get response from API. */
          expect(response.ok).to.equal(true);
        });

        /* More tests/suites here. */
      });

      /* More tests/suites here. */
    });

    /* More tests/suites here. */
  });
}
```

Finally, all I need to do is invoke the test with node:

```sh
node 'tests/test.mjs'
```

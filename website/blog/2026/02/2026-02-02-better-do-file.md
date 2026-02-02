---
slug: 2026-02-02-better-do-file
title: "A Better Do File"
draft: false
---

Coming from a strong C/C++ background, I have been a big user of `make` as a project action manager. Since most of my projects are no longer C/C++, I've migrated away from using `make`. Instead, I generally will lean in on the ecosystem of the project I am using (e.g. packages.js commands for Javascript/Typescript projects or setup.py for Python projects).

For projects that don't have a straight forward _project action manager_ I've established a `do` file pattern. The `do` file is always committed along side the project code itself for maximum portability (i.e. binaries are discouraged). You can think of `do` as a black box action interface that behaves like `make`:

- `do build`
- `do run`
- `do deploy`

In practice, the `do` script is a BASH script, but I think we can do better...

<!-- truncate -->

## Current Shell Variant

The anatomy of my existing boilerplate `do` is something like the following:

```sh
  #!/bin/sh

  SCRIPT_DIR=$(dirname $(realpath $0))

  usage() {
    echo "Possible Targets:"
    echo "- build - build project"
    echo "- start - start service"
    echo "- stop - stop service"
    echo "- deploy - deploy project"
    exit 1
  }

  if [ $# -lt 1 ]; then
    usage
  fi

  DO_CMD=$1
  TGT_OBJ="$2"
  WD=$(pwd)

  case $DO_CMD in

    start)
      cd ${SCRIPT_DIR}/output
      ./service start
      ;;

    stop)
      cd ${SCRIPT_DIR}/output
      ./service stop
      ;;

    build)
      cd ${SCRIPT_DIR}/src
      make
      ;;

    deploy)
      cd ${SCRIPT_DIR}
      ./scripts/deploy.sh
      ;;

    *)
      usage
      ;;
  esac
```

The script very simply looks at the first positional argument as the "recipe" that is handled by a simple shell switch statement. There is _always_ a `--help` so I know there is _always_ a safe entrypoint for discovery. Finally, I accept a single argument for a recipe (`TGT_OBJ`).

This version of `do` is absolutely great! Its simple to maintain, read, and discover the intended targets for the project. Although, one drawback is that it is shell, meaning its sort of stuck in the POSIX realm. I've actually done `.bat` versions in Windows and could do `ps1` versions for more power, but meh.

## Just - _manage_ project-specific commands.

Website: [just.systems](https://just.systems/)

Github: [casey/just](https://github.com/casey/just)

DreamsOfCode Overview: [I'm never writing another Makefile ever again](https://www.youtube.com/watch?v=_aQ8xJ5DuHY)

`just` takes quite a few notes out of Make's playbook, while adding a ton of quality of life improvements over the old fashion make. I'll let the docs and YouTube speak to `just` in detail.

The issue I have with `just` is that its a compiled Rust binary that is (currently) ~1.75MB compressed. This means that users have to discover, locate, and access/download, and install `just` to _just_ use it. If you are like me and work in a ton of different environments (online and offline), this can be a non-starter. So the question is: How can I leverage the make-ish benefits of `just` and have it be as portable as a `do` shell script?

## Justfile + Python

The proposed solution I've come up with is to have a pure python version that covers a subset of `just` functionality. I think of the implementation as a _micro_-`just`, similar to ulibc in relation to GNU's libc. The idea is to maintain the functionality we want for our project into a single python script file to process the `justfile`.  Python is cross-platform and the specific python script is (currently) less than 64KiB. Because the python script is all text, it lives well within revision control systems. Check, check, and check.

Proposed project layout:

```text
  TOP
  |- docs/
  |- src/
  |- do        # <-- always shebang script
  |- Justfile
```


Now the project includes the _micro_-`just` python script as `do` and a `Justfile`, I can still blindly run `./do --help` or `ls` to see its a `Justfile` powered project. I can then do the (just) standard `./do --list` to list the recipes, only now instead of the targets in the script themselves, they are coming from the justfile.

As icing on the cake, since we're processing a real `Justfile`, if we have `just` installed, we can use it as well. Why would I use `just` if I implemented the whole thing in Python? But we didn't! ... We only implemented the parts we wanted to support for portability and usability. There are other quality of life features we deliberately did not include in our Python version. Primarily, I'm talking about the interactive chooser. Other reasons to support the `Justfile` include:

- Muscle Memory
- User Familiarity and Discovery
- Inline Documentation

## Implementation

Full disclosure, I started writing a bare bones `Justfile` line parser that only did simple assignments and recipe processing (with dependencies). This can be done a about 100 lines of code. Once I started looking at the conditionals, strings, and expressions, I decided to vibe it out for now.

<details>

  <summary>The LLM Prompt</summary>

  ```text
    I'd like to have a complete grammar for casey/just justfile and a pure python script
    that implements most of the functionality of the "just" command.

    Parsing the justfile and handle:
    * Default recipe
    * Listing recipes
    * Invoking multiple recipes
    * Setting working directory with [no-cd]
    * Aliases
    * Documentation Comments
    * Expressions and Substitutions
    * Strings
    * Functions
    * Constants
    * Attributes
    * Groups
    * Conditional Expressions
    * Environment Variables
    * Recipe Parameters
    * Dependencies
    * Shebang Recipes
    * Private and Quiet Recipes
    * Imports
    * Signal Handling

    Things I don't need:
    * Interactive Chooser
  ```

</details>

A solution it generated: [ujust.py](https://gist.github.com/crazychenz/23592821949e1006c7067b7ba6333f23)

The gist can be used as a _reasonable_ starting point. I've quickly skimmed the code and determined it good enough for me to prune or extend as I desire. I've not reviewed the code in depth and therefore don't know what dangers may linger within.

## Gotchas

In short, supporting a subset of any existing standard carries risks.

We've implemented some percentage of `just` that we care about for `99%` of our projects. We still need to be careful to always use the `do` script for development and testing with `just` used as a compatibility sanity checker. The `do` script is the authoritative build script that happens to use the same configuration as `just` for downstream user discovery and use.

If there are actions we know we want upstream `just` to process, we can always have the `do` script call `just` itself and output a nice error when `do` can't find `just` in the path.

## Comments

<Comments />

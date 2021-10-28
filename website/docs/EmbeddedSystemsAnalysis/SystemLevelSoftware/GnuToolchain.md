---
sidebar_position: 42
title: GNU Toolchain
---

:::danger Incomplete

This document is not yet written.

:::

## Overview

In the 3rd decade of the 21st century there are a great many systems level programming languages. Embedded and systems level developers are no longer constrained by the C language. That said, C still is the defacto bridge between languages, the kernel is written in C, and a great many legacy projects with value today have value in C. So while you may not need C to accomplish the objective's we're about to discuss, C is the tool we'll use to present the following concepts and material. Therefore this section is a brief (or review) of how C code is constructed. Specifically, we'll be using the GNU toolchain to show the general process.

In synopsis:

```text
Source -> Preprocessor -> Compilation -> Assembling -> Linking -> Locating
```

## ELF Review

Although the GNU toolchain is capable of building different output formats (e.g. ELF, PE), all of our GNU Toolchain usage will focus on ELF output and bare metal binary output.

The Executable and Linkable Format (ELF) is the most common executable format found in POSIX systems. Fundamentally, ELF is composed of a set of magic bytes, an array of section headers, and section data. There are many conventions for the various sections of an ELF file. To name a few:

- **.bss** - Holds uninitialized data. This is where undefined `static` declared arrays in C are stored. The data of a `.bss` section is of zero length on disk. The section header is merely a way to define the size if the section when loaded into memory.
- **.data** - This section holds initialized data.
- **.relaNAME** - This section holds relocation information. By convention, "NAME" is supplied by the section to which the relocations apply.  Thus a relocation section for .text normally would have the name .rela.text.
- **.rodata** - This section holds read-only data. This is where all initialized `const` data  or literal data may be stored.
- **.text** - This section holds the executable instructions of the program.

For more information, see [elf(5)](https://man7.org/linux/man-pages/man5/elf.5.html) or run:

```sh
man 5 elf
```

ELF is conceptually similar to PE or COFF file formats.

## GNU: C -> ELF

### Build Process (for C/C++)

The following list is, roughly, the process that developer maintained C/C++ source code goes through to become executable binary. Of course there are differences from toolchain vendor to toolchain vendor, but by understanding this fundamental process you should be able to more easily transition to whatever tool set you find yourself using.

1. Preprocessor (`cpp`) - Converts human readable/maintained C code to pure C code. The preprocessor code is all the directives like `#include`, `#define`, `#ifdef` and so forth. This preprocessor code is substituted for pure C code. The compiler doesn't understand preprocessor directives and will throw errors if it sees preprocessor during the compilation phase. Luckily we often don't need to worry about this because `gcc` always runs the preprocessor on provided code.

2. Compiler (`cc`) - Converts pure GNU-C source (into intermediate representation and eventually) into assembly language. While `cc` is the generic binary name, the GNU variant is `gcc`. When we refer to GNU-C, we mean to say that GNU has several extensions they support that are outside of the standard C language. You can instruct `gcc` to strictly follow the C standard, but often open source projects use these extensions (e.g. the linux kernel uses the GNU extensions).

3. Assembler (`as`) - Converts assembly code into architecture specific machine code. While `as` is the generic binary name for an assembler in the POSIX environment, the GNU variant of this is `gas`. Some may ask: *Isn't assembler itself architecture specific?* Yes, assembler is typically arch family specific, but from processor model/version to model/version there may be slight differences in the instruction encoding. Also, in ARM there is a level of abstraction at the assembler level called pseudo assembly language. A disassembler does not reconstruct this abstraction layer (AFAIK).

4. Linker (`ld`) - Combine separate object (`.o`) files and computes relative offsets. When building C files, each time the compiler converts code into an object file, this is called a compilation unit. In a typical project, you may find you have 100s or 1000s of compilation units. The linker is responsible for combining all of the relevant compilation units to make a single executable ELF file.

<!-- 5. Locator (`ld`) - Map file offsets to run-time addresses when building non-dynamic binary. The locator phase is often overlooked because its not required if you're building for a dynamic binary. Locating is useful if you're code can not be dynamically relocated (i.e. position dependent) and all offsets must be calculated from some absolute base address (e.g. boot code). -->

### GNU C Compiler

Synopsis:

```text
[prefix]gcc [-E|-S|-c] [options] [-o outfile] infile

-E  Stop after the preprocessing stage; do not run the compiler proper. The output is
    in the form of preprocessed source code, which is sent to the standard output.

-S  Stop after the stage of compilation proper; do not assemble. The output is in the
    form of an assembler code file for each non-assembler input file specified.

-c  Compile or assemble the source files, but do not link. The linking stage simple is
    not done. The ultimate output is in the form of an object file for each source
    file.
```

Notice the `[prefix]` before the `gcc` command. When running `gcc` by itself you are using what is known as the *host* compiler. If you intend to build for another target (with GNU), you need the cross-compiler prefix. Also worth mentioned, you can have cross-compilers that build for the same target as the host. The difference is that you can keep a consistent toolchain API and reproduce the exact same binary if targeting something like x86. In contrast, you may get different binaries from a *host* compilation from host to host or from distribution to distribution. In the following examples, I'll use the buildroot toolchain built in the [Build A Toolchain](./BuildingAToolchain.md) lab.

`gcc` can be instructed to halt at each of the build steps mentioned in the build process. Let's walk through what this looks like in a simple example.

**giant.h**:

```c
#ifndef GIANT_H
#define GIANT_H
extern int fee();
extern int fie();
extern int foe();
#endif
```

**main.c**:

```c
#include "giant.h"

#define VALUE 0xABCD

int main(void) {
  int ret = 0;
  ret = VALUE + fee() + fie() + foe();
  return ret;
}
```

In the above snippets of code, we've got a typical include file and a preprocessor define for `VALUE` of to `0xABCD`. Now we'll run the code through a preprocessor:

```sh
aarch64-buildroot-linux-musl-gcc -E main.c | grep -v '^#'
```

```text
extern int fee();
extern int fie();
extern int foe();



int main(void) {
  int ret = 0;
  ret = 0xABCD + fee() + fie() + foe();
  return ret;
}
```

To cut through some *comment* noise, I've removed those lines with the `grep -v '^#'`. Now you can see that the include was recursively preprocessed and the result was substituted into the output. Additionally the preprocessor define `VALUE` in the `main()` function was substituted with its value `0xABCD` in `main()`. Note: You are currently viewing the code that will occur in this *compilation unit*.

Now lets run the compiler through the compilation phase. In this example, GNU will always save the output to a file (implicitly the name of the source with a `.s` suffix). To automate the output to the terminal I've appended `; cat main.s` to the command:

```sh
aarch64-buildroot-linux-musl-gcc -S main.c ; cat main.s
```

```text
        .arch armv8-a+crc
        .file   "main.c"
        .text
        .align  2
        .global main
        .type   main, %function
main:
.LFB0:
        .cfi_startproc
        stp     x29, x30, [sp, -48]!
        .cfi_def_cfa_offset 48
        .cfi_offset 29, -48
        .cfi_offset 30, -40
        mov     x29, sp
        str     x19, [sp, 16]
        .cfi_offset 19, -32
        str     wzr, [sp, 44]
        bl      fee
        mov     w1, w0
        mov     w0, 43981
        add     w19, w1, w0
        bl      fie
        add     w19, w19, w0
        bl      foe
        add     w0, w19, w0
        str     w0, [sp, 44]
        ldr     w0, [sp, 44]
        ldr     x19, [sp, 16]
        ldp     x29, x30, [sp], 48
        .cfi_restore 30
        .cfi_restore 29
        .cfi_restore 19
        .cfi_def_cfa_offset 0
        ret
        .cfi_endproc
.LFE0:
        .size   main, .-main
        .ident  "GCC: (Buildroot 2021.08.1) 10.3.0"
        .section        .note.GNU-stack,"",@progbits
```

We'll go over arm64 assembler in later material. To orient yourself a bit, you can verify the `0xABCD` value is in the code if you convert `43981` to hex (from the line that contains `mov w0, 43981`). Notice that the section that this line is within is named `main`.

Next, we'll tell gcc to build our `main.c` from source to an object file. Object files are themselves valid ELF files. They usually aren't executable because they contain unlinked or unresolved references to symbols that are defined in another object file or shared object. 

In the following command, we'll build `main.c` to `main.o`, but we'll visualize this with disassembler from `objdump`:

```sh
aarch64-buildroot-linux-musl-gcc -c main.c ; aarch64-buildroot-linux-musl-objdump -d -j .text main.o
```

```text
main.o:     file format elf64-littleaarch64


Disassembly of section .text:

0000000000000000 <main>:
   0:   a9bd7bfd        stp     x29, x30, [sp, #-48]!
   4:   910003fd        mov     x29, sp
   8:   f9000bf3        str     x19, [sp, #16]
   c:   b9002fff        str     wzr, [sp, #44]
  10:   94000000        bl      0 <fee>
  14:   2a0003e1        mov     w1, w0
  18:   529579a0        mov     w0, #0xabcd                     // #43981
  1c:   0b000033        add     w19, w1, w0
  20:   94000000        bl      0 <fie>
  24:   0b000273        add     w19, w19, w0
  28:   94000000        bl      0 <foe>
  2c:   0b000260        add     w0, w19, w0
  30:   b9002fe0        str     w0, [sp, #44]
  34:   b9402fe0        ldr     w0, [sp, #44]
  38:   f9400bf3        ldr     x19, [sp, #16]
  3c:   a8c37bfd        ldp     x29, x30, [sp], #48
  40:   d65f03c0        ret
```

The key takeaway from this is that our undefined symbols (i.e. `fee`, `fie`, and `foe`) have branch calls to themselves (e.g. `bl 0 <fee>`). This is a place holder for the linker phase of the build process. Using a combination of data stored in a special ELF section (.rela.*name*) and these place holders, GNU can track these unresolved references for resolution from the linker.

## Object Files

To review, in the above operations, we walked through preprocessing source code, compiling pure GNU-C to assembler code, and finally assembling the assembler to and object file. This all occured for only the `main.c` file. Assuming we did the same process for the `giant.c` file (where `fee()`, `fie()`, and `foe()` are defined), we should also have a `giant.o` object file.

### Linker Intro

When you don't tell `gcc` to stop at a particular state, it implicitly will run through the linker phase. This phase is where a single ELF file is generated from an *entry point* and all of the symbols from the various object files. When putting object files on the command line, `gcc` treats them with some order sensitivity, therefore its advisable to list object files topologically from left to right (i.e. put the entry point object file or source file first and follow that with recursively dependent input files.) For example, if you have:

<!-- TODO: Consider using a graphviz with .dot notation. -->

- main.o - Depends on giant.o.
- giant.o - Depends on fum.o.

You want to put something on the command line that resembles:

```sh
gcc -o main main.o giant.o fum.o
```

### Linking Object Files

Both `main.o` and `giant.o` have overlapping ELF sections (e.g. `.text`, `.data`, `.bss`). It is the job of the linker to merge all of these sections to make a single ELF file. Using the object file that contains the *entry point* (often `main()`), the linker will look through all the provided object files to resolve all undefined references in `main.o`. We can visualize these undefined references with `objdump`. I've appended a `grep` to filter out all the other symbols.:

```sh
aarch64-buildroot-linux-musl-objdump -t main.o | grep -e fee -e fie -e foe
```

```text
0000000000000000         *UND*  0000000000000000 fee
0000000000000000         *UND*  0000000000000000 fie
0000000000000000         *UND*  0000000000000000 foe
```

The `*UND*` means that the symbol is undefined. Now lets link our `giant.o` with main and view the result.

1. Create the `giant.c`:
  
  ```c
  int fee() { return 1; }
  int fie() { return 2; }
  int foe() { return 3; }
  ```
  
2. Build the `giant.o`
  
  ```sh
  aarch64-buildroot-linux-musl-gcc -c giant.c
  ```
  
3. Link `main.o` with `giant.o`. I've disabled all optimizations (`-O0`) to prevent the compiler from eliminating the `fee()`, `fie()`, and `foe()` calls.:
  
  ```sh
  aarch64-buildroot-linux-musl-gcc -O0 -o main main.o giant.o
  ```
  
4. Re-run the symbol table dump to see the resolved symbols in `main`. I've appended a `grep` to filter out all the other symbols.:
  
  ```sh
  aarch64-buildroot-linux-musl-objdump -t main | grep -e fee -e fie -e foe
  ```

  ```text
  00000000004005bc g     F .text  0000000000000008 foe
  00000000004005b4 g     F .text  0000000000000008 fie
  00000000004005ac g     F .text  0000000000000008 fee
  ```

### Archives Intro

When you find yourself buried in a pile of object files you can aggregate them into whats called a static library. This is accomplished with the `ar` binary. Assuming you wanted to group `fee.o`, `fie.o`, and `foe.o` into a single archive, you could do something like:

```sh
ar rcs libgiant.a fee.o fie.o foe.o
```

Now when you build `main` with gcc, you can do something like:

```sh
gcc -o main main.o libgiant.a
```

Because we used the convention to add a `lib` to the front of our library, we can use a more fancy way to reference the library:

```sh
gcc -o main main.o -lgiant
```

If we need to tell `gcc` to look for our *fancy* library reference in another location, we can add library paths by doing something like:

```sh
gcc -o main main.o -L/path/to/libs -lgiant
```

### Shared Objects Intro

<!-- TODO: Describe how to generate shared objects. -->

## The Generic Commands

<!-- TODO: Describe cpp, cc, as, ld. -->

## The Info Pages

One of the most valuable *offline* resources for details about how to use the GNU toolchain is the gcc info pages. If you don't have the info pages for gcc installed, it'll automatically fall back to the man page (significantly less useful). Try running `info gcc` from the command line.

If you see something like the following, you'll want to install the gcc documentation:

```text
GCC(1)                                           GNU                                          GCC(1)

NAME
       gcc - GNU project C and C++ compiler

SYNOPSIS
       gcc [-c|-S|-E] [-std=standard]
           [-g] [-pg] [-Olevel]
           [-Wwarn...] [-Wpedantic]
           [-Idir...] [-Ldir...]
           [-Dmacro[=defn]...] [-Umacro]
           [-foption...] [-mmachine-option...]
           [-o outfile] [@file] infile...

       Only the most useful options are listed here; see below for the remainder.  g++ accepts
       mostly the same options as gcc.

DESCRIPTION
       When you invoke GCC, it normally does preprocessing, compilation, assembly and linking.  The
       "overall options" allow you to stop this process at an intermediate stage.  For example, the
       -c option says not to run the linker.  Then the output consists of object files output by the
       assembler.
```

In Ubuntu, you can install the documentation with the following command. Note: The assembler and linker documentation is provided by the `binutils-doc` package.:

```sh
apt-get install gcc-doc cpp-doc binutils-doc
```

After the correct info pages have been installed, you'll see something like:

```text
Next: G++ and GCC,  Up: (dir)

Introduction
************

This manual documents how to use the GNU compilers, as well as their
features and incompatibilities, and how to report bugs.  It corresponds
to the compilers (Ubuntu 9.3.0-17ubuntu1~20.04) version 9.3.0.  The
internals of the GNU compilers, including how to port them to new
targets and some information about how to write front ends for new
languages, are documented in a separate manual.  *Note Introduction:
(x86_64-linux-gnu-gccint-9)Top.
```

Access the preprocessor documentation with:

```sh
info cpp
```

Access the compiler documentation with:

```sh
info gcc
```

Access the assembler documentation with:

```sh
info as
```

Access the linker documentation with:

```sh
info ld
```

### Info Pages Usage

If you aren't familiar with info pages, they are basically terminal based hyper link documentation. You should be able to navigate with the arrow keys and `Enter` on links (things that are underlined).

Some good to know hot keys are:

- Space - Scroll Forward
- Delete/Backspace - Scroll Backward
- `n` - Next Node
- `p` - Prev Node
- `u` - Up A Node
- `l` - Go Back
- `t` - Top Node (i.e. Go Home)
- `<` - First Node At Current Level
- `>` - Last Node At Current Level
- `g` - Goto Node (w/ tab completion)
- `/` - Regex Search
- `}` - Search Next
- `{` - Search Previous
- `q` - Quit

## Resources

https://stackoverflow.com/questions/12573816/what-is-an-undefined-reference-unresolved-external-symbol-error-and-how-do-i-fix
http://www.cs.cornell.edu/courses/cs3410/2013sp/lecture/15-linkers2-w.pdf
https://docs.oracle.com/cd/E19683-01/816-1386/chapter7-1/index.html
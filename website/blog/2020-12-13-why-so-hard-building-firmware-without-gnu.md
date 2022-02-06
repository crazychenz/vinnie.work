---
slug: 2020-12-13-why-so-hard-building-firmware-without-gnu
title: "Why so hard?: Building Firmware Images without GNU"
#date: "2020-12-13T12:00:00.000Z"
description: |
  Building firmware images from non-GNU toolchains is taking
  a lot more energy than I ever expected it to.
---

## Overview

By far, the most common use case for a toolchains (compiler, assembler, linker) is for building applications that run on top of an Operating System. A lesser used use case, but still common is to use toolchains for building drivers or modules for the Operating System. What I can only assume is one of the more rare uses cases is using the toolchain to build firmwares that do not have an Operating System. This has become abundantly apparent to me while exploring the possibilities of building firmwares outside of the GNU ecosystem. (Note: I'm focusing on big toolchain suites like LLVM, GNU, and MSVC. I'm aware of other tools like Keil and other proprietary toolchains.)

<!--truncate-->

My intentions are to write minimal startup code for an embedded system (biased towards aarch64) that runs from ROM or from whatever the reset vector is for the target system (which can often be physical memory address 0x0). This startup code consists of some assembly code for initializing the stack pointer and pivoting into C. The initial C code is responsible for copying its own `.data` section data into volatile memory and setting up the `.bss` static section in volatile memory. From here, this special C code will call into the `main()` function where more general C code can be executed to run as the _Operating System_.

When this setup is linked, the code must be aggregated into an executable so that all of the `.text` executable data, `.data` global data, and `.bss` static data is located in a single memory segment that is in a ROM (or non-volatile memory). This is due to the fact that when there is no Operating System, there is no ELF loader. Therefore, one of the last steps in building a firmware image is to strip any ELF headers from the code. This means everything needs to be in a single segment since we can't look up other segment offsets in the program headers (without adding more intelligence into the build system and firmware code itself.)

While the initial global data and static data is loaded into the non-volatile memory, the `.text` section must be linked so that it assumes that its `.data` and `.bss` are running from RAM (or volatile memory). In ELF terms, the address that the ROM version of a section lives in is called the Load Memory Address (LMA) and the address that the RAM version of a section lives in is called the Virtual Memory Address (VMA).

Note: An interesting side effect of not using LMA correctly is that you can quickly create very large executable files that mimic the address layout of a system. If you have 12k of ROM at 0, 12k of RAM at 0x40000000, and you don't use LMA addresses, you'll create an executable that is greater than 1 GiB to satisfy the 0x40000000 + bytes of data within.

In summary, to build firmware, you need to aggregate sections `.text`, `.rodata`, `.data`, and `.bss` into a single memory segment and then before executing `main()` you must setup a stack, global data, and static data. All of this should be doable from non-volatile memory as low in address space as 0 and from volatile memory as high in address space as 2^64.

## GNU - The Gold Standard?

Everything I am about to discuss is based on my knowledge of how to build images with the GNU toolchain. The above scenario is based on ELF files (freqently found in *nix systems) built by GNU toolchains. In Linux (and other *nix systems), Windows, and Mac OS X, there is likely a toolchain or build of GNU's GCC and binutils that you can use to accomplish the above scenario. In Linux its native, in Windows its mingw or cygwin, and in Mac OS X it can be installed with `homebrew`.

This is great and it gives all developers with different platforms the ability to construct firmwares to their hearts desire. The trouble is that in nearly every case (outside of \*nix), using `gcc` feels like a clunky add-on. Its not baked into the system and its not officially supported by the platforms themselves. GNU toolchains will often require adding special paths and require adding special environments (e.g. cygwin/mingw) to support its different call patterns and so forth.

What if instead of forcing GNU into all platforms, we could focus on building firmware images with the tools that come from the factory? (i.e. Visual Studio for Windows, LLVM for Mac OS X, and so forth) They each have compilers, linkers, assemblers. Not only that, they all have these for multiple architectures now (e.g. x86 & arm).

## Visual Studio (and MSVC)

My first attempt at trying to build a firmware image outside of the comfort of GNU was with MSVC (Visual Studio's native toolchain). When starting, I understood that I'd be working with COFF or PE file formats, but I figured that there should be enough metadata in those formats to support my needs similar to ELF.

Since I was building for aarch64, I looked through the MSVC binaries for the assember and linker so that I could sanity check myself with a single peice of code that would write to a register and spin. This way I could inspect the register value with GDB after the system had started to verify everything worked.

To get the required tools, I installed Visual Studio and added the additional component "MSVC v142 - VS 2019 C++ ARM64 build tools (v14.28)". This gave me the `armasm64.exe` assembler binary and the `link.exe` binary for linking. _Great!, I think thats all I need._

I don't know what standard each assembler is working from for aarch64, but unfortunately `armasm64.exe` was using slightly different syntax for the "metadata" of the assembler. For example:

The GNU syntax to set low 32 bits to 0xDEADBEEF in register X2 and spin would be:

```
.section .text
.globl _start
// test
_start:
  ldr w2, =0xDEADBEEF
  b .
```

While the MSVC syntax to do the same is:

```
 AREA .text, CODE, READONLY
 EXPORT start
start
 LDR w1, =0xDEADBEEF
 B .
 END
```

The assembling went pretty smooth and generated a `.obj` file as I expected by running:

```
armasm64.exe startup.s
```

Now came the linking... How do we tell the linker to assume this could would be run from physical address `0x0`? Turns out that there is no such switch in MSVC. In fact, if you are building code for 64 bit ARM, you can not have the linker create anything below address `0x40000000` (offset of 1 GiB). Additionally, if you are building code for 32 bit ARM with MSVC, you can not have the linker create anything below address `0x1000` (offset of 4 KiB).

Based on my limited knowledge of how Windows operates, I can only conclude that the `link.exe` executable was never designed for applications that directly interact with physical memory addresses. In my opinion, the MSVC linker has been designed to always assume its linking for an application that is run within an MMU managed environment (i.e. protected memory mode). In an MMU managed environment with 4k memory pages, most will leave the first page unmapped so that dereferencing `NULL` will result in a segmentation fault. If `link.exe` does make this assumption, it would explain the `0x1000` limit. Following a similar logic, if all 32 bit code is assumed to exist below a particular address (like `0x40000000`), then `link.exe` can perhaps add safety to its ecosystem by not allowing 32 bit code and 64 bit code to be interleaved. _Bah!_

So this sadly leaves me with the question ... **How does Microsoft build the Windows kernel?** Do they use another toolset that isn't the publically available MSVC or do they manually craft everything lower than `0x1000`? It would be awefully ironic if the Windows kernel has been built with GNU. ;-)

I want to give a shout out to @Frant from stack overflow for helping me look into this in the question I posted: [What is the process for generating a bare metal binary with MSVC tools?](https://stackoverflow.com/questions/64944350/what-is-the-process-for-generating-a-bare-metal-binary-with-msvc-tools)

## LLVM (Clang and LLD)

Now that MSVC is out of the question, perhaps there is still another heavy hitter ... [LLVM](https://llvm.org/)! Not only is there a distribution of LLVM provided natively with Mac OS X, but LLVM now seems to be an officially supported part of Visual Studio. So bascially, if we can get LLVM to work for our purposes, perhaps we'll have ourselves a winner. (Fun fact: LLVM also supports compiling and linking WASM.)

Using docker with Ubuntu 20.04 (Focal), I installed the latest LLVM, LLVM 11. Something similar to the following will get you LLVM 11 installed on your system.

```
wget https://apt.llvm.org/llvm.sh && chmod +x llvm.sh && ./llvm.sh 11
```

Once that was installed, we just needed to adjust our parameters a bit from the GNU way of doing things. Instead of running a `gcc` command prefixed with the "triple" of the target (e.g. `aarch64-linux-eabi`), we use `clang` or `lld` parameters to coerce LLVM to build things the way we want. Unlike MSVC, LLVM is designed to be a drop in replacement of GNU (in most cases). This means that we could, in theory, replace assembly, compilation, linking, and object manipulation with LLVM tools.

### The Scenario

Given that LLVM can run code from physical address zero, I'm going to step up the scenario to include setting up a stack and calling some C code that includes global data that will put bytes into our `.data` section.

Here is our \_start.s assembly:

```
.section ".text.ivt"
.globl _start

_start:
  ldr x30, =__stack_start
  mov sp, x30
  bl _entry
  b .
```

Here is the simple C code with global data:

```
int a_global_variable = 0xABCDEF01;
int _entry() { return 0; }
```

And finally, here is the `linker.ld` linker script that I will be using.

```
ENTRY(_start)

MEMORY
{
    ROM (rx) : ORIGIN = 0x0, LENGTH = 64M
    RAM (rwx) : ORIGIN = 0x40000000, LENGTH = 16M
}

SECTIONS
{
    .text : ALIGN(0x8) {
        __text_start = .;
        KEEP(*(.text.ivt)) *(.text);
        __text_end = .;
    } >ROM


    /* Sections required by LLD (LLVM LD). */
    .shstrtab : ALIGN(0x8) { *(.shstrtab) } >ROM
    .strtab : ALIGN(0x8) { *(.strtab) } >ROM
    .symtab : ALIGN(0x8) { *(.symtab) } >ROM


    .rodata : ALIGN(0x8)
    {
        __rodata_start = .;
        *(.rodata);
        __rodata_end = .;
    } >ROM


    .data :
    {
        __data_start = .;
        *(.data)
        __data_end = .;
    } >RAM AT>ROM


    /* --- Static Section --- */
    .bss : ALIGN(0x8)
    {
        __bss_start = .;
        *(.bss);
        *(COMMON);
        __bss_end = .;
    } >RAM


    . = ALIGN(0x1000);
    /* Note: Stacks (classically) grow down in memory (i.e. end comes before start). */
    __stack_end = .;
    . = . + 0x1000;
    __stack_start = .;


    /DISCARD/ :
    {
        *(*);
    }
}
```

To summarize the linker script:

- ENTRY(\_start) - The linker will set the `_start` symbol as the entry point to the executable.
- MEMORY - This section defines our relevant memory spaces. In this case, we assume `0x0` is the location of ROM and `0x40000000` is the location of RAM.
- SECTIONS - This is the part of the linker script that maps what object sections go into what linked executable sections.
- `.text`, `.rodata`, `.shstrtab`, `.strtab`, `.symtab` - These sections are appended to the ROM memory region.
- `.data` - This section is also appended to the ROM memory region, but all references to data within the `.data` section are updated to assume that `.data` will be located in the RAM memory region at runtime.
- `.bss` - This is the section that describe the static memory.
- In each of the section descriptions, there are `__` (dunder) variables (e.g. `__text_start`, `__text_end`) that track the beginning and end of each of the sections. These variable (or symbols) are included in the symbol table of the executable. Therefore, you can reference these symbols from the C code or assembly code that you plan to use to initialize the static memory and the global data memory.
- All sections not referenced are discarded in the special `/DISCARD/` section.
- Finally, there is a bit of magic added to establish a stack. Because we know where the .bss is going to end, we can create our stack offsets just after that. We do this here to simplify the assembly code and prevent unnecessary calculations at runtime.

Ok, so if we want to build this firmware in GNU, we'd run something similar to the following commands:

```
aarch64-linux-gcc \
  -nostdlib -nostartfiles -ffreestanding -nodefaultlibs \
  -c -o _start.o _start.s

aarch64-linux-gcc \
  -nostdlib -nostartfiles -ffreestanding -nodefaultlibs \
  -c -o _entry.o _entry.c

ld --print-map -T linker.ld -o gnu.elf _start.o _entry.o
```

Great, now lets inspect the VMA/LMA of the sections:

```
llvm-objdump -h --show-lma gnu.elf
```

Result

```
gnu.elf:        file format ELF64-aarch64-little

Sections:
Idx Name          Size     VMA              LMA              Type
  0               00000000 0000000000000000 0000000000000000
  1 .text         00000020 0000000000000000 0000000000000000 TEXT
  2 .data         00000004 0000000040000000 0000000000000020 DATA
  3 .symtab       00000210 0000000000000000 0000000000000000
  4 .strtab       000000b5 0000000000000000 0000000000000000
  5 .shstrtab     00000027 0000000000000000 0000000000000000
```

Great, the `.data` section VMA is `0x40000000` (within RAM) and the LMA is `0x20` (within ROM). Now lets run a similar process with LLVM tools. To convert this to LLVM/clang lingo, it becomes:

```
clang --target=aarch64-linux-gnu \
  -nostdlib -nostartfiles -ffreestanding -nodefaultlibs \
  -c -o _start.o _start.s

clang --target=aarch64-linux-gnu \
  -nostdlib -nostartfiles -ffreestanding -nodefaultlibs \
  -c -o _entry.o _entry.c

ld.lld -EL -z relro --hash-style=gnu --build-id --eh-frame-hdr \
  -m aarch64linux --print-map --no-dynamic-linker -T linker.ld \
  -o llvm.elf _start.o _entry.o
```

Great, now lets inspect the VMA/LMA of the sections:

```
llvm-objdump -h --show-lma llvm.elf
```

Result:

```
llvm.elf:       file format ELF64-aarch64-little

Sections:
Idx Name          Size     VMA              LMA              Type
  0               00000000 0000000000000000 0000000000000000
  1 .text         00000024 0000000000000000 0000000000000000 TEXT
  2 .shstrtab     00000034 0000000000000028 0000000000000028
  3 .strtab       000000b0 0000000000000060 0000000000000060
  4 .symtab       000001c8 0000000000000110 0000000000000110
  5 .rodata       00000000 00000000000002d8 00000000000002d8
  6 .data         00000004 0000000040000000 0000000040000000 DATA
  7 .bss          00000000 0000000040000008 0000000040000008 BSS
```

**This is not correct!** The VMA of `.data` is correctly assigned an address in RAM (`0x40000000`), but the LMA is the same as the VMA. Not only does this not set the LMA offsets correctly, preventing the intialization code from working, but it also places the `.data` section at an unknown offset in ROM. This is very much a bug in LLVM 11 and yet again we find ourselves unable to duplicate what GNU has done for decades.

Whenever I find a bug in a toolchain, it takes me days to convince myself that its the toolchain and not me. As developers we put so much faith in our tools that when things go wrong, its second nature to assume we're the problem. In this case though, I scoured the internet for github issues, bugzilla issues, blogs. I even created a stackoverflow question: [How do I specify an LMA on a .data section in LLVM's LLD linker for aarch64-linux-gnu target?](https://stackoverflow.com/questions/65257894/how-do-i-specify-an-lma-on-a-data-section-in-llvms-lld-linker-for-aarch64-linu). When that turned up no results or comments for over 24 hours, I decided that I'd have to start looking at the [LLVM source code](https://github.com/llvm/llvm-project.git) itself.

The code from LinkerScript.cpp looked different enough to warrent building LLVM from upstream main branch. I quickly threw together a docker image that clones and builds LLVM. At the time of this writing its a pre-release of LLVM 12. Once everything was built and ready to go, I gave my (failing) test from above another go ... everything seemed to be working! Yay!

The actual result:

```
llvm.elf:       file format elf64-littleaarch64

Dynamic Section:
Sections:
Idx Name          Size     VMA              LMA              Type
  0               00000000 0000000000000000 0000000000000000
  1 .text         00000020 0000000000000000 0000000000000000 TEXT
  2 .shstrtab     00000034 0000000000000000 0000000000000000
  3 .strtab       000000b0 0000000000000000 0000000000000000
  4 .symtab       000001c8 0000000000000000 0000000000000000
  5 .rodata       00000000 0000000000000000 0000000000000000
  6 .data         00000004 0000000040000000 00000000000002cc DATA
  7 .bss          00000000 0000000040000008 0000000040000008 BSS
```

## Conclusion

GNU is still the "gold standard", but with improvements to LLVM happening all the time, its on its way to becoming a truely embraced replacement for MSVC and GNU in my eyes. While MSVC is far behind in the firmware support game, LLVM is making strides to catchup. While understanding the lineage and general interface of commonly used GNU toolchain binaries, I believe that now is a perfect time to really focus on teaching LLVM to aspiring embedded systems developers because its a tool they can take with them to all environments without having to worry to much about the intricacies of how to install it (unlike GNU).

Still though, I wonder how we're at LLVM 11 (latest release as of Dec 2020) and it still doesn't support a _stable_ build that is capable of linking firmware images. I suspect this is because it wasn't until recently that LLVM started their LLD project as a replacement for GNU ld instead of falling back to GNU ld. Note: When you specify a target that clang doesn't support, it attempts to find a GNU toolchain that can satisfy the requirement as a fallback. This has been a nice feature to have while LLVM transitions and matures into a fully functioning product.

## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>

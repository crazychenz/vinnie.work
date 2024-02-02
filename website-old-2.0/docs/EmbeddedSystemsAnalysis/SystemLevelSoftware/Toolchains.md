---
sidebar_position: 40
title: 🧰 Toolchains
---

:::danger Incomplete

This document is not yet written.

:::

Wikipedia defines a toolchain as:

> In software, a toolchain is a set of programming tools that is used to perform a complex software development task or to create a software product, which is typically another computer program or a set of related programs.

In practice, a toolchain is a set of associated tools for the building of software (e.g. GNU toolchain or LLVM/Clang).

## Common Toolchains

_Note:_ Before we begin to go over the various toolchains, I'll preface by saying that I intend to use the GNU toolchain as the primary tool for examples. From time to time I may show differences between GNU and Clang/LLVM.

### GNU - The Gold Standard?

Everything I am about to discuss is based on my knowledge of how to build images with the GNU toolchain. While commonly associated with \*nix systems, a GNU toolchain exist for nearly every system. In Windows its mingw or cygwin, and in Mac OS X it can be installed with `homebrew`. This gives all developers with different platforms the ability to construct firmware and tools to their heart's desire.

The GNU Compiler Collection has been completely free and released since 1987 and its functionality has become the defacto gold standard for nearly all POSIX compilers. Even LLVM/Clang (which we'll talk about in a moment) was built incrementally so that any functionality it doesn't provide falls back to an appropriate GNU toolchain.

### Visual Studio (and MSVC)

Microsoft has always provided their own toolchains for their environment. These toolchains provide user space functionality similar to GNU toolchain user space functionality. I highly recommend using the right tool for the job and therefore Visual Studio and MSVC is likely to be the best tool to construct a purely Windows product.

That said, MSVC has some hard limitations in regards to firmware and low level applications... _It can't do it._ The bottom line is that MSVC doesn't allow you to link your code so it assumes its running at address zero. For this functionality you are required to use another toolchain (e.g. LLVM). _Luckily, Visual Studio treats LLVM as a first class citizen._

### LLVM (Clang and LLD)

Finally, I'd like to introduce [LLVM](https://llvm.org/). Not only is there a distribution of LLVM provided natively with Mac OS X, but LLVM now seems to be an officially supported part of Visual Studio. (Fun fact: LLVM also supports compiling and linking WASM.)

LLVM is the low level virtual machine that is a language agnostic framework for building compilers. Clang is the C/C++ compiler that is build from LLVM. Clang can perform almost all of the functionality of a `gcc` build, but there are some significant user experience differences that cause me to prefer Clang from time to time.

### Comparing GNU and Clang

So the million dollar question: **What is the difference between GNU and LLVM?**

- GNU is the gold standard for toolchains and LLVM/Clang _still_ depends on it in some edge cases.

- LLVM's language agnostic architecture is able to support building for multiple architectures out of the box. In contrast, you usually need a new GNU compiler installation for each processor family.

- GNU has grown organically since the late 80s, in contrast LLVM has taken advantage of the opportunity to use GNU lessons learned to create a completely language agnostic _low level virtual machine_ that simplifies optimization for all supported languages and architectures.

- _Note:_ Both (modern) GNU and LLVM used Single Static Assignment (SSA). Many sites advertise SSA as the difference between GNU and Clang. _This is untrue._

### Other Notable Mentions

- [Zig CC](https://andrewkelley.me/post/zig-cc-powerful-drop-in-replacement-gcc-clang.html) - Zig is a new systems level language with complete C-ABI compatibility. It comes with a LLVM based C compiler that is able to build standard C code for multiple platforms.

- [Keystone (The Ultimate Assembler)](https://www.keystone-engine.org/) - Keystone is a lightweight multi-platform, multi-architecture assembler framework. (Based on LLVM).

## Key Attributes

Like most systems, when developing and analyzing tools for that system, there are foundational attributes to understand about the platform for any software related efforts to be effective. The attributes we'll discuss here are Architecture, None OS, EABI, Libc, and Build Environment.

### Architectures

The first and most important thing to know about a system you plan to work on is the architecture of the system. The architecture will always dictate the instruction set for the CPU, but it may also describe things like how the CPU behaves (e.g. pipelining, caching), standard special function registers, system initialization, etc. These architecture details are usually described by a consortium of companies or a single company that governs the architecture standard.

Here are some architectural definitions and specifications:

- [ARMv8-A](https://developer.arm.com/documentation/den0024/a/) - Developed and Licensed by Arm Holdings
- [MIPS](https://www.mips.com/products/) - Developed by MIPS Technologies
- [AVR](https://www.microchip.com/design-centers/8-bit/avr-mcus) - Developed by Atmel
- [x86/64](https://software.intel.com/content/www/us/en/develop/articles/intel-sdm.tml#combined) - Developed by Intel
- PowerPC - Developed by Apple, IBM, and Motorola, the PowerPC. [PowerOpen Standards](https://www.sourceware.org/pub/binutils/ppc-docs/ppc-poweropen/) | [PowerPC Spec](http://ps-2.kev009.com/solinno.co.uk/7043-140/files/docs/PReP/srp1_101.pdf)

Common architectures (e.g. x86, arm, arm64, ppc, mips, and avr) all have different variants that each come with their own feature sets and constraints. These are usually described in great detail in the _technical specifications and guides_ distributed by the manufacturer of the part. One example of this is the micro controller unit (MCU) by Broadcom called the [BCM2711](https://datasheets.raspberrypi.org/bcm2711/bcm2711-peripherals.pdf). The BCM2711 is an ARMv8-A, but its also a 64 bit multi core system with a specific set of built in peripherals and a register memory map for utilizing all the peripherals within the SoC chip.

### None OS

A concept new to aspiring embedded systems developers is the idea of no operating system (i.e. bare metal development). In many setups there are options for _which operating system_ you plan to use so that the compiler and code can make assumptions. When performing bare metal development, the OS is literally `none`. When building a Linux Kernel, the linux kernel itself is the operating system, therefore its build for a system with a `none` operating system.

### EABI (Embedded Application Binary Interface)

The _embedded application binary interface_ (EABI) is a set of standards about how software binaries are structured and formatted. This standard allows the interoperability of different compilers, assemblers, and linkers from different languages on embedded systems. EABI is **not** required to do embedded systems development, but its a nice attribute of what ever compiler tool suite you use so you know you are meeting some minimal conventions.

You'll often find that pre-built and packaged cross-compilers from major Linux distribution package management systems have the term `eabi` in their package names and binary prefixes.

### Libc - The Standard C Library

The standard C library is something that a lot of C developers take for granted. This library is responsible for the standard C calls like `printf`, `fread`, `select`, `close`, and so forth. Underneath the hood, this library is translating the standard C calls to system calls that are appropriate for the operating system you are running. There are two points to be made here:

- When doing bare metal development, you have no OS provided standard C library. A lot of standard calls that folks take for granted are simply not there and you have to roll your own.

- If compiling binaries against a libc on a system with the very common glibc, you'll quickly find that the symbols in `glibc` aren't compatible with a more size conscience libc like `uclibc` or `musl`. When building binaries for an embedded system, you need to either development them without dependencies on libc or link them against the libc provided by the target system.

### Build Environment

Embedded systems can be built from scratch, but this is really only something we do as an educational exercise. In reality, there are a number of build environments that assist developers with building system baselines that include things like the cross-compiler toolchain, boot loader, kernel, and user space tools. Examples of these environments include:

- [Yocto](https://www.yoctoproject.org/)
- [OpenWrt/LEDE](https://openwrt.org/) | [DD-WRT](https://dd-wrt.com/)
- [Buildroot](https://buildroot.org/) | [Busybox](https://busybox.net/)

Note: If you have an abundance of time and curiosity, a _fun_ exercise is to run through the [Linux From Scratch](http://www.linuxfromscratch.org/) (LFS) process to build a complete buildroot like environment manually.

---
slug: 2020-11-08-embedded-primer-buildroot
title: Embedded Systems and Cross Compilation Primer
#date: "2020-11-08T12:00:00.000Z"
description: |
  A primer for getting started with embedded systems development. Covers key attributes to getting started with learning an embedded system platform and an example of building a buildroot cross compiled environment for Aarch64.
---

## Embedded Systems Primer

Wikipedia defines an [embedded system](https://en.wikipedia.org/wiki/Embedded_system) as "a computer system—a combination of a computer processor, computer memory, and input/output peripheral devices—that has a dedicated function within a larger mechanical or electrical system."

<!--truncate-->

Like most systems, when developing and analyzing embedded systems there are foundational attributes to understand about the platform for any software related efforts to be effective. The attributes we'll discuss here are Architectures, None OS, EABI, Libc, and Build Environment.

## Key Attributes

### Architectures

The first and most important thing to know about a system you plan to work on is the architecture of the system. The architecture will always dictate the instruction set for the CPU, but it may also describe things like how the CPU behaves (e.g. pipelining, caching), standard special function registers, system initialization, etc. These architecture details are usually described by a consortium of companies or a single company that governs the architecture standard.

Here are some architectural definitions and specifications:

- [ARMv8-A](https://developer.arm.com/documentation/den0024/a/) - Developed and Licensed by Arm Holdings
- [MIPS](https://www.mips.com/products/) - Developed by MIPS Technologies
- [AVR](https://www.microchip.com/design-centers/8-bit/avr-mcus) - Developed by Atmel
- [x86/64](https://software.intel.com/content/www/us/en/develop/articles/intel-sdm.html#combined) - Developed by Intel

Common architectures (e.g. x86, arm, arm64, PowerPC, MIPS, and AVR) all have different variants that each come with their own feature sets and constraints. These are usually described in great detail in the _technical specifications and guides_ distributed by the manufacturer of the part. One example of this is the micro controller unit (MCU) by Broadcom called the [BCM2711](https://datasheets.raspberrypi.org/bcm2711/bcm2711-peripherals.pdf). The BCM2711 is an ARMv8-A, but its also a 64 bit multi core system with a specific set of built in peripherals and a register memory map for utilizing all the peripherals within the SoC chip.

### None OS

A concept new to aspiring embedded systems developers is the idea of no operating system (i.e. bare metal development). In many setups there are options for _which operating system_ you plan to use so that the code can make particular assumptions. When performing bare metal development, the OS is literally `none`. When building a Linux Kernel, the linux kernel itself is the operating system, therefore its build for a system with a `none` operating system.

### EABI (Embedded Application Binary Interface)

The embedded application binary interface is a set of standards about how software binaries are structured and formatted. This standard allows the interoperability of different compilers, assemblers, and linkers from different languages on embedded systems. EABI is **not** required to do embedded systems development, but its a nice attribute of what ever compiler tool suite you use so you know you are meeting some minimal conventions.

You'll often find that pre-built and packaged cross-compilers from major Linux distribution package management systems have the term `eabi` in their package names and binary prefixes.

### Libc - The Standard C Library

The standard C library is something that a lot of C developers take for granted. This library is responsible for the standard C calls like `printf`, `fread`, `select`, `close`, and so forth. Underneath the hood, this library is translating the standard C calls to system calls that are appropriate for the operating system you are running. There are two points to be made here:

- When doing bare metal development, you have no standard C library. A lot of standard calls that folks take for granted are simply not there and you have to roll your own.

- If compiling binaries against a libc on a system with the very common glibc, you'll quickly find that the symbols in glibc aren't compatible with a more size conscience libc like uclibc or musl. When building binaries for an embedded system, you need to either development them without dependencies on libc or link them against the libc provided by the target system.

### Build Environment

Embedded systems can be built from scratch, but this is really only something we do as an educational exercise. In reality, there are a number of build environments that assist developers with building system baselines that include things like the cross-compiler toolchain, boot loader, kernel, and user space tools. Examples of these environments include:

- [Yocto](https://www.yoctoproject.org/)
- [OpenWrt/LEDE](https://openwrt.org/)
- [Buildroot](https://buildroot.org/)

Note: If you have an abundance of time and curiosity, a fun exercise is to run through the [Linux From Scratch](http://www.linuxfromscratch.org/) (LFS) process to build a complete buildroot like environment manually.

## Building Embedded Systems Tools

Once you have a sense of all the key attributes mentioned in the previous section, you can select a build environment and start inputting relevant options into their build systems. For our purposes, we'll be using:

- **Architecture:** aarch64 (i.e. arm64)
- **OS:** linux (Note: we can build `none` binaries from a `linux` compiler)
- EABI: _unspecified_
- **Libc:** uclibc (Note: we can build `none` binaries from a `uclibc` compiler)
- **Build Environment:** Buildroot

### Cross-Compiler Toolchain Types

When building toolchains, there are several different schemes to choose from. Since a toolchain itself is software that should be build-able by itself (i.e. bootstrapped), there are three attributes of toolchains to track:

- The architecture that the toolchain runs on.
- The architecture that the toolchain build binaries for.
- The architecture that a newly compiled toolchain intends to build for.

In a "non-cross-compilation" environment. All of these are the same, for example a compiler on an x86 that is only going to be used to build other x86 binaries will be a `x86-x86-x86` tuple.

Most embedded development occurs through the use of _traditional_ cross compilation. An example of ARM64 compilation would warrant a compiler with the tuple `x86-x86-aarch64`.

In exceptional situations you may find the desire to build cross compilers for multiple platforms that each themselves will target different architectures. This is known as a canadian cross compilation. An example of this would be building a toolchain that targets mips while running from an aarch64 that is built from an x86, generating the tuple `x86-aarch64-mips`.

### Toolchain Prefixes

When working with cross compilers, it is rare for the cross-compilation toolchain to be the only toolchain on the system. Therefore, to distinguish between the different toolchains, each toolchain is usually prefixed with a set of terms to indicate its intended target. For example, when building a toolchain from buildroot (like we'll do in the following sections), you'll find that tools like g++, gcc, and ld are prefixed with the string `aarch64-buildroot-linux-uclibc-`. Note: These terms match the key attributes mentioned above.

It is important to know these prefixes for several reasons. The first is that if you just use the standard `gcc` command, you may find yourself loading x86 binary code into a arm system. This often leads to many contorted faces while figuring out where things went wrong and where to begin troubleshooting. Secondly, when attempting to build external open source packages, often there are variables or arguments that allow the insertion of the cross compilation toolchain prefix so you can easily use the same make or build system commands but get binaries intended for the alternative target.

### Configure Buildroot

Now that we have an idea of what the key attributes are of our target, we can start to build the toolchain and other relevant tools we'll use later. As previously mentioned, we're aiming to use Buildroot. The first task is to download and configure buildroot. All of these actions are being performed on Ubuntu 20.04.

Within a known directory (something like `/projects/` or `/home/user/projects`), run the following set of commands.

```sh
wget https://buildroot.org/downloads/buildroot-2020.02.7.tar.bz2
sudo apt-get install build-essential libncurses-dev libssl-dev
tar -xf buildroot-2020.02.7.tar.bz2
cd buildroot-2020.02.7
make defconfig
make menuconfig
```

_Notes:_

- libncurses-dev required for buildroot menuconfig
- libssl-dev required for buildroot kernel build

Once the menuconfig terminal screen is available, you'll need to select several options from several different screens. The screens include the Target Options, the Toolchain Options, Kernel configuration, and Build Options. Each of the expected settings are displayed in the preformatted areas below.

**Target Options:**

Notice _all_ options.

```text
    Target Architecture (AArch64 (little endian))  --->
    Target Binary Format (ELF)  --->
    Target Architecture Variant (cortex-A72)  --->
    Floating point strategy (FP-ARMv8)  --->
```

**Toolchain Options:**

Notice the `Host GDB Options` section.

```text
        Toolchain type (Buildroot toolchain)  --->
        *** Toolchain Buildroot Options ***
    (buildroot) custom toolchain vendor name
        C library (uClibc-ng)  --->
        *** Kernel Header Options ***
        Kernel Headers (Linux 5.4.x kernel headers)  --->
        *** uClibc Options ***
    (package/uclibc/uClibc-ng.config) uClibc configuration file to use?
    ()  Additional uClibc configuration fragment files
    [ ] Enable WCHAR support
    [ ] Enable toolchain locale/i18n support
        Thread library implementation (Native POSIX Threading (NPTL))  --->
    [ ] Thread library debugging
    [ ] Enable stack protection support
    [*] Compile and install uClibc utilities
        *** Binutils Options ***
        Binutils Version (binutils 2.32)  --->
    ()  Additional binutils options
        *** GCC Options ***
        GCC compiler Version (gcc 8.x)  --->
    ()  Additional gcc options
    [ ] Enable C++ support
    [ ] Enable Fortran support
    [ ] Enable compiler link-time-optimization support
    [ ] Enable compiler OpenMP support
    [ ] Enable graphite support
        *** Host GDB Options ***
    [*] Build cross gdb for the host
    [*]   TUI support
    [*]   Python support
    [*]   Simulator support
        GDB debugger Version (gdb 8.2.x)  --->
        *** Toolchain Generic Options ***
    ()  Extra toolchain libraries to be copied to target
    [*] Enable MMU support
    ()  Target Optimizations
    ()  Target linker options
    [ ] Register toolchain within Eclipse Buildroot plug-in
```

**Linux Kernel Options:**

Notice the `Kernel configuration` option.

```text
[*] Linux Kernel
      Kernel version (Latest version (5.4))  --->
()    Custom kernel patches
      Kernel configuration (Use the architecture default configuration)  --->
()    Additional configuration fragment files
()    Custom boot logo file path
      Kernel binary format (Image)  --->
      Kernel compression format (gzip compression)  --->
[ ]   Build a Device Tree Blob (DTB)
[ ]   Install kernel image to /boot in target
[ ]   Needs host OpenSSL
[ ]   Needs host libelf
      Linux Kernel Extensions  --->
      Linux Kernel Tools  --->
```

**Build Options:**

Notice the `Enable compiler cache` option. We enable this so that when we want to update options the build should reuse as much of the previous build as possible. Make only prevents rebuilding things already built whereas ccache will cache objects already built that may have been cleaned by make. To clear ccache, run `ccache -C`.

```text
        Commands  --->
    ($(CONFIG_DIR)/defconfig) Location to save buildroot config
    ($(TOPDIR)/dl) Download dir
    ($(BASE_DIR)/host) Host dir
        Mirrors and Download locations  --->
    (0) Number of jobs to run simultaneously (0 for auto)
    [*] Enable compiler cache
    ($(HOME)/.buildroot-ccache) Compiler cache location (NEW)
    ()    Compiler cache initial setup (NEW)
    [*]   Use relative paths (NEW)
    [ ] build packages with debugging symbols
    [*] strip target binaries
    ()    executables that should not be stripped
    ()    directories that should be skipped when stripping
        gcc optimization level (optimize for size)  --->
        libraries (shared only)  --->
    ($(CONFIG_DIR)/local.mk) location of a package override file
    ()  global patch directories
        Advanced  --->
        *** Security Hardening Options ***
    [ ] Build code with PIC/PIE
        *** Stack Smashing Protection needs a toolchain w/ SSP ***
        RELRO Protection (None)  --->
        *** Fortify Source needs a glibc toolchain and optimization ***
```

### Build Buildroot

_Building buildroot can take hours_, but take care to check in about every 15 minutes because you never know when some compiler error or warning will pop up and halt the whole build process. It's also worth noting that this build will likely take up over 12 GiB of hard disk space.

```sh
make
```

**Note:** "Explicit cleaning is required when any of the architecture or toolchain configuration options are changed." - [Buildroot Manual](https://buildroot.org/downloads/manual/manual.html#make-tips) i.e. Use "`make clean`" after updating toolchain configs.

To rebuild kernel after new configuration without clean:

```sh
rm -rf output/build/linux-5.4.70/{.stamp_built,.stamp_configured}
```

When the build completes (assuming everything worked as intended), you should find all the relevant build artifacts in the `output` folder. Within this folder you'll find several sub-folders:

- build - The build directories of each of the components.
- host - The toolchain intended to run on the development host machine.
- images - The build images that are typically flashed to the board for booting.
- staging - A sysroot filesystem that holds dynamic libraries and headers for building for target.
- target - A stripped filesystem that contains most of the target root filesystem.

### Building with Buildroot

Now that buildroot is built, you can add the toolchain folder to your path.

```
export PATH=$PATH:$(pwd)/output/host/bin
```

With the toolchain as part of the path you can use the toolchain prefixed tools to build binaries for `aarch64` from whatever host you've built buildroot on.

You can test this with a simple C file (`test.c`):

```
int main() { return 0; }
```

Build it with:

```
aarch64-buildroot-linux-uclibc-gcc test.c -o test
```

Then you can verify the platform it's intended to run on with the `readelf` tool.

```
aarch64-buildroot-linux-uclibc-readelf -h test | grep -i machine
```

This will return the machine type that the binary has been built to run on. (Note: Remove the grep to see lots of other potentially useful information.)

```
  Machine:                           AArch64
```

## Conclusion

In follow up articles, we'll use this buildroot toolchain with qemu and a real Raspberry Pi to perform bare metal development and standard kernel/userspace development.

To conclude, we've covered key attributes of an embedded system, the configuration of buildroot, and a trivial example of using the buildroot tools with toolchain prefixing.

## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>

---
sidebar_position: 41
title: '🛠️ Lab: Building A Toolchain'
---

:::danger Incomplete

This document is not yet written.

:::

In this section, we'll be building a toolchain using the buildroot build environment. The intention is to get a feel for the range of architectures and build options one may use when building a toolchain with buildroot. This is similar to other toolchain build environments.

To begin building a GNU toolchain, you should have a sense of all the key attributes of your required toolchain, you can select a build environment and start inputting relevant options into the build system. For our purposes, we'll be using:

- **Architecture:** aarch64 (i.e. arm64)
- **OS:** linux (Note: we can build `none` binaries from a `linux` compiler)
- EABI: _unspecified_
- **Libc:** uclibc (Note: we can build `none` binaries from a `uclibc` compiler)
- **Build Environment:** Buildroot

## Cross-Compiler Toolchain Types

When building toolchains, there are several different schemes to choose from. Since a toolchain itself is software that should be build-able by itself (i.e. bootstrapped), there are three attributes of toolchains to track:

- The architecture that the toolchain runs on.
- The architecture that the toolchain builds binaries for.
- The architecture that a newly compiled toolchain intends to build for.

In a "non-cross-compilation" environment. All of these are the same, for example a compiler on an x86 that is only going to be used to build other x86 binaries will be a `x86-x86-x86` tuple.

Most embedded development occurs through the use of _traditional_ cross compilation. An example of ARM64 compilation would warrant a compiler with the tuple `x86-x86-aarch64`.

In exceptional situations you may find the desire to build cross compilers for multiple platforms that each themselves will target different architectures. This is known as a canadian cross compilation. An example of this would be building a toolchain that targets mips while running from an aarch64 that is built from an x86, generating the tuple `x86-aarch64-mips`.

## Toolchain Prefixes

When working with GNU cross compilers, it is rare for the cross-compilation toolchain to be the only toolchain on the system. Therefore, to distinguish between the different GNU toolchains, each toolchain is usually prefixed with a set of terms to indicate its intended target. For example, when building a toolchain from buildroot (like we'll do in the following sections), you'll find that tools like g++, gcc, and ld are prefixed with the string `aarch64-buildroot-linux-musl-`. Note: These terms (roughly) match the key attributes mentioned above.

It is important to know these prefixes for several reasons.

- The first is that if you just use the standard `gcc` command, you may find yourself loading `x86` binary code into a system that **is not** `x86`. This often leads to many contorted faces while figuring out where things went wrong and where to begin troubleshooting.

- Secondly, when attempting to build external open source packages, often there are variables or arguments that allow the insertion of the cross compilation toolchain prefix so you can easily use the same make or build system commands but get binaries intended for the alternative target.

<!-- TODO: Mention somewhere the relationship between kernel headers and the build. -->

## Lab: Build A Buildroot Toolchain

### Configure Buildroot

Now that we have an idea of what the key attributes are of our target, we can start to build the toolchain and other relevant tools we'll use later. As previously mentioned, we're aiming to use Buildroot. The first task is to download and configure buildroot. All of these actions are being performed on Ubuntu 20.04.

Within a known directory (something like `/projects/` or `/home/user/projects`), run the following set of commands.

<!-- TODO: Have all the resources available. -->

<!-- TODO: Have a docker image with dependencies installed? -->

```sh
# Install the host dependencies.
sudo apt-get update
sudo apt-get install build-essential libncurses-dev libssl-dev

# Download, extract, and initialize buildroot for configuration.
wget https://buildroot.org/downloads/buildroot-2021.08.1.tar.bz2
tar -xf buildroot-2021.08.1.tar.bz2
cd buildroot-2021.08.1/
make defconfig
make menuconfig
```

_Dependency Notes:_

- build-essential is a suite of core dev packages including GCC
- libncurses-dev required for buildroot menuconfig
- libssl-dev required for buildroot kernel build

Once the menuconfig terminal screen is available, you'll need to select several options from several different screens. The screens include the Target Options, the Toolchain Options, Kernel configuration, and Build Options. Each of the expected settings are displayed in the preformatted areas below.

**Target options:**

Notice _all_ options.

```text
    Target Architecture (AArch64 (little endian))  --->
    Target Binary Format (ELF)  --->
    Target Architecture Variant (cortex-A72)  --->
    Floating point strategy (FP-ARMv8)  --->
```

**Toolchain** _Options:_

Notice the `Host GDB Options` section.

```text
    Toolchain type (Buildroot toolchain)  --->
    *** Toolchain Buildroot Options ***
(buildroot) custom toolchain vendor name
    C library (musl)  --->
    *** Kernel Header Options ***
    Kernel Headers (Linux 5.13.x kernel headers)  --->
    *** Binutils Options ***
    Binutils Version (binutils 2.36.1)  --->
()  Additional binutils options
    *** GCC Options ***
    GCC compiler Version (gcc 10.x)  --->
()  Additional gcc options
[ ] Enable C++ support
[ ] Enable Fortran support
[ ] Enable compiler link-time-optimization support
[ ] Enable compiler OpenMP support
[ ] Enable graphite support
    *** Host GDB Options ***
[*] Build cross gdb for the host
[*]   TUI support
      Python support (Python 3)  --->
[*]   Simulator support
      GDB debugger Version (gdb 9.2.x)  --->
    *** Toolchain Generic Options ***
()  Extra toolchain libraries to be copied to target
[*] Enable MMU support
()  Target Optimizations
()  Target linker options
```

_Linux_ **Kernel** _Options:_

Notice the `Kernel configuration` option.

```text
[*] Linux Kernel
      Kernel version (Latest version (5.13))  --->
()    Custom kernel patches (NEW)
      Kernel configuration (Use the architecture default configuration)  --->
()    Additional configuration fragment files (NEW)
()    Custom boot logo file path (NEW)
      Kernel binary format (Image)  --->
      Kernel compression format (gzip compression)  --->
[ ]   Build a Device Tree Blob (DTB)
[ ]   Install kernel image to /boot in target
[ ]   Needs host OpenSSL (NEW)
[ ]   Needs host libelf (NEW)
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
    [ ] build packages with runtime debugging info
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
        Stack Smashing Protection (None)  --->
        RELRO Protection (None)  --->
        *** Fortify Source needs a glibc toolchain and optimization ***
```

### Build Buildroot

_Building buildroot can take hours_, but take care to check in about every 15 minutes because you never know when some compiler error or warning will pop up and halt the whole build process. It's also worth noting that this build will likely take up over 12 GiB of hard disk space. We're only going to build the toolchain. For my setup, this took ~4 minutes to build with all packages pre-downloaded and ~4.5GB of space.

For those that are stuck behind enterprise firewalls or on isolated networks, you can run `make source` at this point to download all of the packages needed for the build. Once you have the packages downloaded, simply copy the `.config` and `dl` folder to transfer media for an _offline_ build.

Assuming all packages have been downloaded and the `.config` is accurate, build a toolchain by running (Note: While optional, the `-j8` cut my build time in half.):

```sh
make toolchain -j8
```

**Note:** "Explicit cleaning is required when any of the architecture or toolchain configuration options are changed." - [Buildroot Manual](https://buildroot.org/downloads/manual/manual.html#make-tips) i.e. Use "`make clean`" after updating toolchain configs.

When the build completes (assuming everything worked as intended), you should find all the relevant build artifacts in the `output` folder. Within this folder you'll find several sub-folders:

- build - The build directories of each of the components.
- host - The toolchain intended to run on the development host machine.
- images - The build images that are typically flashed to the board for booting.
- staging - A sysroot filesystem that holds dynamic libraries and headers for building for target.
- target - A stripped filesystem that contains most of the target root filesystem.

### Building with Buildroot

Now that buildroot is built, you can add the toolchain folder to your path.

```sh
export PATH=$PATH:$(pwd)/output/host/bin
```

With the toolchain as part of the path you can use the toolchain prefixed tools to build binaries for `aarch64` from whatever host you've built buildroot on.

You can test this with a simple C file (`test.c`):

```c
int main() { return 0; }
```

Build it with:

```sh
aarch64-buildroot-linux-uclibc-gcc test.c -o test
```

Then you can verify the platform it's intended to run on with the `readelf` tool.

```sh
aarch64-buildroot-linux-uclibc-readelf -h test | grep -i machine
```

This will return the machine type that the binary has been built to run on. (Note: Remove the grep to see lots of other potentially useful information.)

```text
  Machine:                           AArch64
```

## APT Provided Cross Compilers

Using tools like Buildroot can be handy for granularly dialing in options for a toolchain or other aspects of an embedded system. I encourage you to experiment with a working baseline so that you can find what works and what dead ends you may find.

In practice you'll want to take a path of least resistance and that can often be a simple cross build package installation from your distribution package management system. Many x86 `apt` based distributions have the `crossbuild-essential` packages. You can see these by running:

```sh
apt-cache search crossbuild-essential
```

Output:

```text
crossbuild-essential-arm64 - Informational list of cross-build-essential packages
crossbuild-essential-armhf - Informational list of cross-build-essential packages
crossbuild-essential-ppc64el - Informational list of cross-build-essential packages
crossbuild-essential-s390x - Informational list of cross-build-essential packages
crossbuild-essential-amd64 - Informational list of cross-build-essential packages
crossbuild-essential-armel - Informational list of cross-build-essential packages
crossbuild-essential-i386 - Informational list of cross-build-essential packages
crossbuild-essential-powerpc - Informational list of cross-build-essential packages
crossbuild-essential-riscv64 - Informational list of cross-build-essential packages
```

I'll highlight that the above list is missing a MIPS architecture. MIPS is often found in embedded platforms and therefore you can fallback to buildroot for those situations.

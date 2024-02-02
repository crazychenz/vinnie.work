
<!-- ## Problem

On many occasions over the years I find myself playing whack-a-mole with getting various code packages to compile. When dealing in embedded systems or non-x86 based architecture, this becomes more niche (albiet more common with ARM these days). The compilation and linking of older packages is made significantly worse the older the package.

Suppose you wanted to add functionality or fix something broken in an old device that is running off of:

- x86 with Linux 2.2
- MIPS with Linux 2.4
- ARMv3 with Linux 2.6
- MIPSEL with Linux 3.x
- ARMv7 with Linux 4.x

While these have all been targets that seemed relatively straight forward to build for in their day, nowadays the dependencies and known good versions of toolchains required to build executables for these kinds of setups are more difficult to find and even more difficult to repeat.

Sure, _fire up an old distribution with a Virtual Machine_ with the advice you'll often get from a wipper snapper or someone not invested in your delima. And this is valid advice if you are someone that is willing to whack-a-mole yourself forward. I for one am kind of tired of that game and would rather build for myself (and others) a toolset to more prescriptively apply the _right tool for the right job_. 

## Mo Problems

- Internet changes over time.
  - Ubuntu releases move from archive.ubuntu.com to old-releases.ubuntu.com
  - debootstrap does not guarentee backward compatibility going forward, even though the scripts are still there (i.e. cruft)
  - Linux kernel has removed many long term release files.
  - The acceration of major releases has recently (since ~2008) increased.
- Version matching nightmare.
  - Developers do not document their exact build environment (e.g. glibc, gcc, binutils, other deps)
  - GNU philosophy discourages the use of static libraries and therefore release of environment independent executables.
  - Many tools and libraries have complex dependencies that lie beneath the surface. These dependencies employ more version specific extensions to languages and constructs (e.g. `__thread`).
  - Many old source packages can be published with the assumption that down stream folks can patch for their needs.
- C is not C
  - As GNU (and LLVM) have evolved, their tolerance for sloppy code expression has decreased. This in turn makes code that would compile without a single warning in 2010 impossible to build with a modern distribution in 2022.
  - Newer distributions have stopped delivering older tool chains.
  - Older distributions never provided good support for cross toolchains.

## Designing A Solution

Luckily a solution seems relatively straight forward but unfortunately very labor intensive. The gist is that we should be able to containerize most compliant build environments for x86_64/amd64 systems. From the appropriate build environment, in theory, we should be able to build a non-trivial number of cross compilation toolsets. For environments that are pre-x86_64/amd64, we'll need to employ emulation (i.e. qemu).

- Any syscall compliant Linux 2.6 distribution that has amd64/x86_64 support should be runnable in a Docker container.
  - I've personally been able to take this all the way back to Ubuntu Warty (4.10). 

A successful toolchain should be able to build itself, a range of linux kernels, and qemu.

A more lofty goal would be to setup completely static toolchains and environments. Often we can get old packages to build with old shared libraries and packages. This is less of an issue with containerization, although it is significantly more convienent when I can move something I've built with a container into a modern linux distribution. 

## Others Have Been Here

- Kegel Crosstool
- Crosstool-NG -->

`qemu-system-mipsel -m 256 -M malta -kernel ${KERNEL} -drive if=ide,format=raw,file=${IMAGE} -append "firmadyne.syscall=1 root=/dev/sda1 console=ttyS0 nandsim.parts=64,64,64,64,64,64,64,64,64,64 rdinit=/firmadyne/preInit.sh rw debug ignore_loglevel print-fatal-signals=1" -serial file:${WORK_DIR}/qemu.initial.serial.log -serial unix:/tmp/qemu.${IID}.S1,server,nowait -monitor unix:/tmp/qemu.${IID},server,nowait -display none -netdev socket,id=s0,listen=:2000 -device e1000,netdev=s0 -netdev socket,id=s1,listen=:2001 -device e1000,netdev=s1 -netdev socket,id=s2,listen=:2002 -device e1000,netdev=s2 -netdev socket,id=s3,listen=:2003 -device e1000,netdev=s3`

## Things That Worked

- Ubuntu Dapper 6.06 (w/ gcc-3.3)
  - Builds crosstool-0.43
    - Builds mipsel-unknown-linux-gnu/binutils-2.15-gcc-3.3.6-linux-2.4.26-glibc-2.2.5
    - Builds mipsel-unknown-linux-gnu/binutils-2.15-gcc-3.4.5-linux-2.6.9-glibc-2.3.6

- Ubuntu Hardy 8.04 (w/ gcc-4.2.3)
  - Builds crosstool-ng-1.19.0
    - Supports gcc-4.2.2 -> gcc-4.8.1
    - Supports glibc-2.8 -> glibc-2.17, uclibc-0.9.30 -> uclibc-0.9.33.2, eglibc-2_9 -> eglibc-2_17
    - Builds mipsel-unknown-linux-gnu/binutils-2.19.1a-gcc-4.3.2-linux-2.6.31.14-glibc-2.9 (crossgdb broken)
      - Builds linux 3.10.4 (mipsel)
    
    - binutils-2.19.1a-gcc-4.3.2-linux-2.6.27.62-glibc-2.9/mipsel-static-linux-gnu (w/o native-gdb)

- Ubuntu Focal 20.04 (w/ gcc-9.4.0)
  - Builds crosstool-ng-1.24.0
    - Supports gcc-4.9.4 -> gcc-8.3.0
    - Supports glibc-2.12.1 -> 2.28, uclibc-1.0.25 -> uclibc-1.0.31
    - Supports binutils-2.26.1 -> binutils-2.32
    - Supports linux-3.2.101 -> linux-4.20.8

    - binutils-2.32-gcc-8.3.0-linux-4.20.8-glibc-2.28/mipsel-static-linux-gnu
    - binutils-2.32-gcc-7.4.0-linux-4.20.8-glibc-2.28/mipsel-static-linux-gnu
    - binutils-2.32-gcc-6.5.0-linux-4.20.8-glibc-2.28/mipsel-static-linux-gnu
    - binutils-2.32-gcc-5.5.0-linux-4.20.8-glibc-2.28/mipsel-static-linux-gnu
    - binutils-2.32-gcc-4.9.4-linux-4.20.8-glibc-2.28/mipsel-static-linux-gnu
    - binutils-2.32-gcc-4.9.4-linux-3.2.101-glibc-2.28/mipsel-static-linux-gnu

    

    - RUNNING: time ./run-ct-ng-1.24.0.sh ct-ng -C /opt/builds/binutils-2.32-gcc-4.9.4-linux-4.20.8-glibc-2.28/mipsel-static-linux-gnu CT_PREFIX=/opt/x-tools/binutils-2.32-gcc-4.9.4-linux-4.20.8-glibc-2.28 build 

  - Builds crosstool-ng-1.25.0

    - binutils-2.38-gcc-11.2.0-linux-5.16.9-glibc-2.28/mipsel-static-linux-gnu

    time ./run-ct-ng-1.24.0.sh ct-ng -C /opt/builds/binutils-2.38-gcc-11.2.0-linux-5.16.9-glibc-2.28/mipsel-static-linux-gnu CT_PREFIX=/opt/x-tools/binutils-2.38-gcc-11.2.0-linux-5.16.9-glibc-2.28 build 




GCC_EXTRA_CONFIG="${GCC_EXTRA_CONFIG} --enable-static LDFLAGS=-static-libgcc"
BINUTILS_EXTRA_CONFIG="${BINUTILS_EXTRA_CONFIG} LDFLAGS=-all-static"
GLIBC_EXTRA_CONFIG="--enable-static-nss --disable-shared"


${BINUTILS_BUILD_MAKE_FLAGS}
BINUTILS_INSTALL_MAKE_FLAGS
GCC_CORE_BUILD_MAKE_FLAGS
GCC_CORE_INSTALL_MAKE_FLAGS
GLIBC_BUILD_MAKE_FLAGS
GLIBC_INSTALL_MAKE_FLAGS
LIBIBERTY_MAKE_FLAGS
GCC_BUILD_MAKE_FLAGS
GCC_INSTALL_MAKE_FLAGS

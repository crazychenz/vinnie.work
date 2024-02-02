# Debugging Linux Kernel with QEMU (on x86_64)

When dealing with embedded systems, you can very quickly find yourself falling down a rabbit hole when something doesn't go to plan.

* Is it my wiring?
* Is it the board?
* Is it electrostatic energy?
* Is it noise on the unshielded jumper wires?
* Did some magic smoke escape the chip?

Following all of those questions, depending on your knowledge and resources, you may find yourself pulling out an oscilloscope or logic analyser just to prove to yourself that its not the hardware but the software process that is screwed up. In contrast, we can focus on the lower hanging fruit by ironing out our debug process with a little practice on the world famous emulator qemu.

qemu provides an aarch64 SMP system emulation that we can use to mockup the Raspberry Pi core. Setting this up from scratch takes quite a bit of machine time, but shouldn't take nearly as many man hours (unless you are the kind of person that love to just watch the compiler messages scroll by!) Plus, while you wait for the environment to build itself, you can spend that time double checking all your hardware environmental variables.

## The Plan

Right, so the plan here is to build a cross-compiler, kernel, and user space that can be debugged with GDB from a different host. The two driving pieces of software required for this are qemu and buildroot. I'll be building everything with Ubuntu 20.04 (focal) for consistency.

Once we have a running aarch64 buildroot-based system running in qemu, we will attach to that system with a cross-toolchain version of GDB. Using GDB and the kernel symbols of the system we just built, we should be able to step through the kernel using hardware breakpoints and symbols.

TODO: Determine if we should build are own bare metal runtime.

## Setup The Environment

### Install QEMU

Install qemu from the Ubuntu apt package management system.

```sh
sudo apt-get install qemu qemu-efi-aarch64 qemu-system-arm
```

### Configure Buildroot

Download and configure buildroot.

*Notes:*

* libncurses-dev required for buildroot menuconfig
* libssl-dev required for buildroot kernel build

```sh
wget https://buildroot.org/downloads/buildroot-2020.02.7.tar.bz2
sudo apt-get install build-essential libncurses-dev libssl-dev
tar -xf buildroot-2020.02.7.tar.bz2
cd buildroot-2020.02.7
make defconfig
make menuconfig
```

**Target Options:**

Notice *all* options.

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

TODO: Grab **Linux Kernel Options:**

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

Notice the `Enable compiler cache` option. We enable this so that when we want to update options the build should reuse as much of the previous build as possible. Make only prevents rebuilding things already built whereas ccache will cache objects already built that may have been cleaned by make. To clear ccache, run `path/to/ccache -C`.

TODO: Find relative path the ccache for buildroot.

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

Build build buildroot. *This step could take hours*, but take care to check in about every 15 minutes because you never know when some compiler error or warning will pop up and halt the whole build process. It's also worth noting that this build will likely take up over 11 GiB of hard disk space.

TODO: Determine disk space of build.

```sh
make
```

**Note:** "Explicit cleaning is required when any of the architecture or toolchain configuration options are changed." - [Buildroot Manual](https://buildroot.org/downloads/manual/manual.html#make-tips) i.e. Use "`make clean`" after updating toolchain configs.

To rebuild kernel after new configuration without clean:

```sh
rm -rf output/build/linux-5.4.70/{.stamp_built,.stamp_configured}
```

TODO: Determine if these are useful?

```sh
make V=0?
make list-defconfigs?
```

When the build completes (assuming everything worked as intended), you should find all the relevant build artifacts in the `output` folder.

## Run QEMU with Buildroot Kernel

```sh
qemu-system-aarch64 -machine virt -cpu cortex-a72 -machine type=virt -nographic -smp 1 -m 2048 -monitor telnet:127.0.0.1:1234,server,nowait -kernel buildroot-2020.02.7/output/images/Image 
```

It should crash.

Now run qemu so the system halts before it starts so we can attach GDB to it.

```sh
qemu-system-aarch64 -machine virt -cpu cortex-a72 -machine type=virt -nographic -smp 1 -m 2048 -monitor telnet:127.0.0.1:1234,server,nowait -kernel buildroot-2020.02.7/output/images/Image -S -gdb tcp::3333
```

Attach gdb from another terminal.

```sh
./buildroot-2020.02.7/output/host/bin/aarch64-linux-gdb ./buildroot-2020.02.7/output/build/linux-5.4.70/vmlinux
```

Output should resemble:

```text
GNU gdb (GDB) 8.2.1
Copyright (C) 2018 Free Software Foundation, Inc.
License GPLv3+: GNU GPL version 3 or later <http://gnu.org/licenses/gpl.html>
This is free software: you are free to change and redistribute it.
There is NO WARRANTY, to the extent permitted by law.
Type "show copying" and "show warranty" for details.
This GDB was configured as "--host=x86_64-pc-linux-gnu --target=aarch64-buildroot-linux-uclibc".
Type "show configuration" for configuration details.
For bug reporting instructions, please see:
<http://www.gnu.org/software/gdb/bugs/>.
Find the GDB manual and other documentation resources online at:
    <http://www.gnu.org/software/gdb/documentation/>.

For help, type "help".
Type "apropos word" to search for commands related to "word"...
Reading symbols from ./buildroot-2020.02.7/output/images/vmlinux...done.
(gdb)
```

Now set a break point and run:

```text
(gdb) target ext :3333
Remote debugging using :3333
0x0000000040000000 in ?? ()
(gdb) break start_kernel
Breakpoint 1 at 0xffff8000112e0a00: file init/main.c, line 578.
(gdb) continue
Continuing.

Breakpoint 1, start_kernel () at init/main.c:578
578     {
(gdb)
```

**Note: You can always kill a qemu-system process with Ctrl-a x.**

```sh
sudo apt-get install qemu qemu-efi-aarch64 qemu-system-arm
mkdir /projects/playground/qemu-aarch64
cd /projects/playground/qemu-aarch64
wget http://cloud-images.ubuntu.com/minimal/releases/focal/release-20201106/focal-minimal-cloudimg-amd64.img

dd if=/dev/zero of=flash0.img bs=1M count=64
dd if=/usr/share/qemu-efi-aarch64/QEMU_EFI.fd of=flash0.img conv=notrunc
dd if=/dev/zero of=flash1.img bs=1M count=64

sudo qemu-system-aarch64 -nographic -machine virt,gic-version=max -m 2G -cpu max -netdev user,id=vnet,hostfwd=:127.0.0.1:0-:22 -device virtio-net-pci,netdev=vnet -drive file=buildroot-2020.02.7/output/images/vmlinux,if=none,id=drive0,cache=writeback -device virtio-blk,drive=drive0,bootindex=0 -drive file=./flash0.img,format=raw,if=pflash -drive file=./flash1.img,format=raw,if=pflash -smp 4
```

$ mkdir mnt
$ sudo losetup -f -P ubuntu.img
$ sudo losetup -l
NAME       SIZELIMIT OFFSET AUTOCLEAR RO BACK-FILE                                DIO LOG-SEC
/dev/loop0         0      0         0  0 ubuntu.img   0     512
$ sudo mount /dev/loop0p2 ./mnt
$ ls ./mnt/boot
config-4.15.0-88-generic  grub                          initrd.img-5.5.11             System.map-5.5.11          vmlinuz-5.5.11
config-5.5.11             initrd.img                    initrd.img.old                vmlinuz                    vmlinuz.old
efi                       initrd.img-4.15.0-88-generic  System.map-4.15.0-88-generic  vmlinuz-4.15.0-88-generic
$ cp ./mnt/initrd.img-5.5.11 .
$ sudo umount ./mnt
$ sudo losetup -d /dev/loop0

## Ubuntu aarch64 toolchain

Although Ubuntu makes aarch64 toolchain available, using buildroot's toolchain gives us better cohesion?

```sh
sudo apt-get install gcc-aarch64-linux-gnu g++-aarch64-linux-gnu binutils-aarch64-linux-gnu binutils-aarch64-linux-gnu-dbg cpp-aarch64-linux-gnu pkg-config-aarch64-linux-gnu libncurses-dev
```

## Building Buildroot

*libncurses-dev - needed for buildroot menuconfig.*

```sh
sudo apt-get install build-essential libncurses-dev
make defconfig
make menuconfig
Selected Targets and changed to aarch64, cortex-a75 (kept ELF).
make
```

## References

[How to debug kernel using QEMU and aarch64 VM.](https://futurewei-cloud.github.io/ARM-Datacenter/qemu/aarch64-debug-kernel/)

[Ubuntu QEMU aarch64](https://wiki.ubuntu.com/ARM64/QEMU)

[How to install the aarch64 toolchain for armv8 cortex-a53 on Debian?](https://stackoverflow.com/questions/38025275/how-to-install-the-aarch64-toolchain-for-armv8-cortex-a53-on-debian)

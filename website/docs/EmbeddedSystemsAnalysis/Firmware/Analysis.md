---
sidebar_position: 4
title: 🔍 Analysis
---

:::danger Incomplete

This document is not yet written.

:::

## Overview

Up to this point we've been observing the target device and its properties to gain access. This access could be for more analysis, but often the real end goal is some persistent effect. This could be a mended binary for a broken game or other bug, a new feature for some business application, or simple an adjustment in some options that there is no user interface for. To accomplish this you'll want to capture and modify the firmware of the device.

Target devices can have multiple firmware image spread across multiple chips. For example, a cell phone device might have the main micro controller firmware and a base-band firmware. This material focuses on a target devices with a single firmware image, but these same tools and techniques could be used on platforms with multiple firmware as well.

## Identification

Assuming you've downloaded the target device firmware using something like system level access (i.e. root access to download the /dev/mtd devices) or in-circuit extraction (i.e. reading a SPI chip directly), you should now have some sort of opaque binary.

There are quite a few tool to help identify a file and its contents. The first two that I always use are `file`, and `binwalk`.

### `file`

`file` was originally developed by AT&T Bell Labs. Its part of the SysV standard and therefore its everywhere. Its primary role is to identify file types based on the files content. It does this through the use of an array of what are called magic numbers. They are basically very simply signatures that can be used very quickly to identify the file type.

For example:

- `1fh 8bh` @ 0h - GZIP
- `75h 73h 74h 61h 72h` ("ustar") @ 101h - TAR
- `4dh 5ah` ("MZ") @ 0h - PE File (i.e. Microsoft Executable)
- `23h 21h` ("#!") @ Shell Script

File also has some other rudimentary parsing capabilities to give more context to the files it identifies. Some examples:

```text
$ file /bin/ls
/bin/ls: ELF 64-bit LSB shared object, x86-64, version 1 (SYSV), dynamically linked, interpreter /lib64/ld-linux-x86-64.so.2, BuildID[sha1]=2f15ad836be3339dec0e2e6a3c637e08e48aacbd, for GNU/Linux 3.2.0, stripped
```

```text
$ file /etc/passwd
/etc/passwd: ASCII text
```

```text
$ file /etc/init.d/udev
/etc/init.d/udev: POSIX shell script, ASCII text executable
```

### `binwalk`

`binwalk` was written by Craig Heffner in 2010. To over simplify `binwalk`, it basically walks through a binary and looks for file signatures along the way. You could think of this as running `file` from each offset in a binary to find other embedded binaries. 

`binwalk` comes preinstalled in Kali Linux, but many distributions do not include it by default. You can install it on Ubuntu with: `sudo apt-get install binwalk`. You can also find the source on GitHub at [ReFirmLabs/binwalk](https://github.com/ReFirmLabs/binwalk).

**Note**: On ubuntu there is a nasty enum issue that may crop up with `binwalk`. It has to do with an uninstallable enum34 package that is in `/usr/lib/python3.8/site-packages/enum`. Google results elluded to the issue but no one actually assumed the enum43 package could not be uninstalled by `pip`. I fixed this by running:

```sh
PYPLATLIB=$(python3 -c "import sysconfig as _;print(_.get_paths()['platlib'])")
sudo -E mv $PYPLATLIB/enum $PYPLATLIB/enum_goaway
```

Ok ... some `binwalk` examples. If we run `binwalk RT-N10_1.0.2.4.trx` to analyze the firmware upgrade for an ASUS router, we'll see:

```text
$ binwalk RT-N10_1.0.2.4.trx

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
0             0x0             TRX firmware header, little endian, image size: 3870720 bytes, CRC32: 0xB25F027E, flags: 0x0, version: 1, header size: 28 bytes, loader offset: 0x1C, linux kernel offset: 0xB8F04, rootfs offset: 0x0
28            0x1C            gzip compressed data, maximum compression, has original file name: "piggy", from Unix, last modified: 2010-12-02 01:10:14
757508        0xB8F04         Squashfs filesystem, little endian, version 2.0, size: 3109870 bytes, 489 inodes, blocksize: 65536 bytes, created: 2010-12-02 01:10:46
```

Looking at the above data, we see that there is some kind of `TRX` header that seems to contain a `loader` and a `linux kernel` which is oddly identified as a SquashFS. Interestingly, there doesn't seem to be a `rootfs`. At this point we could extract the relevant pieces of the TRX image with `dd`. But instead, I'll run `binwalk` with its own recursive extraction process:

<details>
<summary>Click to see complete binwalk output.</summary>

```text
$ binwalk -eM RT-N10_1.0.2.4.trx
Scan Time:     2021-11-12 10:37:51                                                                   
Target File:   /projects/stable/vinnie.work/website/docs/EmbeddedSystemsAnalysis/Firmware/Analysis/RT
-N10_1.0.2.4.trx
MD5 Checksum:  5e6e9537823004e45d834284541b9077
Signatures:    391
                                                                                                     
DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------                     
0             0x0             TRX firmware header, little endian, image size: 3870720 bytes, CRC32: 0xB25F027E, flags: 0x0, version: 1, header size: 28 bytes, loader offset: 0x1C, linux kernel offset: 0xB8F04, rootfs offset: 0x0                                                                           
28            0x1C            gzip compressed data, maximum compression, has original file name: "piggy", from Unix, last modified: 2010-12-02 01:10:14
757508        0xB8F04         Squashfs filesystem, little endian, version 2.0, size: 3109870 bytes, 489 inodes, blocksize: 65536 bytes, created: 2010-12-02 01:10:46
                                                                                                     

Scan Time:     2021-11-12 10:37:51
Target File:   /projects/stable/vinnie.work/website/docs/EmbeddedSystemsAnalysis/Firmware/Analysis/_RT-N10_1.0.2.4.trx.extracted/piggy
MD5 Checksum:  0f28633527fd20261ce6b1002ad6edeb
Signatures:    391

DECIMAL       HEXADECIMAL     DESCRIPTION
--------------------------------------------------------------------------------
1393168       0x154210        Linux kernel version 2.4.20
1411996       0x158B9C        Unix path: /usr/lib/libc.so.1
1449968       0x161FF0        CRC32 polynomial table, little endian
1484168       0x16A588        Certificate in DER format (x509 v3), header length: 4, sequence length: 4736
1484188       0x16A59C        Certificate in DER format (x509 v3), header length: 4, sequence length: 4736
1494303       0x16CD1F        Copyright string: "Copyright 1995-1998 Mark Adler "
```

</details>

Once the command is complete, you'll notice that you now have a new `_RT-N10_1.0.2.4.trx.extracted` folder. In this folder you'll find the original binaries that we identified with our first binwalk run (i.e. `loader` and `linux kernel`). You'll also find an additional `squashfs-root` folder where the SquashFS was recursively (and successfully) extracted to. Looking through this SquashFS, you'll notice that you now have access to the entire firmware's root file system (and without ever even loading it onto a target device).

Its at this point that you can continue with your analysis to determine how to reassemble the extracted bits so that you can apply any changes or start analyzing the software and determining what changes need to be made. We'll talk more about assembly in the next section.

`binwalk` is a very powerful and handy tool to have for very quick triage of what could be lurking in various firmware files with minimal effort.

## Unpacking Overview

We've already talked a bit about unpacking with regards to `binwalk` recursive extraction process. While this is a great start, you really need to understand what all is getting unpacked so that nothing is lost or forgotten in the assembly process. There are a few common image formats that you should ceptually understand and know how to use (With tools) to jump into firmware unpacking:

## Boot Images

There are several different kinds of boot images that combine a boot loader, kernel, file system, and configuration into a single file. More popular flavors of these includes the legacy U-Boot image format, the FDT/DTB U-Boot image format and the TRX image format.

These boot images include the meta data required to extract the parts of the system, such as the offsets, size, compression, and type of entry. You can think of it as a sort of Master Boot Record or partition table that lives on an HDD.

U-Boot is open source and therefore its file formats are very well known. You can install `uboot-utils` package in Ubuntu/Debian and then use the `mkimage` tool to generate or modify existing u-boot images. You can also generate a FDT/DTB U-Boot image with any FDT/DTB tools available. Note: FDT is a flattened device tree and DTB is a device tree binary. These are the same, but essentially are a description language that is used by the kernel to describe the layout and configurations of systems. Often there is a kernel version of the device tree and a boot loader version of a device tree. The boot loader version can include the whole kernel and root filesystem.

## Root/Init File System Formats

There are many root file system formats. Depending on the required functionality of the root filesystem, you'll likely see different format selections. For example, if the root filesystem is intended to be writable, you'll likely see it in a UBIFS, JFFS2, or YAFFS2 file system format. For read-only functionality, cpio, cramfs, and squashfs are popular options.

### Read/Write File Systems

Embedded systems often store their non-volatile data on flash. Since flash wears out, there is a conceptual need for wear leveling. This means that instead of reusing the same flash erase block over and over, the file system deliberately spreads its writes over the entire flash chip to prevent favoring any one erase block and immaturely wearing it out.

- JFFS/JFFS2 - Journaling Flash Filesystem is readable and writable. It works on NOR and NAND flash but requires a minimum of 5 free erase blocks to work. For example, if you had 128K erase block sizes, you're JFFS2 partition could be no less than 640K. Note: JFFS2 is no longer maintained, but it is supported in the Linux Kernel. While it does work well, when you don't have those spare erase blocks, disk space leakage may occur (i.e. when you delete a file, you can't regain the space because JFFS2 doesn't have the space to safely defragment the data across erase blocks safely.) JFFS2 data is primarily broken into two areas, inode metadata and file data. The former is completely loaded into memory when the file system is mounted to keep performance up. You manage jffs2 images with `jffs2dump`, `jffs2reader`, and `mkfs.jffs2` from the `mtd-utils` package.

- YAFFS - Yet Another Flash File System is designed to work with NAND and NOR flash devices. This file system is very similar to JFFS2 except that because it doesn't load everything into memory at once, it has lower memory requirements than JFFS2. YAFFS arguably has a cleaner and more performant garbage collector (so says its author). You manage yaffs2 with tools from [aleph1.co.uk](https://www.aleph1.co.uk/yaffs2), `mkyaffs2image`. It doesn't appear that Ubuntu has official support, but you can extract yaffs2 images with `unyaffs` from the `unyaffs` package.

- UBIFS - The spiritual successor to JFFS2 is the Unsorted Block Image File System (UBIFS). I think of UBIFS as the LVM of the flash world because it can unify and span multiple flash chips. When you create a UBIFS image, you are just creating the file system content. It then needs to be converted into a UBI image which is what gets written to actual flash.

  To summarize:

    1. Gather file system content.
    2. Create `ubifs` image with `mkfs.ubifs`
    3. Create UBI image with `ubinize` to directly write to flash OR load the UBIFS image into device and update the flash locally with `ubiupdatevol`.

### Read-Only File Systems

Embedded systems that don't have a need to support writable root file systems or any file system can use more space efficient or simple file system formats. Read-only file systems don't have to worry about wear leveling because they only get erased and written during firmware updates.

- SquashFS - SquashFS is a very commonly used read-only file system. This is because it has a bunch of flexibility with regards to how it manages compression and erase block sizes. It also supports Linux extended attributes and LZMA compression. In my experience, this is the most common read-only file system I've seen that isn't a kernel CPIO archive.

- Cramfs - Cramfs is much older than SquashFS and has a lot less flexibility. That said, its simplicity allowed it to have upstream kernel support as early as kernel 2.4.0 (it actually showed up in the 2.3 dev release cycle). Here is a commonly used comparison chart from the net:

  ```text
                              Squashfs    Cramfs

  Max filesystem size:          2^64        256 MiB
  Max file size:                ~ 2 TiB     16 MiB
  Max files:                    unlimited   unlimited
  Max directories:              unlimited   unlimited
  Max entries per directory:    unlimited   unlimited
  Max block size:               1 MiB       4 KiB
  Metadata compression:         yes         no
  Directory indexes:            yes         no
  Sparse file support:          yes         no
  Tail-end packing (fragments): yes         no
  Exportable (NFS etc.):        yes         no
  Hard link support:            yes         no
  "." and ".." in readdir:      yes         no
  Real inode numbers:           yes         no
  32-bit uids/gids:             yes         no
  File creation time:           yes         no
  Xattr support:                yes         no
  ACL support:                  no          no
  ```

- CPIO - This is a general file archive format. Every 2.6 kernel has a `cpio` archive included in its binary. If the configuration doesn't require the archive, its empty but still there. When the CPIO archive is used during a kernel boot, the kernel mounts an in-memory `ramfs` and extracts the CPIO archive there for use. 

  **Note**: A `ramfs` is a simple virtual filesystem that has no serializable format. It is purely for in-memory only file use. While `ramfs` has no bounds, `tmpfs` is bounded and therefore safer for end-user use.



### Loopback Mounting

For some of the file systems, if you have the module support in your developer workstation, you can often mount them for analysis purposes.

```sh
mkdir mountpt
sudo mount -o loop,ro rt10n.squashfs /mountpt
```

### Qemu Image Utility

Qemu comes with a tool called `qemu-img`. This tool is intended for conversion of virtual machine file formats between different hypervisors. The nice thing about this tool is that it can accept `raw` as an input/output format. This means that you can grab a firmware of a HDD, flash, or any other file system and convert it to a image that can be then loaded by a virtual machine. This can provide a safer sandbox for performing required analysis of a image instead of polluting your development environment with a bunch of tools you aren't sure you'll be using any time soon.

## Binary Analysis

Whether you are working with boot images, file system images, or actual executable binary files, there are tools that you should be familiar with to effectively work with binaries. This doesn't mean that you'll be using only these tools, its the fundamentals for being able to work with the bigger utilities like Ghidra, Radare/Rizin, and so forth.

- xxd - This is a hex dumper/viewing program.
- od - `od` stands for octal dump and is usually everwhere `xxd` is not. You can use `od` to view octal or hex output.
- strings - This is a simple utility for displaying printable strings from binaries. *What is a reason that'd you'd want to do this? What kinds of strings are best?
- cat - We know `cat` as a file dumper, but this is because cat implicitly dumps binary input to STDOUT. `cat` is also a great tool for sequentially reading data from any file (including device files) and dumping the output to any other file descriptor. `cat` is what I always use to extract `/dev/mtd` data.

  ```sh
  cat /dev/mtd0ro > /tmp/mtd0
  ```

- echo/printf - `echo` and `printf` are the tools you'll want to be familiar with to inject arbitrary input into a file or device without having to create a file to `cat` with. For example, echoing 4 bytes to replace and instruction is easier than having to create the file with only four bytes.

- grep - Your king of text searching in *nix systems, this tool can also be used for analyzing /proc and /sys file system attributes. One handy trick I like is using grep to display `/proc` file contents. For example, to show udp attributes you can run something like: `grep -H . /proc/sys/net/ipv4/udp*` which returns:

```text
udp_early_demux:1
udp_l3mdev_accept:0
udp_mem:380244  506992  760488
udp_rmem_min:4096
udp_wmem_min:4096
```

### ELF Files

- objdump - Nearly everything I would ever need for parsing ELF files can be obtained from `objdump`. It parses ELF headers, it disassembles, and it can associate source with assembly if built with debug symbols. It shows dynamic and static symbols and can handle many other ELF conventions.
- readelf - This is a more simply tool than `objdump` but provides some nicely formatted output for reading ELF headers and sections.
- nm - This is the binary used if all you want is a list of symbols in an ELF file. The advantage of `nm` over `objdump` is that the output is easily parsable. You could parse `nm` output in a couple lines of python or even bash shell script.
- ar - "The archiver" is the tool that is used to generate static libraries. It actually is just an archive utility like tar. The primary difference is that tar is designed for streaming to tape whereas `ar` is not.

### Binary Analysis Tool Suites

- [Ghidra](https://ghidra-sre.org/) - *A software reverse engineering (SRE) suite of tools developed by NSA's Research Directorate in support of the Cybersecurity mission.*

- [Rizin](https://rizin.re/) / [Radare2](https://rada.re/n/) - Rizin and Radare2 are forks of each other. Rizin touts itself as the more socially open minded variant of Radare2, but technically the accomplish the same thing: *A free/libre toolchain for easing several low level tasks like forensics, software reverse engineering, exploiting, debugging*, and so forth.

### Debuggers

<!-- TODO: This feels under represented compared to its value. -->

gdb - The GNU debugger.

gdbserver - Part of the `gdb` source code, the `gdbserver` is a light weight (only 100s of KiB) debugger that can act on behalf of a `gdb` client from the developer machine. This is especially useful when on resource contrained systems where having a multi-megabyte `gdb` binary isn't an option. Additionally, you get the benfit of having a larger pre-configure `gdb` environment ready to attach to any target that has a `gdbserver`.

pwndbg - This is one of my favorite `gdb` plugins. It turns the GDB terminal window into a multipane view of all the aspects of debugging that you come to expect.

VSCode - This is another ok `gdb` client that can be used from a number of different platforms. VSCode requires a bit more setup than `target remote ...`, but for longer running debug sessions it can be a nicer user experience.

### Emulators

When performing analysis, debugging, and development for embedded systems, nothing beats being able to test code and applications on the actual hardware. The trouble is that this can drastically slow down development and testing because of the time and complexity that may be required to flash images to a device. Often, you have to be co-located with the target device. Finally, when working on a team, having multiple devices for every engineer doesn't scale very well.

Instead, you can consider using emulation technology:

- [qemu](https://www.qemu.org/) - Arguably the best known emulator. Qemu tightly couples CPU architectures with an array of system definitions that can be used for testing cross-compiled code on your ARM/X86 developer machine. QEMU is [open source](https://github.com/qemu/qemu) so you can always build your own system definitions and rebuild QEMU for the additional support.

- [Renode](https://renode.io/) - Renode took a different take on emulation from qemu. Instead of building the system descriptions directly into the product, `renode` allows the user to define the system in a set of flat description files. This creates quite a flexible system for working with unknown or uncommon embedded systems.

- [Unicorn Engine](https://www.unicorn-engine.org/) - Unicorn engine doesn't have any system definitions or peripherals. It specializes in emulating only the CPUs. The makes it a key component in a whole number of other useful products. Check out the [Unicorn Showcase](https://www.unicorn-engine.org/showcase/) for more information.

### Virtual Machines

Virtual Machines run on what are called hypervisors. This is the bridge orchestration software that transparently runs between the computation resources and the virtual machine's kernel or running applications. There are 2 types of hypervisors:

- Type 1: Run directly on bare metal (i.e. no OS). Typically used for cloud technologies.
- Type 2: Run within an operating system and are usually more end-user friendly.

The following are some Type 2 hypervisors:

- [VMWare](https://www.vmware.com/) - The "system administrator's" hypervisor. VMWare requires $$ licenses, but the Player can be used free of charge.
- [Virtual Box](https://www.virtualbox.org/) - Oracles cross platform hypervisor.
- [Parallels](https://www.parallels.com/) - A hypervisor for Mac OSX.
- [Hyper-V](https://docs.microsoft.com/en-us/virtualization/hyper-v-on-windows/about/) - Microsoft's hypervisor for Windows 10+ (Also used for WSL2.)
- [KVM](https://www.linux-kvm.org/page/Main_Page) - Linux's Hypervisor

**Note**: Its typical that only a single type-2 hypervisor can run at a time in an OS. In other words, you can not run both KVM and VirtualBox on linux simutaneously. You also can not run Virtual Box and Hyper-V (or WSL) simultaneously on a Windows machine. So choose wisely my friend...

When performing both emulation and virtualization of highly heterogenous (i.e. very different) systems, I often opt to use the KVM hypervisor. This usually gives me the most options for the least amount of cost. For a better user experience, using a tool like `virt-manager` is recommended.

## Resources

- [Wikipedia List Of Signatures](https://en.wikipedia.org/wiki/List_of_file_signatures)
- [Preparing a Linux build with YAFFS2](https://yaffs.net/videos/preparing-build-linux-yaffs)
- [UBIFS how to](http://www.linux-mtd.infradead.org/faq/ubifs.html#L_mkfubifs)
- [LWN Compressed Filesystems](https://lwn.net/Articles/219827/)
- [Linux Journal about CPIO (1996)](https://www.linuxjournal.com/article/1213)
- [Why use CPIO for initramfs?](https://unix.stackexchange.com/questions/7276/why-use-cpio-for-initramfs)
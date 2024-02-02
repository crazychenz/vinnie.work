---
sidebar_position: 5
title: 📐 Integration
---

:::danger Incomplete

This document is not yet written.

:::

## Overview

Assuming your goal is to somehow change the software or firmware of a target device: Once you've successfully extracted the firmware and implemented a plan to apply the change, you'll need to reconstruct the firmware so that you can re-flash it into the system.

## Kernels and Boot Loaders

When re-assembling firmware for an embedded system, the systems sometimes have cleanly separated partitions where one area is for boot loading, one area is for kernel, one area for root file system, and one area for configuration. Other times, systems will combine these into a single partition or some hybrid of the two. In all of these cases, whenever possible its best to leave as much the same as possible. This is especially true for the boot loader and kernel. While we can build our own kernels and boot loaders, these are the areas of the firmware where it is most likely that there are hardware specific changes made by the vendor that we can not easily re-produce. In most cases, our best course of action is to work around what is already in the kernel and boot loader by only making modifications to the root file system and configuration sections of flash.

## Firmware Mod Kit

A general strategy to re-create a similar build process as the vendors of the target device. For example, If you are working with a SquashFS in a U-boot image, you want to find the same SquashFS version and the same U-boot version. Then you want to determine the parameters that were used in each of these? In other words, what parameters can you put into the tools that will generate a close enough looking binary.

SquashFS is a common embedded filesystem that is especially squirrel-y when it comes to image construction. This is for many historical reasons, but suffice to say that before SquashFS (version 4) was up-streamed into the Linux Kernel, everyone had to patch SquashFS into their kernel as an out-of-tree patch. This created many forks and variants of SquashFS. Tools like `sasquatch` can unpack different variants and manual unpacking via binwalk only help the extraction process. *How do we reconstruct the original binary?*

The [Firmware Mod Kit](https://github.com/rampageX/firmware-mod-kit) is a repository of common legacy embedded filesystems and utilities for the purpose of rebuilding firmware images of older embedded systems. Within that repository alone, there are no less than 20 SquashFS variants! Sometimes you can wing it and just get one that works with a close enough version to match the running kernel. Other times you need to get the variant exact which can mean building a dozen SquashFS `mksquashfs` versions until you get the correct one.

A method for measuring your success is to find a canonical way to dump the state of the image extraction. For example, write a shell script that runs `sasquatch` between the original image and your rebuilt image with various descriptors dumped to a file for each image. Then determine the delta between the images with `diff`.

<!-- TODO: Show example of using FMK and `sasquatch`. -->

## Other Common Tools

Aside from the Firmware Mod Kit, there are a number of other resources and tools that can be considered:

- OpenWRT / DDWRT / LEDE / Yocto / Buildroot - These are all communities that specialize in the building and development of embedded systems. In many cases you can even assume that a vendor has used these open source suites themselves to build their system. Therefore you can use these same frameworks to assist with rebuilding your own firmware images.

- When building file systems like `squashfs` or `jffs2`, there is usually a `mkfs.*` or `mk*` utility for building that file system. Using tab completion in the linux shell can lead you to what packages you have on you system. Also using tools like `apt-file`, `apt-cache`, `yum provides` and `dnf provdes` are good ways to find what tools are easily available.

- If you have root or shell access to the target device or its firmware via emulation/virtualization, the tools you need may be right there on the target system.

- `dd` with `conv=notrunc` is usually available for overlaying binaries into other binaries in a pinch.

<!-- TODO: Show example. -->

- `chroot`/`fakeroot` - Many embedded systems run in single user mode and that user is `root`. When you create a CPIO or other file system from your user account, you may be using files that have your `uid` and not `root`'s id. Some times this is unavoidable based on the way that cpio or tar are executed through another build process. To work around this, use tools like `chroot` or `fakeroot` to ensure that any indirect calls to packages are assuming the contents should be either copied as-is or as `root`.

<!-- TODO: Show fakeroot initramfs build example. -->

- [`pax`](https://www.gnu.org/software/paxutils/) is another packaging format and tool. While this tool primarily focuses on its own `pax` format (a variant of `tar`), it also supports `cpio` and `tar`.

<!-- TODO: Show example. -->

- [`cpio`](https://www.gnu.org/software/cpio/) - Packing tool used to package the `initramfs` for all 2.6.13+ Linux Kernels. It is also used for packaging `initrd` images for the kernel.

<!-- TODO: Show initramfs build example. -->

- [`xz`](https://tukaani.org/xz/) / [`lzma`](https://tukaani.org/lzma/) - A modern compression algorithm that achieves very space efficient compression. Note: `xz` can not always reproduce legacy `lzma` as desired. In this case, you really should consider building the original `lzma` code.

<!-- TODO: Show the difference between `xz` and `lzma`. -->

## Things To Consider

### Integrity Checks

Even modification of a few bytes in a firmware with a hex editor can create a whole host of issues. The first is that there are usually hashes and digest (i.e. CRC checks) to protect the device against bad data from flash. Note: Embedded systems checking for data irregularities is not to protect it against you modifying the system, its more likely to protect the system from hardware failure. Remember that memory, just like all physical things, can wear out over time and return bad data.

### Signature Checks

Sometimes target devices will check the signature of an image. In contrast to a CRC, this is a security feature to ensure that only firmware from the vendor will load. In the event that you determine a firmware won't boot without a proper signature, you'll need to do one of the following:

- Remove the signature check
- Replace the verification key with a verification key you control
- Implement your own signature check

## Testing The Firmware

Once you have a fully built firmware image, how do you know it works? **DO NOT BLINDLY FLASH TO MTD DEVICE IF YOU HAVE ANY OTHER OPTIONS!** Sometimes your only option is to pull the trigger and flash the firmware for your first test. This can be acceptable if you have a hardware based method for flash reading **and** writing (e.g. socketed flash, test clips with flasher device). If your access is software based, there are several other options to consider first.

### U-Boot Testing

One of the easiest ways to test new firmware images is to use the functionality of U-boot (if available). U-boot may have been built with the ability to boot from an image hosted from a TFTP service. U-boot can also be made to download images over ethernet, usb, or other removable media. 

### JTAG Testing

If you don't have u-boot but you have been able to gain control of the internal state of an MCU via JTAG, you should be able to restart the system and halt on boot. Then during your OpenOCD session, you can load the bits of the firmware into memory as if you were the boot loader. You can also stack this method with the previous where you can load a U-boot image into memory and run it. Then from u-boot run a firmware or kernel+rootfs directly from u-boot.

### Recovery Mode Testing

Many commercially available embedded system with a web interface or console have some sort of recovery mode. If you can reliably get to this recovery mode, this is generally a safe way to re-flash the firmware. This is because you can usually presume that the recovery mode is not going to over-write itself with your firmware. In contrast, if you wrote your firmware to flash directly, you may over-write any recovery code that existed.

### Hardware Supported Boot Mode Selection

Sometimes the hardware itself will support a boot mode selection. This could be as simple as pulling a particular pin high or low on the PCB. It could also involve looking for the first validly boot-able partition in some given/configurable boot priority. For example, the RaspberryPi 4 can be configured to boot from an SDCard and if no SDCard exists it will attempt to boot from the network.

### Vendor Provided Firmware Updater

Most commercially available embedded systems with a web interface or console will have some kind of *Firmware Update* functionality available. This can often be a low risk way to not only re-flash a device but re-flash with integrity. Since this is an interface intended for end-users it'll likely include a bunch of checks to ensure that the image is complete and has integrity before performing the flash.

## Flashing

Once you are comfortable with the actual firmware image, you need to ensure that you know how you intend to flash your firmware to the device. Flash isn't all created equal. As mentioned in the Memories section, flash can be NOR or NAND and the communication layers that exist between user space and those different flash chips will vary from system to system.

Often the easiest path is to access the flash directly via the MTD device in linux. These are often labeled as `/dev/mtdX` or `/dev/mtdXro`. You can see some more details about these via the `/proc/mtd` pseudo file. The most important thing to remember is that before you can write to flash (e.g. mtd) directly, you must erase the blocks you intend to overwrite. Erasing and writing flash can generally be accomplished with a build of `mtd-utils` for the target device.

<!-- TODO: Show examples of using mtd-utils. -->

### Experimenting With Flash

When you aren't confident whether your build of `mtd-utils` will operate as you intend on a device, you can mitigate some of the risk by finding an *erase block* that is currently unused. Think about looking at the end of a a flash partition area. *Is there a completely unused erase-block size of memory that we can play with?* *Are there multiple blocks?* Once you identify the block you should be able to:

- Wipe just the unused block.
- Write the unused block.
- Verify what was written showed up by reading from the block.
- Wipe the same block again.
- Read from the same block to ensure the erase occured.

<!-- TODO: Show examples of using unused blocks with MTD devices -->

This should build some confidence that you now control a single block of flash and you can now translate that to all the other blocks by any means appropriate for your task.

### NOR vs NAND

It's worth repeating that while NAND flash is loaded from flash into memory before executing, **NOR flash can be read and executed directly from flash**. This means that if you write to a NOR chip while the system is running, you may overwrite code or data that is currently being run and not cached in memory. In the event this happens you'll likely put the system in an *undefined* state or more likely crash and end up with a *bricked* system (i.e. the device is about as useful as a paper weight). At this point you'll have no other option than to use one of the above testing methods (e.g. jtag, recovery-mode, socketed flash) to recover the device.

In regards to NOR systems, sometimes the flash process from a software perspective is akin to threading an array of needles. You'll have to phase your flashing so that you don't put the system into a corrupted state. This can include more sophisticated techniques like:

- Writing some bare metal code to pivot too in the operating target device.
- After the pivot, update the previous firmware without overwriting the code you are currently running.
- Then reboot to get the full update.

Some embedded systems employ a multi-kernel, multi-rootfs for this very purpose. They'll not only have a clean and clear update path, but also an execution path when integrity checks fail.

### Erase Block Alignment

Link performs all sort of magic in its various subsystems, sometimes they manifest in unexpected ways. For example, there are situations where a MTD partition doesn't have to be erase block aligned. There are also situations where the MTD partitions will over lap. This can most easily be seen in the MTD kernel initialization output from `dmesg`.

<!-- TODO: Show dmesg output. -->

Always be aware of the erase block boundaries and if there are misalignments, its likely that there is a larger containing MTD partition that should be considered as the flash target and not the misaligned child partition.

---
sidebar_position: 1
title: U-Boot On RPi4
---

## Building 64bit U-Boot (for RPi4)

```sh
wget https://snapshots.linaro.org/gnu-toolchain/12.0-2021.10-1/aarch64-linux-gnu/gcc-linaro-12.0.0-2021.10-x86_64_aarch64-linux-gnu.tar.xz
tar -xf gcc-linaro-12.0.0-2021.10-x86_64_aarch64-linux-gnu.tar.xz
export TOOLCHAIN=$(pwd)/gcc-linaro-12.0.0-2021.10-x86_64_aarch64-linux-gnu/bin

git clone git@github.com:u-boot/u-boot.git
cd u-boot/
git checkout v2021.10
ARCH=arm64 CROSS_COMPILE=$TOOLCHAIN/aarch64-linux-gnu- make rpi_4_defconfig
# Optionally modify config with menuconfig at this point
# ARCH=arm64 CROSS_COMPILE=$TOOLCHAIN/aarch64-linux-gnu- make menuconfig
ARCH=arm64 CROSS_COMPILE=$TOOLCHAIN/aarch64-linux-gnu- make -j8
```

The successful result is a `u-boot.bin` in the top-level folder of the u-boot source tree.

## Using U-Boot

### Listing files

Synopsis:

```text
ls <interface> [<dev[:part]>] [directory]
```

List `/boot` files:

```sh
ls mmc 0:1
```

List `/` (rootfs) files:

```sh
ls mmc 0:2
```

Output:

```text
<DIR>       4096 .
<DIR>       4096 ..
<DIR>      16384 lost+found
<DIR>       4096 boot
<DIR>       4096 bin
<DIR>       4096 dev
<DIR>       4096 etc
<DIR>       4096 home
<DIR>       4096 lib
<DIR>       4096 media
<DIR>       4096 mnt
<DIR>       4096 opt
<DIR>       4096 proc
<DIR>       4096 root
<DIR>       4096 run
<DIR>       4096 sbin
<DIR>       4096 srv
<DIR>       4096 sys
<DIR>       4096 tmp
<DIR>       4096 usr
<DIR>       4096 var
<DIR>       4096 boot.bak
```

### Physical Memory

Synopsis:

```text
md [.b, .w, .l, .q] address [# of objects]
```

Show first `0x80` bytes at address `0x0`:

```sh
md.b 0x0 0x80
```

Output:

```text
00000000: 40 05 00 58 1f 00 00 b9 01 00 b0 52 01 08 00 b9  @..X.......R....
00000010: 40 b0 39 d5 41 04 80 d2 00 00 01 aa 40 b0 19 d5  @.9.A.......@...
00000020: 80 04 00 58 00 e0 1b d5 7f e0 1c d5 e0 7f 86 d2  ...X............
00000030: 40 11 1e d5 20 b6 80 d2 00 11 1e d5 60 0e 80 d2  @... .......`...
00000040: 20 10 1e d5 00 08 80 d2 20 f2 19 d5 2d 00 00 94   ....... ...-...
00000050: 40 03 00 58 00 10 1c d5 20 79 80 d2 00 40 1e d5  @..X.... y...@..
00000060: 60 00 00 10 20 40 1e d5 e0 03 9f d6 a6 00 38 d5  `... @........8.
00000070: c6 04 40 92 e6 00 00 b4 05 03 00 10 5f 20 03 d5  ..@........._ ..
```

### Booting The Kernel

```sh
# Set the kernel command line
setenv bootargs "8250.nr_uarts=1 console=ttyS0,115200 console=tty1 root=PARTUUID=42842715-02 rootfstype=ext4 elevator=deadline fsck.repair=yes rootwait maxcpus=4"

# Verify the kernel command line
env print bootargs

# View the /boot file listing
ls mmc 0:1

# Load the device tree blob
load mmc 0:1 $fdt_addr_r bcm2711-rpi-4-b.dtb

# Load the kernel (compressed) image
load mmc 0:1 $kernel_addr_r ORIGINALkernel8.img

# We have to setup scratch space for kernel decompression (if compressed)
# Note: We've chosen the high 0xb400000 bytes of DRAM
setenv kernel_comp_addr_r 0x30000000
setenv kernel_comp_size 0x0b400000

# Boot the kernel (The `-` denotes no initrd.)
booti $kernel_addr_r - $fdt_addr_r
```

## Resources

- [U-Boot on Raspberry Pi (including RPi 4)](https://andrei.gherzan.ro/linux/uboot-on-rpi/)
- [Linaro Toolchains](https://www.linaro.org/downloads/)
- [agherzan/u-boot Github Fork](https://github.com/agherzan/u-boot)
- [Das U-Boot](http://www.denx.de/wiki/U-Boot/WebHome)


<!-- U-Boot> setenv bootargs coherent_pool=1M 8250.nr_uarts=1 snd_bcm2835.enable_compat_alsa=0 snd_bcm2835.enable_hdmi=1 snd_bcm2835.enable_headphones=1 smsc95xx.macaddr=DC:A6:32:05:53:B6 vc_mem.mem_base=0x3ec00000 vc_mem.mem_size=0x40000000 console=serial0,115200 console=tty1 root=PARTUUID=42842715-02 rootfstype=ext4 elevator=deadline fsck.repair=yes rootwait maxcpus=4
U-Boot> load mmc 0:1 $fdt_addr_r bcm2711-rpi-4-b.dtb                 
47471 bytes read in 26 ms (1.7 MiB/s)
U-Boot> load mmc 0:1 $kernel_addr_r kernel8.img
15483392 bytes read in 823 ms (17.9 MiB/s)
U-Boot> booti $kernel_addr_r - $fdt_addr_r



kernel8.img: gzip compressed data, was "Image", last modified: Thu Aug 12 19:24:36 2021, from Unix, original size modulo 2^32 21457408


setenv bootargs "8250.nr_uarts=1 console=ttyS0,115200 console=tty1 root=PARTUUID=42842715-02 rootfstype=ext4 elevator=deadline fsck.repair=yes rootwait maxcpus=4"


setenv bootargs "coherent_pool=1M 8250.nr_uarts=1 snd_bcm2835.enable_compat_alsa=0 snd_bcm2835.enable_hdmi=1 snd_bcm2835.enable_headphones=1 smsc95xx.macaddr=DC:A6:32:05:53:B6 vc_mem.mem_base=0x3ec00000 vc_mem.mem_size=0x40000000 console=ttyS0,115200 console=tty1 root=PARTUUID=42842715-02 rootfstype=ext4 elevator=deadline fsck.repair=yes rootwait maxcpus=4"

env print bootargs
ls mmc 0:1

load mmc 0:1 $fdt_addr_r bcm2711-rpi-4-b.dtb
load mmc 0:1 $kernel_addr_r ORIGINALkernel8.img
setenv kernel_comp_addr_r 0x30000000
setenv kernel_comp_size 0x0b400000
booti $kernel_addr_r - $fdt_addr_r -->
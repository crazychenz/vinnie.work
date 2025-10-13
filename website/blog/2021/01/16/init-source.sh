#!/bin/bash

# Build Linux

mkdir linux_build
wget https://cdn.kernel.org/pub/linux/kernel/v4.x/linux-4.14.212.tar.xz
tar -xpf linux-4.14.212.tar.xz
cd linux-4.14.212
make ARCH=arm64 O=../linux_build defconfig
cd ../linux_build
# Adjust toolchain prefix and remove loadable module support.
patch .config ../linux-config-4.14.212.patch
# Optionally run menuconfig.
#make ARCH=arm64 menuconfig
# Do the build.
make ARCH=arm64
cd ..

# Build musl libc

mkdir sysroot
mkdir rootfs

wget https://musl.libc.org/releases/musl-1.2.1.tar.gz
tar -xpf musl-1.2.1.tar.gz
cd musl-1.2.1
./configure --target=aarch64-linux-gnu --prefix=$(realpath ../sysroot)
make install
cd ..

# # Build userspace kernel headers

cd linux_build
make headers_install ARCH=arm64 INSTALL_HDR_PATH=$(realpath ../sysroot)
cd ..

# # Build busybox

wget https://busybox.net/downloads/busybox-1.32.0.tar.bz2
tar -xpf busybox-1.32.0.tar.bz2
cd busybox-1.32.0
cp ../busybox-1.32.0.config .config
# Adjust sysroot, rootfs, and cflags in a location independent way.
SYSROOT=$(realpath ../sysroot)
ESC_SYSROOT=$(printf '%s\n' "$SYSROOT" | sed 's:[\\/&]:\\&:g;$!s/$/\\/')
CFLAGS="-Wno-undef -Wno-parentheses -Wno-strict-prototypes -specs=$SYSROOT/lib/musl-gcc.specs"
ESC_CFLAGS=$(printf '%s\n' "$CFLAGS" | sed 's:[\\/&]:\\&:g;$!s/$/\\/')
ROOTFS=$(realpath ../rootfs)
ESC_ROOTFS=$(printf '%s\n' "$ROOTFS" | sed 's:[\\/&]:\\&:g;$!s/$/\\/')
sed -i "s/SYSROOTHERE/$ESC_SYSROOT/" .config
sed -i "s/CFLAGSHERE/$ESC_CFLAGS/" .config
sed -i "s/INSTALLHERE/$ESC_ROOTFS/" .config
# Optionally run menuconfig
#make menuconfig
make install
cd ..


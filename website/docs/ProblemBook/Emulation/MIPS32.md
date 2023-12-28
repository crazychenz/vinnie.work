# MIPS32

## User Emulation with Docker

```Dockerfile
FROM multiarch/debian-debootstrap:mips-buster-slim as qemu
FROM scratch
ADD ./firmware.tar.gz /
COPY --from=qemu /usr/bin/qemu-mips-static /usr/bin
CMD [ "/usr/bin/qemu-mips-static", "/bin/busybox" ]
ENV ARCH=mips
```

## Working Chroot Environment

### Build Kernel

```sh
export WD_PREFIX=$(pwd)/
tar xf linux-4.4.60.tar.xz
mkdir linux_build
cd linux-4.4.60
make ARCH=mips O=../linux_build defconfig
cd ../linux_build
make ARCH=mips menuconfig
```

Configure mips kernel with: `make ARCH=mips menuconfig`

- Machine selection -> MIPS Malta board
- Endianness Selection () -> Little Endian / Big Endian (choose what you need)
- General Setup -> Cross-compiler tool prefix -> `mipsel-static-linux-gnu-`
- General Setup -> Initial RAM filesystem and RAM disk (initramfs/initrd) support
- _Uncheck_ Enable loadable module support.
- Device Drivers -> Character devices -> Serial drivers:
  - 8250/16550 and compatible serial support
  - Console on 8250/16550 and compatible serial port

If you attempt to build the kernel at this point, you may find yourself with an error that is similar to:

```text
/usr/bin/ld: scripts/dtc/dtc-parser.tab.o:(.bss+0x10): multiple definition of `yylloc'; scripts/dtc/dtc-lexer.lex.o:(.bss+0x0): first defined here
collect2: error: ld returned 1 exit status
```

To fix this, run (from the `linux-4.4.60` folder): `sed -i 's/^YYLTYPE yylloc;$//' scripts/dtc/dtc-lexer.lex.c_shipped`
<!-- To fix this (from `linux_build` folder): `sed -i 's/^YYLTYPE yylloc;$//' scripts/dtc/dtc-lexer.lex.c` -->

Build kernel (from `linux_build` folder): `make ARCH=mips -j8 vmlinux`

### Build Userspace

```sh
export TC_TUPLE=mipsel-static-linux-gnu
mkdir -p ${WD_PREFIX}sysroot ${WD_PREFIX}rootfs
tar -xpf musl-1.2.1.tar.gz
cd musl-1.2.1
./configure --target=${TC_TUPLE} --prefix=${WD_PREFIX}sysroot
make install
cd ../linux_build
make headers_install ARCH=mips INSTALL_HDR_PATH=${WD_PREFIX}sysroot
cd ..
tar -xpf busybox-1.32.0.tar.bz2
cd busybox-1.32.0
make menuconfig
```

Setup some build configurations:

- Enable `Settings -> Build Options -> Build static binary (no shared libs)`
- Set `Settings -> Build Options -> Cross compiler prefix` to `aarch64-linux-gnu-`
- Set `Settings -> Build Options -> Path to sysroot` to `/projects/playground/minsys/sysroot`
- Set `Settings -> Build Options -> Additional CFLAGS` to `-Wno-undef -Wno-parentheses -Wno-strict-prototypes -specs=/projects/playground/minisys/sysroot/lib/musl-gcc.specs`
- Set `Settings -> Installation Options -> Destination path for 'make install'` to `/projects/playground/minsys/rootfs`
- Disable `Linux System Utilities -> eject -> Scsi Support`

Build busybox: `make install`

Build and install dropbear:
```sh
wget https://matt.ucc.asn.au/dropbear/releases/dropbear-2022.82.tar.bz2
tar xf dropbear-2022.82.tar.bz2
cd dropbear-2022.82
./configure --host=mips-static-linux-gnu --prefix=${WD_PREFIX}rootfs --disable-zlib --enable-static CC="mips-static-linux-gnu-gcc -specs=${WD_PREFIX}sysroot/lib/musl-gcc.specs" LD="mips-static-linux-gnu-ld"
make install
cd ..
```

TODO: Use /etc/init-rc.d with:
- ``for script in `ls /etc/init-rc.d` ; do $script ; done ``
- `find /etc/init-rc.d -maxdepth 1 -type f -executable -exec {} \;`

Create generic `${WD_PREFIX}rootfs/init`:

```sh
#!/bin/sh

mount -t proc proc /proc
mount -t sysfs proc /sys

mount -n -t tmpfs none /dev
mknod -m 622 /dev/console c 5 1
mknod -m 666 /dev/null c 1 3
mknod -m 666 /dev/zero c 1 5
mknod -m 666 /dev/ptmx c 5 2
mknod -m 666 /dev/tty c 5 0
mknod -m 444 /dev/random c 1 8
mknod -m 444 /dev/urandom c 1 9

find /etc/init-rc.d -maxdepth 1 -type f -executable -exec {} \;

exec /bin/sh
```

Make script executable:

```sh
cd ${WD_PREFIX}rootfs
chmod +x init
cd ..
```

Create `${WD_PREFIX}rootfs/etc/init-rc.d/10-rootuser.sh` init:

```sh
#!/bin/sh

if [ ! -e /etc/passwd ]; then
    touch /etc/passwd
fi

if [ ! -e /etc/group ]; then
    touch /etc/group
fi

# If no root user exists..
grep root /etc/passwd >/dev/null || `adduser root -D -u 0 ; echo "root:root" | chpasswd`

if [ ! -e /home/root ]; then
    mkdir /home /home/root
fi
```

Create `${WD_PREFIX}rootfs/etc/init-rc.d/30-network.sh` init:

```sh
#!/bin/sh

ifconfig eth0 10.0.1.2 netmask 255.255.255.0 up
ping -c 512 -A 10.0.1.1 >/dev/null 2>/dev/null
```

Create `${WD_PREFIX}rootfs/etc/init-rc.d/50-dropbear.sh` init:

```sh
#!/bin/sh
if [ ! -e /etc/dropbear ]; then
    mkdir /etc/dropbear
fi

if [ ! -e /dev/pts ]; then
    mkdir /dev/pts
fi

# If devpts not mounted...
grep devpts /proc/mounts || mount -t devpts -o rw,mode=620,ptmxmode=666 devpts /dev/pts

dropbear -p 5522 -R -B -a
```

Create `build_initramfs.sh`:

```sh
#!/bin/bash
pushd rootfs
# Note: busybox may have created some of these during its install.
mkdir -p dev bin sbin etc proc sys usr/bin usr/sbin
# TODO: Get the non-sudo equivalents.
mknod -m 622 ./dev/console c 5 1
mknod -m 666 ./dev/null c 1 3
find . -print0 | cpio --null -ov --format=newc | gzip -9 > ../initramfs.cpio.gz
popd
```

TODO: binwalk / rsync squashfs

```sh
chmod +x build_initramfs.sh
fakeroot ./build_initramfs.sh
```

Start emulation with:

```sh
qemu-system-mipsel -m 256 -M malta -display curses \
  -kernel linux_build/vmlinux \
  -append "console=ttyS0 init=/init" \
  -initrd initramfs.cpio \
  -netdev tap,id=if0,ifname=mipsif0 -device e1000,netdev=if0 \
  -netdev socket,id=if1,listen=:2000 -device e1000,netdev=if1 \
  -netdev user,id=if2,hostfwd=tcp::2222-:22 -device e1000,netdev=if2
```

Networking Notes:
- Setup the `tap` interface before hand with: `sudo tunctl -t mipsif0 ; sudo ifconfig mipsif0 10.0.1.1 up`
- Network Socket packets are prefixed with 32bit length field followed by ethernet frame. 
- Host Forward Synopsis: `hostfwd=tcp:[<hostaddr>]:<hostport>-[guestaddr]:<guestport>`
- You can list multiple `hostfwd` entries comma separated: `-netdev user,id=id0,hostfwd=tcp::2222-:22,hostfwd=tcp::2280-:80`

QEmu Usage Notes:

- Esc + 2 -> Monitor (e.g. `quit` to exit)
- Esc + 3 -> Serial Console
- If you use `-display none`, `Ctrl-A x` to quit.



https://www.vinnie.work/blog/2020-12-27-a-simple-busybox-system/
https://www.vinnie.work/blog/2021-01-16-why-so-hard-qemu-user-network-and-busybox



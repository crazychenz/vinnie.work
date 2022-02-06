---
slug: 2021-01-16-why-so-hard-qemu-user-network-and-busybox
title: "Why so hard?: QEmu User Networking and Dropbox"
#date: "2021-01-16T12:00:00.000Z"
description: |
  In a follow up to [A More Simple Busybox System](https://www.vinnie.work/20201227-a-simple-busybox-system/), fleshing out the capabilities of a "simple" rootfs. All without requiring use of sudo or root permissions.
---

## Overview

In [A More Simple Busybox System](https://www.vinnie.work/20201227-a-simple-busybox-system/), I documented how to get started with building a plain old rootfs with Linux, musl, and busybox. While this setup is good enough for local applications, its more practical to fold in some foundational networking capabilities and tools that allow remote access and inspection of the environment.

<!--truncate-->

Additionally, I've automated most of the process from the previous article, which had quite a few typos.

## Review

### Dependencies

To recap the previous article and provide some working examples, we started by installing some dependencies into the system. Instead of installing those dependencies directly into the host system, I more often than not install everything into a docker image. Here is the `Dockerfile` I used:

```
FROM ubuntu:20.04

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    crossbuild-essential-arm64 \
    flex bison \
    libncurses5-dev \
    bc \
    wget \
    fakeroot \
    vim vim-common \
    qemu-user-static \
    qemu-system-arm \
    cpio \
    sudo

RUN sed -i 's/ALL=(ALL:ALL) ALL/ALL=(ALL:ALL) NOPASSWD: ALL/' /etc/sudoers

RUN adduser user --uid 1000
RUN adduser user sudo

USER user
WORKDIR /workspace
```

This container has the dependencies installed as its first step. Following the dependency installation, we've installed sudo and enabled sudo usage without a password. This enables us to install additional packages in a pinch instead of rebuilding the entire image. More importantly it provides a nice soft failure state for builds, installs, and applications that might assume they've been given root permission.

_Security Note_: Allowing docker containers to have root access without authentication is bad security practice. Know if someone has access to the docker container (or daemon), they have root access to the entire machine. This is OK in my situation because only I have access to my system and my docker installation.

To build the docker image, I typically define a `build.sh`:

```
#!/bin/bash

docker build -t $(whoami)/busybox-dev .
```

That'll generate an image that is based on your user login name suffixed with `/busybox-dev`.

Finally, to run the docker container I use a `run.sh` script:

```
#!/bin/bash

docker run \
  -ti --rm \
  --network host \
  -v $(pwd):/workspace $(whoami)/busybox-dev bash -li -c "${*}"
```

This command will give us stdin/stdout of the container (as if we just logged into another system), it binds itself to our host's network namespace so we don't have to fuss with the docker network API. I like to think of `--network host` as saying, treat the container the same as any other berkeley socket network application running on my host.

Finally, `-v $(pwd):/workspace` is my special sauce I depend on for nearly all of my container runs. It bascially says, whatever directory I'm currently in, make that the `/workspace` directory within the container. This allows me to run the container from any given directory and impose the containers environment on only that directory tree. For example, if I change directory into a source directory and run the container, I can have reasonable confidence that the build system of that source directory will not be able to leak outside of the `/workspace` directory. If it does, it'll either fail because I'm running as a user, or if it runs `sudo` it'll just muck with the container state which is easily reset to the docker image baseline.

### Package Builds

In _A More Simple Busybox System_ I demonstrated a volatile initramfs and a persistent rootfs. Going forward I'll only be working with rootfs. To help iron out any errors and automate the process a bit I've developer a script and 2 configuration patch files.

- [init-source.sh](2021-01-16-why-so-hard-qemu-user-network-and-busybox/init-source.sh) - A script that should be run from the `busybox-dev` docker container described above.
- [busybox-1.32.0.config](2021-01-16-why-so-hard-qemu-user-network-and-busybox/busybox-1.32.0.config) - Baseline configuration for busybox as previously described.
- [linux-config-4.14.212.patch](2021-01-16-why-so-hard-qemu-user-network-and-busybox/linux-config-4.14.212.patch) - Linux defconfig patch for ARCH=arm64 that matches what is required for our needs.

To use the `init-source.sh`, you can either run it from a `bash` prompt in the container or run it as the container command itself.

Running as bash:

```
./run.sh bash
user@host$ ./init-source.sh
...
```

Running as container command (recommended):

```
./run.sh ./init-source.sh
```

Once complete you'll want to create the following scripts:

**build_rootfs.sh**

```
#!/bin/bash

truncate --size=64M disk.ext3
cp init rootfs/init
cp startsshd.sh rootfs/startsshd.sh

cd rootfs
mkdir -p dev bin sbin etc proc sys usr/bin usr/sbin
mknod -m 622 ./dev/console c 5 1
mknod -m 666 ./dev/null c 1 3
cd ..
mkfs.ext3 -d ./rootfs disk.ext3
```

**init**

```
#!/bin/sh +m
# Note: No job control without +m

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

# Populate /dev with entries from /sys
/sbin/mdev -s

# Note: Can't Ctrl-C without cttyhack
exec setsid cttyhack /bin/sh
```

With those two scripts local, we new run the `build_rootfs.sh` script with `fakeroot` as we did before:

```
fakeroot ./build_rootfs.sh
```

This'll create a disk.ext3 file that we'll use as our persistent rootfs in qemu. To start the qemu process, I've create a `run_rootfs.sh` script:

```
#!/bin/bash

qemu-system-aarch64 -no-reboot -nographic \
  -M virt -m 2048 -smp 1 -cpu cortex-a72 \
  -hda disk.ext3 \
  -kernel linux_build/arch/arm64/boot/Image \
  -append "console=ttyAMA0 root=/dev/vda rw init=/init serial"
```

This'll point the kernel at our disk.ext3 image as the persistent drive. It'll mount the ext3 partition as read/write by default so there is no need to remount. Lastly, it points to our `init` script instead of the busybox `linuxrc` process.

And that is the end of the review! On ward to network capabilities!

## Running QEMU User Networking With Port Forwarding.

Qemu has many ways to access network capabilities. My personal favorite is the tap interface, but the downside with the tap interfaces in Qemu is that it requires elevated priviledge and is quite frankly not nessessary for our needs. Instead we'll go with the less popular user mode networking. The gist of Qemu user mode networking is that the qemu system has the same access to the host network as any other application allowed to connect(), bind(), listen(), and accept() relavant servers and clients.

For SSH, we will configure qemu so that it will listen to port `5522` on the host's localhost (or possibly 0.0.0.0) network and forward all traffic to the inner qemu `eth0` interface at `10.0.2.15:5522` as if it came from `10.0.2.2` on an ephemeral port.

To accomplish the port forwarding from the host, we'll add `hostfwd=tcp::5522-:5522` to some standard qemu networking arguments. This changes the new qemu command (that runs from `run_rootfs.sh`) to:

```
qemu-system-aarch64 -no-reboot -nographic \
  -M virt -m 2048 -smp 1 -cpu cortex-a72 \
  -hda disk.ext3 \
  -kernel linux_build/arch/arm64/boot/Image \
  -append "console=ttyAMA0 root=/dev/vda rw init=/init serial" \
  -netdev user,id=mynet,hostfwd=tcp::5522-:5522 \
  -device virtio-net-pci,netdev=mynet
```

A nice quick little way to verify that qemu networking is working correctly is to use `nc` (i.e. netcat).

1. Start qemu in one terminal window with forwarding from port 5522 to port 5522.
2. In the qemu busybox console run `nc -lvp 5522`.
3. In another terminal window on the host (or in the docker container), run `echo "test" | nc 127.0.0.1 5522`.

If you received the text "text" in qemu, everything worked! You can always go in the opposite direction so long as you assume the host is `10.0.2.2`. Going from qemu out to the host and onward is usually significantly easier. If it doesn't work, checking firewalls, routes, ip forwarding, and so forth would be in order.

## Building Dropbear

Dropbear is a lightweight SSHd daemon. Using our musl libc, we can build a very simple (and likely less secure) static binary from the dropbear sources that'll allow us to not just SSH into and out of our qemu machine, but we'll also be able to setup SSH tunnels through the qemu user networking layer.

### Building From Source

The following script should build dropbear. It includes a small have that forces dropbear to not attempt to use the getrandom() interface provided by the kernel. This prevents the dropbear daemon from blocking due to a lack of entropy in the kernel's randomness state. The following script also ensures that our musl libc is used instead of the host's glibc.

```
# Build dropbear with musl instead of glibc for dependency reasons.
wget https://matt.ucc.asn.au/dropbear/releases/dropbear-2020.81.tar.bz2
tar -xpf dropbear-2020.81.tar.bz2
cd dropbear-2020.81
sed -i 's/ getrandom//' configure.ac
autoconf
./configure \
    --host=aarch64-linux-gnu \
    --prefix=$(realpath ../rootfs) \
    --disable-zlib \
    --enable-static \
    CC="aarch64-linux-gnu-gcc -specs $(realpath ../sysroot)/lib/musl-gcc.specs" \
    LD=aarch64-linux-gnu-ld
make install
cd ..
```

To setup dropbear as a service within qemu, I've written a short script that is run from the same location as `init` (i.e. root `/`).

```
#!/bin/sh

ifconfig eth0 10.0.2.15
ping -c 512 -A 10.0.2.2 >/dev/null 2>/dev/null

if [ ! -e /etc/passwd ]; then
    touch /etc/passwd
fi

if [ ! -e /etc/group ]; then
    touch /etc/group
fi

adduser root -u 0

if [ ! -e /etc/dropbear ]; then
    mkdir /etc/dropbear
fi

if [ ! -e /home/root ]; then
    mkdir /home /home/root
fi

dropbear -p 5522 -R -B -a
```

Lastly, you must update `init` so that it mounts `/dev/pts`. Add the following lines to `init`, somewhere around the `mknod` commands:

```
# Note: SSHd will fail without /dev/pts
mkdir /dev/pts
mount -t devpts -o rw,mode=620,ptmxmode=666 devpts /dev/pts
```

Once everything is done building, you'll need to rerun `build_rootfs.sh` to get the new dropbear installation.

After you've rebuilt the `disk.ext3` and restarted the qemu session with `run_rootfs.sh`, one last suggestion is to modify your `ssh_config` to work nicely with dropbear. I modified `/etc/ssh/ssh_config` directly, but you can use a user specific `ssh_config` as well. Add the following lines to the configuration:

```
Host localhost
    PreferredAuthentications=password
    PubkeyAuthentication=no
```

### Gotchas

So many things can catch you up when attempting to get dropbear running in the system.

- You can't run `ifconfig` from `init`.
- You can't use dropbear until the kernel has initialized its RNG from system entropy.
- `/etc/dropbear` needs to exist before the daemon is created, even when using `-R` argument.
- Users (including `root`) must have a home directory for storing `~/.ssh`.
- You must have `/dev/pts` mounted to allow for interactive (i.e. tty) ssh logins.
- Clients must be configured to interact with the less secure `dropbear` sevice.

**Entropy In The Kernel**

The `ping` command in the script above is **required**. Without it, the qemu system might never get enough entropy to initialize its randomness state to allow dropbear to accept any connections. So weird!

## Building `gdbserver`

GDB is the king of debuggers. It has a remote agent referred to as `gdbserver`. This can be cross compiled statically and dropped on a system with networking to serve the debug state of a program over the network. This is a great feature to have for learning and inspection of a real or emulated environment because you can have all the convienece of a beefy GDB configuration on a beefy machine while the process runs in its native environment.

The following will build gdbserver without building the entire gdb suite. _Note: We're forced to build gdbserver with glibc, but its still static so it makes little difference in this case._

```
# Note: GDB is built with glibc instead of musl for compatibility reasons.
wget http://sourceware.org/pub/gdb/releases/gdb-9.2.tar.xz
tar -xpf gdb-9.2.tar.xz
cd gdb-9.2
mkdir build
cd build
LDFLAGS=-static CC=aarch64-linux-gnu-gcc \
    ../gdb/gdbserver/configure --host=aarch64-linux-gnu --prefix=$(realpath ../../rootfs)
make LDFLAGS=-static install
cd ../..
```

Once everything is done building, you'll need to rerun `build_rootfs.sh` to get the new gdbserver installation.

## Building `strace`

I only use strace for quick syscall inspection when checking out what various processes are doing when the initialize, run, block, and quit.

```
wget https://github.com/strace/strace/releases/download/v5.10/strace-5.10.tar.xz
tar -xpf strace-5.10.tar.xz
cd strace-5.10
LDFLAGS="-static -pthread" CC=aarch64-linux-gnu-gcc \
  ./configure \
    --host=aarch64-linux-gnu \
    --prefix=$(realpath ../rootfs) \
    --disable-mpers
make install
cd ..
```

Once everything is done building, you'll need to rerun `build_rootfs.sh` to get the new strace installation.

## Building `tcpdump`

This is your standard network interface sniffer tool. It can provide packet/connection summaries for an interface or dump BPF filtered traffic into package capture files (pcaps) to be analyzed with other tools (e.g. Wireshark).

```
# libpcap (required by tcpdump)
./configure --host=aarch64-linux-gnu \
    --includedir=$(realpath ../sysroot/include) \
    --libdir=$(realpath ../sysroot/lib) \
    --datarootdir=$(realpath ../sysroot/share) \
    --prefix=$(realpath ../rootfs) \
    CC="aarch64-linux-gnu-gcc -specs $(realpath ../sysroot/lib/musl-gcc.specs)" \
    LDFLAGS=-static
make install

# tcpdump
./configure --host=aarch64-linux-gnu \
    --includedir=$(realpath ../sysroot/include) \
    --libdir=$(realpath ../sysroot/lib) \
    --datarootdir=$(realpath ../sysroot/share) \
    --prefix=$(realpath ../rootfs) \
    CC="aarch64-linux-gnu-gcc -specs $(realpath ../sysroot/lib/musl-gcc.specs)" \
    LDFLAGS="-L$(realpath ../sysroot/lib) -static"
make install
```

Once everything is done building, you'll need to rerun `build_rootfs.sh` to get the new tcpdump installation.

## Conclusion

In conclusion, we've installed dropbear as a SSHd service that allows for easy file transfers via `scp`, ssh tunneling, and interactive ssh shell access. We've installed gdbserver and strace for inspection of application behavior and state. And finally, we've installed tcpdump for inspection of network behavior and state. This concludes my "Simple Busybox System".

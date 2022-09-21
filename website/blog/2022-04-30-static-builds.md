---
slug: 2022-04-30-static-builds
title: 'My Obsession With Static Builds'
draft: false
---

Static builds, technically linking of binaries in such a way that there is no dynamic loading of external libraries to start the process. A more broad way that I prefer to think of static applications are ones that have no external userspace dependencies. One may argue that my definition of a static application could be a docker container. Not true! A docker container depends on docker (i.e. an external userspace dependency).

Periodically I become a bit obsessed with static building and linking of various tools. These tools can be invaluable with performing troubleshooting of niche systems where you can't depend on the system's ability to accomplish what you need to analyze or debug issues. The catch is that classical unix philosophy has encouraged maximization of shared libraries and dynamic linking. This creates tight couplings between applications and their distributions. Linus has spoken about this coupling and the weaknesses that it brings into the Linux ecosystem.

There are quite a few projects that attempt to mitigate this issues. Let's explore some of these ...

<!-- truncate -->

## Linux Namespaces & Containers

Linux namespaces and containerization are a primary example of breaking an applications coupling from the system. With a container runtime (e.g. Docker), we can now easily collect an application and all of its userspace dependencies into a user namespace. This is a fantastic tool for portability and repeatability. With all of the good it brings, it does have several downsides:

- Docker requires Linux v3.10 or higher. This means that if the application you'd like to run on an older system (for analysis/debug) is a 2.6 kernel, you'll be out of luck.

- Some applications are executed with a command and arguments, do their thing, and return. Others will require reaching out to other sections of the system such as /usr/share, /etc/, /opt, /home, and whatever its configured to touch. Allowing this through containerization is possible but requires a clear understanding of the relationship between the tool, its container, and how to map the host environment into the container. **This is about as error prone as trusting a developer to malloc/free correctly.**

## Upstream Packaging

_Upstream packaging_ is a term used by [AppImage](https://appimage.org/) to describe a setup where an application author is responsible for collecting all of the dependencies for an application and bundling them into a single file. Another one of AppImage's mantras is "one app = one file". The simplicity makes managing and moving/installing an application extremely user friendly.

The way AppImage works by bundling all of the application binaries (and dependencies) into an embedded read-only filesystem (e.g. ISO or squashfs). When the `*.AppImage` file is executed, it mounts the embedded filesystem, runs the application, and then unmounts the application filesystem when the application terminates.

In some respects you can think of an AppImage application as a _container_ that runs in the host namespace. There is no "containment" of the application and its effects over the filesystem other than the traditional discretionary access controls, but this also allows the application to perform all of derived actions it may need to do without complex volume mapping required in the container runtime case.

Ok, so AppImage is the solution right? Not exactly.

- AppImage requires that mount support be built into the kernel.

- AppImage is designed with a _exclude least common denominator_ mindset. For example, if you intend to support RHEL 5+, you don't need to bother with any dependencies that you can trust to exist in RHEL5 and beyond. This means that a lot of AppImage tools can depend on the system's libc and other "typical" system libraries. That said, an application or package author can build an AppImage package as independent as they want in terms of linking.

- AppImage packages have to co-exist with the running system. If you packaged your own `libc`, you'd have to run your application with a LD_LIBRARY_PATH or LD_PRELOAD configuration to redirect the application to the correct `libc`. This issue is the primary reason you can't just convert a Docker image into an AppImage. (**Although I've never tried packaging a user-only container runtime (e.g. podman) into AppImage with a container image.**)

### Frameworks Similar To AppImage

- [Flatpak](https://flatpak.org/)
- [Snapcraft](https://snapcraft.io/)
- [Zero Install](https://0install.net/)

## Static Libraries

Albiet the most labor intensive, the best solution I've often found is to just build and link a given application statically. This eliminates the complexity of using funky `LD_*` environment variables and makes the binary more/less portable. So who not just do this everytime?

- For whatever reason, linux distributions and OSS authors often do not prioritize testing that their binaries and libraries can be built statically without patching. Ideally I should always do something as simple as `./configure --enable-static && make` and I'll get outputs. Most of the time you'll find yourself having to monkey patch `Makefile`s so that LDFLAGS includes `-static` flags or you have to know which variable needs to have `-all-static` or some other non-conventional way to indicate that the package should be built statically.

- Linux distributions don't provide static versions of most of their repositories. This means that when I know something _can_ be built statically (e.g. qemu), I'll have to go find the source for all the dependencies of the package, build them statically, and then build the actual end goal tool statically with their outputs.

- Toolchains and Libc needs to be built with static support in mind. This means that in nearly all cases you'll need to build a cross compiler toolchain, even for the host architecture to host architecture. This ensures that you'll have a static `libgcc` and static version of `nss` (Network Service Switch) functionality.

### Static Build Portability

Static binaries are not infinitely portable.

- Within architectures, there are different instructions sets that can appear in CPUs from model to model.

- When building a `libc` for Linux based systems, you must provide the linux kernel headers. This allows the `libc` to determine what functionality it needs to provide and/or emulate based on the kernel capabilities.

- Linux kernel functionality is performed by making system calls. Each system call has a mapped number. Since Linux 2.6, the system call interface has largely remained backward compatible. That said, different major linux versions have different system call interfaces and your toolchain, libc, and application need to account for this. The versions that you need to consider include 2.2, 2.4, 2.6+.

- While system calls are the primary method for interacting with a kernel, there are also now applications that communicate with the kernel via character devices (e.g. /dev), sockets (e.g. AF_NETLINK), and file systems (e.g. procfs). All of these are essentially kernel internals and therefore can change from kernel to kernel. If your application depends on any of these and can't be reconfigured without a toolchain, you might as well consider yourself tightly coupled to the distribution.

### Static Build Repositories

- [static-get](https://github.com/minos-org/minos-static) - _Appears abandoned._ [Package Archive](http://s.minos.io/archive/)
- [Bifrost](https://github.com/jelaas/bifrost-build) - A predictable and repeatable building environment for Bifrost binaries.
- [Morpheus](http://git.2f30.org/ports/) - A statically linked musl based Linux distro.
- [Retro Linux-libre Software Distribution](https://github.com/dimkr/rlsd2) - A small, "live" operating system with GNU/Linux-libre.

## Future Goals

I've been spending a huge amount of time playing with toolchains recently. This article is the first in an attempt to capture my thoughts and figure out where exactly I'm attempting to go. For now, within the scope of static builds,

- I'm aiming to acquire container enabled static toolchain _recipes_ for everything from gcc-4 through gcc-11 (with gcc-3 as a stretch goal), generally do-able via the marvelous crosstool-ng.

- I'm aiming to get a 100% static build recipe of qemu user emulation for all supported architectures. This'll require a butt load of static library dependency builds. This is primarily what prompted be to brain dump everything above. Also, by having this in a recipe, I can easily add or reconfigure qemu machines to match existing system firmware images.

- With static qemu emulation, I'm aiming to _portably_ containerize i386 systems. This should enable me to easily setup recipes for building linux-2.4, linux-2.2, and other ancient tools (e.g. gcc-2.95).

## Comments

<Comments />

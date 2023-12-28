---
slug: 2022-05-01-building-to-the-version-generation
title: 'Building To The Version Generation'
draft: false
---

## Problem

When building from source code in Linux (or any \*nix) based system, you'll often run into a web of other dependencies that you need to cherry pick from the internet. If you are required to use an older version of a package, its wise to use dependencies that were released just before the source code your are attempting to download. Even if the API for the dependency is still technically compatible, there are also many other factors that can ruin your day.

<!-- truncate -->

The version of the toolchain is one external dependency I've found to have a significant impact on whether I can build a package or not. For example, using `binutils-2.23` with MIPS allows mixing soft floats and hard floats in the same code base. `binutils-2.24` changed this and breaks a bunch of code that worked perfectly find with older versions of the assembler.

In another example, Linux is GNU toolchain specific. In older versions of the kernel (before v4.1), there were GCC headers that were version specific (`include/linux/compiler-gcc[3-5].h`). This means that to build any kernel v4.0 and before you'll need a version of gcc that is version 3.x, 4.x, or 5.x. Earlier versions don't have the headers for 4.x or 5.x so you must use version 3.x. Linux 2.2 and 2.4 are highly recommended to be built with gcc-2.95.

Takeaway: GCC is not backward compatible.

## Using The Correct Tools For The Job

This is all to say that to save you from pain, its highly recommended to consider matching like versions when building code and this all starts with what toolchain (assembler, compiler, libc) you are using to build your package. 

[Crosstool-NG](https://crosstool-ng.github.io/), [Kegel's Crosstool](http://www.kegel.com/crosstool/), and [Scott Howard's CrossGCC FAQ](./2022-05-01-building-to-the-version-generation/CrossGCC-FAQ.pdf) are fantastic resources and systems for building toolchains. This particular set will capture about 99% of what you might ever build. Crosstool-NG supports GCC 11 through 4. Kegel's Crosstool covers GCC 4, 3, and 2.95. CrossGCC FAQ has a sort of walk through and discussion about building GCC versions before 2.95. Long story short, if you need a toolchain version that has been supported at some point in time, you'll likely find the right pattern for building it from one of these resources.

Even with the efforts made by these individuals and groups, you'll still need to run their respective versions within suitable Linux distributions that match the generation of the crosstool build. To make this a more repeatable process I've developed some container images (w/ Docker) that allow me to run the tools in a comfortable environment. To improve the user experience, I've also developed an API that runs on the host and automatically runs the docker environment. You can find the code and documentation for this in the [X-Tools Github Repository](https://github.com/crazychenz/x-tools).

You can see some of the toolchain version coverage of X-Tools in the following dropdowns:

<details>
<summary>ct-ng-1.25.0</summary><br />

- Core
  - Linux: 5.16.9 thru 3.2.101
  - Binutils: 2.38 thru 2.26.1
  - Libc
    - Glibc: 2.28 thru 2.17
    - uclibc-ng: 1.0.39 thru 1.0.25
    - musl: 1.2.2 thru 1.1.6
    - mingw: 9.0.0 thru 4.0.6
    - newlib: 4.1.0 thru 2.5.0
    - bionic: 21 thru 28
  - Gcc: 11.2.0 thru 4.9.4
- Debug
  - duma: 2_5_15
  - gdb: 11.2. thru 8.3.1 (cross & native)
  - ltrace: 0.7.3
  - strace: 5.16
- Libs
  - cloog: 0.18.4
  - expat: 2.4.1
  - gettext: 0.21 thru 0.19.8.1
  - gmp: 6.2.1 thru 6.1.2
  - isl: 0.24 thru 0.15
  - libelf: 0.8.13
  - libiconv: 1.16 thru 1.15
  - mpc: 1.2.0 thru 1.0.3
  - mpfr: 4.1.0 thru 3.1.6
  - ncurses: 6.2 thru 6.0
  - zlib: 1.2.12
- Tools
  - autoconf: 2.71 thru 2.65
  - automake: 1.16.1 thru 1.15.1
  - bison: 3.5 thru 3.0.5
  - dtc: 1.6.0 thru 1.4.7
  - libtool: 2.4.6
  - m4: 1.4.19
  - make: 4.3 thru 4.2.1
- Use Cases
  - If you want the newest and strictest compiler and toolchain, here you go.
  - LLVM isn't cutting it for you? Try GCC 11. It'll throw warning at you like a kid at the dunk a wench stand.

</details>

<details>
<summary>ct-ng-1.24.0</summary><br />

- Core
  - Linux: 4.20.8 thru 3.2.101
  - Binutils: 2.32 thru 2.26.1
  - Libc
    - Glibc: 2.28 thru 2.12.1
    - uclibc-ng: 1.0.31 thru 1.0.25
    - musl: 1.1.21 thru 1.1.6
    - mingw: 6.0.0 thru 4.0.6
    - newlib: 3.1.0 thru 2.5.0
    - bionic: 21 thru 28
  - Gcc: 8.3.0 thru 4.9.4
- Debug
  - duma: 2_5_15
  - gdb: 8.2.1 thru 7.11.1 (cross & native)
  - ltrace: 0.7.3
  - strace: 4.26 thru 4.15
- Libs
  - cloog: 0.18.4
  - expat: 2.2.6
  - gettext: 0.19.8.1
  - gmp: 6.1.2
  - isl: 0.20 thru 0.15
  - libelf: 0.8.13
  - libiconv: 1.5
  - mpc: 1.1.0 thru 1.0.3
  - mpfr: 4.0.2 thru 3.1.6
  - ncurses: 6.1 thru 6.0
  - zlib: 1.2.11
- Tools
  - autoconf: 2.69 thru 2.65
  - automake: 1.16.1 thru 1.15.1
  - bison: 3.3.2 thru 3.0.5
  - dtc: 1.4.7
  - libtool: 2.4.6
  - m4: 1.4.18
  - make: 4.2.1
- Use cases:
  - A _modern_ set of tools that predate the COVID pandemic and predate a lot of philosophical changes in how/when software releases occur.

</details>


<details>
<summary>ct-ng-1.19.0</summary><br />

- Core
  - Linux: 3.10.2 thru 2.6.27.62
  - Binutils: 2.22 thru 2.18a
  - Gcc: 4.8.1 thru 4.2.2
  - Libc
    - Glibc: 2.17 thru 2.8
    - Eglibc: 2_17 thru 2_9 (or trunk)
    - Uclibc: 0.9.33.2 thru 0.9.30
- Debug
  - dmalloc: 5.5.2
  - duma: 2.5.15
  - gdb: 7.4.1 thru 6.8a (native & cross)
  - ltrace: 0.5.3 thru 0.5.2
  - strace: 4.5.20 thru 4.5.18
- Libs
  - gmp: 5.1.1 thru 4.3.0
  - mpfr: 3.1.2 thru 2.4.0
  - ppl: 0.11.2 thru 0.10.2
  - cloog: 0.15.11 thru 0.15.6
  - libelf: 0.8.13 thru 0.8.12
- Use Cases
  - Building with an older binutils or gcc can work better with some versions of packages.
  - Building a LTS version of Linux 2.6. 
  - Linux has compiler configurations that are version specific.
  - Building a system with the old eglibc (now merged into upstream glibc).

</details>

<details>
<summary>kegel-ct-0.43</summary><br />

- Core
  - Linux: 2.6.15.4 thru 2.6.8 / 2.4.26 / historically 2.2.X
  - Binutils: 2.15 thru 2.16
  - Gcc: 2.95.3 thru 4.1.1
  - Glibc: 2.1.3 thru 2.3.6 (linuxthreads: 2.1.3 thru 2.3.6)
- Misc
  - gcrypt: 2.1
  - gdb: 6.5
- Use Cases
  - This tool is based purely on glibc based toolchains.
  - You need to build something with gcc-2.95 (e.g. Linux 2.4 or Linux 2.2)
  - You need to build something with gcc-3 or assembly with old binutils.

</details>

### ct-ng Toolchain X-Tools Build Example

```sh
$ cd ct-ng-1.24.0-scripts

$ ./list | grep mips
# Lists starter tuples for mips (e.g. mips-malta-linux-gnu)

$ ./stage.sh mips-malta-linux-gnu my-build-alias
# configuration written to .config

$ ./config.sh my-build-alias
# Perform configuration

$ ./build.sh my-build-alias
# Builds toolchain.

$ ../x-tools/binutils-2.32-gcc-4.9.4-linux-3.2.101-glibc-2.28/mips-static-linux-gnu/bin/mips-static-linux-gnu-gcc --version
mips-static-linux-gnu-gcc (crosstool-NG 1.24.0) 4.9.4
Copyright (C) 2015 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

### Kegel Crosstool X-Tools Build Example

```sh
$ cd kegel-ct-0.43-scripts

$ ./list.sh | grep mips
# Lists starter tuples for mips (e.g. mips_gcc-3.4.5-glibc-2.3.6_crosstool.sh)

$ ./stage.sh mips_gcc-3.4.5-glibc-2.3.6_crosstool.sh my-build-alias
# configuration written to .config

$ ./config.sh my-build-alias
# Perform configuration

$ ./build.sh my-build-alias
# Builds toolchain.

$ ../x-tools/binutils-2.15-gcc-3.4.5-linux-2.6.8-glibc-2.3.6/mips-unknown-linux-gnu/bin/mips-unknown-linux-gnu-gcc --version
mips-unknown-linux-gnu-gcc (GCC) 3.4.5
Copyright (C) 2004 Free Software Foundation, Inc.
This is free software; see the source for copying conditions.  There is NO
warranty; not even for MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.
```

## Discovering The Correct Version

When building older versions of code, for whatever reason, it can be a big pain to match the correct version of something with its dependencies. For example, building toolchains with crosstool-ng, you're going to want a really old Linux distribution that runs bash 3.x by default (e.g. Ubuntu Hardy v8.04). To run Kegel's crosstool you'll want to go back even further (e.g. Ubuntu Dapper v6.06).

To wrap my head around this I started creating a table. (Warning: It's big.)

<details>
<summary>Version Table</summary>

|Date                        |Kernel|GCC    |EGCS |Busybox|Crosstool-NG|qemu |Redhat                               |RHEL                 |Fedora|Debian|Ubuntu                |
|----------------------------------------------------------------------------------------------|------|-------|-----|-------|------------|-----|-------------------------------------|---------------------|------|------|----------------------|
|March 22, 1987              |      |0.9.0  |     |       |            |     |                                     |                     |      |      |                      |
|May 23, 1987                |      |1.0.0  |     |       |            |     |                                     |                     |      |      |                      |
|September 17, 1991          |0.01.0|       |     |       |            |     |                                     |                     |      |      |                      |
|January 24, 1994            |      |2.5.8  |     |       |            |     |                                     |                     |      |      |                      |
|March 14, 1994              |1.0.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|April 6, 1994               |1.1.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|October 31, 1994            |      |       |     |       |            |     |0.9.0 (kernel 1.0.9)                 |                     |      |      |                      |
|November 30, 1994           |      |2.6.3  |     |       |            |     |                                     |                     |      |      |                      |
|March 7, 1995               |1.2.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|May 1, 1995                 |      |       |     |       |            |     |1.0.0 (kernel 1.2.8)                 |                     |      |      |                      |
|June 12, 1995               |1.3.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|September 1, 1995           |      |       |     |       |            |     |2.0.0 (kernel 1.2.13)                |                     |      |      |                      |
|June 9, 1996                |2.0.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|June 17, 1996               |      |       |     |       |            |     |                                     |                     |      |1.1.0 |                      |
|July 15, 1996               |      |       |     |       |            |     |3.0.4 (kernel 2.0.?)                 |                     |      |      |                      |
|October 3, 1996             |      |       |     |       |            |     |4.0.0 (kernel 2.0.18)                |                     |      |      |                      |
|December 12, 1996           |      |       |     |       |            |     |                                     |                     |      |1.2.0 |                      |
|July 2, 1997                |      |       |     |       |            |     |                                     |                     |      |1.3.0 |                      |
|August 22, 1997             |      |2.7.2.3|     |       |            |     |                                     |                     |      |      |                      |
|December 1, 1997            |      |       |     |       |            |     |5.0.0                                |                     |      |      |                      |
|December 3, 1997            |      |       |1.0.0|       |            |     |                                     |                     |      |      |                      |
|July 24, 1998               |      |       |     |       |            |     |                                     |                     |      |2.0.0 |                      |
|September 27, 1998          |      |       |     |0.25.0 |            |     |                                     |                     |      |      |                      |
|March 9, 1999               |      |       |     |       |            |     |                                     |                     |      |2.1.0 |                      |
|March 15, 1999              |      |       |1.1.2|       |            |     |                                     |                     |      |      |                      |
|April 19, 1999              |      |       |     |       |            |     |6.0.0 (kernel 2.2 glibc 2.1 egcs)    |                     |      |      |                      |
|June 9, 1999                |2.2.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|August 15, 2000             |      |       |     |       |            |     |                                     |                     |      |2.2.0 |                      |
|October 20, 1999            |      |       |     |0.30.0 |            |     |                                     |                     |      |      |                      |
|January 7, 2000             |      |       |     |0.40.0 |            |     |                                     |                     |      |      |                      |
|September 25, 2000          |      |       |     |       |            |     |7.0.0 (kernel 2.4 glibc 2.2 gcc 2.96)|                     |      |      |                      |
|March 16, 2001              |      |2.95.3 |     |0.50.0 |            |     |                                     |                     |      |      |                      |
|January 4, 2001             |2.4.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|February 20, 2002           |      |3.0.4  |     |       |            |     |                                     |                     |      |      |                      |
|March 23, 2002              |      |       |     |       |            |     |                                     |2.1.0 (kernel 2.4.9) |      |      |                      |
|July 19, 2002               |      |       |     |       |            |     |                                     |                     |      |3.0.0 |                      |
|July 25, 2002               |      |3.1.1  |     |       |            |     |                                     |                     |      |      |                      |
|May 6, 2002                 |      |       |     |       |            |     |                                     |2.1.0                |      |      |                      |
|September 30, 2002          |      |       |     |       |            |     |8.0.0 (glibc 2.3 gcc 3.2)            |                     |      |      |                      |
|March 31, 2003              |      |       |     |       |            |     |9.0.0 (kernel 2.4.20 glibc 2.3.2)    |                     |      |      |                      |
|April 22, 2003              |      |3.2.3  |     |       |            |     |                                     |                     |      |      |                      |
|September 25, 2003          |      |       |     |       |            |     |                                     |                     |0.95.0|      |                      |
|October 22, 2003            |      |       |     |       |            |     |                                     |3.0.0 (kernel 2.4.21)|      |      |                      |
|November 6, 2003            |      |       |     |       |            |     |                                     |                     |1.0.0 |      |                      |
|November 28, 2003           |2.4.23|       |     |       |            |     |                                     |                     |      |      |                      |
|December 17, 2003           |2.6.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|February 14, 2004           |      |3.3.3  |     |       |            |     |                                     |                     |      |      |                      |
|May 18, 2004                |      |       |     |       |            |     |                                     |                     |2.0.0 |      |                      |
|October 13, 2004            |      |       |     |1.0.0  |            |     |                                     |                     |      |      |                      |
|October 26, 2004            |      |       |     |       |            |     |                                     |                     |      |      |4.10.0                |
|November 8, 2004            |      |       |     |       |            |     |                                     |                     |3.0.0 |      |                      |
|February 15, 2005           |      |       |     |       |            |     |                                     |4.0.0 (kernel 2.6.9) |      |      |                      |
|March 2, 2005               |2.6.11|       |     |       |            |     |                                     |                     |      |      |                      |
|April 4, 2005               |2.4.30|       |     |       |            |     |                                     |                     |      |      |                      |
|April 8, 2005               |      |       |     |       |            |     |                                     |                     |      |      |5.04.0 (kernel 2.6.10)|
|April 20, 2005              |      |4.0.0  |     |       |            |     |                                     |                     |      |      |                      |
|June 6, 2005                |      |       |     |       |            |     |                                     |                     |      |3.1.0 |                      |
|June 13, 2005               |      |       |     |       |            |     |                                     |                     |4.0.0 |      |                      |
|February 28, 2006           |      |4.1.0  |     |       |            |     |                                     |                     |      |      |                      |
|March 20, 2006              |2.6.16|       |     |       |            |     |                                     |                     |5.0.0 |      |                      |
|June 1, 2006                |      |       |     |       |            |     |                                     |                     |      |      |6.06.0                |
|August 11, 2006             |2.4.33|       |     |       |            |     |                                     |                     |      |      |                      |
|September 20, 2006          |2.6.18|       |     |       |            |     |                                     |                     |      |      |                      |
|October 24, 2006            |      |       |     |       |            |     |                                     |                     |6.0.0 |      |                      |
|March 15, 2007              |      |       |     |       |            |     |                                     |5.0.0 (kernel 2.6.18)|      |      |                      |
|March 22, 2007              |      |       |     |1.5.0  |            |     |                                     |                     |      |      |                      |
|April 8, 2007               |      |       |     |       |            |     |                                     |                     |      |4.0.0 |                      |
|April 10, 2007              |      |       |     |       |0.0.1       |     |                                     |                     |      |      |                      |
|April 19, 2007              |      |       |     |       |            |     |                                     |                     |      |      |7.04.0                |
|May 13, 2007                |      |4.2.0  |     |       |            |     |                                     |                     |      |      |                      |
|May 31, 2007                |      |       |     |       |            |     |                                     |                     |7.0.0 |      |                      |
|July 1, 2007                |      |       |     |       |0.1.0       |     |                                     |                     |      |      |                      |
|November 8, 2007            |      |       |     |       |            |     |                                     |                     |8.0.0 |      |                      |
|January 1, 2008             |2.4.36|       |     |       |            |     |                                     |                     |      |      |                      |
|January 16, 2008            |      |       |     |       |1.0.0       |     |                                     |                     |      |      |                      |
|March 5, 2008               |      |4.3.0  |     |       |            |     |                                     |                     |      |      |                      |
|April 24, 2008              |      |       |     |       |            |     |                                     |                     |      |      |8.04.0                |
|May 4, 2008                 |      |       |     |       |1.1.0       |     |                                     |                     |      |      |                      |
|May 13, 2008                |      |       |     |       |            |     |                                     |                     |9.0.0 |      |                      |
|October 9, 2008             |2.6.27|       |     |       |            |     |                                     |                     |      |      |                      |
|November 25, 2008           |      |       |     |       |1.3.0       |     |                                     |                     |10.0.0|      |                      |
|December 2, 2008            |2.4.37|       |     |       |            |     |                                     |                     |      |      |                      |
|February 14, 2009           |      |       |     |       |            |     |                                     |                     |      |5.0.0 |                      |
|April 21, 2009              |      |4.4.0  |     |       |            |     |                                     |                     |      |      |                      |
|April 23, 2009              |      |       |     |       |            |     |                                     |                     |      |      |9.04.0                |
|April 26, 2009              |      |       |     |       |1.4.0       |     |                                     |                     |      |      |                      |
|June 9, 2009                |      |       |     |       |            |     |                                     |                     |11.0.0|      |                      |
|November 17, 2009           |      |       |     |       |            |     |                                     |                     |12.0.0|      |                      |
|December 2, 2009            |2.6.32|       |     |       |            |     |                                     |                     |      |      |                      |
|January 26, 2010            |      |       |     |1.16.0 |            |     |                                     |                     |      |      |                      |
|January 31, 2010            |      |       |     |       |1.6.0       |     |                                     |                     |      |      |                      |
|April 14, 2010              |      |4.5.0  |     |       |            |     |                                     |                     |      |      |                      |
|April 29, 2010              |      |       |     |       |            |     |                                     |                     |      |      |10.04.0               |
|May 25, 2010                |      |       |     |       |            |     |                                     |                     |13.0.0|      |                      |
|November 2, 2010            |      |       |     |       |            |     |                                     |                     |14.0.0|      |                      |
|November 9, 2010            |      |       |     |       |            |     |                                     |6.0.0 (kernel 2.6.32)|      |      |                      |
|January 31, 2011            |      |       |     |       |1.10.0      |     |                                     |                     |      |      |                      |
|February 6, 2011            |      |       |     |       |            |     |                                     |                     |      |6.0.0 |                      |
|March 25, 2011              |      |4.6.0  |     |       |            |     |                                     |                     |      |      |                      |
|April 28, 2011              |      |       |     |       |            |     |                                     |                     |      |      |11.04.0               |
|May 18, 2011                |2.6.39|       |     |       |            |     |                                     |                     |      |      |                      |
|May 24, 2011                |      |       |     |       |            |     |                                     |                     |15.0.0|      |                      |
|July 21, 2011               |3.0.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|November 8, 2011            |      |       |     |       |            |     |                                     |                     |16.0.0|      |                      |
|December 1, 2011            |      |       |     |       |            |1.0.0|                                     |                     |      |      |                      |
|January 4, 2012             |3.2.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|January 31, 2012            |      |       |     |       |1.14.0      |     |                                     |                     |      |      |                      |
|March 22, 2012              |      |4.7.0  |     |       |            |     |                                     |                     |      |      |                      |
|April 26, 2012              |      |       |     |       |            |     |                                     |                     |      |      |12.04.0               |
|May 29, 2012                |      |       |     |       |            |     |                                     |                     |17.0.0|      |                      |
|January 15, 2013            |      |       |     |       |            |     |                                     |                     |18.0.0|      |                      |
|January 31, 2013            |      |       |     |       |1.18.0      |     |                                     |                     |      |      |                      |
|March 22, 2013              |      |4.8.0  |     |       |            |     |                                     |                     |      |      |                      |
|April 25, 2013              |      |       |     |       |            |     |                                     |                     |      |      |13.04.0               |
|May 4, 2013                 |      |       |     |       |            |     |                                     |                     |      |7.0.0 |                      |
|July 2, 2013                |      |       |     |       |            |     |                                     |                     |19.0.0|      |                      |
|September 2, 2013           |3.11.0|       |     |       |            |     |                                     |                     |      |      |                      |
|December 17, 2013           |      |       |     |       |            |     |                                     |                     |20.0.0|      |                      |
|April 17, 2014              |      |       |     |       |            |     |                                     |                     |      |      |14.04.0               |
|April 22, 2014              |      |4.9.0  |     |       |            |     |                                     |                     |      |      |                      |
|June 9, 2014                |      |       |     |       |            |     |                                     |7.0.0 (kernel 3.10)  |      |      |                      |
|August 3, 2014              |3.16.0|       |     |       |            |     |                                     |                     |      |      |                      |
|August 15, 2014             |      |       |     |       |            |2.0.1|                                     |                     |      |      |                      |
|September 8, 2014           |      |       |     |       |1.20.0      |     |                                     |                     |      |      |                      |
|October 23, 2014            |      |       |     |       |            |     |                                     |                     |      |      |14.10.0               |
|December 7, 2014            |3.18.0|       |     |       |            |     |                                     |                     |      |      |                      |
|December 9, 2014            |      |       |     |       |            |     |                                     |                     |21.0.0|      |                      |
|April 12, 2015              |4.0.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|April 22, 2015              |      |5.1.0  |     |       |            |     |                                     |                     |      |      |                      |
|April 23, 2015              |      |       |     |       |            |     |                                     |                     |      |      |15.04.0               |
|April 25, 2015              |      |       |     |       |            |     |                                     |                     |      |8.0.0 |                      |
|May 26, 2015                |      |       |     |       |            |     |                                     |                     |22.0.0|      |                      |
|June 10, 2015               |      |       |     |       |1.21.0      |     |                                     |                     |      |      |                      |
|November 3, 2015            |      |       |     |       |            |     |                                     |                     |23.0.0|      |                      |
|November 20, 2015           |      |       |     |       |1.22.0      |     |                                     |                     |      |      |                      |
|April 21, 2016              |      |       |     |       |            |     |                                     |                     |      |      |16.04.0               |
|April 27, 2016              |      |6.1.0  |     |       |            |     |                                     |                     |      |      |                      |
|June 21, 2016               |      |       |     |       |            |     |                                     |                     |24.0.0|      |                      |
|October 13, 2016            |      |       |     |       |            |     |                                     |                     |      |      |16.10.0               |
|November 22, 2016           |      |       |     |       |            |     |                                     |                     |25.0.0|      |                      |
|December 11, 2016           |4.9.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|April 13, 2017              |      |       |     |       |            |     |                                     |                     |      |      |17.04.0               |
|April 20, 2017              |      |       |     |       |1.23.0      |     |                                     |                     |      |      |                      |
|May 2, 2017                 |      |7.1.0  |     |       |            |     |                                     |                     |      |      |                      |
|June 17, 2017               |      |       |     |       |            |     |                                     |                     |      |9.0.0 |                      |
|July 11, 2017               |      |       |     |       |            |     |                                     |                     |26.0.0|      |                      |
|November 12, 2017           |4.14.0|       |     |       |            |     |                                     |                     |      |      |                      |
|November 14, 2017           |      |       |     |       |            |     |                                     |                     |27.0.0|      |                      |
|April 26, 2018              |      |       |     |       |            |     |                                     |                     |      |      |18.04.0               |
|May 1, 2018                 |      |       |     |       |            |     |                                     |                     |28.0.0|      |                      |
|May 2, 2018                 |      |8.1.0  |     |       |            |     |                                     |                     |      |      |                      |
|July 26, 2018               |      |8.2.0  |     |       |            |     |                                     |                     |      |      |                      |
|October 18, 2018            |      |       |     |       |            |     |                                     |                     |      |      |18.10.0               |
|October 22, 2018            |4.19.0|       |     |       |            |     |                                     |                     |      |      |                      |
|October 30, 2018            |      |       |     |       |            |     |                                     |                     |29.0.0|      |                      |
|December 23, 2018           |4.20.0|       |     |       |            |     |                                     |                     |      |      |                      |
|March 3, 2019               |5.0.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|April 11, 2019              |      |       |     |       |            |3.0.1|                                     |                     |      |      |                      |
|April 13, 2019              |      |       |     |       |1.24.0      |     |                                     |                     |      |      |                      |
|April 18, 2019              |      |       |     |       |            |     |                                     |                     |      |      |19.04.0               |
|May 3, 2019                 |      |9.1.0  |     |       |            |     |                                     |                     |      |      |                      |
|May 7, 2019                 |      |       |     |       |            |     |                                     |8.0.0 (kernel 4.18.0)|30.0.0|      |                      |
|July 6, 2019                |      |       |     |       |            |     |                                     |                     |      |10.0.0|                      |
|October 17, 2019            |      |       |     |       |            |4.0.1|                                     |                     |      |      |                      |
|October 29, 2019            |      |       |     |       |            |     |                                     |                     |31.0.0|      |                      |
|November 24, 2019           |5.4.0 |       |     |       |            |     |                                     |                     |      |      |                      |
|April 23, 2020              |      |       |     |       |            |     |                                     |                     |      |      |20.04.0               |
|April 28, 2020              |      |       |     |       |            |     |                                     |                     |32.0.0|      |                      |
|May 7, 2020                 |      |10.1.0 |     |       |            |     |                                     |                     |      |      |                      |
|September 15, 2020          |      |       |     |       |            |5.0.1|                                     |                     |      |      |                      |
|October 27, 2020            |      |       |     |       |            |     |                                     |                     |33.0.0|      |                      |
|December 13, 2020           |5.10.0|       |     |       |            |     |                                     |                     |      |      |                      |
|April 22, 2021              |      |       |     |       |            |     |                                     |                     |      |      |21.04.0               |
|April 27, 2021              |      |11.1.0 |     |       |            |     |                                     |                     |34.0.0|      |                      |
|August 14, 2021             |      |       |     |       |            |     |                                     |                     |      |11.0.0|                      |
|October 14, 2021            |      |       |     |       |            |     |                                     |                     |      |      |21.10.0               |
|October 28, 2021            |      |       |     |       |            |6.0.1|                                     |                     |      |      |                      |
|October 31, 2021            |5.15.0|       |     |       |            |     |                                     |                     |      |      |                      |
|November 2, 2021            |      |       |     |       |            |     |                                     |                     |35.0.0|      |                      |
|March 20, 2022              |5.17.0|       |     |       |            |     |                                     |                     |      |      |                      |
|March 24, 2022              |      |       |     |       |1.25.0rc1   |     |                                     |                     |      |      |                      |
|April 19, 2022              |      |       |     |       |            |7.0.0|                                     |                     |      |      |                      |
|April 21, 2022              |      |       |     |       |            |     |                                     |                     |      |      |22.04.0               |

</details>

## Abandoned Build Suites

Along with Linux distributions and their package management, there are also build suites like [yocto](https://www.yoctoproject.org/), [openwrt](https://openwrt.org/), [buildroot](https://buildroot.org/), crosstool-NG, crosstool. All of these tools build multiple upstream source packages. They all automatically download a range of packages and associated patch sets. This is fantastic and feels like magic when it works. But as the internet has shown over and over again, it is volatile. These build suites can easily become obsolete by the simple fact that the download location of a package doesn't exist anymore. To compound these issues, many of these build suites have limited resources and don't maintain LTS versions.

Note: Even major organizations like kernel.org and Ubuntu have relocated packages from what were believed to be stable locations. For example, Ubuntu commonly moves unsupported package repositories to [http://old-releases.ubuntu.com/ubuntu/](http://old-releases.ubuntu.com/ubuntu/). On some occasions you may need to manually patch scripts like debootstrap or sources.list at this _old-releases_ to get the correct environment for a targeted version.

**Takeaway:** Any tool that automatically downloads source from hard coded upstream URLs is temporal.

If you expect it to build at some unknown date in the future, you must save all of the dependent source packages. Fortunately most of these systems do have some sort of local caching or download directory that they check before reaching out to the internet to download. This gives us the opportunity to preload packages from unofficial sources.

**Tip:** I've found that looking for packages with "Index of" in google can help significantly with locating older packages. For example, if you wanted to find an old version of `isl`, you can search for "Index of isl" and Google/DuckDuckGo/Bing is more likely to find you a classic file listing page with an array of versions.

**Tip:** Leandro Lisboa Penz (lpenz) has a [patched debootstrap](https://github.com/lpenz/docker-debian-releases) that'll allow you to build older debian or ubuntu root filesystems or you can download them from [DockerHub](https://hub.docker.com/u/lpenz).

## Comments

<Comments />

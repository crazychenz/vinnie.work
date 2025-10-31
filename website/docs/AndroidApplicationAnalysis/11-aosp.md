---
sidebar_position: 110
sidebar_label: Browsing, Acquiring, and Building AOSP (Notes Only)
---

<!-- pagebreak -->

# Browsing, Acquiring, and Building AOSP

:::danger

Work In Progress - Missing Critical Content

:::

<!-- 
- AOSP
    - AOSP is enormous, cs.android.com, using repo/git.
    - libart - runtime and platform specific code
    - Find potential solutions for vreg access, dex access.
    - _Consider_: Building AOSP?
 -->


Android Open Source Project (AOSP). The AOSP is the open source project that allows you to build Android from source code (i.e. from scratch). The business case for building Android from scratch is to allow hardware vendors and other embedded device vendors to tailor Android for their platforms. Be aware, having the source code to Android does not mean you can build Android for any ole device (plus your changes), load it on and be good to go. There is a lot of specific and highly technical skills that go into preparing an Android build for a vendor specific device. (Of course things are a little different for Pixel phones. `:)`).

For the rest of us, the Android source code allows us to easily peek into the internals to understand why memory is organized or to understand how particular options and arguments are practically implemented and are intended to behave. Confirming this knowledge with observations in reverse engineering or dynamic analysis can afford you, as an engineer, the ability to takes larger leaps of faith on the running system.

For the adventurous, you can also acquire the code and dependencies locally and build an image of AOSP for yourself. You can run the image in an emulator or if you want more true to the CPU architecture of a mobile device, you can build yourself a low-cost RaspberryPi build for experiementation. By having a working image that you've built from scratch, you have the option to add special instrumentation or feature sets that are not available in upstream versions. This could be the difference in being able to debug an application on Android 16 -ish environment or not. (I guess you could also start a company that builds an open source Android phone? ...)

## Browse AOSP

AOSP is positively massive (i.e. hundreds of gigabytes from the Git repositories alone), and as such, if all you need are some analysis of course code or offset calculations to squirrel your way into the memory of an Android release, it can be significantly easier to simply browse to the [cross-referenced version of Android that is readily available online](https://cs.android.com/android/platform/superproject). The top level link is easy to remember too: [https://cs.android.com](https://cs.android.com). Simply click the "Android" card and select the superproject link.

The search bar at the top of the screen is a great place to start. When you click in the search text field, similar to Github, it'll let you choose a scope for your search. I recommend sticking with the "repository" scope for now. 

### Browsing Android Runtime Library (ART)

Within the context of our discussion, we'll be staying entirely within the Android Runtime Library (`art` or `libart`). ART is where the Dalvik code is located within the AOSP. A couple key locations would be:

- `./art/runtime/*` - At first glance, you'll see over a dozen folders. Don't forget there are critical files in this folder as well.
- `./art/runtime/arch/*` - Architecture specific code. We care about this because this happens to also be where a lot of code that determines whether to start JDWP or not exists.

As with any C/C++ project, a good place to jump in is the headerfiles, specifically `runtime.h` in this case. Looking at the header file, you'll notice that there are many many method calls and they are all `static` or `inline`. In C++, this often equates to the methods being inlined or hardcoded into the code so there will be no exported symbol for that call in the ELF output. When there is no symbol exported, that makes using the code from Frida almost impossible to locate and reuse. In Frida land, we really can only reasonably lean on function calls that are neither static nor inline.

If you are like me, you really only care about the member variables associated with a class. In the case of `Runtime` class, the first instance of a member variable isn't until nearly 1200 lines have passed. The particular declaration is:

```c
LIBART_PROTECTED static Runtime* instance_;
```

This `instance_` variable is the singleton for the Runtime environment. If you are able to get this pointer, there are a great many things you can accomplish with ART from a debugger or instrumentation tool. We'll talk more about grabbing native pointers from bytecode land in a later section.

<!-- TODO: Discuss C++ class structure in memory? -->

## Acquire AOSP Code

If you'd rather browse the code with your favorite fuzzy search enabled IDE or cross reference the code yourself, you're going to require a few dependencies to fetch the AOSP source code. Android has documented the [requirements on their own site](https://source.android.com/docs/setup/start/requirements), but I'll also walk through what specifically worked for me.

The first thing you must do to acquire the AOSP code is to have `repo` installed into your system. `repo` is a tool that assist with managing projects across an array of smaller Git repositories.

<!-- - [Upstream `repo` Documentation](https://source.android.com/docs/setup/reference/repo) -->

To install Google's `repo` tool into our `env.sh` environment:

```sh
mkdir -p ${ANDROID_HOME}misc-tools
# Note: repo is roughly 44KiB
curl -o ${ANDROID_HOME}misc-tools/repo -L https://storage.googleapis.com/git-repo-downloads/repo
chmod a+x ${ANDROID_HOME}misc-tools/repo
```

<!-- TODO: Needs to be tested. -->
You can _optionally_ verify the download with:

```sh
gpg --recv-keys 8BB9AD793E8E6153AF0F9A4416530D5E920F5C65
curl -s https://storage.googleapis.com/git-repo-downloads/repo.asc \
  | gpg --verify - ${ANDROID_HOME}misc-tools/repo
```

The next step is to decide where to put the AOSP project files. I recommend that the AOSP code go somewhere different than `~/apks` because its way more than an APK. The AOSP code should also not be placed in `${ANDROID_HOME}`. AOSP will generate non-compatible files that SDK tools scan for in `${ANDROID_HOME}`. Therefore we need a new convention for AOSP that allows us to pull down the source code while providing the flexibility to have some utility scripts to perform operations on that code. My convention will be:

`~/aosp` - The base AOSP folder (`$AOSP_HOME`).
`~/aosp/source` - The directory that will hold the code (>150GB).

Ok, so we know where we plan to put the code when we download it, but _what code_ do we want to download? You can select a specific branch that you want checked out by looking at [the reference list](https://android.googlesource.com/platform/manifest/+refs). In my case, I'm going for a recent version of Android 13, so I've choosen `android-13.0.0_r84`.

Ok, lets acquire the AOSP code. Please keep in mind that the `repo sync` command can take many hours. I recommend setting aside an entire day or over night timeframe to run the command.

```sh
mkdir -p ~/aosp/source
cd ~/aosp/source
repo init -u https://android.googlesource.com/platform/manifest -b android-13.0.0_r84
# Note: This is the command that takes hours to run.
repo sync -c -j$(nproc)
```

Troubleshooting: Something I've noticed on my older hardware (running Debian 13/Trixe) is that the `repo sync` command can sometimes _stick_? Its an idempotent command, so you can Ctrl-C and rerun if required. I world recommend giving any given command at least an hour, and if there is no progress: see if moving a mouse, hitting enter or nudging the terminal in some way wakes it up. Once that doesn't work, `Ctrl-C` as many times as required to get back to the terminal shell, then re-run until we get to a successful completion.

Once you have successfully synchronized the code to your local system, I would encourage you to check out the size of the folder (`du -h -d 0 ~/aosp/source`). If you want to stay up to date with the code and histories available, you can re-run `repo sync -c -j$(nproc)` periodically (e.g. cron).

<!-- TODO: Consider a walk through the layout and how it differs from cs.android.com -->

Now that you have the code, you can start your indexing, IDE loading, or whatever you intended to do with the dump. In the next section, we'll discuss building the code.

## Building AOSP

Android is designed to build on Ubuntu. Android 13 builds on Ubuntu 20.04. I've tried to build Android 13 AOSP on Debian 13 and I quickly ran into the issue of no libncurses5.so being available in Debian 13. Ugh. Ok, we'll need to use an Ubuntu 20.04 container to perform all of our AOSP builds. 

<!-- TODO: Integrate this somehow

To build, get all the submodules:

```sh
repo sync --fetch-submodules
```

Example Output:

```text
(adb-venv) $ repo sync --fetch-submodules
Syncing:  99% (1145/1146), done in 6m37.605s
Syncing: 100% (1146/1146) 6:53 | ..working..repo sync has finished successfully.
(adb-venv) $
```
 -->

The plan is to build a small Ubuntu 20.04 docker image that has all of the bare minimum dependencies to perform the build. We will not need any of our "adb-venv" environment to perform the build. The AOSP build is nearly self-contained (except for some Ubuntu based assumptions). AOSP code itself will remain in our `~/aosp/source` folder and be volume mounted into the container. We'll run the container as our current user to prevent `root` artifacts from showing up in the `~/aosp/source` folder.

If you do not have docker installed, see the [Docker Installation Documentation](https://docs.docker.com/engine/install/). I usually click on Debian, add the `apt` repos, and `apt install` the `docker-ce` version of the tool with the various plugins (compose, build kit, and so forth).

When complete, there will be the additional set of files in our `~/aosp` folder:

- `~/aosp/context` - Docker specific context folder. (We _really_ don't want to accidently embed `source` into the image!)
- `~/aosp/aosp-builder.dockerfile` - Dockerfile definition for aosp-builder image.
- `~/aosp/build-docker-image.sh` - Script to rebuilt docker image.
- `~/aosp/run-docker-image.sh` - Script to run within docker image.
<!-- TODO: - `~/aosp/build-sysimg-sdk33-emu-x86_64.sh` - Script to build AOSP -->

Create the following files:

`~/aosp/aosp-builder.dockerfile`:

```Dockerfile
FROM ubuntu:20.04

ARG USER_UID=1000
ARG USER_GID=1000

RUN apt-get update
RUN apt-get install -y git curl python3 unzip libncurses5 passwd zip

RUN /sbin/groupadd -g $USER_GID user
RUN /sbin/useradd -u $USER_UID -g $USER_GID -m user
USER $USER_UID:$USER_GID
WORKDIR /home/user
```

`~/aosp/build-docker-image.sh`:

```sh
#!/bin/bash

docker build -t aosp-builder \
  --build-arg USER_UID=$(id -u) \
  --build-arg USER_GID=$(id -g) \
  -f Dockerfile context
```

`~/aosp/run-docker-image.sh`:

```sh
#!/usr/bin/env bash

docker run -ti --rm \
  -v $(pwd):/home/user/aosp -w /home/user/aosp \
  -u $(id -u):$(id -g) \
  aosp-builder
```

Now make sure the `sh` files are executable and build the `aosp-builder` Docker image.

```sh
cd ~/aosp
chmod +x *.sh
./build-docker-image.sh
```

If everything went well, you should now have a `aosp-builder` docker image in your local Docker cache.

### First Build Walkthrough

Run the container:

```sh
cd ~/aosp
./run-docker-image.sh
```

The `run-docker-image.sh` script has volume mounted `~/aosp` to `/home/user/aosp` in the container and the script has made `/home/user/aosp` the current working directory. 

The prompt will look something like: `user@6ed9f11c4f4d:/home/user/aosp$`

Once you are in the container, enter the `source` folder and enable the the build environment:

```sh
cd source
source build/envsetup.sh
```

The `envsetup.sh` script enables some aliases that we'll use to configure and launch the build. In summary we'll need to configure the build for a target build, perform the actual build, and then package the build for use with the emulator. If you want to see some build target options, you can run `lunch`. The lunch output will look similar to:

```text
You're building on Linux

Lunch menu .. Here are the common combinations:
     1. aosp_arm-eng
     2. aosp_arm64-eng
     ... snip ...
     44. aosp_trout_x86_64-userdebug
     45. aosp_whitefin-userdebug
     46. aosp_x86-eng
     47. aosp_x86_64-eng
     48. arm_krait-eng
     ... snip ...
     77. uml-userdebug
     78. yukawa-userdebug
     79. yukawa_sei510-userdebug

Which would you like? [aosp_arm-eng]
Pick from common choices above (e.g. 13) or specify your own (e.g. aosp_barbet-eng):
```


<!-- ```sh
# Caution: `lunch aosp_x86_64-eng` builds, but without qemu_img_zip target available
lunch sdk_phone_x86_64
``` -->

For our purposes, we need to run a specific build that will work on our `x86_64` hosted emulator. You may think that `aosp_x86_64-eng` is an obvious choice, but it has extra complications. The primary being that `aosp_x86_64-eng` doesn't support building a emulator friendly ZIP file. More on that later. For now, build for `sdk_phone_x86_64` with the following command:

```sh
lunch sdk_phone_x86_64
```

Example Output:

```text
============================================
PLATFORM_VERSION_CODENAME=REL
PLATFORM_VERSION=13
TARGET_PRODUCT=sdk_phone_x86_64
TARGET_BUILD_VARIANT=eng
TARGET_BUILD_TYPE=release
TARGET_ARCH=x86_64
TARGET_ARCH_VARIANT=x86_64
... snip ...
```

After running `lunch`, you'll see that there is a new `out` folder within the `/home/user/aosp/source` folder. This will be the top level folder for all of the output from the build system. If you ever need to nuke everything that has been built and start from scratch (without re-downloading the source), `rm -rf out`. Its also a neat folder where you can see the system decomposed into all of its parts (after the build).

<!-- TODO: Mention a VM is OK for AOSP building. -->

Once the build target has been configured, we can begin the make. If you are building on a build system, you can run full throttle with something like `-j$(nproc)`. I am building on a 6 core machine that I am still using for other things so I'm going to be using `-j3` for my make command. Its also worth mentioning that you may trigger the OOM killer if you have less than 16GB of memory free. Yes, Android takes 16GB of available memory (minimal) to build and even then it may not be enough based on configuration. Note: The 16GB does not include OS used memory, I wouldn't recommend attempting the building on a machine with less than 24GB total system memory (32GB recommended).

<!-- ```text
12:10:22 ************************************************************
12:10:22 You are building on a machine with 15.4GB of RAM
12:10:22
12:10:22 The minimum required amount of free memory is around 16GB,
12:10:22 and even with that, some configurations may not work.
12:10:22
12:10:22 If you run into segfaults or other errors, try reducing your
12:10:22 -j value.
12:10:22 ************************************************************
``` -->

To build android, we'll be using the `m` alias. Its short for `make` and is interchangable so long as you are in the `source` folder. You can run `make clean` to clobber everything, or `make help` to see a list of other possible make targets. To start the build, run the following:

```sh
m -j3
```

Example Output:

```text
user@6ed9f11c4f4d:/home/user/aosp$ m -j3
08:34:06 Build sandboxing disabled due to nsjail error.
build/make/core/soong_config.mk:209: warning: BOARD_PLAT_PUBLIC_SEPOLICY_DIR has been deprecated. Use SYSTEM_EXT_PUBLIC_SEP
OLICY_DIRS instead.
build/make/core/soong_config.mk:210: warning: BOARD_PLAT_PRIVATE_SEPOLICY_DIR has been deprecated. Use SYSTEM_EXT_PRIVATE_S
EPOLICY_DIRS instead.
============================================
PLATFORM_VERSION_CODENAME=REL
PLATFORM_VERSION=13
TARGET_PRODUCT=sdk_phone_x86_64
TARGET_BUILD_VARIANT=eng

... snip ...

[ 97% 581/597] including system/sepolicy/Android.mk ...

```

When the build first starts, you'll see a reasonable looking output saying that build is working through several hundred targets. This may take a few minutes to process, but after that, the **real** build begins! Below we have the subsequent output showing a total of 155,351 targets to build. This will take a long time. Lots of documentation online has examples using things like `make -j32` ... I presume these are bulky build servers that can build the whole thing in roughly an hour, I wouldn't know (`:-P`).

```text
... snip ...

[  0% 890/155351] bc: libclcore_x86.bc <= frameworks/rs/driver/runtime/arch/generic.c
    0:00 bc: libclcore_g.bc <= frameworks/rs/driver/runtime/rs_sample.c
    0:00 bc: libclcore_g.bc <= frameworks/rs/driver/runtime/rs_sampler.c
    0:00 bc: libclcore_g.bc <= frameworks/rs/driver/runtime/rs_convert.c

... snip ...

[100% 155351/155351] Create system-qemu.img now
removing out/target/product/emulator_x86_64/system-qemu.img.qcow2
out/host/linux-x86/bin/sgdisk --clear out/target/product/emulator_x86_64/system-qemu.img

#### build completed successfully (05:59:13 (hh:mm:ss)) ####

user@6ed9f11c4f4d:/home/user/aosp$
```

The above text shows the end of a successful build. At this point you can see the fruit of your labors by checking out `out/target/product/emulator_x86_64/`. If you aren't running in a container, you should be able to literally run `emulator` from the CLI right now and it'll pop-up the emulator. Since I depise Ubuntu and I'm running from a container, we'll take a slightly different path.

## Running Out AOSP Build

The next step is to build a ZIP file that contains all of the files (except one) to make a base system image that can be used by `avdmanager`. Run the following to create the ZIP file:

```sh
m -j3 emu_img_zip
```

Example Ouput:

```text
user@6ed9f11c4f4d:/home/user/aosp$ m emu_img_zip
19:50:37 Build sandboxing disabled due to nsjail error.
build/make/core/soong_config.mk:209: warning: BOARD_PLAT_PUBLIC_SEPOLICY_DIR has been deprecated. Use SYSTEM_EXT_PUBLIC_SEP
OLICY_DIRS instead.
build/make/core/soong_config.mk:210: warning: BOARD_PLAT_PRIVATE_SEPOLICY_DIR has been deprecated. Use SYSTEM_EXT_PRIVATE_S
EPOLICY_DIRS instead.
============================================
PLATFORM_VERSION_CODENAME=REL
PLATFORM_VERSION=13

... snip ...

[ 99% 1374/1376] Create system-qemu.img now
removing out/target/product/emulator_x86_64/system-qemu.img.qcow2
updating out/target/product/emulator_x86_64/system-qemu.img ...
done
[100% 1376/1376] Package: out/target/product/emulator_x86_64/sdk-repo-linux-system-images-eng.user.zip

#### build completed successfully (03:26 (mm:ss)) ####

user@6ed9f11c4f4d:/home/user/aosp$
```

OK, great. We now have all of the output we care about packaged up into a ZIP file at `out/target/product/emulator_x86_64/sdk-repo-linux-system-images-eng.user.zip`. Now we need to drop the contents of the ZIP file into our host system's `${ANDROID_HOME}system-images` folder so we can reference it with `avdmanager`. At this point, either `exit` out of the container or open a new "adb-venv" enabled terminal and run the following:

```sh
mkdir ${ANDROID_HOME}system-images/android-33/aosp
cd ${ANDROID_HOME}system-images/android-33/aosp
unzip ~/aosp/source/out/target/product/emulator_x86_64/sdk-repo-linux-system-images-eng.user.zip
```

To make the AVD baseline discoverable by the SDK tools, we need to define a `package.xml`. Here is an example that I've hacked together from another upstream version:

`${ANDROID_HOME}system-images/android-33/aosp/x86_64/package.xml`:

```xml
<?xml version="1.0" encoding="UTF-8" standalone="yes"?>

<ns2:repository
    xmlns:ns2="http://schemas.android.com/repository/android/common/02"
    xmlns:ns3="http://schemas.android.com/repository/android/common/01"
    xmlns:ns4="http://schemas.android.com/repository/android/generic/01"
    xmlns:ns5="http://schemas.android.com/repository/android/generic/02"
    xmlns:ns6="http://schemas.android.com/sdk/android/repo/addon2/01"
    xmlns:ns7="http://schemas.android.com/sdk/android/repo/addon2/02"
    xmlns:ns8="http://schemas.android.com/sdk/android/repo/addon2/03"
    xmlns:ns9="http://schemas.android.com/sdk/android/repo/repository2/01"
    xmlns:ns10="http://schemas.android.com/sdk/android/repo/repository2/02"
    xmlns:ns11="http://schemas.android.com/sdk/android/repo/repository2/03"
    xmlns:ns12="http://schemas.android.com/sdk/android/repo/sys-img2/04"
    xmlns:ns13="http://schemas.android.com/sdk/android/repo/sys-img2/03"
    xmlns:ns14="http://schemas.android.com/sdk/android/repo/sys-img2/02"
    xmlns:ns15="http://schemas.android.com/sdk/android/repo/sys-img2/01">
  <license id="android-sdk-license" type="text">You good.</license>
  <localPackage
      path="system-images;android-33;aosp;x86_64"
      obsolete="false">
    <type-details
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:type="ns12:sysImgDetailsType">
      <api-level>33</api-level>
      <base-extension>true</base-extension>
      <tag>
        <id>aosp</id>
        <display>AOSP Android System Image</display>
      </tag>
      <abi>x86_64</abi>
      <abis>x86_64</abis>
    </type-details>
    <revision><major>2</major></revision>
    <display-name>Intel x86_64 Atom System Image</display-name>
    <uses-license ref="android-sdk-license"/>
    <dependencies>
      <dependency path="emulator">
        <min-revision>
          <major>29</major>
          <minor>1</minor>
          <micro>11</micro>
        </min-revision>
      </dependency>
    </dependencies>
  </localPackage>
</ns2:repository>
```

Now that we have the AVD baseline installed, we can generate the AVD:

```sh
avdmanager create avd -n aosp -k "system-images;android-33;custom;x86_64"
```

Start the `emulator` with the new AVD:

```sh
emulator -avd aosp \
  -no-snapshot -writable-system -selinux permissive \
  -show-kernel -verbose -no-audio -no-window
```

And if you want to wipe the AVD without messing with `rm` and folders, delete the AVD with:

```sh
avdmanager delete avd -n aosp
```

In conclusion, you now should have the ability to make any changes you'd like in any AOSP source file (that's used in the target build) and take it from source code to executed code in the emulator (or real device if that was your target).




<!-- 
From GPT:

```
AOSP’s prebuilts are self-contained tools, but they still depend on a minimal baseline of host libraries — primarily:

glibc

libncurses5 / libtinfo5

libz

libstdc++

fontconfig (for some host tools)

and a few X11 libs (for emulator)

That’s why the setup instructions tell you to install libncurses5 and friends, even though Clang itself is in prebuilts/.
``` -->



<!-- Example output:

```text
(adb-venv) $ repo init -u https://android.googlesource.com/platform/manifest -b android-13.0.0_r84
Downloading Repo source from https://gerrit.googlesource.com/git-repo
repo: Updating release signing keys to keyset ver 2.3

Your identity is: user <user@gmail.com>
If you want to change this, please re-run 'repo init' with --config-name

Testing colorized output (for 'repo diff', 'repo status'):
  black    red      green    yellow   blue     magenta   cyan     white
  bold     dim      ul       reverse
Enable color display in this user account (y/N)? y

repo has been initialized in /home/user/.android/aosp
(adb-venv) $
``` -->





<!-- 
## Run AOSP Build

Android 13+: `make emu_img_zip`
- `sdk-repo-linux-system-images-eng.[username]].zip`
- Used as _AVD System Image URL_

Android 12-: `make -j32 sdk sdk_repo`
- `aosp-android-latest-release/out/host/linux-x86/sdk/sdk_phone_x86/sdk-repo-linux-system-images-eng.[username].zip`
- `aosp-android-latest-release/out/host/linux-x86/sdk/sdk_phone_x86/repo-sys-img.xml`
- Edit `repo-sys-img.xml`
  - Update `<sdk:url>`
- Used as _Custom Update Site URL_. -->


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
Android Open Source Project (AOSP). The AOSP is the open source project that allows you to build Android from scratch. The business case for building Android from scratch is to allow hardware vendors and other embedded device vendors to tailor Android for their platforms. For us, it allows us to easily peek into the internals to understand why memory is organized the way we may observe, or to understand how particular options and arguments are practically implemented.

For the adventurous, you can also acquire the code and dependencies locally and build an image of AOSP for yourself. You can run the image in an emulator or if you want more true to the CPU architecture of a mobile device, you can build yourself a low-cost RaspberryPi build for experiementation. By having a working image that you've built from scratch, you have the option to add special instrumentation or feature sets that are not available in upstream versions. This could be the difference in being able to debug an application on Android 16 -ish environment or not.

## Browse AOSP

AOSP is positively massive (i.e. hundreds of gigabytes in source code form), and as such, if all you need are some offsets to squirrel your way into the memory of an Android release, it can be significantly easier to simply browser the [cross-referenced version of Android that is readily available online](https://cs.android.com/android/platform/superproject). The top level link is easy to remember too: [https://cs.android.com](https://cs.android.com). Simply click the "Android" card and select the superproject link.

The search bar at the top of the screen is a great place to start. When you click in the search text field, similar to Github, it'll let you choose a scope for your search. I recommend sticking with the "repository" scope for now. 

### Browsing Android Runtime Library (ART)

Within the context of our discussion, we'll be staying entirely within the Android Runtime Library (`art` or `libart`). ART is where the Dalvik code is located within the AOSP. A couple key locations would be:

- `./art/runtime/*` - At first glance, you'll see over a dozen folders. Don't forget there are critical files in this folder as well.
- `./art/runtime/arch/*` - Architecture specific code. We care about this because this happens to also be where a lot of code that determines whether to start JDWP or not exists.

As with any C/C++ project, a good place to jump in is the headerfiles, specifically `runtime.h` in this case. Looking at the header file, you'll notice that there are many many method calls and they are all `static`. In C++, this often equates to the methods being inlined or hardcoded into the code so there will be no exported symbol for that call. When there is no symbol exported, that makes using the code from Frida almost impossible to locate and reuse. In Frida land, we really can only reasonably lean on function calls that are neither static or inline.

If you are like me, you really only care about the member variables associated with a class. In the case of `Runtime` class, the first instance of a member variable isn't until nearly 1200 lines have passed. The particular declaration is:

```c
LIBART_PROTECTED static Runtime* instance_;
```

This `instance_` variable is the singleton for the Runtime environment. If you are able to get this pointer, there are a great many things you can accomplish with ART from a debugger or instrumentation tool. We'll talk more about grabbing native pointers from bytecode land in a later section.

## Acquire AOSP Code

https://source.android.com/docs/setup/start/requirements

```
export REPO=$(mktemp /tmp/repo.XXXXXXXXX)
curl -o ${REPO} https://storage.googleapis.com/git-repo-downloads/repo
gpg --recv-keys 8BB9AD793E8E6153AF0F9A4416530D5E920F5C65
curl -s https://storage.googleapis.com/git-repo-downloads/repo.asc | gpg --verify - ${REPO} && install -m 755 ${REPO} ~/bin/repo
```


Install minimal system dependencies with your package manager:

```sh
sudo apt update
sudo apt install git curl python3 unzip libncurses-dev
```

sudo apt install \
    gnupg flex bison build-essential  zlib1g-dev \
    gcc-multilib g++-multilib libc6-dev-i386 lib32ncurses5-dev \
    x11proto-core-dev libx11-dev lib32z1-dev libgl1-mesa-dev \
    libxml2-utils xsltproc  fontconfig zip
    
    git-core
    unzip
    libncurses5
    
    curl


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
```

<!-- TODO: Do everything without these from APK: repo openjdk-11-jdk -->

Install Google's `repo` tool into our `env.sh` environment:

```sh
mkdir -p ${ANDROID_HOME}misc-tools
# Note: repo is roughly 44KiB
curl -o ${ANDROID_HOME}misc-tools/repo -L https://storage.googleapis.com/git-repo-downloads/repo
chmod a+x ${ANDROID_HOME}misc-tools/repo
```

```sh
mkdir -p ${ANDROID_HOME}aosp
cd ${ANDROID_HOME}aosp
```

Pick a branch: https://android.googlesource.com/platform/manifest/+refs

To initialize or switch to a new branch:

```sh
repo init -u https://android.googlesource.com/platform/manifest -b android-13.0.0_r84
```

Example output:

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
```

Get/Update _all_ the things. Idempotent (can be rerun if interrupted.) Caution: This can take a VERY long time. I would do this one overnight or start in the morning and don't expect it to finish before lunch:

```sh
repo sync -c -j$(nproc)
```

Example Output (compressed for readability):

```text
(adb-venv) $ repo sync -c -j$(nproc)
info: A new version of repo is available
warning: repo is not tracking a remote branch, so it will not receive updates
info: Restarting repo with latest version
Syncing:  6% (80/1145) 3:37 | 8 jobs | 3:28 device/goog..
Receiving objects: 100% (11179/11179), 2.46 MiB | 6.91 MiB/s, done.
Syncing:  6% (80/1145) 3:38 | 8 jobs | 3:28 device/goog..
Resolving deltas: 100% (6085/6085), done.
# ... snip ...
Resolving deltas: 100% (140/140), done.
Syncing: 96% (1107/1145) 21:42 | 8 jobs | 11:51 platf..
Receiving objects: 100% (7957/7957), 1.35 MiB | 21.25 MiB/s, done.
Resolving deltas: 100% (2462/2462), done.
Syncing: 100% (1145/1145), done in 37m8.509s
Syncing: 100% (1145/1145) 37:08 | ..working..repo sync has finished successfully.
(adb-venv) $
```

A quick rerun should look like:

```text
(adb-venv) $ repo sync -c -j$(nproc)
Syncing: 100% (1145/1145), done in 1m8.240s

repo sync has finished successfully.
```

I've observed it sometimes locking up as well. It should be safe to Ctrl-C out of and rerun if its lingering on the same repo for over an hour.

Note: The last time I downloaded AOSP in this manner it was over 128 GB (gigabytes)! And due to the sheer number of files that git creates and manages, it took a full day worth of hours to download the first time.



<!-- DOES NOT WORK Optionally avoid downloading full history:

```sh
repo sync -c -j$(nproc) --no-tags --depth=1
``` -->

<!-- MEH, DONT KNOW IF I CARE. Optionally only download for a single device:

```sh
repo sync -c -j$(nproc) device/google/cheetah device/google/cheetah-kernel vendor/google -l
``` -->

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

- [Upstream `repo` Documentation](https://source.android.com/docs/setup/reference/repo)

## Build AOSP

Setup build environment:

```sh
source build/envsetup.sh
```

Configure for build target:
```sh
# See available targets:
lunch
```

Example Output:

```text
(adb-venv) $ lunch

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
Pick from common choices above (e.g. 13) or specify your own (e.g. aosp_barbet-eng): 47

Hint: next time you can simply run 'lunch aosp_x86_64-eng'

============================================
PLATFORM_VERSION_CODENAME=REL
PLATFORM_VERSION=13
TARGET_PRODUCT=aosp_x86_64
TARGET_BUILD_VARIANT=eng
TARGET_BUILD_TYPE=release
TARGET_ARCH=x86_64
TARGET_ARCH_VARIANT=x86_64
TARGET_2ND_ARCH=x86
TARGET_2ND_ARCH_VARIANT=x86_64
HOST_ARCH=x86_64
HOST_2ND_ARCH=x86
HOST_OS=linux
HOST_OS_EXTRA=Linux-6.12.43+deb13-amd64-x86_64-Debian-GNU/Linux-13-(trixie)
HOST_CROSS_OS=windows
HOST_CROSS_ARCH=x86
HOST_CROSS_2ND_ARCH=x86_64
HOST_BUILD_TYPE=release
BUILD_ID=TQ3A.230805.001.S2
OUT_DIR=out
PRODUCT_SOONG_NAMESPACES=device/generic/goldfish device/generic/goldfish-opengl hardware/google/camera
hardware/google/camera/devices/EmulatedCamera
============================================
(adb-venv) $ 
```

```sh
# Caution: `lunch aosp_x86_64-eng` builds, but without qemu_img_zip target available
lunch sdk_phone_x86_64
```

Example Output:

```text
user@6ed9f11c4f4d:/opt/aosp$ m -j3
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
TARGET_BUILD_TYPE=release
TARGET_ARCH=x86_64
TARGET_ARCH_VARIANT=x86_64
TARGET_2ND_ARCH=x86
TARGET_2ND_ARCH_VARIANT=x86_64
HOST_ARCH=x86_64
HOST_2ND_ARCH=x86
HOST_OS=linux
HOST_OS_EXTRA=Linux-6.12.43+deb13-amd64-x86_64-Ubuntu-20.04.6-LTS
HOST_CROSS_OS=windows
HOST_CROSS_ARCH=x86
HOST_CROSS_2ND_ARCH=x86_64
HOST_BUILD_TYPE=release
BUILD_ID=TQ3A.230805.001.S2
OUT_DIR=out
[ 97% 581/597] including system/sepolicy/Android.mk ...
system/sepolicy/Android.mk:57: warning: BOARD_PLAT_PUBLIC_SEPOLICY_DIR has been deprecated. Use SYSTEM_EXT_PUBLIC_SEPOLICY_
DIRS instead.
system/sepolicy/Android.mk:62: warning: BOARD_PLAT_PRIVATE_SEPOLICY_DIR has been deprecated. Use SYSTEM_EXT_PRIVATE_SEPOLIC
Y_DIRS instead.
[ 99% 594/597] including out/soong/late-sdk_phone_x86_64.mk ...
    0:01 including out/soong/late-sdk_phone_x86_64.mk ...

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

user@6ed9f11c4f4d:/opt/aosp$

```

```
$ m emu_img_zip
19:50:37 Build sandboxing disabled due to nsjail error.
build/make/core/soong_config.mk:209: warning: BOARD_PLAT_PUBLIC_SEPOLICY_DIR has been deprecated. Use SYSTEM_EXT_PUBLIC_SEP
OLICY_DIRS instead.
build/make/core/soong_config.mk:210: warning: BOARD_PLAT_PRIVATE_SEPOLICY_DIR has been deprecated. Use SYSTEM_EXT_PRIVATE_S
EPOLICY_DIRS instead.
============================================
PLATFORM_VERSION_CODENAME=REL
PLATFORM_VERSION=13
TARGET_PRODUCT=sdk_phone_x86_64
TARGET_BUILD_VARIANT=eng
TARGET_BUILD_TYPE=release
TARGET_ARCH=x86_64
TARGET_ARCH_VARIANT=x86_64
TARGET_2ND_ARCH=x86
TARGET_2ND_ARCH_VARIANT=x86_64
HOST_ARCH=x86_64
HOST_2ND_ARCH=x86
HOST_OS=linux
HOST_OS_EXTRA=Linux-6.12.43+deb13-amd64-x86_64-Ubuntu-20.04.6-LTS
HOST_CROSS_OS=windows
HOST_CROSS_ARCH=x86
HOST_CROSS_2ND_ARCH=x86_64
HOST_BUILD_TYPE=release
BUILD_ID=TQ3A.230805.001.S2
OUT_DIR=out
PRODUCT_SOONG_NAMESPACES=device/generic/goldfish device/generic/goldfish-opengl hardware/google/camera hardware/google/came
ra/devices/EmulatedCamera device/generic/goldfish device/generic/goldfish-opengl
============================================
wildcard(out/target/product/emulator_x86_64/clean_steps.mk) was changed, regenerating...
[ 86% 1188/1376] //system/librustutils:libcutils_bindgen bindgen bindgen/cutils.h

... snip ...

[ 99% 1374/1376] Create system-qemu.img now
removing out/target/product/emulator_x86_64/system-qemu.img.qcow2
updating out/target/product/emulator_x86_64/system-qemu.img ...
done
[100% 1376/1376] Package: out/target/product/emulator_x86_64/sdk-repo-linux-system-images-eng.user.zip

#### build completed successfully (03:26 (mm:ss)) ####

user@6ed9f11c4f4d:/opt/aosp$
```

Note: Can't have aosp beneath ${ANDROID_HOME} because SDK scans AOSP for files names that are not compatible with SDK within AOSP.

Create ${ANDROID_HOME}system-images/android-33/custom

Decompress zip from AOSP output:

```sh
cd ${ANDROID_HOME}system-images/android-33/custom
unzip ${AOSP_HOME}out/target/product/emulator_x86_64/sdk-repo-linux-system-images-eng.user.zip
```

Add `package.xml` (rename various fields as appropriate):

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
      path="system-images;android-33;custom;x86_64"
      obsolete="false">
    <type-details
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:type="ns12:sysImgDetailsType">
      <api-level>33</api-level>
      <base-extension>true</base-extension>
      <tag>
        <id>custom</id>
        <display>Custom Android System Image</display>
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

Create AVD:

avdmanager create avd -n aosp -k "system-images;android-33;custom;x86_64"

Delete AVD:

avdmanager delete avd -n aosp

Start AVD:

```sh
emulator -avd aosp \
  -no-snapshot -writable-system -selinux permissive \
  -show-kernel -verbose -no-audio -no-window
```



```text
(adb-venv) $ lunch aosp_x86_64-eng

============================================
PLATFORM_VERSION_CODENAME=REL
PLATFORM_VERSION=13
TARGET_PRODUCT=aosp_x86_64
TARGET_BUILD_VARIANT=eng
TARGET_BUILD_TYPE=release
TARGET_ARCH=x86_64
TARGET_ARCH_VARIANT=x86_64
TARGET_2ND_ARCH=x86
TARGET_2ND_ARCH_VARIANT=x86_64
HOST_ARCH=x86_64
HOST_2ND_ARCH=x86
HOST_OS=linux
HOST_OS_EXTRA=Linux-6.12.43+deb13-amd64-x86_64-Debian-GNU/Linux-13-(trixie)
HOST_CROSS_OS=windows
HOST_CROSS_ARCH=x86
HOST_CROSS_2ND_ARCH=x86_64
HOST_BUILD_TYPE=release
BUILD_ID=TQ3A.230805.001.S2
OUT_DIR=out
PRODUCT_SOONG_NAMESPACES=device/generic/goldfish device/generic/goldfish-opengl hardware/google/camera
hardware/google/camera/devices/EmulatedCamera
============================================
(adb-venv) $
```

Start the make:

```sh
m -j$(nproc)
```

If you're machine doesn't have sufficient memory, you may get a warning that looks like:

```text
12:10:22 ************************************************************
12:10:22 You are building on a machine with 15.4GB of RAM
12:10:22
12:10:22 The minimum required amount of free memory is around 16GB,
12:10:22 and even with that, some configurations may not work.
12:10:22
12:10:22 If you run into segfaults or other errors, try reducing your
12:10:22 -j value.
12:10:22 ************************************************************
```

Example output:

```text
(adb-venv) $ m -j$(nproc)
build/make/core/soong_config.mk:209: warning: BOARD_PLAT_PUBLIC_SEPOLICY_DIR has been deprecated. Use S
YSTEM_EXT_PUBLIC_SEPOLICY_DIRS instead.
build/make/core/soong_config.mk:210: warning: BOARD_PLAT_PRIVATE_SEPOLICY_DIR has been deprecated. Use
SYSTEM_EXT_PRIVATE_SEPOLICY_DIRS instead.
============================================
PLATFORM_VERSION_CODENAME=REL
PLATFORM_VERSION=13
TARGET_PRODUCT=aosp_x86_64

... snip ...

============================================
[ 98% 390/397] analyzing Android.bp files and generating ninja file at out/soong/build.ninja
    1:17 test android/soong/cc
    1:09 test android/soong/rust
    1:04 test android/soong/aidl
    1:04 test android/soong/java
    1:01 test android/soong/apex
    0:58 test android/soong/sdk

... snip ...

[  0% 963/164155] Build hyb out/target/product/generic_x86_64/obj/ETC/hyph-de-1996_intermediates/hyph-de-1996.hyb <- exter$
    0:01 Build hyb out/target/product/generic_x86_64/obj/ETC/hyph-af_intermediates/hyph-af.hyb <- external/hyphenation-patt
    0:00 Build hyb out/target/product/generic_x86_64/obj/ETC/hyph-cs_intermediates/hyph-cs.hyb <- external/hyphenation-patt
    0:00 Build hyb out/target/product/generic_x86_64/obj/ETC/hyph-cu_intermediates/hyph-cu.hyb <- external/hyphenation-patt
```


```text
[ 99% 107127/107142] //frameworks/base/packages/SystemUI:SystemUI r8
Warning: Missing class android.compat.annotation.UnsupportedAppUsage (referenced from: void com.android.systemui.people.wid
get.PeopleBackupHelper.writeNewStateDescription(android.os.ParcelFileDescriptor))
[100% 107142/107142] Target vbmeta image: out/target/product/generic/vbmeta.img

#### build completed successfully (03:41:01 (hh:mm:ss)) ####

user@460c305ada5d:/opt/aosp$
```

Emulator build should be in:

```text
# FALSE
out/target/product/generic_x86_64/
```






## Run AOSP Build

Android 13+: `make emu_img_zip`
- `sdk-repo-linux-system-images-eng.[username]].zip`
- Used as _AVD System Image URL_

Android 12-: `make -j32 sdk sdk_repo`
- `aosp-android-latest-release/out/host/linux-x86/sdk/sdk_phone_x86/sdk-repo-linux-system-images-eng.[username].zip`
- `aosp-android-latest-release/out/host/linux-x86/sdk/sdk_phone_x86/repo-sys-img.xml`
- Edit `repo-sys-img.xml`
  - Update `<sdk:url>`
- Used as _Custom Update Site URL_.




DOES NOT WORK

emulator -verbose -show-kernel -selinux permissive \
  -kernel prebuilt/android-emulator/kernel-ranchu-64 \
  -ramdisk out/target/product/emulator_x86_64/ramdisk.img \
  -system out/target/product/emulator_x86_64/system.img \
  -vendor out/target/product/emulator_x86_64/vendor.img \
  -data out/target/product/emulator_x86_64/userdata.img

<!--
```
emulator -avd <your_avd_name> -system out/target/product/generic_x86_64/system.img \
  -ramdisk out/target/product/generic_x86_64/ramdisk.img \
  -kernel out/target/product/generic_x86_64/kernel \
  -data out/target/product/generic_x86_64/userdata.img \
  -verbose

$ANDROID_SDK/emulator/emulator -avd <avd_name> -system out/target/product/generic_x86_64/system.img
```
-->


Convention:

~/aosp/source - AOSP
~/aosp/context - Docker context
~/aosp/Dockerfile
~/aosp/build-docker-image.sh - Script to rebuilt docker image.
~/aosp/run-docker-image.sh - Script to run within docker image.
~/aosp/build-sysimg-sdk33-emu-x86_64.sh - Script to build AOSP

```sh
mkdir -p ~/aosp/context
cd ~/aosp/
```


`Dockerfile`:

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

`build.sh`:

```sh
#!/bin/bash

docker build -t android-builder \
  --build-arg USER_UID=$(id -u) \
  --build-arg USER_GID=$(id -g) \
  -f Dockerfile context
```

`run.sh`:

```sh
#!/usr/bin/env bash

docker run -ti --rm \
  -v $(pwd)/aosp:/opt/aosp -w /opt/aosp \
  -u $(id -u):$(id -g) \
  android-builder
```

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


## Acquire AOSP Code

```sh
sudo apt update
sudo apt install git curl python3 unzip openjdk-11-jdk repo
```

```sh
mkdir -p ~/bin
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/bin/repo
chmod a+x ~/bin/repo
export PATH=~/bin:$PATH
```

```sh
mkdir ~/aosp
cd ~/aosp
```

```sh
repo init -u https://android.googlesource.com/platform/manifest -b android-14.0.0_r1
```

Branches: https://android.googlesource.com/platform/manifest/+refs


Get all the things. Idempotent (can be rerun if interrupted.)

```sh
repo sync -c -j$(nproc)
```

Note: The last time I downloaded AOSP in this manner it was over 128 GB (gigabytes)!



Optionally avoid downloading full history:

```sh
repo sync -c -j$(nproc) --no-tags --depth=1
```

Optionally only download for a single device:

```sh
repo sync -c -j$(nproc) device/google/cheetah device/google/cheetah-kernel vendor/google -l
```

To build, get all the submodules:

```sh
repo sync --fetch-submodules
```

## Browse AOSP

cs.android.com

./art/runtime/*
./art/runtime/arch/*

## Build AOSP

Setup build environment:

```sh
source build/envsetup.sh
```

Configure for build target:
```sh
# See available targets:
lunch

# Config for Pixel 7
lunch aosp_cheetah-userdebug

# Other default configs
lunch aosp_x86_64-eng
lunch aosp_x86-eng
lunch aosp_arm64-eng
lunch aosp_arm-eng
```

Start the make:

```sh
m -j$(nproc)
```

Emulator build should be in:

```text
out/target/product/generic_x86_64/
```


## Run AOSP Build

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
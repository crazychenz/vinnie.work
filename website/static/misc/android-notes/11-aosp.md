
<!-- 
- AOSP
    - AOSP is enormous, cs.android.com, using repo/git.
    - libart - runtime and platform specific code
    - Find potential solutions for vreg access, dex access.
    - _Consider_: Building AOSP?
 -->


## Acquire AOSP Code

```
sudo apt update
sudo apt install git curl python3 unzip openjdk-11-jdk repo
```

```
mkdir -p ~/bin
curl https://storage.googleapis.com/git-repo-downloads/repo > ~/bin/repo
chmod a+x ~/bin/repo
export PATH=~/bin:$PATH
```

```
mkdir ~/aosp
cd ~/aosp
```

```
repo init -u https://android.googlesource.com/platform/manifest -b android-14.0.0_r1
```

Branches: https://android.googlesource.com/platform/manifest/+refs


Get all the things. Idempotent (can be rerun if interrupted.)

```
repo sync -c -j$(nproc)
```

Note: The last time I downloaded AOSP in this manner it was over 128 GB (gigabytes)!



Optionally avoid downloading full history:

```
repo sync -c -j$(nproc) --no-tags --depth=1
```

Optionally only download for a single device:

```
repo sync -c -j$(nproc) device/google/cheetah device/google/cheetah-kernel vendor/google -l
```

To build, get all the submodules:

```
repo sync --fetch-submodules
```

## Browse AOSP

cs.android.com

./art/runtime/*
./art/runtime/arch/*

## Build AOSP

Setup build environment:

```
source build/envsetup.sh
```

Configure for build target:
```
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

```
m -j$(nproc)
```

Emulator build should be in:

```
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
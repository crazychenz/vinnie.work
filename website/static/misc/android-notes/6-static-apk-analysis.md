<!-- 

- Static APK Inspection
  - apktool - decompress and decode APK
  - Analyze Manifest
  - Analyze Smali code
  - Analyze native libraries
    - Ghidra

  - jadx
  - jadx-gui

  - Androguard programatically doing:
    - APK parsing
    - dex internals
    - APK resources
  
- Static Analysis of APK
  - TODO: Install jadx
  - TODO: Install pipenv: androguard, thirdparty tools, frida, fuzzyfinder, pure-python-adb-reborn, mitmproxy

 -->



## APK Overview

An Android Package Kit (APK) is a ZIP file of resources distributed by the developer to run an Android application. Roughly speaking, they are composed of:

- Manifest - Metadata about the package.
  - Single file encoded in `axml`, decoded to `xml`.
- Dex Files - Bundles of Dalvik Executable Code.
  - You can think of this like a more complex `jar`.
- Libraries - All of the native code that runs outside of the Dalvik VM.
  - ELF shared object files of native executable code. There is usually a duplicate `so` file each supported CPU instruction set. Most commonly, `x86_64`, `x86`, `aarch64`, and a variant of 32bit `armeabi`.
- Resources - All the other stuff.
  - Encoded in `axml`, decoded to a folder structure of files.

An APK's design principles were developed around supporting embedded system constraints (i.e. low memory, slow CPUs, battery operated). Therefore it has lots of awkward optimizations like XMLs in binary and the whole APK ZIP is ment to be _aligned_ on page boundaries to speed up references to objects in the file. 

## Extracting an APK

TODO: Consider a convention for jar files!

The simplest way to extract and examine the innards of an APK is to use the `apktool`. `apktool` often can be installed with a local package manager (e.g. `apt install apktool`). For the latest release, check out the [APKtool Github releases page](https://github.com/iBotPeaches/Apktool/releases). The tool from github is a `jar` file. If you had `myspecial.apk` that you wanted to expand, you could do something like:

```sh
java -jar apktool_2.12.1.jar d myspecial.apk
```

TODO: Do a better job of fleshing this out.

## Smali Code

TODO: Flesh this out more.

[Baksmali Github](https://github.com/JesusFreke/smali)

## Native Library Analysis

TODO: Flesh this out.

Ghidra

Cutter

## Extracting and Decompiling APK with JADX

TODO: Flesh this out.

Download and install from https://github.com/skylot/jadx/releases

### jadx cli

jadx vs jadx-gui

### jadx-gui

Run, open file, select APK, click open.

It will attempt to deobfuscate and decompile.

## Programatically Extracting and Analyzing APKs

TODO: Flesh this out

Download and install Androguard

<!-- - Androguard programatically doing:
    - APK parsing
    - dex internals
    - APK resources -->






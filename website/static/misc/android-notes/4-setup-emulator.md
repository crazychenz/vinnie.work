- Setup (emulator and analysis) environment
  - Setup openjdk-17
  - Setup commandline tools
  - Install platform tools, emulator, and other Google packages.
  - Install target system image (e.g. x86_64 Android 13)
  - Install scrcpy
  - Install jadx
  - Install pipenv: androguard, thirdparty tools, frida, fuzzyfinder, pure-python-adb-reborn, mitmproxy

## Setup Java

When doing analysis on Android, you often need to build or use tools on your development host that are written in Java. This means that you'll need Java installed into your environment. Unfortunately, its not as mature or prefessional as "download/install the newest" and away you go. There are certain versions you'll need for different versions of Android, or the tools. Put simply, I've found the sweet spot to be Java 17, but I recommend you have maybe Java 8, Java 17, and the newest available for when you need them.

For now, we'll use OpenJDK 17. Since OpenJDK 17 is not longer supported, we must download it from the [OpenJDK Archive site](https://jdk.java.net/archive/). Download the bundle and extract similar to the following:

```sh
cd ~/.android
tar -xf ~/Downloads/openjdk-17.0.2_linux-x64_bin.tar.gz
```

If you're using the `env.sh` that was previous used, you should now be able to verify the Java install by running `java --version`:

```sh
$ java --version
openjdk 17.0.2 2022-01-18
OpenJDK Runtime Environment (build 17.0.2+8-86)
OpenJDK 64-Bit Server VM (build 17.0.2+8-86, mixed mode, sharing)
```

## Google Packages


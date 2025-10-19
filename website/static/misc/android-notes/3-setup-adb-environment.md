---
sidebar_position: 30
---

# Setting Up ADB Environment

<!-- 
- ADB into device.
  - Collect ADB information on application:
    - Get the package name (from running application)
    - Get the installed package information.
    - Discover, locate, and extract application APK.
      - Can also discover, locate, and extract application via internet.
  - Root if desired.
    - Grab the sqlite databases that hold application information.
 -->

## Android Debug Bridge (ADB)

ADB is the Android Debug Bridge. To me, it is a very misleading acronym because I automatically think it looks like an "android debugger", similar to gdb (GNU Debugger) or jdb (Java Debugger). ADB is nothing like a debugger.

ADB is designed as a bridge that allows you, the developer, to access the internals and configuration of the Android system. You can think of ADB as 3 major components:

- ADB Client - This is the `adb` command you use on the developer host.
- ADB Server - This is an ADB server that run on the developer host, usually autostarted by the client.
- ADB Daemon - This is another ADB server that runs on the target device or emulator.

When you run a command like `adb shell`, the command that you provide is serialized and sent to the server. For example, if you send `adb -s emulator-5554 shell echo test`, over the wire you might see: `host:transport:emulator-5554,shell:echo test`. The local ADB server then forwards that command to the ADB daemon running on the device for execution and eventually returns the results back through the server and back to the client.

```
   ---------- Developer Host -------            -- Android Device --
  |                                 | <----->  |      ADB Daemon    |
  |  ADB Client <-----> ADB Server  |           --------------------
  |                                 |           ----- Emulator -----
  |                                 | <----->  |      ADB Daemon    |
   ---------------------------------            --------------------
```

By having these parts split up, the ADB server can continuously run and monitor multiple device connections while the client only needs to send the actions to the server. There are other fun things you can do like daisy chain servers together so you can make a ADB Daemon not locally connected appear local. But more on that later.

In summary, `adb` is not a debugger. `adb` is a tool to access the configuration and internals of the Android system for things like running shell commands on the Android device.

### Acquire ADB

For my purposes, I never use the full version of _Android Studio_. Instead, I'll use only the command line version of developer tools for Android analysis. For `adb` only, you can commonly install an older version with your native package manager. For `apt` based distributions, its `apt install adb`.

## Setup Environment

As we go along, we'll be adding more tools. To make things easy, I've provided a script that enables the environment that I intend to end up with. Not having all of the referenced paths is harmless as we build up the toolbox, so we might as well have everything setup as soon as possible. This alieviates the need to continually update a non-repeatable environment or restarts shells and terminals.

There are many ways to skin this cat (via .dotfiles, via .profile, vi other shell RC files). Because I work on many different projects across many different languages that use many different SDKs, I don't like to manage SDK folders in my general home dotfiles. Instead, my convention for managing a particular project is to have a script that launches a new shell with the settings I want. This way I'm avoiding unrepeatable environments and I can easily reset with a `exit; ./env.sh` type of behavior. Since the script I have is harmless before you have all the tools, I'll provide everything at once. If you follow along with subsequent procedures, everything should line up fine. Note: There is a pre-requisite that you have `python3` and `python3-pip` already installed.

`~/.android/env.sh`:

```sh
#!/usr/bin/env bash

if [ -z "$(which python3)" ]; then
  echo "Missing 'python3' from \$PATH."
  echo "Suggestion: apt-get install python3"
  exit 1
fi

if [ -z "$(which pip)" -a -z "$(which pip3)" ]; then
  echo "Missing 'pip' from \$PATH."
  echo "Suggestion: apt-get install python3-pip"
  exit 1
fi

# Check for python3-venv (via ensurepip existance)
python3 -c "import ensurepip" &>/dev/null
if [ $? -ne 0 ]; then
  echo "Missing 'venv' module in Python."
  echo "Suggestion: apt-get install python3-venv"
  exit 1
fi

export ANDROID_HOME=${HOME}/.android/
export JAVA_HOME=${ANDROID_HOME}jdk-17.0.2/
export PATH=${JAVA_HOME}bin:$PATH
export PATH=${ANDROID_HOME}cmdline-tools/latest/bin:$PATH
export PATH=${ANDROID_HOME}platform-tools:$PATH
export PATH=${ANDROID_HOME}emulator:$PATH
export PATH=${ANDROID_HOME}scrcpy:$PATH
export PATH=${ANDROID_HOME}jadx/bin:$PATH
export PATH=${ANDROID_HOME}misc-tools:$PATH

# Version agnostic PATH entries and symlink to fallback build-tools
export PATH=$PATH:${ANDROID_HOME}misc-tools/build-tools-symlink

# Make sure .android and .android/scripts exists.
ls ${ANDROID_HOME}misc-tools &>/dev/null || mkdir -p ${ANDROID_HOME}misc-tools
# Assuming build-tools 33.0.0 manually installed.
ls ${ANDROID_HOME}misc-tools/build-tools-symlink &>/dev/null \
  || ln -s ${ANDROID_HOME}build-tools/33.0.0 ${ANDROID_HOME}misc-tools/build-tools-symlink

# Version Specific
#export PATH=${ANDROID_HOME}cmake/latest/bin:$PATH
#export PATH=${ANDROID_HOME}ndk/latest/toolchains/llvm/prebuilt/linux-x86_64/bin:$PATH
#export PATH=${ANDROID_HOME}ndk/latest:$PATH

export PS1_TAG="(adb-venv) "
export PS1="${PS1_TAG}${PS1:-\$ }"

if [ ! -f "$ANDROID_HOME/adb-venv" ]; then
  python3 -m venv $ANDROID_HOME/adb-venv
  if [ $? -ne 0 ]; then
    echo "Failed to create venv"
    exit 1
  fi
fi
source $ANDROID_HOME/adb-venv/bin/activate

pip show frida &>/dev/null || pip install frida-tools
pip show frida-tools &>/dev/null || pip install frida-tools
pip show pure-python-adb-reborn &>/dev/null || pip install pure-python-adb-reborn
pip show androguard &>/dev/null || pip install androguard
pip show pyaxml &>/dev/null || pip install pyaxml
pip show fuzzyfinder &>/dev/null || pip install fuzzyfinder

exec bash -i
```

After creating the file, ensure its executable: `chmod +x ~/.android/env.sh`

To activate it, run: `~/.android/env.sh`

You should now be left with a shell that resembles something like: `(adb-venv) $ `.

## Setup Java

To start off, lets make sure we have an expected version of Java running. When doing analysis on Android, you often need to build or use tools on your development host that are written in Java. This means that you'll need Java installed into your environment. Unfortunately, not all software that use Gradle are as mature or prefessional as "download/install the newest" and away you go. There are certain versions you'll need for different versions of Android or the tools. I've found the sweet spot to be Java 17, but I recommend you have maybe Java 8, Java 17, and the newest available for when you need them.

For now, we'll use OpenJDK 17. Since OpenJDK 17 is not longer supported, we must download it from the [OpenJDK Archive site](https://jdk.java.net/archive/). Download the bundle and extract similar to the following:

```sh
mkdir ~/.android
cd ~/.android
tar -xf ~/Downloads/openjdk-17.0.2_linux-x64_bin.tar.gz
```

If you're using the `env.sh` that was previous used, you should now be able to verify the Java install by running `java --version`:

```sh
(adb-venv) $ java --version
openjdk 17.0.2 2022-01-18
OpenJDK Runtime Environment (build 17.0.2+8-86)
OpenJDK 64-Bit Server VM (build 17.0.2+8-86, mixed mode, sharing)
```

## Install via Google's "Command Line Tools"

The command line tools for Android are a minimal set of tools.

- The key binary we need from this package is the `sdkmanager`. `sdkmanager` is used to discover and install all of the other command line Android development, build, and deployment tools. 
- The other binary that we'll use from the "Command Line Tools" package is the `avdmanager`. `avdmanager` is the command used to manage the different instances of emulators that we have on our system. You can think of this as a lightweight hypervisor manager for Android Emulators.

To manually locate and download the "Command Line Tools" Browse to [https://developer.android.com/studio](https://developer.android.com/studio) and scroll to nearly the bottom where you'll find "Command line tools only". Select the Zip file that meets your system requirements. After the ZIP download is complete, extract the Zip into the `$ANDROID_HOME` folder. Afterwards you need to move everything into a `latest` subfolder within `cmdline-tools`. For example:

```sh
cd ~/.android
unzip ~/Downloads/commandlinetools-linux-13114758_latest.zip
cd cmdline-tools
mkdir latest
mv * ./latest/
```

Sometimes there are other tools that assume you have multiple versions of SDKs on your system. They will assume they are given the exact version to use or they'll look for `latest` in the appropriate tool folder. I don't know why Google ships the file the way it does, but I'm sure they have their reasons. Moving on!

## Installing ADB Tools

Now that you have `sdkmanager` in your environment and in your `$PATH`, (assuming you have internet access) lets install `adb`:

```sh
yes | sdkmanager "platform-tools"
```

Note: `yes |` automatically accepts the EULA that is presented by sdkmanager.

You should now be able to test if you have adb by running `adb version`. At the time of this writing, my output is:

```text
Android Debug Bridge version 1.0.41
Version 36.0.0-13206524
Installed as /home/user/.android/platform-tools/adb
Running on Linux 6.12.43+deb13-amd64 (x86_64)
```

## ADB Into (Unrooted) Device

Now that we have ADB installed and configured, lets test is on an Android Device. Plug a device into a developer host machine via USB. Hopefully you've gotten some notification that the device was recognized by the developer host machine. Its out of scope to troubleshoot this kind of thing here, but on Linux I recommend monitoring USB insertions with something like `watch | lsusb`. Once the device is connected in recognized:

- In Developer Tools on the target device, enable "USB debugging".

  - Allow USB debugging?, click OK.

  - Allow USB debugging? The computer RSA key fingerprint is: ... , click "Always allow from this computer", click Allow.

Note: The fingerprint that the phone asks about is a OpenSSH key generated by the `adb` server on the host. The key files are usually kept (by default) in `~/.android/adbkey` and `~/.android/adbkey.pub`. This also happens to be the reason I've shoved all the other Android stuff in the same folder, by convention.

Once the device USB debugging is all setup, you may receive device reconnection notifications (often in the form of a file share) in your developer host OS. You can ignore this by closing it or allowing it if you want the storage mounted.

Now you may run `adb devices` to see if your device is connected. The host can have multiple devices (or emulators) connected and you can specify what device to connect to with `adb -s <device-name>`. If there is only one device connected, you can omit the device selection and `adb` will implicitly select the only option.

```text
(adb-venv) $ adb devices
List of devices attached
RFCNC34J1RT     device
emulator-5554   device
```

To specify the device to connect to, do something like `adb -s RFCNC34J1RT shell echo worked` where `RFCNC34J1RT` is the serial number as displayed from the list of devices. Going forward, unless otherwise specified, we'll omit the `-s` flag. (It makes everything harder to read.)

## Inspect Reddit via ADB

Find the application in the running process list. For example, if we're looking for Reddit:

```sh
(adb-venv) $ adb shell "ps -A" | grep -i reddit
u0_a320      14081  1149 26127600 289564 0                  0 S com.reddit.frontpage
```

In the above command, we ran the command `ps -A` to list all running processes. The output was returned to our shell and we used our **local** grep to find any instances of "reddit" (case-insensitive). If we run the following, the grep search happens on the device, not in our local system:

```sh
(adb-venv) $ adb shell "ps -A | grep -i reddit"
u0_a320      14081  1149 26127600 289564 0                  0 S com.reddit.frontpage
```

Its important to distinguish the difference between the above commands because you can forget that what you are submitting to adb shell is parsed by the local shell first and then handled locally. Sometimes we need to use an executable that is on the device and sometimes we'd prefer to have the follow up command run locally for processing with more powerful tools and versions of binaries that may not exist on both systems.

Now lets look at the results of our filtered `ps` command from above. The process that we found has what appears to be a package name of `com.reddit.frontpage` with a process ID (PID) of `14081`. Both the package name and the process id (PID) are very important to be able to quickly identify for any target application. Many debugging and analysis tools allow you to inspect or effect the applications by referencing their package name or PID.

### Getting More App Package Information

```sh
adb shell dumpsys package com.reddit.frontpage
```

After running that command, you'll get a flood of information in a structure like:

```text
Activity Resolver Table:
  ...
Receiver Resolver Table:
  ...
Service Resolver Table:
  ...
Domain verification status:
  ...
Permissions:
  ...
Registered ContentProviders:
  ...
ContentProvider Authorities:
  ...
Key Set Manager:
  ...
Packages:
  ...                     <<---- package identification info here
Queries:
  ...
Dexopt state:
  ...
Compiler stats:
  ...
Historical install Logging info(9/10):
  ...
HeimdAllFS state:
  ...
```

These are all different kinds of data structures defined and utilized by the application. Generally, you don't need to understand what everythihng does. Its more important to be able to scan through the data and identify entries that maybe of interest to achieve your goals. For example, see the `Packages:` section and know that there is detailed information about the running package there that you can use to verify APK extraction or locate an APK from an online APK archive. Accurate identity information is also a critical skill when disambiguating communications with peers.

## Other ADB Shell Commands

There are many inspection commands in Android that can provide an overwhelming amount of information. The type of information can be extra confusing if you haven't been developing Android applications for years. I highly recommend you find other articles or material to assist with tips and tricks to find the exact kind of information you are looking for. Many use cases are one-offs and unique for their situation and then forgotten once you get over the hump. As always, large language models are there to poke to get ideas and things to try. On a non-rooted device, its much safer to scan for this kind of information because there really is only a limited amount of things you can do and 99.9% of the commands are harmless (on a **non-rooted device**)!

Here are some nice to always know commands:

```sh
# List installed system packages
adb shell pm list packages -s

# List installed 3rd party packages
adb shell pm list packages -3

# Package information
adb shell dumpsys package <package-name>
```

## ADB Pull/Push Commands

Other than `adb shell`, the other two most important `adb` subcommands to know are `push`/`pull`. These two commands are how to upload and download files between the developer host and the Android device. Need I say more?

As always, you can dump all of the given output to a file on the local dev machine by doing something like:

```sh
adb shell "dumpsys package com.reddit.frontpage" >com.reddit.frontpage-app-dumpsys.txt
```

If there are files that already exist on the device, you can pull them with `adb pull`. For example, lets suppose you did:

```sh
adb shell "dumpsys package com.reddit.frontpage > /sdcard/app-dumpsys.txt"
```

The file is now on the device at `/sdcard/app-dumpsys.txt`. You can pull that file to your local current working directory with:

```sh
adb pull /sdcard/app-dumpsys.txt
```

The same works with push:

```sh
echo 'special data' > datafile
adb push ./datafile /sdcard/datafile
```

The file `./datafile` now exists on the device at `/sdcard`.

## Extract A Running APK From Device

Lets put together the `adb shell` and `adb pull` to extract the running APK from the device for further analysis:

```sh
PKG_NAME=com.reddit.frontpage
# Fetch running path to APK with "pm path", strip "^package:", filter with "base.apk$"
APK_PATH=$(adb shell "pm path $PKG_NAME" | sed 's/^package://' | grep base.apk$)
# Pull package.
adb pull $APK_PATH $PKG_NAME.apk
```

If successful, the APK of the target application running on the device should now exist on the developer host. The `com.reddit.frontpage.apk` in this case can now be unwrapped and decomposed into all of its bits for analysis and static reverse engineering. The nice thing here is that you know you have the exact binary that you were interfacing with on the device and not potentially some knock off or different version from a sketchy APK archive website.


<!-- 

## Account Databases

TODO: If rooted, grab extra databases?

TODO: Fully automated download and install of tools. -->
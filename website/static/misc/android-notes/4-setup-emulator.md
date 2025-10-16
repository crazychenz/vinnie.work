- Setup (emulator and analysis) environment
  - Setup openjdk-17
  - Setup commandline tools
  - Install platform tools, emulator, and other Google packages.
  - Install target system image (e.g. x86_64 Android 13)
  - Install scrcpy
  - Install jadx
  - Install pipenv: androguard, thirdparty tools, frida, fuzzyfinder, pure-python-adb-reborn, mitmproxy

## QEMU - Generic Emulator

QEMU fancies itself "A generic and open source machine emulator and virtualizer". I've been using QEMU for over 25 years. It is an amazing tool that can emulator completely different CPu architectures on x86ish systems. Nowadays, since the time of Linux Kernel-based Virtual Machines (KVM), it is also a virtualization frontend.

- QEMU can do **whole system emulation**, for example: Run a virtual hardware platform with a firmware bootloader that boots a kernel and supports a full user environment. This is very flexible and powerful, but also very slow due to the host CPU having to not only convert all of the applications instructions, but it also must handle all of the hardware emulation (e.g. MMU & IO).

- QEMU can do **userspace emulation**, for example: Run a ARM64 binary on a x86_64 based system. The idea here is that the executable is the same ELF format that an x86_64 would be. It has `.data`, `.text`, and `.bss` sections like any other. The primary difference is that the executable code (found in `.text`) is ARM64 instructions instead of x86_64 instructions. QEMU can do on-the-fly translation of those instructions to allow the executable to make standard ABI calls that all Linux systems support (i.e. the syscall interface).

- QEMU can do **whole system virtualization**. Emulation is the act of converting instruction sets from one to another or mocking up hardware that doesn't actually exist. Virtualization is different in that the instructions are not translated and the virtual hardware is generally backed by real hardware that serves the same function as the API. The real hardware backed aspect plus supported Virtualization technology (e.g. VMX) allows virtualization to provide developers the desired system encapsulation without overly sacrificing on speed or performance. Hypervisors and virtual machines are virtualizations, not emulations.

Android Emulator is a fork of qemu. When I originally started messing around with Android emulator years ago, it was doing full emulation of the system. I could run the ARM version of Android 7 on my x86_64 machine. This always felt really good to me because I was running the _exact_ same code on my developer host as I was on the device.

For performance reasons and due to virtualization extension availability, Android now is developed using virtualization. In general, we run the same APK on x86_64 as we do on ARM64, but Android invokes the CPU specific libaries for the platform it is running on. So while we're not running from the same binary code, its running from the same source code (ideally).

The point that I am driving at here is that we call the Android tool an emulator, but its really a virtual machine. As such, it runs faster and you need to run it with the system image that matches your developer host (in contrast to the target Android device). Another key piece of knowledge is that you can't have any other hypervisor running other than KVM. If you are using VMWare or VirtualBox for other VMs on the developer host, you'll need to compeletely shutdown those services to get the emulator to run happily.

Note: I've gone down a great many paths to circumvent the multi-hypervisor issue. Running qemu inside another VM is technically possible, but the overhead is unbearable (IMHO). Please do not consider running qemu inside a container, containers don't work like that. One strategy that has worked for me is to run QEMU on a completely different machine and connect my ADB server to the ADB server on that machine. It makes for a more complicated environment, but it does allow me to continue using VirtualBox on my developer host while using KVM on a second host. More on this later.

TODO: Write about ADB connect later.


## Installing Emulator and System Image

Enough about QEMU, lets install the Android "emulator" (i.e. Virtual Machine):

```
yes | sdkmanager emulator
```

Verify install with: `emulator -version`:

```
(adb-venv) $ emulator -version
INFO         | Android emulator version 36.1.9.0 (build_id 13823996) (CL:N/A)
INFO         | Graphics backend: gfxstream
Android emulator version 36.1.9.0 (build_id 13823996) (CL:N/A)
Copyright (C) 2006-2024 The Android Open Source Project and many others.
This program is a derivative of the QEMU CPU emulator (www.qemu.org).

  This software is licensed under the terms of the GNU General Public
  License version 2, as published by the Free Software Foundation, and
  may be copied, distributed, and modified under those terms.

  This program is distributed in the hope that it will be useful,
  but WITHOUT ANY WARRANTY; without even the implied warranty of
  MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
  GNU General Public License for more details.
```

Assuming everything has gone well, we now need to select a base system image to run with the emulator. If you simply run `sdkmanager --list | grep system-images`, you get a large list of available system images to install. I want to install an x86_64 based image for Android 13. (We want Android 13 in this case because its the last version that doesn't have a bunch of new security features making emulator rooting and debugging a big hastle.)

The tools in `sdkmanager` are referenced with the SDK version, **not** the Android version. Therefore we need to determine what the associated SDK is for Android 13. Two different sites list the mapping:

- First party (Google) site: [SDK Platform Release Notes](https://developer.android.com/tools/releases/platforms)
- Third party site: [API Levels](https://apilevels.com/)

I also asked ChatGPT to make me a chart:

```
| Android Version  | API / SDK Level  | Codename / Notes       |
|------------------|------------------|------------------------|
| 16               | 36               | —                      |
| 15               | 35               | —                      |
| 14               | 34               | —                      |
| 13               | 33               | —                      |
| 12L              | 32               | —                      |
| 12               | 31               | —                      |
| 11               | 30               | —                      |
| 10               | 29               | —                      |
| 9.0              | 28               | Pie                    |
| 8.1              | 27               | Oreo MR1               |
| 8.0              | 26               | Oreo                   |
| 7.1              | 25               | Nougat MR1             |
| 7.0              | 24               | Nougat                 |
| 6.0              | 23               | Marshmallow            |
| 5.1              | 22               | Lollipop MR1           |
| 5.0              | 21               | Lollipop               |
| 4.4W (Wear)      | 20               | KitKat Watch           |
| 4.4              | 19               | KitKat                 |
| 4.3.x            | 18               | Jelly Bean MR2         |
| 4.2.x            | 17               | Jelly Bean MR1         |
| 4.1.x            | 16               | Jelly Bean             |
| 4.0.3 – 4.0.4    | 15               | Ice Cream Sandwich MR1 |
| 4.0.1 – 4.0.2    | 14               | Ice Cream Sandwich     |
| 3.2              | 13               | Honeycomb MR2          |
| 3.1              | 12               | Honeycomb MR1          |
| 3.0              | 11               | Honeycomb              |
| 2.3.3 – 2.3.7    | 10               | Gingerbread MR1        |
| 2.3 – 2.3.2      | 9                | Gingerbread            |
| 2.2              | 8                | Froyo                  |
| 2.1              | 7                | Eclair MR1             |
| 2.0 – 2.0.1      | 5 – 6            | Eclair                 |
| 1.6              | 4                | Donut                  |
| 1.5              | 3                | Cupcake                |
| 1.1              | 2                | —                      |
| 1.0              | 1                | —                      |
```

Based on the above information, I'm looking for a system image with the name `system-images;android-33` for architecture `x86_64`:

```
(adb-venv) $ sdkmanager --list | grep 'system-images;android-33' | grep 'x86_64'
  system-images;android-33;default;x86_64 | 2                 | Intel x86_64 Atom System Image   | syst
em-images/android-33/default/x86_64
  system-images;android-33-ext4;google_apis_playstore;x86_64                      | 1                 |
 Google Play Intel x86_64 Atom System Image
  system-images;android-33-ext5;google_apis_playstore;x86_64                      | 2                 |
 Google Play Intel x86_64 Atom System Image
  system-images;android-33;android-automotive-distant-display-playstore;x86_64    | 2                 |
 Automotive Distant Display with Google Play x86_64 System Image
  system-images;android-33;android-automotive;x86_64                              | 5                 |
 Android Automotive with Google APIs x86_64 System Image
  system-images;android-33;android-desktop;x86_64                                 | 4                 |
 Desktop Intel x86_64 Atom System Image
  system-images;android-33;android-wear;x86_64                                    | 4                 |
 Wear OS 4 Intel x86_64 Atom System Image
  system-images;android-33;aosp_atd;x86_64                                        | 2                 |
 AOSP ATD Intel x86_64 Atom System Image
  system-images;android-33;default;x86_64                                         | 2                 |
 Intel x86_64 Atom System Image
  system-images;android-33;google_apis;x86_64                                     | 17                |
 Google APIs Intel x86_64 Atom System Image
  system-images;android-33;google_apis_playstore;x86_64                           | 9                 |
 Google Play Intel x86_64 Atom System Image
  system-images;android-33;google_atd;x86_64                                      | 2                 |
 Google APIs ATD Intel x86_64 Atom System Image
```

To keep things as simple as possible, I'll go for the `default` image. Install the image with `sdkmanager`:

```sh
sdkmanager "system-images;android-33;default;x86_64"
```

After the install completes, you can see the install located in `$ANDROID_HOME/system-images/android-33/default/x86_64/`. Hopefully you can see how the name of the system image directly maps to where its stored in the system. Within that folder, you'll find all of the base files used to run the Android system.

## Create an Android Virtual Machine (AVD)

As mentioned before, the `avdmanager` from `cmdline-tools` is used to generate a "virtual machine" based on a given system image and some other possible input about the hardware configuration (i.e. the qemu configuration). For our purposes, we'll keep things simple for now. But you should know that its here that you can select whether you'd like to mock up a specific device type (e.g. Pixel 6) for your specific needs. Be aware, its not identical to the real thing, but usually enough to trick the application and enough to provide an appropriate visual representation (e.g. same screen pixel dimensions as the real thing).

To create a default AVD based on the default Android SDK-33 system image for an x86_64:

```
(adb-venv) $ avdmanager create avd -n android13 -k "system-images;android-33;default;x86_64"
Warning: Observed package id 'build-tools;35.0.0' in inconsistent location '/home/chenz/.android/build-tools/latest' (Expected '/home/chenz/.android/build-tools/35.0.0')
Warning: Already observed package id 'build-tools;35.0.0' in '/home/chenz/.android/build-tools/35.0.0'. Skipping duplicate at '/home/chenz/.android/build-tools/latest'
Warning: Observed package id 'ndk;29.0.14033849' in inconsistent location '/home/chenz/.android/ndk/latest' (Expected '/home/chenz/.android/ndk/29.0.14033849')
Warning: Already observed package id 'ndk;29.0.14033849' in '/home/chenz/.android/ndk/29.0.14033849'. Skipping duplicate at '/home/chenz/.android/ndk/latest'
[=======================================] 100% Fetch remote repository...
Auto-selecting single ABI x86_64
Do you wish to create a custom hardware profile? [no]
```

You can hit Enter on `Do you wish to create a custom hardware profile? [no]` to skip it. Once you've created the AVD, you can see the files its created at `$ANDROID_HOME/avd/android13.avd/` and `$ANDROID_HOME/avd/android13.ini`.

If you want to remove an AVD from the system, you can use the `delete` subcommand:

```sh
avdmanager delete avd -n android13
```

I often use this when I've made a mess of the environment and want to start over. You will lose any stateful data in the system state when you do this. All the system state is stored in the relavant `$ANDROID_HOME/avd/<NAME>.avd/` folder.

## Start The Emulator

Now that we have created a emulator, lets fire it up. You can list available AVDs in the system from the `emulator` with something like: `emulator -list-avds`. We're using our `android13` AVD, so we can start the emulator with:

```
emulator -avd android13
```

Presuming you are in a desktop environment in Linux, the above command (if successful) will launch a new window that shows the Android operating system booting and eventually running. There is a toolbox off to the side where you can poke and prode the AVD as if it were a real device. There are also a numnber of options that allow you to configure various aspects of the AVD (or hardware) state as seen by the system.

Personally, I never you use this interface unless I have to. It doesn't perform as well in constrained environments and has a lot of limitations with regards to remote access (that I often require). In the next section we'll discuss using an alternative third party tool called `scrcpy` to get a more flexible visualization of the system's GUI.

Another thing that I don't like about running `emulator -avd android13` is that it doesn't provide the console output I want to see. When I'm working in a device, I want to know where the kernel is struggling, I want to see if I'm in a boot loop, I want to monitor device state changes, and I want to have a general understanding the the system is up and responsive (even if my application is locked up or halted).  To do this, I use a specific set of options with `emulator`:

```
emulator -avd android13 -no-snapshot -writable-system -show-kernel -verbose -no-audio -no-window
```

- **no-snapshot** - Don't save the system state on reboot. I want the system to be volatile to maximize repeatability. This also makes rebooting faster since it doesn't need to waste time creating a snapshot.
- **writable-system** - A requirement for rooting and making system level changes on a running AVD.
- **show-kernel** - Dumps the kernel log to STDOUT (similar to `dmesg`).
- **verbose** - Give us all the details about the initialization and bootup procedure.
- **no-audio** - Don't use developer host audio resources. (Useful if you aren't testing or using AVD audio.)
- **no-window** - Don't use developer host video resources. (Useful if you are using `scrcpy`.)

Note: When you run the above command, you no longer will see a window with the Android screen output. Instead, it'll only be console-ish information in the terminal.

## ADB To The Emulator

Great! We should now have an emulator running! I recommend that you disconnect any other Android devices from the developer host unless you want to type `-s <device-name>` endlessly.

By default if you run `adb devices`, you'll likely now see the following (assuming the AVD/emulator is running):

```
(adb-venv) $ adb devices
List of devices attached
emulator-5554   device

```

ADB is automatically able to connect to the emulator (via USB protocol). There is no need to worry about Developer Tools and enabling USB debugging. Remember, all of that is for security purposes. In an emulator, we're are significantly less secure by design to enable and facilitate development, troubleshooting, and debugging.

You can connect to the emulator now by simply running `adb shell`. Note: This is a non-root shell access so it'll be pretty challenging to break anything at this point. 

You should also be able to `adb push` and `adb pull` to locations you have access to as a user.

## Install and Run `scrcpy` (i.e. "Screen Copy")

You can locate and download a version of `scrcpy` from the [Github release page](https://github.com/Genymobile/scrcpy/releases). For example:

```sh
cd ~/Downloads
curl -LO https://github.com/Genymobile/scrcpy/releases/download/v3.3.3/scrcpy-linux-x86_64-v3.3.3.tar.gz
tar -xf scrcpy-linux-x86_64-v3.3.3.tar.gz
# Move the scrcpy to the folder in our PATH from env.sh
mv scrcpy-linux-x86_64-v3.3.3 ~/.android/scrcpy
```

Note: Once installed, one big thing I'd like everyone to note is that the `$ANDROID_HOME/scrcpy` folder has a `adb` binary in the folder. If you run `which adb` you'll also see that this `adb` has precendence over `platform-tools`. This has never presented an issue for me, but not having the environment configured this was has. `scrcpy` really wants `adb` to exist in its own folder, so I recommend leaving all of that as it is until you have a stronger grasp on the complete environment.

Now that `scrcpy` has been installed, you can simply run it to get a window with the Android GUI. In the event you have multiple devices on your system, you may need to specifc the `-s` parameter just like the `adb` client. One thing I always do when running `scrcpy` is to disassociate it from my shell. That way I can reuse my shell or close my terminal and not interrupt `scrcpy` window. This is done with:

```sh
setsid scrcpy >/dev/null 2>/dev/null &
```

Of course this also hides any errors, so only do this after you have things working. Its also worth noting that anytime the Android Server or AVD reboots, `scrcpy` will close. Some `adb` commands will cause this to occur and you'll need to restart your `scrcpy`. I personally work around this by having a tmux pane dedicated to some of the GUI applications and then rerun commands from that shell's history. You could also write a easy script and drop it into the `$ANDROID_HOME/scripts` folder (which is already in the `$PATH`).

Since `scrcpy` is more slim in its interface, it has alot of command line options and keyboard shortcuts to perform similar tasks to the side toolbox from pure emulator GUI. See shortcuts below (copied from [`scrcpy` Github](https://github.com/Genymobile/scrcpy/blob/master/doc/shortcuts.md)).

<details>
<summary>scrcpy Keyboard Shortcuts (Click Here To Expand)</summary>

### Shortcuts

Actions can be performed on the scrcpy window using keyboard and mouse
shortcuts.

In the following list, <kbd>MOD</kbd> is the shortcut modifier. By default, it's
(left) <kbd>Alt</kbd> or (left) <kbd>Super</kbd>.

It can be changed using `--shortcut-mod`. Possible keys are `lctrl`, `rctrl`,
`lalt`, `ralt`, `lsuper` and `rsuper`. For example:

```bash
# use RCtrl for shortcuts
scrcpy --shortcut-mod=rctrl

# use either LCtrl or LSuper for shortcuts
scrcpy --shortcut-mod=lctrl,lsuper
```

_<kbd>[Super]</kbd> is typically the <kbd>Windows</kbd> or <kbd>Cmd</kbd> key._

[Super]: https://en.wikipedia.org/wiki/Super_key_(keyboard_button)

 | Action                                      |   Shortcut
 | ------------------------------------------- |:-----------------------------
 | Switch fullscreen mode                      | <kbd>MOD</kbd>+<kbd>f</kbd>
 | Rotate display left                         | <kbd>MOD</kbd>+<kbd>←</kbd> _(left)_
 | Rotate display right                        | <kbd>MOD</kbd>+<kbd>→</kbd> _(right)_
 | Flip display horizontally                   | <kbd>MOD</kbd>+<kbd>Shift</kbd>+<kbd>←</kbd> _(left)_ \| <kbd>MOD</kbd>+<kbd>Shift</kbd>+<kbd>→</kbd> _(right)_
 | Flip display vertically                     | <kbd>MOD</kbd>+<kbd>Shift</kbd>+<kbd>↑</kbd> _(up)_ \| <kbd>MOD</kbd>+<kbd>Shift</kbd>+<kbd>↓</kbd> _(down)_
 | Pause or re-pause display                   | <kbd>MOD</kbd>+<kbd>z</kbd>
 | Unpause display                             | <kbd>MOD</kbd>+<kbd>Shift</kbd>+<kbd>z</kbd>
 | Reset video capture/encoding                | <kbd>MOD</kbd>+<kbd>Shift</kbd>+<kbd>r</kbd>
 | Resize window to 1:1 (pixel-perfect)        | <kbd>MOD</kbd>+<kbd>g</kbd>
 | Resize window to remove black borders       | <kbd>MOD</kbd>+<kbd>w</kbd> \| _Double-left-click¹_
 | Click on `HOME`                             | <kbd>MOD</kbd>+<kbd>h</kbd> \| _Middle-click_
 | Click on `BACK`                             | <kbd>MOD</kbd>+<kbd>b</kbd> \| <kbd>MOD</kbd>+<kbd>Backspace</kbd> \| _Right-click²_
 | Click on `APP_SWITCH`                       | <kbd>MOD</kbd>+<kbd>s</kbd> \| _4th-click³_
 | Click on `MENU` (unlock screen)⁴            | <kbd>MOD</kbd>+<kbd>m</kbd>
 | Click on `VOLUME_UP`                        | <kbd>MOD</kbd>+<kbd>↑</kbd> _(up)_
 | Click on `VOLUME_DOWN`                      | <kbd>MOD</kbd>+<kbd>↓</kbd> _(down)_
 | Click on `POWER`                            | <kbd>MOD</kbd>+<kbd>p</kbd>
 | Power on                                    | _Right-click²_
 | Turn device screen off (keep mirroring)     | <kbd>MOD</kbd>+<kbd>o</kbd>
 | Turn device screen on                       | <kbd>MOD</kbd>+<kbd>Shift</kbd>+<kbd>o</kbd>
 | Rotate device screen                        | <kbd>MOD</kbd>+<kbd>r</kbd>
 | Expand notification panel                   | <kbd>MOD</kbd>+<kbd>n</kbd> \| _5th-click³_
 | Expand settings panel                       | <kbd>MOD</kbd>+<kbd>n</kbd>+<kbd>n</kbd> \| _Double-5th-click³_
 | Collapse panels                             | <kbd>MOD</kbd>+<kbd>Shift</kbd>+<kbd>n</kbd>
 | Copy to clipboard⁵                          | <kbd>MOD</kbd>+<kbd>c</kbd>
 | Cut to clipboard⁵                           | <kbd>MOD</kbd>+<kbd>x</kbd>
 | Synchronize clipboards and paste⁵           | <kbd>MOD</kbd>+<kbd>v</kbd>
 | Inject computer clipboard text              | <kbd>MOD</kbd>+<kbd>Shift</kbd>+<kbd>v</kbd>
 | Open keyboard settings (HID keyboard only)  | <kbd>MOD</kbd>+<kbd>k</kbd>
 | Enable/disable FPS counter (on stdout)      | <kbd>MOD</kbd>+<kbd>i</kbd>
 | Pinch-to-zoom/rotate                        | <kbd>Ctrl</kbd>+_click-and-move_
 | Tilt vertically (slide with 2 fingers)      | <kbd>Shift</kbd>+_click-and-move_
 | Tilt horizontally (slide with 2 fingers)    | <kbd>Ctrl</kbd>+<kbd>Shift</kbd>+_click-and-move_
 | Drag & drop APK file                        | Install APK from computer
 | Drag & drop non-APK file                    | [Push file to device](control.md#push-file-to-device)

_¹Double-click on black borders to remove them._  
_²Right-click turns the screen on if it was off, presses BACK otherwise._  
_³4th and 5th mouse buttons, if your mouse has them._  
_⁴For react-native apps in development, `MENU` triggers development menu._  
_⁵Only on Android >= 7._

Shortcuts with repeated keys are executed by releasing and pressing the key a
second time. For example, to execute "Expand settings panel":

 1. Press and keep pressing <kbd>MOD</kbd>.
 2. Then double-press <kbd>n</kbd>.
 3. Finally, release <kbd>MOD</kbd>.

All <kbd>Ctrl</kbd>+_key_ shortcuts are forwarded to the device, so they are
handled by the active application.

</details>

## Rooting The Emulator

Unlike a real device where you have to authorize unlocking, unlock bootloader, patch booter, and then flash a rooted image; In the (Android 13 based) emulator, all you have to do is run the following commands:

```sh
adb root
adb remount
```

Note: If you were running `scrcpy`, you'll see it close. Simply rerun to get it up and running in the root setup.

One of the easiest ways to know if `adb root` worked is by running `adb shell`. When you opened ADB before, you were presented with a prompt that ended with a `$`. A rooted prompted (by convention) is shown with a `#`.

Peek and poke around in the system without worry. If you do break something, you can always reboot the system. If you feel you've done something that has persisted a reboot, you can delete and recreate the AVD from scratch. This is the beauty about rooting and experimenting in an emulator: No bricking a device!

## Recap

We did the following:

- Installed the Android emulator
- Installed a base system image (Android 13 / default / x86_64)
- Created an Android Virtual Device (AVD)
- Started the AVD/emulator
- Installed scrcpy
- Started the AVD/emulator in background only
- Started scrcpy to see background AVD/emulator.
- Rooted the AVD/emulator
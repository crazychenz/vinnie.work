Glass down approach:

- Application on device is doing something I want to inspect or change.

- (1) Application Overt Inspection:
  - Overt usage?
  - Permissions on system?
  - Permissions requested on install?
  - Storage requirements?
  - Other system feature requirements?
  - Analyze the Ecosystem
    - Dependencies (GPL claims and the like)
    - Privacy Policies, Usage Policies, and associated resources.
    - If plugable, identify developer kits, documentation, dev accounts
    - Other Online Research

- (2) Device Inspection
  - Make/Model/Year
  - Android Versions
  - Vendor software versions
  - Developer Mode Options
  - Online Research
    - Can device bootloader be unlocked?
      - If yes, what is the expected procedure?
    - Is there a replacement bootloader (TWERP)?
      - If yes, can you do a complete backup?
    - Is there a replacement system image?
    - Is there a vendor registration for rooting?
    - Is there a burn down for bootloader unlocking?
    - If there a undo root capability? (Usually no.)
    - How long until system images are unlockable from past versions.

- (3) Setup ADB environment
  - ADB overview
  - env.sh
    - TODO: pipenv
  - Setup openjdk-17
  - Setup commandline tools
  - Install platform tools
  - ADB into non-root device.
    - Identify app process package name and PID
    - Get the installed package information.
    - adb shell/push/pull
    - Discover, locate, and extract application APK.
      - Can also discover, locate, and extract application via internet.
  
  
- TODO??: Root if desired.
    - Grab the sqlite databases that hold application information.
- TODO: Figure out where to discuss SELinux?
- TODO: Frida without root?


- (4) Setup (emulator and analysis) environment
  - QEMU overview
  - Isntall Emulator and System Image
    - Install target system image (e.g. x86_64 Android 13)
  - Create an AVD (avdmanager)
  - Start Emulator
    - Start emulator with kernel visibility.
  - ADB to emulator
  - Install and run scrcpy
  - Rooting the Emulator
    - Get root and /system read-write

  - TODO: Install application
  

- TODO: (5) Inspect application traffic:
  - pipenv mitmproxy
  - Certificate injection
  - mitmproxy - VPN inspection, transparent capture
  - TODO: Install mitmproxy certificate


- Static Analysis of APK
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
  
  - TODO: Install jadx
  - TODO: Install pipenv: androguard, thirdparty tools, frida, fuzzyfinder, pure-python-adb-reborn, mitmproxy


- Altering APKs:
  - Force interpreter/debug modes




  


- Dynamic Application Inspection
  - Understanding zygote, namespaces, code reuse
    - _Consider_: Android 14+ certificate injection.

  - Frida
    - Frida-Server
    - Frida-Client
    - Frida Scripts
    - Frida Launch vs Frida Attach
    - Frida Java.perform
        - add-bridge in Frida 17+
    - Frida interceptor
    - Frida memory read, write, execute

  - Debugging APK
    - Make APK debuggable:
      - Complexities with reconstruction
      - Updating only manifest (axml vs xml)
      - zipalign page size 4096
      - apk signing
    - Install debuggable APK as application on emulator

    - What is JDWP and the JDWP agent.
      - Compare with Frida agent.
      - Can coexist.

    - Application debug via Android GUI
      - Forward JDWP, attach to application with jdb
      - Notice: Usability.

    - Application debug via ADB:
      - Forward JDWP, attach to application with jadx-gui.
      - Notice: VRegister access, Stack Trace access.

  - AOSP
    - AOSP is enormous, cs.android.com, using repo/git.
    - libart - runtime and platform specific code
    - Find potential solutions for vreg access, dex access.
    - _Consider_: Building AOSP?

  - Custom debugger and dynamic analysis:
    - Application debug via thirdparty JvmDebugger, programatically:
      - App launch, app PID discovery, adb forward, JDWP attach, Frida attach
      - Remote await-able REPL for interactive access.
      - _Consider_: Textual view of code and watch panel via tmux.
      - Execute with breakpoint, step bytecode, see disassembled bytecode.
      - Inspect environment (types, threads, objects, vm_state), step bytecode.
      - Dynamic Vreg and Dex access via Frida using JDWP pointers.

- Frida embedded in application APK for non-root access
- Android 14+ debug research
- Rooted device android root certificate injection.
- _Consider_: Spoofing android emulator as always online.
- _Consider_: Mock environment to control emulator visibility and perception of network.
- _Consider_: Mock environment to control emulator time perception.
- _Consider_: gdb-server on Android for native access.

- Final use case walkthrough.
    


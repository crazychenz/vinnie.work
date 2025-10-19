---
sidebar_position: 100
---
# Dynamic Analysis with JDWP

<!--     
    - What is JDWP and the JDWP agent.
      - Compare with Frida agent.
      - Can coexist.

    - Application debug via Android GUI
      - Forward JDWP, attach to application with jdb
      - Notice: Usability.

    - Application debug via ADB:
      - Forward JDWP, attach to application with jadx-gui.
      - Notice: VRegister access, Stack Trace access.
       -->

## Debugging Android Applications

When I first jumped into Android rooting (circa 2016), as a long time `gdb` user, I had always assumed that `adb` was the "debugger". Now that we know this is very wrong, I had the same question at the beginning of this year: How do I run a debugger on an Android application running on Android?

Android Developers may laugh because the functionality is built right into Android Studio. You write your code, click some items, and you are debugging line by line in either the emulator or the physical device. But one key aspect to that is that the _normal_ Android developer has the build files and source code to accompany their debugging sessions. All I have is some minimal knowledge of the ABI, mostly because Android _is_ Linux. What do you do when you want to run an APK in a debugger that you do not have the source code for?

## Native Libraries and JVM Execution

To review, an APK is made up of metadata, resources, native (or CPU architecture specific) executable code, and architecture agnostic bytecode. When Android launches a process, (roughly) it forks from a initial system process (zygote) and loads the minimal infrastructure to start execution of the "Main Activity" defined in the AndroidManifest. There is no `main()` to start an APK. The developer defined "Main Activity" in Dalvik Bytecode is the entry point. The native libraries are lazily loaded when the bytecode specifies that in needs the libraries loaded. Many applications will do this early in execution to maintain a smooth user experience, but there are no guarentees that this will happen.

When running a process with a debugger, you can debug the process with something like `gdb`, but you'll be in purely the native code space. This means you'll be breaking, watching, and stepping code from the Zygote fork and Android Runtime library. You can also break and step code in native libraries, but setting up these breakpoints before the libraries have actually been loaded can be tricky. If you are able to successfully hook into a native library, you also have the complexity of waiting for the Dalvik bytecode to call into the library and when you return to Dalvik space, there is no real visibility into the Java/Kotlin side of the code. This all leads us to my original question: **How does one debug the Dalvik bytecode execution?**

## Java Debug Wire Protocol (JDWP)

Oracle states JDWP as:

```text
The Java Debug Wire Protocol (JDWP) is the protocol used for communication between a debugger and the Java virtual machine (VM) which it debugs (hereafter called the target VM).
```

Android provides the JDWP as a means to debug the Dalvik execution. The specifics about JDWP can be read at:

- [Java Debug Wire Protocol](https://docs.oracle.com/javase/8/docs/technotes/guides/jpda/jdwp-spec.html) - An overview of the packet format and datatypes used in the protocol.

- [JDWP Protocol Details](https://docs.oracle.com/javase/8/docs/platform/jpda/jdwp/jdwp-protocol.html) - A specification of each of the RPCs, their inputs, outputs, and error formats in the context of the packets described in the _Java Debug Wire Protocol_ page.

There is zero need to understand this protocol unless you are developing your own debugger. The point that I am trying to make is that any debugger that supports this protocol will likely be able to be used as a debugger for Dalvik byte code in an Android application. `jdb` is one such debugger. `jadx-gui` is another common tool that implements JDWP. There is one more special case that we'll discuss later.

<!-- TODO: Notes on multiple JDWP debuggers at once? -->

## Native Debuggers, JDWP Debuggers, and Frida

So far, we've discussed 3 different mechanisms that can be used to debug or dynamically analyze the runtime state of an Android application. All of these are independent of each other and can be used simultaneously (with care). Of course there will be edge cases where you could setup a `gdb` hook that Frida clobbers or you could be doing something with `gdb` or `Frida` that halts the JDWP itself while monitoring bytecode. But in general, they can all coexist in the same running process without issue.

When using all three interactively, you'll want 3 different shells or panes that show them all separately. If you are programmatically interacting with these mechanisms, you'll always be managing them via 3 different sockets, but you can interlace interactions quite nicely. For example, maybe you've setup some Frida RPCs to read native memory so that while you are stepping through bytecode that doesn't have raw memory access, you can see what is happening in the physical (or native) environment.

## Targeting An Application For Debugging

A native application (on a rooted device) can always be ptrace-d or attached to by a native debugger. The JDWP agent code on the other hand is only made active by the Dalvik code itself and only when an APK both declares itself debuggable and has been targeted for debugging. The declaration of debuggable was performed in a previous section on APK reconstruction. The targeting of a APK for debugging can happen in two ways:

- You can open Developer Options in the Settings of Android, drop down the option "Select debug app" and select the application you want to debug. This can be either the package name or the display name of the application. I recommend also selecting the option "Wait for debugger".

If you selected "Wait for debugger", when you now start the application you'll see a modal that pops up saying "Wait For Debugger". At this point you can cancel the operation by clicking "Force Close" or attaching with a debugger.

At this point I'd like to highlight that to find and select the application, it was kind of annoying. The list of possible application to target for debugging can be very long because it includes all of the system packages and third party packages. They are (thankfully) in alphabetical order, but there is no way to filter the list so you end of scrolling, scrolling, scrolling. This is made even worse when you have to do it on a developer host via the emulator GUI or scrcpy GUI. Luckily there is an easier way. Using `adb`, simply run the following:

```sh
adb shell am set-debug-app -w com.example.hellojni
```

To unset any application for debug, run the following:

```sh
adb shell am clear-debug-app
```

Once the application has been targeted for JDWP based debugging, there is one more annoying step that needs to be handled. JDWP is a packet based protocol that generally operates over TCP. When JDWP is enabled for a process, there is a convention that says that its JDWP port will be the same as the process id. The issue is that port is only accessible within the Android system. Therefore we need to forward the internal JDWP port to a developer host accessible TCP port. This is achieved with the `adb forward` command.

### adb jdwp

Before forwarding the port, I'll mention that a lot of online documentation will say you must use the `adb jdwp` command to see all of the JDWP ports that are available for debugging. I personally find this information 100% useless because it only lists the ports. It can be useful to verify the port you plan to forward is available, but that is it. To makes matters more weird, the `adb jdwp` command never returns. You have to `Ctrl-C` out of it. Meh.

### adb forward

In brief, when forwarding a JDWP port, I do something like the following. Note: I use 8700 as a convention, but you can use any available port on your developer host. Presuming my process PID was `18431`, I'd do:

```sh
adb forward tcp:8700 jdwp:18431
```

At this point, we can now connect to the process with a debugger via `127.0.0.1:8700` on the developer host. You can also chain this out to other hosts via SSH forwarding if desired or required.

Right, so to forward a JDWP port to a developer host accessible port, you need to:

- Targeted the application for debug
- Start the application
- Get the application PID
- Forward PID-port to developer TCP-port

The first two can be done manually in the GUI. And sometimes that can be easier. But if you are starting the application hundreds or even dozens of times, you want to automate as much of the process as possible. The following is a script that can be used to assist with auto starting:

```sh
#!/usr/bin/env bash
# Target the application for debugging
PKG=com.example.hellojni
INTCAT=android.intent.category.LAUNCHER
adb shell am set-debug-app -w $PKG
# Fetch the application's launch activity
ACT_NAME="$(adb shell cmd package resolve-activity -c $INTCAT $PKG)"
ACT_NAME=$(printf "%s\n" "$ACT_NAME" | grep -oP 'name=\K\S+' | head -n 1 | sed -s "s/$PKG/$PKG\//")
# Launch the application
adb shell am start -n $ACT_NAME
# Get the PID
PROC_PID=$(adb shell ps -A | grep $PKG | awk '{print $2}')
# Forward the port
adb forward tcp:8700 jdwp:$PROC_PID
```

The above script does make some assumptions about the structure of the APK, but hopefully they are reasonable and will work for any of your setups. I usually drop the above script in the folder specific to the target apk. In this case I'd put it in `~/apks/hellojni/setup-debug.sh`. (Ensure its executable with `chmod +x ~/apks/hellojni/setup-debug.sh`.) 

## Java Debugger (JDB)

Attach to debugger, see program resume.

```sh
jdb -attach localhost:8700
```

Attach with debugger and keep app suspended.

```sh
cat <(echo "suspend") - | jdb -attach localhost:8700
```

See available commands:

```text
> help
```

Set a break-point.

```text
> stop at com.example.hellojni.HelloJni.onCreate
Deferring breakpoint com.example.hellojni.HelloJni.onCreate.
It will be set after the class is loaded.
```

TODO: Something about unloaded class breakpoints.

resume - You can resume by a thread by ID (`resume 21574`), or omit thread-id to resume everything:

```text
> resume
All threads resumed.
> Set deferred breakpoint com.example.hellojni.HelloJni.onCreate

Breakpoint hit: "thread=main", com.example.hellojni.HelloJni.onCreate(), line=25 bci=0

main[1]
```

thread=main
line=25
bci=0

<!-- 
`> stop at com.example.hellojni.HelloJni.stringFromJNI`

```
> Exception in thread "event-handler" com.sun.jdi.NativeMethodException: Cannot set breakpoints on native methods
        at jdk.jdi/com.sun.tools.jdi.EventRequestManagerImpl.createBreakpointRequest(EventRequestManagerImpl.java:842)
        at jdk.jdi/com.sun.tools.example.debug.tty.BreakpointSpec.resolveEventRequest(BreakpointSpec.java:85)
        at jdk.jdi/com.sun.tools.example.debug.tty.EventRequestSpec.resolve(EventRequestSpec.java:73)
        at jdk.jdi/com.sun.tools.example.debug.tty.EventRequestSpecList.resolve(EventRequestSpecList.java:68)
        at jdk.jdi/com.sun.tools.example.debug.tty.EventHandler.classPrepareEvent(EventHandler.java:246)
        at jdk.jdi/com.sun.tools.example.debug.tty.EventHandler.handleEvent(EventHandler.java:112)
        at jdk.jdi/com.sun.tools.example.debug.tty.EventHandler.run(EventHandler.java:74)
        at java.base/java.lang.Thread.run(Thread.java:833)
```
-->


Get a list of threads in application. Note: Only VM threads are halted by jdb. Native threads keep going unless halted at the native level.

```text
> threads
Group system:
  (java.lang.Thread)21574 Signal Catcher                     cond. waiting
  (java.lang.Thread)21575 ADB-JDWP Connection Control Thread cond. waiting
  (java.lang.Thread)21578 ReferenceQueueDaemon               cond. waiting
  (java.lang.Thread)21579 FinalizerDaemon                    cond. waiting
  (java.lang.Thread)21580 FinalizerWatchdogDaemon            cond. waiting
  (java.lang.Thread)21581 Jit thread pool worker thread 0    running
  (java.lang.Thread)21582 HeapTaskDaemon                     cond. waiting
  (java.lang.Thread)21586 Profile Saver                      running
Group main:
  (java.lang.Thread)21573 main                               running (at breakpoint)
  (java.lang.Thread)21576 binder:14381_1                     running
  (java.lang.Thread)21577 binder:14381_2                     running
  (java.lang.Thread)21583 binder:14381_3                     running
  (java.lang.Thread)21767 RenderThread                       running
```

Set default thread

```text
thread 21573
```


```text
main[1] locals
Method arguments:
Local variables:
 = null
```

```text
main[1] list
Source file not found: HelloJni.kt
```

```text
main[1] wherei
  [1] com.example.hellojni.HelloJni.onCreate (HelloJni.kt:25), pc = 0
  [2] android.app.Activity.performCreate (Activity.java:8,305), pc = 94
  [3] android.app.Activity.performCreate (Activity.java:8,284), pc = 1
  [4] android.app.Instrumentation.callActivityOnCreate (Instrumentation.java:1,417), pc = 3
  [5] android.app.ActivityThread.performLaunchActivity (ActivityThread.java:3,626), pc = 446
  [6] android.app.ActivityThread.handleLaunchActivity (ActivityThread.java:3,782), pc = 49
  [7] android.app.servertransaction.LaunchActivityItem.execute (LaunchActivityItem.java:101), pc = 79
  [8] android.app.servertransaction.TransactionExecutor.executeCallbacks (TransactionExecutor.java:135), pc = 77
  [9] android.app.servertransaction.TransactionExecutor.execute (TransactionExecutor.java:95), pc = 76
  [10] android.app.ActivityThread$H.handleMessage (ActivityThread.java:2,307), pc = 138
  [11] android.os.Handler.dispatchMessage (Handler.java:106), pc = 19
  [12] android.os.Looper.loopOnce (Looper.java:201), pc = 173
  [13] android.os.Looper.loop (Looper.java:288), pc = 81
  [14] android.app.ActivityThread.main (ActivityThread.java:7,872), pc = 101
  [15] java.lang.reflect.Method.invoke (native method)
  [16] com.android.internal.os.RuntimeInit$MethodAndArgsCaller.run (RuntimeInit.java:548), pc = 11
  [17] com.android.internal.os.ZygoteInit.main (ZygoteInit.java:936), pc = 312
```

See the instance id of the **this** object.

```text
print this
```

See the fields of the **this** object.

```text
dump this
```

Print all of the loaded classes (usually thousands).

```text
classes
```

`class <id>`

```text
main[1] class com.example.hellojni.HelloJni
Class: com.example.hellojni.HelloJni
extends: androidx.appcompat.app.AppCompatActivity
nested: com.example.hellojni.HelloJni$Companion
main[1]
```

`methods <id>`

```text
main[1] methods com.example.hellojni.HelloJni
** methods list **
com.example.hellojni.HelloJni <clinit>()
com.example.hellojni.HelloJni <init>()
com.example.hellojni.HelloJni onCreate(android.os.Bundle)
com.example.hellojni.HelloJni stringFromJNI()
com.example.hellojni.HelloJni unimplementedStringFromJNI()
androidx.appcompat.app.AppCompatActivity <init>()
androidx.appcompat.app.AppCompatActivity <init>(int)
androidx.appcompat.app.AppCompatActivity initDelegate()
... over 1000 more lines of methods ...
```

`fields <id>`

```text
main[1] fields com.example.hellojni.HelloJni
** fields list **
com.example.hellojni.HelloJni$Companion Companion
java.lang.String DELEGATE_TAG (inherited from androidx.appcompat.app.AppCompatActivity)
androidx.appcompat.app.AppCompatDelegate mDelegate (inherited from androidx.appcompat.app.AppCompatActivity)
... over 300 more lines of fields ...
```

<!-- TODO: find working step -->

step - line (a bunch of bytecode)
stepi - instruction step


Continue execution until next breakpoint.

```text
cont
```

JDB is primitive, difficult to use, and is very limiting in its exposure to all that JDWP has to offer!

## JADX Debugging

<!-- TODO: Need lots of pictures (or maybe a video) here. -->

Open JADX, select the APK or project that matches the APK.

Click on the green bug logo or via the menu Tools -> Select a process to debug

Click Launch App

If "It's Debugging by other", "This process seemes like its being debugged, should we proceed?" Click OK.

Jadx will automatically suspend the process. At this point you can set your own breakpoints by clicking to the left of the line. Note: You can only click on read bytecode lines.

Click the play button and wait for the breakpoint to hit.

Once the breakpoint has hit, you'll see:

- Bottom Left - A thread backtrace.
- Bottom Middle - A watch window of this object and local variables.
- Bottom Right - Debugger Log and Android's Logcat

You can step over, into, and out with the various arrow keys between the listing and the bottom panes.

Issues:

- Jadx Thread Stack is not interactable ... even through there is the ability to query and look at each of the frames individually!
- Jadx Variable watch only sees what is available via the StackFrame values. JDWP does not expose the actual values in the vregs in Dalvik.
- Jadx variables that are exposed do not provide any information of value. If I saw a object in a register, maybe I want to see its field values or any number of depth searching of that object instance tree.
- Jadx logcat is a nice addition, but it needs a fuzzyfinder and I'd rather watch logcat in tmux anyway.

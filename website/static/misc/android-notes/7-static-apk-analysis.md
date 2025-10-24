---
sidebar_position: 70
---

<!-- pagebreak -->

# Static APK Analysis

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

## Unzipping an APK

From `~/apks/hellojni`, using our HelloJNI APK we built in the previous section, lets see what it looks like when we unzip it:

```sh
cd ~/apks/hellojni
mkdir unzipped
cd unzipped
unzip ../input/app-release.apk
```

The output should resemble:

```text
(adb-venv) $ ls
AndroidManifest.xml  classes.dex        kotlin                        lib       res
assets               DebugProbesKt.bin  kotlin-tooling-metadata.json  META-INF  resources.arsc
```

Lets take a peek at `AndroidManifest.xml` (using a hex dump):

```text
(adb-venv) $ xxd -g 1 -l 64 AndroidManifest.xml
00000000: 03 00 08 00 ec 13 00 00 01 00 1c 00 fc 0a 00 00  ................
00000010: 3a 00 00 00 00 00 00 00 00 00 00 00 04 01 00 00  :...............
00000020: 00 00 00 00 00 00 00 00 0e 00 00 00 1c 00 00 00  ................
00000030: 28 00 00 00 34 00 00 00 4c 00 00 00 6e 00 00 00  (...4...L...n...
```

As you can see from the hex/ascii dump above, the AndroidManifest.xml is not in XML at all! Its binary encoded XML! In fact, it would be more appropriate for Google to have named it AndroidManifest.axml. But I suppose that due to historical reasons they've left the extention as `.xml`. The same encoding is also applied to `resources.arsc`.

I'll demonstrate easier ways to handle decoding the AndroidManifest in a moment, but if you really want to decode the AndroidManifest.xml from this plain unzipped point, you can do:

```sh
pip show pyaxml &>/dev/null || pip install pyaxml
pyaxml -i AndroidManifest.xml -o AndroidManifest-decoded.xml axml2xml
```

Now you can see the actual XML:

```text
(adb-venv) $ head -n 5 AndroidManifest-decoded.xml
<manifest xmlns:android="http://schemas.android.com/apk/res/android" android:versionCode="1" android:ve
rsionName="1.0" android:compileSdkVersion="35" android:compileSdkVersionCodename="15" package="com.exam
ple.hellojni" platformBuildVersionCode="35" platformBuildVersionName="15">
  <uses-sdk android:minSdkVersion="21" android:targetSdkVersion="35"/>
  <permission android:name="com.example.hellojni.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION" android:prot
ectionLevel="0x2"/>
  <uses-permission android:name="com.example.hellojni.DYNAMIC_RECEIVER_NOT_EXPORTED_PERMISSION"/>
  <application android:theme="@7f10000b" android:label="@7f0f001c" android:icon="@7f0d0000" android:all
owBackup="true" android:supportsRtl="true" android:extractNativeLibs="true" android:appComponentFactory
="androidx.core.app.CoreComponentFactory">
```

The `classes.dex` is where all of the bytecode related data is stored. If there are a lot of code or dependencies in the Java/Kotlin side of the project, you may find there are `classes2.dex` and `classes3.dex`. This is due to some lower level design decisions in the Dalvik bytecode that don't allow any more than 16 bit addresses for classes, methods, fields, types, and objects. Therefore, to work around that limitation, larger applications split the bytecode into multiple `dex` files. More on that later.

## Extracting an APK with `apktool`

A simple way to extract and examine the innards of an APK is to use the `apktool`. `apktool` often can be installed with a local package manager (e.g. `apt install apktool`).

### Setting Up Apktool From Github

For the latest `apktool` release, check out the [APKtool Github releases page](https://github.com/iBotPeaches/Apktool/releases). The tool from github is a `jar` file. To neatly organize apktool into our `~/.android` environment, we'll use a sort of convention for our JAR tools. Run the following to download Apktool from Github, create a script (already in `\$PATH`) to execute the tool as a simple command, and then make the script executable:

```sh
ls ${ANDROID_HOME}misc-tools &>/dev/null || mkdir -p ${ANDROID_HOME}misc-tools
# Download from Github
curl -L -o ${ANDROID_HOME}misc-tools/apktool_2.12.1.jar \
  https://github.com/iBotPeaches/Apktool/releases/download/v2.12.1/apktool_2.12.1.jar
# Create a wrapper script
cat > ${ANDROID_HOME}misc-tools/apktool << 'EOF'
#!/bin/bash
exec java -jar ${ANDROID_HOME}misc-tools/apktool_2.12.1.jar "$@"
EOF
chmod +x ${ANDROID_HOME}misc-tools/apktool
```

### Using apktool

Now, whether you installed `apktool` from a package manager or Github, you should be able to run:

```sh
cd ~/apks/hellojni
apktool d -o ./hellojni-extracted ./input/app-release.apk
```

The output may look something like:

```text
(adb-venv) $ apktool d -o ./hellojni-extracted ./input/app-release.apk
I: Using Apktool 2.12.1 on app-release.apk with 8 threads
I: Baksmaling classes.dex...
I: Loading resource table...
I: Decoding file-resources...
I: Loading resource table from file: /home/user/.local/share/apktool/framework/1.apk
I: Decoding values */* XMLs...
I: Decoding AndroidManifest.xml with resources...
I: Copying original files...
I: Copying assets...
I: Copying lib...
I: Copying unknown files...
```

Looking at the `hellojni-extracted` folder we see:

```text
(adb-venv) $ ls hellojni-extracted/
AndroidManifest.xml  apktool.yml  assets  lib  original  res  smali  unknown
```

- `AndroidManifest.xml` - decoded AndroidManifest XML we can read as XML.
- `apktool.yml` - summary of apktool configurations.
- `lib` - verbatim extraction of the native libraries
- `original` - The encoded versions of files
- `res` - Decoded and expanded resource file structure
- `unknown` - All the files apktool didn't know what to do with.
- `smali` - Disassembly of the `classes.dex` files.

## Smali Code

All of the executable bytecode and associated metadata is stored in a Dalvik Executable (`dex`) file. You can find the definitions of the byte codes at [Dalvik Bytecode Instruction Formats](https://source.android.com/docs/core/runtime/instruction-formats) and [Dalvik Bytecode Format](https://source.android.com/docs/core/runtime/dalvik-bytecode). In those pages, you'll find standard representations for each of the instructions. Along with the instructions, there is a bunch of metadata stored in the `dex` file. For example, defined strings, source line indicators with line number and file paths, and then class ids, method ids, field ids and so forth to assist with code reflection and dynamic references.

With all of this information in hand (without any actual source), we can layout a clear listing of bytecode disassembly. The disassembly in this format is commonly referred to as Smali code from the DEX disassembler baksmali [Github](https://github.com/JesusFreke/smali).

### Smali Example 

As a quick run through of _some_ of the aspects of smali, I've grabbed a couple snippets from `./hellojni-extracted/smali/com/example/hellojni/databinding/ActivityHelloJniBinding.smali`:

```smali
.class public final Lcom/example/hellojni/databinding/ActivityHelloJniBinding;
.super Ljava/lang/Object;
.source "ActivityHelloJniBinding.java"

# interfaces
.implements Landroidx/viewbinding/ViewBinding;


# instance fields
.field public final activityHelloJni:Landroidx/constraintlayout/widget/ConstraintLayout;

.field public final helloTextview:Landroid/widget/TextView;

.field private final rootView:Landroidx/constraintlayout/widget/ConstraintLayout;

...

.method public static inflate(Landroid/view/LayoutInflater;)Lcom/example/hellojni/databinding/ActivityHelloJniBinding;
    .locals 2

    const/4 v0, 0x0

    const/4 v1, 0x0

    .line 43
    invoke-static {p0, v0, v1}, Lcom/example/hellojni/databinding/ActivityHelloJniBinding;->inflate(Landroid/view/LayoutInflater;Landroid/view/ViewGroup;Z)Lcom/example/hellojni/databinding/ActivityHelloJniBinding;

    move-result-object p0

    return-object p0
.end method
```

- The `.class` at the top is the fully qualified name of the class in JNI signature format. The `L` is the Signature Byte that indicates the data type. You can see all of the [Tag Bytes in the JDWP documentation](https://docs.oracle.com/javase/8/docs/platform/jpda/jdwp/jdwp-protocol.html#JDWP_Tag).
- The `.super` defines the parent class that this class inherits from.
- The `.source` is the file path of the respective source code file. The various `.line` entries throughout the smali code are in reference to the offsets in the `.source` referenced file.
- The `.implements` is the fully qualified name for the interface being implemented.
- The `.field` lines show the accessibility, type, and name of the class variable members. For example:

  ```text
  For: .field public final helloTextview:Landroid/widget/TextView;
    accessibility: public final
    field name: helloTextview
    type: android.widget.TextView
  ```

- The `.method` sections show the method metadata and the disassembled bytecode within the method.
- The `.locals` indicate the number of registers required for the Dalvik virtual machine.

A manual java decompilation might look something like:

```java
  package com.example.hellojni.databinding;
  
  import android.widget.TextView;
  import java.lang.Object;
  import androidx.viewbinding.ViewBinding;
  import androidx.constraintlayout.widget.ConstraintLayout;
  import android.view.LayoutInflater;
  import android.view.ViewGroup;

  class ActivityHelloJniBinding extends Object implements ViewBinding {
    public final ConstraintLayout activityHelloJni;
    public final TextView helloTextview;
    private final ConstraintLayout rootView;

    public static ActivityHelloJniBinding inflate(LayoutInflater p0) {
      ViewGroup v1 = null;
      return this.inflate(p0, v1, 0);
    }
  }
```

Now lets look at the original version that was generated by the build. Note: I was able to find this by grepping the entire `ndk-samples` directory structure. This code was not part of the original code base, but generated as part of the build.

`ndk-samples/hello-jni/app/build/generated/data_binding_base_class_source_out/release/out/com/example/hellojni/databinding/ActivityHelloJniBinding.java`:

```java
// Generated by view binder compiler. Do not edit!
package com.example.hellojni.databinding;

import android.view.LayoutInflater;
import android.view.ViewGroup;
import android.widget.TextView;
import androidx.constraintlayout.widget.ConstraintLayout;
import androidx.viewbinding.ViewBinding;
import androidx.annotation.NonNull;

public final class ActivityHelloJniBinding implements ViewBinding {
  @NonNull
  private final ConstraintLayout rootView;

  @NonNull
  public final ConstraintLayout activityHelloJni;

  @NonNull
  public final TextView helloTextview;

  /* ... */

  @NonNull
  public static ActivityHelloJniBinding inflate(@NonNull LayoutInflater inflater) {
    return inflate(inflater, null, false);
  }

  /* ... */

```

Comparing the two, I'd say we got pretty close to the original. I will also say that a strong background in Java helps to be able to envision what the Java code should look like from the Smali code on the fly. Without that skill, you may need to lean on some of the other tools we'll introduce in a moment. That said, this is a great way to do quick and dirty static analysis of the source code of an APK.

### Challenges With Smali and Kotlin

Another thing I'd like to highlight is that in a weird way, Dalvik is based on Java (with embedded system design decisions). Kotlin is a higher level language that compiles down to Java bytecode. So when you are reverse engineering the Dalvik bytecodes to Smali and perhaps to the higher level Java, you are not decompiling to Kotlin. This makes understanding or following the flow of Kotlin code extra challenging. You can see this in the way that HelloJni builds Java code in response to a Kotlin `companion {}` section of code in `HelloJni.kt`. I find the biggest headaches come from tracing through Kotlin `suspend` functions (i.e. Kotlin's version of coroutines or await/async in other scripting languages). Perhaps more on this later.

In summary, to have a good grasp on Smali, you should have a good grasp on Java, an understanding of how Kotlin builds into JVM bytecode, and a grasp on the Dalvik instruction set. Like any language, you probably only need to know the 20% that is used most often to get going and then learn from experience after that.

### Focus On Usage Of Artifacts

I will say that for those that don't plan on going deeper down the rabbit hole than this, I would recommend using the smali listing as a way to determine in what context you might see a string or object type being used. You don't have to trace it exactly, but you can get a feel for where strings or constant values are being used.

## Native Library Analysis

<!-- TODO: This section breaks up the DEX analysis too much. Needs to be moved somewhere else. -->

I don't want to say much about this in this material. I will say that the native libraries are typically loaded and interfaced via JNI. Having a grasp of how JNI works and the ABI between a JVM and a native interface will be helpful.

Native libraries execute outside of the JVM, and therefore if you wanted to dynamically debug them, you'll need a native debugger. Consider finding or building (with the NDK) [GNU Debugger](https://sourceware.org/gdb/)'s gdb-server. You can than attach to a process with gdb-server and then connect to the gdb-server from and GDB client that supports the protocol. Obviously the first party and terminal based `gdb` binary can do this. [Ghidra](https://github.com/NationalSecurityAgency/ghidra) is another great tool that can disassemble, decompile, and debug over the GDB protocol.

I'm actually not sure about the debuggability, but [Cutter](https://cutter.re/) is another great tool for disassembly and decompilation of native binaries/libraries. Cutter's decompiler is decompiler from Ghidra, but packaged in a lighter weight and easier to use interface than Ghidra.

## Extracting and Decompiling APK with JADX

To recap, we've extracted an APK with `unzip` but couldn't read anything. We extracted the APK with apktool, and we could read some of the files, but everything was a flat file. There was no cross referencing or easy to use interface to explore the output without spending a bunch of time potentially setting up an IDE with Smali support. Worst of all, we had to manually decompile the Smali to Java ... I want the decompilation step to happen automatically. This is where JADX comes in.

### JADX

Jadx (**J**ava **A**nd **D**alvik e**X**tractoR) is an APK extractor (like apktool), Java decompiler (like Ghidra is for C/C++), and Smali debugger (that lets you breakpoint and single step code); all wrapped into a single package. It also comes with a graphical interface for resource and code browsing.

### Install JADX

You can find JADX available as a zip file download on the [skylot/jadx Github Releases page](https://github.com/skylot/jadx/releases).

At the time of this writing, jadx-1.5.3 is available and I've installed it with the following:

```sh
curl -L -o ~/Downloads/jadx-1.5.3.zip \
  https://github.com/skylot/jadx/releases/download/v1.5.3/jadx-1.5.3.zip
mkdir -p ${ANDROID_HOME}/jadx
cd ${ANDROID_HOME}/jadx
unzip ~/Downloads/jadx-1.5.3.zip
```

If you are using the `env.sh` I referenced before, JADX should now be avaulable in your `\$PATH`.

## JADX GUI

To start the GUI, simple run `jadx-gui`. To run is deassociated from your terminal and shell, run something like `setsid jadx-gui &>/dev/null &`.

Once JADX is up and running, you'll need to tell it to "Open File". Select the APK that you want it to process and away it goes. If you check out the bottom left of the screen while its processing, you can watch a progress bar bounce around until its complete.

Once JADX has initially processed the APK, you can save the result in a JADX project file. There are other reasons to save the project file that we'll discuss in a moment.

Along the left hand side, if you select "Source code" and then find a class you are interested in, like `com.example.hellojni.databinding.ActivityHelloJniBinding` (the one we used above), and click on it, it'll show you the Java decompilation for the Smali that it saw. Once you have the decompilation shown, you can click through different decompilation strategies along the bottom of the window. Code, Smali, Simple, and Fallback. These are very useful when you want to see code that is less inferred and more aligned with what the actual Smali code is doing beneath the source.

One of the things I'll do while going through code is find an area of interest based on some API usage or a string and then start to trace the calls through usage. If you Right Click on a label in the Java, you can then click on "Find Usage" or "Usage Tree Search".

If you are looking at obfuscated code, as you work out what something is doing, JADX will allow you to refactor the name of something by right clicking and clicking "Rename". It'll rename the usage of that variable everywhere it tell its the same variable.

Finally, using the "Navigation" menu and all of the searching capabilites are invaluable when hunting through the code to find collections of useful information while reverse engineering.

Once you have some efforts put into refactoring or injecting comments, please don't forget to save the project and load that same project the next time you fire up JADX (presuming you are working on the same APK).

### Un-decompiled Code

## JADX CLI

Aside from the GUI, JADX also has a command line interface. The interface behaves a lot like apktool, except it includes the deobfuscation and decompilation. Running the following will net you the decompilation of Kotlin/Java/Smali code to the greatest extent JADX can. Sometimes you just want to use your own code editor when browsing.

```text
(adb-venv) $ cd ~/apks/hellojni
(adb-venv) $ jadx -d hellojni-decompiled ./input/app-release.apk
INFO  - loading ...
INFO  - processing ...
ERROR - finished with errors, count: 1
```

Once that command finishes, you'll be left with a pile of source code that you can analyze or integrate into an IDE for more powerful and flexible browsing.

## Programatically Extracting and Analyzing APKs

Between apktool and JADX, it may feel like you have complete visibility of everything in the package. In fact, there is a level deeper you can decend. Androguard is a python package that parses out the entire APK into PYthon data structures. These data structures can then be programatically iterated over for more automated or granular tasks.

The original `env.sh` script should have automatically installed Androguard in the python virtual environment. If it hasn't, you can install or upgrade the package with `pip install -U androguard`.

For a REPL interface to start playing with, you can try something like:

```sh
(adb-venv) $ cd ~/apks/hellojni
(adb-venv) $ androguard analyze ./input/app-release.apk
>>> filename
input/app-release-unsigned.apk
>>> a
<androguard.core.apk.APK object at 0x7ff7642b5400>
>>> d
[<androguard.core.dex.DEX object at 0x7ff7642b6a50>]
>>> dx
<analysis.Analysis VMs: 1, Classes: 7428, Methods: 61155, Strings: 61347>

Androguard version 4.1.3 startedTip: Use `--theme`, or the `%colors` magic to change IPython's themes and colors.

In [1]:
```

For API reference material you can use the [readthedocs for Androguard](https://androguard.readthedocs.io/en/latest/). I recommend checking out Androguard's [Getting Started documentation](https://androguard.readthedocs.io/en/latest/intro/gettingstarted.html). It has some quick snippets to show how you can fetch things like permissions, activities, package name, and SDK versions programatically. In reality, this is all in the AndroidManifest and can be retrieved with some XPath or XML Element Tree in python, but Androguard streamlines it!

Some of the lower level tasks I like to perform with Androguard are iterations over all of the classes, methods, fields, and other strings that are embedded in the dex file. JADX and apktool parse and reference this material, but only in the context of the code that they are looking at. Perhaps you want an overview of all the classes and methods but don't care about their actual implementation. Also, combining these programatic lists with a fuzzyfinder can be a great quick way to get different capabilities of the software to pop out.

### Excessive Logging

One of the big things you'll notice when you start using Androguard in your python code is the amount of logging output it spits. You can mute it by including the following at the top of your code:

```python
from androguard import util
util.set_log("CRITICAL")
```

### Missing Tasks

In smali code there are references to type_ids (`type@XXXX`). For whatever reason these don't automatically get parsed out in the newer Androguard. Here is some code that may help with working arounding that limitation:

```python
#!/usr/bin/env python3

import sys
import struct
from androguard.core import dex
from androguard import util
util.set_log("CRITICAL")

type_ids = []

# sys.argv[1] is a file path to the DEX file (NOT the APK)
with open(sys.argv[1], "rb") as f:
    data = f.read()

    print("Parsing dex.")
    d = dex.DEX(data)
    print("Dex parsing done.")

    # Parse out the type table since its missing from Androguard v4?
    # Example: d.get_strings()[type_ids[0x1ede]]
    type_ids_size = d.header.type_ids_size
    type_ids_off  = d.header.type_ids_off
    for i in range(type_ids_size):
        offset = type_ids_off + i * 4
        (descriptor_idx,) = struct.unpack_from("<I", data, offset)
        type_ids.append(descriptor_idx)

# Resolve `type@1ede` by using `d.get_strings()[type_ids[0x1ede]]`
```






## Frida

"Dynamic instrumentation toolkit for developers, reverse-engineers, and security researchers."

Personally I am more of a `gdb` user. Even in more sophisticated setups, I'll almost always jump to something like Cutter/Ghidra, find a hook point, fire up `gdb-server` and start hacking with `gdb` (with relavant plugins). Frida sort of changes that mindset by replacing the breakpoint mindset with a remote controllable agent enabled hooking interface.

In more simple terms, Frida is a agent that lives within a process and communicates with a client. Because the Frida agent lives within the target process, we have access to everything the application has access to, including its own memory. With access to the memory, we can choose to hook function calls so that calls to them are redirected to our own code.

To make Frida more flexible and reusable for engineers, its agent ships with a javascript interpreter. This means that I can write some javascript, shoot it at the agent and have it immediate applied. The kinds of things that the Javascript API supports include memory read/write/execute, symbol searching, symbol calling (if the symbol points to a function), and hooking. Frida has some slick convienence functions for hooking native code as well as Java code.

Note: Frida has been designed as a generic instrumentation tool. There are many features that it provides that aren't reasonable for our purposes, so I'll only be covering the stuff I care about from the Android inspection point of view.

### Documentation

There is good enough [Frida Developer Documentation](https://frida.re/docs/home/) available, but you'll really need to play with it. In my experience, LLMs are **REALLY DUMB** related to all things Frida, so be sure to test anything you find!

- [Frida Android Examples](https://frida.re/docs/examples/android/) - Examples of using `Java.perform()`.
- [Frida Android Tutorials](https://frida.re/docs/android/) - Examples of using `frida-trace`.
- [Frida Javascript API](https://frida.re/docs/javascript-api/) - Rough Javascript API descriptions.
- [Frida Bridges Docs](https://frida.re/docs/bridges/) - As of this writing, useless. Does not describe bridges with Python.

### Components

There are several components of Frida you'll want to be familiar with to get started:

- **frida-server** - A binary that can be run from Android (via ADB). This usually requires a rooted device or emulator because it uses ptrace to inject an agent into the process.
- **frida gadget** - A shared object that can be patched into a APK when you don't have root on a device.
- **frida** client - The frida client that runs on the developer host. 

## Frida Server

You can download Frida Server from Frida's [Github Releases page](https://github.com/frida/frida/releases). Don't forget to click "Show all 243 assets..." to see all of the available downloads!

Since we intend on running our Frida Server on our emulator on the x86_64 developer host, we'll do:

```sh
curl -L -o ${ANDROID_HOME}frida-server.xz \
  https://github.com/frida/frida/releases/download/17.4.0/frida-server-17.4.0-android-x86_64.xz
unxz ${ANDROID_HOME}frida-server.xz
adb push ${ANDROID_HOME}frida-server /data/local/tmp/frida-server
adb shell chmod +x /data/local/tmp/frida-server
adb shell "setsid /data/local/tmp/frida-server &"
```

Now the server should be running. Continue to the next section for testing.

Note: When you are working with a non-rooted device, often the only place you can push things is to the `/sdcard` partition. The way this partition is mounted prevents you from executing anything. Instead, you can try to push and run from `/data/local/tmp`. You'll notice that you have no read access to `/data` or `/data/local`, but if you cd directly to `/data/local/tmp`, you should have access as a plain ole adb user. You should be aware though that you need root to ptrace an executable.

## Frida Client

Installing Frida (client) should have happened automatically from the `env.sh` script. If you want to manually install Frida, you can do so with pip:

```sh
pip install frida frida-tools
```

When starting the Frida Client (`frida`), typically you can choose to have Frida launch the application or attach to an already running application. Often, the preferred thing to do is launch the application. This is because it means that Frida gets to inject itself as early in the application initialization process as it can. Its not always perfect, but its alot earlier than you could ever attach after launching from another process.

One of the reasons to inject Frida as early as possible to not only to catch early on side effects from an application but also to be able to circumvent any debug detection code that exist in the application. This isn't a topic I plan to discuss in this material, but it is a concern when attempting to analyze released Android applications.

### Launch An Application

A straight forward way to launch the Frida client is as follows. What we're doing here is telling Frida to connect to the server over the USB connection (`-U`) and to launch the package (or _file_) `com.example.hellojni`. Assuming the application is installed, the system has been rooted, and the frida-server is running, you'll see the following when starting Frida.

```
(adb-venv) $ frida -U -f com.example.hellojni
     ____
    / _  |   Frida 17.4.0 - A world-class dynamic instrumentation toolkit
   | (_| |
    > _  |   Commands:
   /_/ |_|       help      -> Displays the help system
   . . . .       object?   -> Display information about 'object'
   . . . .       exit/quit -> Exit
   . . . .
   . . . .   More info at https://frida.re/docs/home/
   . . . .
   . . . .   Connected to Android Emulator 5554 (id=emulator-5554)
Spawned `com.example.hellojni`. Resuming main thread!
[Android Emulator 5554::com.example.hellojni ]->
```

This is the Frida REPL that lets you run Javascript commands on the fly. A quick test is to use `console.log("try it out");` to see it working. Something to notice with Frida is that it has not halted the application. It only instruments or hooks various parts of code to run our injected code. We of course and spin or lock up the process once we have control.

Use `exit` to drop out of the client.

### Attach To Running Process

Suppose you wanted to hook into an already running application (maybe a system application that starts on boot). You'll need to locate the PID of the process and then attach with it. I usually use something like the following to extract a PID, but you can also manually look at the output of `adb shell ps -A` if you prefer.

```sh
(adb-venv) $ adb shell ps -A | grep hellojni | awk '{print $2}'
3645
(adb-venv) $ frida -U -p 3645
     ____
    / _  |   Frida 17.4.0 - A world-class dynamic instrumentation toolkit
   | (_| |
    > _  |   Commands:
   /_/ |_|       help      -> Displays the help system
   . . . .       object?   -> Display information about 'object'
   . . . .       exit/quit -> Exit
   . . . .
   . . . .   More info at https://frida.re/docs/home/
   . . . .
   . . . .   Connected to Android Emulator 5554 (id=emulator-5554)

[Android Emulator 5554::PID::3645 ]->
```

## Frida Interceptor

Now that we know Frida is working by connecting, launching, and attaching to target processes, we want to add some instrumentation to the process. 

Put the following in a file (e.g. `open.js`):

```javascript
var openAddr = Process.findModuleByName("libc.so").findExportByName("open");
Interceptor.attach(openAddr, {
    onEnter: function(args) {
        console.log("process opening file" + ptr(args[0]).readUtf8String());
    },
    onLeave: function(retval) {
        console.log("process done opening file");
    },
});
```

After we're able to locate the module with the function we want (`libc.so`) and the symbol from that module (`open`), we attach to it with a Frida Interceptor.

- **onEnter** callback - Called with hooked function's arguments.
- **onLeave** callback - Called with hooked function's return values.

Then launch hellojni with Frida and tell Frida to load the script:

```sh
frida -U -f com.example.hellojni -l open.js
```

The output will look something like:

```
...
Spawned `com.example.hellojni`. Resuming main thread!
[Android Emulator 5554::com.example.hellojni ]-> process opening file/proc/self/cmdline
process done opening file
process opening file/data/app/~~X6vRQsetWEfMHJey-PZzKw==/com.example.hellojni-6amwxOvnoG7DvJoQj0IJ1Q==/base.dm
process done opening file
...
```

As you can see, it does hook rather early when launching the application with Frida. The open calls you see are the open calls by the application loader reading from the APK itself.

## Frida Java Bridge

A fantastic addition to Frida is the ability to intercept Java code as well as native code. (A bit ironic that we're actually using Javascript as a script in Java execution.) You accomplish this with the Java Bridge that is exposed from Frida as the `Java` object.

In the following, we're completely wrapping the `onCreate` method with the `android.os.Bundle` signature. What this means is that our code is called when the wrapped function is called, we decide how the arugments are passed, we call (or don't call) the original function, and we decide what we want returned. Very powerful stuff.

Here is an example of `HelloJni.onCreate(Bundle)` being wrapped:

```javascript
Java.perform(function () {
  var HelloJni = Java.use("com.example.hellojni.HelloJni");
  HelloJni.onCreate.overload("android.os.Bundle").implementation = function (b) {
    console.log("Activity onCreate: " + this.$className);
    this.onCreate(b);
  };
});
```

Its only action is to output that the function was run. But you can use any other Frida javascript to maybe call other native functions, you can reference other Java classes and call their methods via `Java.use` interface, and you can completely high jack the arguments, makeing booleans inverted or strings altered in some desirable manner.

### Frida 17's Mistake

In the above Frida script, we're using the Java bridge. Frida 16 and before had the Java bridge embedded into the frida-server automatically. This meant all we had to do was load the above code and all was well. In FRida 17, the decision was made to remove the Java Bridge from the frida-server and make the scripts bring it up with them. How to handle this change has been poorly documented, argumentative, and frankly a disappointing betrayal of expected user experience. But hey ... I never really paid for any of it, what am I complaining about... lets clean up the mess!

The quick work around that I've come up with is to utilize the fact that the Java bridge code is embedded in the `frida-tools` installing the Python environment. We can pull out this artifact using some Python module magic, prepend it to any given script file (or string), add a single line of glue code, and then return it as a fully working script. I recommend you put the following in a file at `${ANDROID_HOME}misc-tools/add-bridge` and make it executable. Here is the `add-bridge` script I've used:

```python
# https://github.com/frida/frida/issues/3460

import sys

def load_bridge(lang):
	import os
	import importlib.util

	# Calculate frida-tools module path without loading it (we don't need to)
	frida_tools_path = os.path.dirname(importlib.util.find_spec('frida_tools').origin)

	# Calculate the bridge location and load it
	bridge_file = os.path.join(frida_tools_path, 'bridges', f'{lang.lower()}.js')
	with open(bridge_file, 'r', encoding='utf-8') as f:
		bridge_src = f.read()

	# Wrap with the setter and return
	return '(function() { ' + bridge_src + '; Object.defineProperty(globalThis, "' + lang + '", { value: bridge }); })();\n'

# Load as usual
with open(sys.argv[1]) as f:
	source = f.read()

# Prepend the Java bridge - note the bridge language is CASE SENSITIVE!
print(load_bridge('Java') + source)
```

The script leaves a lot to be desired, but it gets the job done. If you dumped the above `Java.perform` code into a file named `oncreate_nobridge.js`, you can have yourself a running bit of Frida javascript by doing something like:

```sh
add-bridge ./oncreate_nobridge.js > ./oncreate.js
```

## Frida RPC from Python

Frida is not only a CLI command, but also a python package. If you decide you'd like to work Frida into some python code, there is a neat feature that I use all the time that allows me to define RPCs in the Frida script that can easily be called from Python code. This creates a clean integration between the python code and the Frida capability that doesn't require sprinkling javascript injects everywhere.

Here is an example of 2 RPCs. One is a really simply `ping()` that returns `pong` if successfully configured. Its my sanity checker. The other is a `read()` RPC that allows me to read any memory accessible by the process I'm attached to. Once I have a reference to a pointer of interest, I start reading the memory (i.e. bytes) directly into the Python environment and use all of my developer host Python capabilities to process the data to find more memory to grab and process.

```python
import frida

proc_pid = 18432
device = frida.get_usb_device()
session = device.attach(proc_pid)
script = session.create_script("""
    rpc.exports = {
        ping: function () {
            return "pong";
        },
        read: function(addr, size) {
            return ptr(addr).readByteArray(size);
        }, 
    };
""")
script.on("message", lambda msg, data: print("FRIDA MESSAGE:", msg, data))
script.load()
rpc = script.exports_sync

print("ping -> ", rpc.ping())
```

## Other Scripts

For some Frida scripts that can jump start your usage, check our the [Frida Codeshare](https://codeshare.frida.re/). Note: They are no references to the Frida Codeshare directly from the [frida.re documentation](https://frida.re/) site!
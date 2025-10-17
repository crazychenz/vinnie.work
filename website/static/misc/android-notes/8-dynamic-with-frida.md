<!-- 
- Frida
    - Frida-Server
    - Frida-Client
    - Frida Scripts
    - Frida Launch vs Frida Attach
    - Frida Java.perform
        - add-bridge in Frida 17+
    - Frida interceptor
    - Frida memory read, write, execute
 -->

## Frida

"Dynamic instrumentation toolkit for developers, reverse-engineers, and security researchers."

Personally I am more of a `gdb` user. Even in more sophisticated setups, I'll almost always jump to something like Cutter/Ghidra, find a hook point, fire up `gdb-server` and start hacking with `gdb` (with relavant plugins). Frida sort of changes that mindset by replacing the breakpoint mindset with a remote controllable agent enabled hooking interface.

In more simple terms, Frida is a agent that lives within a process and communicates with a client. Because the Frida agent lives within the target process, we have access to everything the application has access to, including its own memory. With access to the memory, we can choose to hook function calls so that calls to them are redirected to our own code.

To make Frida more flexible and reusable for engineers, its agent ships with a javascript interpreter. This means that I can write some javascript, shoot it at the agent and have it immediate applied. The kinds of things that the Javascript API supports include memory read/write/execute, symbol searching, symbol calling (if the symbol points to a function), and hooking. Frida has some slick convienence functions for hooking native code as well as Java code.

Note: Frida has been designed as a generic instrumentation tool. There are many features that it provides that aren't reasonable for our purposes, so I'll only be covering the stuff I care about from the Android inspection point of view.

### Components

There are several components of Frida to understand:

- **frida-server** - A binary that can be run from Android (via ADB). This usually requires a rooted device or emulator because it uses ptrace to inject the agent into the process.
- **frida agent** - The peice of frida-server that is hooked into the target process that communicates with the frida client.
- **frida gadget** - A shared object that can be patched into a APK when you don't have root on a device.
- **frida** client - The frida client that runs on the developer host. 

## Frida Server

You can download Frida Server from Frida's [Github Releases page](https://github.com/frida/frida/releases). Don't forget to click "Show all 243 assets..." to see all of the available downloads!

Since we intend on running our Frida Server on our emulator on the x86_64 developer host, we'll do:

```sh
curl -L -o ${ANDROID_HOME}frida-server.xz \
  https://github.com/frida/frida/releases/download/17.4.0/frida-server-17.4.0-android-x86_64.xz
unxz ${ANDROID_HOME}frida-server.xz
adb push ${ANDROID_HOME}frida-server /data/frida-server
adb shell chmod +x /data/frida-server
adb shell "setsid /data/frida-server &"
```

Now the server should be running. Continue to the next section for testing.

Note: When you are working with a non-rooted device, often the only place you can push things is to the `/sdcard` partition. The way this partition is mounted prevents you from executing anything. 

<!-- TODO: Test using /tmp as a place to execute from on a non-root phone. -->

## Frida Client

Installing Frida should have happened automatically from the `env.sh` script. If you want to manually install Frida, you can do so with pip:

```sh
pip install frida frida-tools
```

When starting the Frida Client (`frida`), typically you can choose to have Frida launch the application or attach to an already running application. Often, the preferred thing to do is launch the application. This is because it means that Frida gets to inject itself as early in the application initialization process as it can. Its not always perfect, but its alot earlier than you could ever attach after launching from another process.

One of the reasons to inject Frida as early as possible to not only to catch early on side effects from an application but also to be able to circumvent any debug detection code that exist in the application. This isn't a topic I plan to discuss in this material, but it is a concern when attempting to analyze released Android applications.

<!-- TODO: Show launch vs attach frida client examples: -->

## Frida Java Bridge

<!-- 
TODO: Discuss Java.perform
TODO: Discuss Frida 17 design change
 -->

```python
# https://github.com/frida/frida/issues/3460

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
with open('script.js') as f:
	source = f.read()

# Prepend the Java bridge - note the bridge language is CASE SENSITIVE!
source = load_bridge('Java') + source
```

## Frida Interceptor

<!-- TODO: Why? Example? -->

## Frida RPC from Python

<!-- TODO: Simplify python usage with RPCs. -->

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
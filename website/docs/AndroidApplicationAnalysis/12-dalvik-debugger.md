---
sidebar_position: 120
sidebar_label: Dalvik Debugger (Missing Content)
---

<!-- pagebreak -->

# Dalvik Debugger

:::danger

Work In Progress - Missing Critical Content

:::

The Dalvik debugger that we'll discuss in the next section is a project that I've developed specifically for my own needs. The debugger attempts to get at that sweet spot of walking arbitrary code and observing or affecting state. The Dalvik debugger is something that I really tried not to write. How could there be such a gap in such a large ecosystem? My only guess is that I'm not in the right social circles or there is no commercial business case for what I'm attempting to accomplish.

As the developer, I want nothing more than to boast about all of the cogs and how everything works with this debugger under the hood. But to continue with our originally stated glass down approach, we'll cover usage of the debugger now and then delve beneath the hood.

:::note

There are plans to TUI-ify the debug interface. Its a WIP and I wanted to pause to write this material to garner potential user feedback.

:::

## A Debugger Workflow

When working with debuggers, there is generally a workflow that the developer is using to shorten the compile-run-observe-change-repeat loop. When starting to use any debugger, you should have an understanding of every step of that loop. An appreciation of what or why you are observing a thing is all very context sensitive. Therefore, lets setup a mock environment to run our loop over.

The Dalvik debugger is designed to be run programatically, via a REPL, or via a multi pane interface. Since everything is still very much in unstable development, we can not simply fire up a REPL via CLI along and off we go. Instead, we'll setup the environment programatically and then interact with the program in the REPL at runtime. This style of debugging seemed to fit well into my idea of the minimal viable product (MVP).

### Environment Setup

I will presuming we're working from "adb-venv" environment and using hellojni as the target application. The plan is to walk through all of the major sections of the setup code and then present the final product at the end.

```python
import pdb
from fuzzyfinder import fuzzyfinder
from pprint import pprint

adb = AdbObject()
native = NativeObject()
class BreakpointObject(): pass
bp = BreakpointObject()
jdwp = None
dbg = thirdparty.debug.dalvik.Debugger()
dbg_state = dbg.state
```

This global code is a bit hacky looking. When you are developing for different types of human interfaces, there are some not so computery science things you need to consider, such as the burden of typing really long dereferences. Therefore, the idea here is:

- Include some imports that are purely intended for REPL use, not programatic use.
- Keep a few umbrella object references in the global scope so that they are easily accessible to the REPL user.

We've defined `BreakpointObject` as a dumb object to hold references to our `BreakpointInfo` object references that you'll see later on. The other references defined here are separated based on the library (or socket management).

```python
async def main():
    global dbg
    global jdwp
    global native
    global adb
    global bp

    # Start up the application in debug mode.
    adb.target('com.example.hellojni')

    native.connect(adb)    

    # Settle a bit.
    settle_timeout = 3
    print(f"Sleeping {settle_timeout} secs for system to settle.")
    await asyncio.sleep(settle_timeout)

    # Connect to application with our debugger.
    print("Connecting debugger to localhost:8700")
    await dbg.start('127.0.0.1', 8700)
    jdwp = dbg.jdwp
    dbg.print_summary()


    # ... snip ...
```

After the global scope references have been defined, we define our `main()` function. In the first few lines of the function:

- We use the `AdbObject` to target a specific package or application. The `target()` method attempts to locate the package's MainActivity, target the application for debug, start the application's MainActivity, and finally capture the applications PID for attachment.

- The `NativeObject` with the PID (via `AdbObject`) is used to connect to the target application with Frida.

- Sometimes the emulator can be a bit slow for it to get to the state we want, hence we wait for a few seconds for threads and initialization to settle.

- After the settle period, we connect to the JDWP port that has been setup and initialized by the `adb.target()` call previously made. We also set the `jdwp` global reference for potential REPL usage.

Skipping ahead a bit, lets define a breakpoint in the code:

```python
fetchQuote = dbg.create_breakpoint(**{
    'class_signature': 'Lsh/kau/playground/quoter/QuotesRepoImpl;',
    'method_name': 'fetchQuote',
    'method_signature': '(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;',
}, callback=handle_breakpoint)
bp.fetchQuote = fetchQuote
await fetchQuote.set_breakpoint()
```

In the above code, you can see that we're specifing the class, method name, and method signature we want to break into. The breakpoint definition is in JNI format. Additionally, we provide a `callback` that is the breakpoint handler. We'll discuss this callback next. Next, we set the `BreakpointInfo` reference to a object member of `BreakpointObject` for ease of use for the REPL user. Finally, we enable the breakpoint itself with `set_breakpoint()`. 

Now that we have defined a breakpoint, we need to backup and define the breakpoint handler. What do we want to happen when the breakpoint fires? The default (`callback=None`) in the Dalvik debugger is to:

- Disable breakpoint from happening again.
- Register event arguments in breakpoint's `ThreadInfo`
- Print the current thread execution location.
- Print disassembly of next bytecode instruction.

Instead of only doing that, lets define our own handler that additionally grabs references to JNI pointers that give us insight into the Vregs in the Dalvik VM and Dex as loaded into memory.

```python
async def handle_breakpoint_extra(event, composite, args):
    global native
    bp_info, = args
    dbg = bp_info.dbg
    
    await dbg.disable_breakpoint_event(event.requestID)
    thread_info = await dbg.thread(event.thread)
    thread_info.event_args(event, composite, args)

    print(f"Custom Bkpt@ {await bp_info.location_str(event)}")
    
    if not native.session:
        raise RuntimeError("Required native session is None.")

    await parse_dex_header(dbg, native, event)

    await parse_vregs(native, thread_info)
    
    print(await instruction_str(dbg, event))
```

We'll discuss what magic is happening to make the runtime vreg and dex access possible later. For now, it should suffice to know that `parse_dex_header` and `parse_vregs` are imported from another Dalvik debugger utility library. The rest of the handler definition is borrowed from the `std_break_event` that is used by `BreakpointInfo` when `callback=None`.

Moving on, we see a `resume_vm()` call and what appears to be an infinite loop:

```python
await dbg.resume_vm()

try:
    print("Waiting for events... Ctrl-C to quit.")
    while True:
        await asyncio.sleep(1)
except KeyboardInterrupt:
    exit(0)
```

We've now setup all the global references (for REPL usage), defined our breakpoints, and defined our handlers. Therefore, we can now continue with the execution of the target application with `dbg.resume_vm()`. That will restart all of the _Dalvik_ threads that were suspended. Note: Natively managed threads are still running (e.g. Frida is working before we `resume_vm()`). After the VM is resumed, we spin the async event loop until the user explicitly kills the REPL with an exit or `Ctrl-C`.

Finally, with that being the end of the `main()` definition we need to call `main()`:

```python
async def main_with_sandbox():
    socket_path = "/tmp/asyncrepl.sock"
    repl_coro = Repl(namespace=globals()).start_repl_server(socket_path=socket_path)
    repl_task = asyncio.create_task(repl_coro)
    main_task = asyncio.create_task(main())
    await asyncio.gather(repl_task, main_task)

if __name__ == "__main__":
    asyncio.run(main_with_sandbox())
```

Instead of doing a simple `asyncio.run(main())`, we inject our remote REPL initialization code before running main. The `main_with_sandbox()` code sets the REPL's default scope to the current global scope, makes the REPL accessible via a unix socket, and runs the REPL adjacent to `main()` in the async event loop. Note: The scope can be set to whatever we want, I chose `globals()` because its easy, clean, and requires little maintenance.

And that is it. Here is the full thing:

```python
#!/usr/bin/env python3

import asyncio
from thirdparty.jdwp import Jdwp, Byte, Boolean, Int, String, ReferenceTypeID
from thirdparty.sandbox.repl import Repl
import thirdparty.debug.dalvik
from thirdparty.debug.dalvik.util.native import NativeObject
from thirdparty.debug.dalvik.util.adb import AdbObject
from thirdparty.debug.dalvik.util.breakpoint import parse_dex_header, parse_vregs
from thirdparty.debug.dalvik.info.breakpoint import instruction_str
from thirdparty.debug.dalvik.info.state import *

# Utility imports
import pdb
from fuzzyfinder import fuzzyfinder
from pprint import pprint

adb = AdbObject()
native = NativeObject()
class BreakpointObject(): pass
bp = BreakpointObject()
jdwp = None
dbg = thirdparty.debug.dalvik.Debugger()
dbg_state = dbg.state


async def main():
    global dbg
    global jdwp
    global native
    global adb
    global bp

    adb.target('com.example.hellojni')
    native.connect(adb)    

    settle_timeout = 3
    print(f"Sleeping {settle_timeout} secs for system to settle.")
    await asyncio.sleep(settle_timeout)

    print("Connecting debugger to localhost:8700")
    await dbg.start('127.0.0.1', 8700)
    jdwp = dbg.jdwp
    dbg.print_summary()


    async def handle_breakpoint(event, composite, args):
        global native
        bp_info, = args
        dbg = bp_info.dbg
        
        await dbg.disable_breakpoint_event(event.requestID)
        thread_info = await dbg.thread(event.thread)
        thread_info.event_args(event, composite, args)

        print(f"Custom Bkpt@ {await bp_info.location_str(event)}")
        
        if not native.session:
            raise RuntimeError("Required native session is None.")

        await parse_dex_header(dbg, native, event)

        await parse_vregs(native, thread_info)
        
        print(await instruction_str(dbg, event))
    

    fetchQuote = dbg.create_breakpoint(**{
        'class_signature': 'Lsh/kau/playground/quoter/QuotesRepoImpl;',
        'method_name': 'fetchQuote',
        'method_signature': '(Lkotlin/coroutines/Continuation;)Ljava/lang/Object;',
    }, callback=handle_breakpoint)
    bp.fetchQuote = fetchQuote
    await fetchQuote.set_breakpoint()

    await dbg.resume_vm()

    try:
        print("Waiting for events... Ctrl-C to quit.")
        while True:
            await asyncio.sleep(1)
    except KeyboardInterrupt:
        exit(0)


async def main_with_sandbox():
    socket_path = "/tmp/asyncrepl.sock"
    repl_coro = Repl(namespace=globals()).start_repl_server(socket_path=socket_path)
    repl_task = asyncio.create_task(repl_coro)
    main_task = asyncio.create_task(main())
    await asyncio.gather(repl_task, main_task)


if __name__ == "__main__":
    asyncio.run(main_with_sandbox())
```

Throw that into a file, make it executable, and run it.

```sh
cd ~/apks/hellojni
vi debug_hellojni.py
chmod +x debug_hellojni.py
./debug_hellojni.py
```

### The Debugger REPL

<!-- Remote await-able REPL for interactive access. -->

### Break, Step, Observe

<!-- Execute with breakpoint, step bytecode, see disassembled bytecode. -->
<!-- Inspect environment (types, threads, objects, vm_state), step bytecode. -->

## Anatomy of Dalvik Debugger

### Java Debug Wire Protocol (JDWP)

### Deferred Breakpoints

### Dalvik Bytecode Disassembler

### Vregs via Frida and AOSP

<!-- Dynamic Vreg and Dex access via Frida using JDWP pointers. -->

## TUI Design Thoughts

<!-- _Consider_: Textual view of code and watch panel via tmux. -->


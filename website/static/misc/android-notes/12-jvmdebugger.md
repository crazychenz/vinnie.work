<!-- 

- Custom debugger and dynamic analysis:
    - Application debug via thirdparty JvmDebugger, programatically:
      - App launch, app PID discovery, adb forward, JDWP attach, Frida attach
      - Remote await-able REPL for interactive access.
      - _Consider_: Textual view of code and watch panel via tmux.
      - Execute with breakpoint, step bytecode, see disassembled bytecode.
      - Inspect environment (types, threads, objects, vm_state), step bytecode.
      - Dynamic Vreg and Dex access via Frida using JDWP pointers.

       -->
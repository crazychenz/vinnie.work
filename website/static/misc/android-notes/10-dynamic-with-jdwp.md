    
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
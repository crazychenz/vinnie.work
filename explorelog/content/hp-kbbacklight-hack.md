HP Spectre keyboard backlight.

Drop KBCDrv.sys into C:\windows\system32

Make adjustments to registry

Drop kbdfix.bat into a folder like C:\bin

Reboot

Turn off Secure Boot from BIOS (F10 on reboot)

Open cmd as Admin and run:

`bcdedit /set testsigning on`

Run the kbdfix.bat

Keyboard shouldn't turn off until reboot.

https://h30434.www3.hp.com/t5/Notebook-Hardware-and-Upgrade-Questions/adjust-keyboard-backlight-timeout-hp-15-da0031nr/m-p/7321128/highlight/true#M542366

- bcdedit /set testsigning on
- bcdedit /set testsigning off
- bcdedit /set nointegritychecks OFF
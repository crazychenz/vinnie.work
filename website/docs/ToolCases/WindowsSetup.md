---
sidebar_position: 5
title: Microsoft Windows Setup
---

## Installs

- Boot From USB: Windows 11
- Manually From USB: NVIDIA, Realtek, LAN Driver
- MS Store: Minecraft, App Installer (e.g. winget)
- Notepad++
- Powershell As Admin: winget install Microsoft.PowerToys --source winget
- Win + Shift + ` to open fancy zones.
- VSCode
- 7zip
- getpaint.net: paint.net
- gimp.org
- godotengine.org
- Typora
- libre office
- virtual box
- audacity
- camtasia
- snagit
- blender
- tailscale
- Adobe Reader w/o McAfee
- android studio
- [WinFSP](https://github.com/billziss-gh/winfsp/releases/tag/v1.10B4)
- [SSHFS-Win 2021.1 Beta 2](https://github.com/billziss-gh/sshfs-win/releases/tag/v3.7.21011)
- [Git for Windows](https://git-scm.com/download/win)
- Discord
- OpenJDK 11
- node.js 16.13.1 LTS
- powershell as admin: Set-ExecutionPolicy Unrestricted
- *uninstalled node.js -> installed nvm for windows
- choco install vboxvmservice
- choco install python3
- choco install grep
- Inkscape
- AutoHotKey

## Extras

- Calibre
- Zadig
- Wireshark
- Spotify
- PulseView
- LibreOffice
- Draw.io
- Postman
- PowerToys
- [TreeSize](https://www.jam-software.com/treesize_free)

## Meh

- Cutter - Reverse Engineering Tool
- Dependency Walker
- Graphics Gale - Sprite Animation Editor

## Configuration

Disable Windows 11 "Show More Options" Context Menu:

```cmd
reg add "HKCU\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}\InprocServer32" /f /ve
```

<details><summary>Enable Windows 11 "Show More Options" Context Menu</summary><br />

```cmd
reg delete "HKEY_CURRENT_USER\Software\Classes\CLSID\{86ca1aa0-34aa-4e8b-a509-50c905bae2a2}" /f​
```

</details><br />

Restart Explorer:

```cmd
taskkill /f /im explorer.exe
start explorer.exe
```

## HotKeys Script

```ahk
#NoEnv  ; Recommended for performance and compatibility with future AutoHotkey releases.
; #Warn  ; Enable warnings to assist with detecting common errors.
SendMode Input  ; Recommended for new scripts due to its superior speed and reliability.
SetWorkingDir %A_ScriptDir%  ; Ensures a consistent starting directory.

^6:: Winset, Alwaysontop, , A
return

;f16:: MsgBox, Here I am

;f16::SoundSet, -5
;f17::SoundSet, +5

f16::Send {Volume_Down}
return

f17::Send {Volume_Up}
return

f18::Send {Volume_Mute}
return

f19::Send {Media_Play_Pause}
return

;{Media_Next}
;{Media_Prev}

```

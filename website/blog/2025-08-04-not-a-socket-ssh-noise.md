---
slug: 2025-08-04-not-a-socket-ssh-noise.md
title: "SSH Noise: Not a socket."
draft: false
---

## Overview

For awhile now, but not always, I've been getting `chan_shutdown_read: channel 1: shutdown() failed for fd 7 [i0 o0]: Not a socket` on my terminal whenever I do something with SSH. This include ssh, scp, and git commands. It'll often obscure the password prompt at the bottom of the terminal screen.

<!-- truncate -->

For awhile, I've been looking for the culprit of what caused this error. Since it always happened in my remote sessions on my linux sessions, I presumed that it was part of the Linux configuration. Specifically I've been suspect of tmux because of the complexity of what tmux has to handle in regards to all the terminal command codes in modern terminal emulators.

Finally, I looked at the root SSH binary as the culprit. My windows builtin SSH is running v8.6. It didn't matter whether I ran it from cmd.exe, powershell.exe (v5.1), or pwsh.exe (v7.5), it would always trigger the error when I did a second SSH session from within the remote session. I have no idea what is actually happening, but I've finally been able to fix it.

By downloading and installing [Win32-OpenSSH](https://github.com/PowerShell/Win32-OpenSSH/releases) ~v9.8 and adding it to my path, I can now SSH into my remote sessions and then remote a second time without the dreaded `chan_shutdown_read: channel 1: shutdown() failed for fd 7 [i0 o0]: Not a socket` error popping up.

## Comments

<Comments />




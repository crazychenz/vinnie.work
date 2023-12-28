---
title: Hypervisors
---

## Overview

I don't have a deep knowledge on various Hypervisors. I generally will quickly determine which one will give me the least amount of friction to accomplish my goals. This list is based on my simplistic observations and decision making progress.

## Virtual Box 7

- Free
- Supported on (common) Linux and Windows 7, 8, 10 ... 11 has been a pain.
- Easy To Use / Works Out Of Box for "normal use".
- Less Flexible Than qemu-kvm enabled setups.
- May setup auto-start with 3rd party service starter. (VmServiceAutoStart)

Install Virtual Box 7:

```sh
sudo apt-get update
sudo apt-get install build-essential linux-headers-`uname -r`
# Insert VBox Additions Disc and Run the install
sudo usermod -aG vboxsf $USER
sudo shutdown -r now
```

## VMWare Workstation Pro 16

- Costs Money ($199 Personal License)
- Used on Windows 10, 11
- Enables seamless compatibility with ESXi, VMWare Fusion
- **No auto start**. Old janky auto-start removed in version 15?

## VMWare Workstation Pro 17

- Costs Money ($99 Upgrade from 16)
- Supported on Linux, Windows 10, 11
- Enables seamless compatibility with ESXi, VMWare Fusion
- **Supports auto-start**.

## qemu / libvirt / virt-manager

- Free
- Supported on Linux
- Extremely Flexible
- Provides non-native architecture emulation.
- Very difficult to setup initial configurations.
- Easy to auto-start or run existing configurations.
- Open Source
  - Allows creation of new machine definitions
- Requires kernel support.
- Requires binfmt kernel support for user-mode emulation.

Note: Use this for any situation that isn't a normal business practice supported by VMWare or VirtualBox.

## Hypervisor Contention

One major issue with Hypervisors is that you typically can only choose one to run at a time. If there is a stong enough reason to use qemu, you'll want to determine how to do all tasks with qemu (or virt-manager). If you can get away with accomplishing everything with VMWare or VirtualBox, it comes down to how much you want to spend. I'm always going to recommend VMWare when money is no objective. VirtualBox is free and easy to use so typically the best choice for the lowest hanging fruit.

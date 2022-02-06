---
slug: 2020-10-02-linux-is-dos
title: "Linux Is DOS: Windows returns to its roots."
#date: "2020-10-02T12:00:00.000Z"
description: |
  Windows is going back to an operating environment or platform
  instead of a bare metal operating system.
---

After seeing the headline that read, "[Eric Raymond: Windows 10 will soon be just an emulation layer on Linux kernel](https://www.zdnet.com/article/open-sources-eric-raymond-windows-10-will-soon-be-just-an-emulation-layer-on-linux-kernel/)", it had occurred to me that perhaps the proverbial pendulum is now swinging back on Microsoft. I believe that Microsoft is returning to their roots as an operating environment and not an operating system.

<!--truncate-->

This is to say that it is likely that Windows will accept that they have no stake in the fight to own the bare metal operating system. Instead they can now leverage the Linux kernel for their business and productivity applications while investing in Azure. Running windows on top of Linux, with zero performance lost to all Windows applications, is ultimately the sweet spot (IMHO).

Winding back the clock to the 1990s, Windows was an application that ran on top of DOS which became known as MS-DOS. Wikipedia reads:

> Windows 3.0 is the third major release of Microsoft Windows, launched in 1990. Like its predecessors, it is not an operating system, but rather a graphical operating environment that runs on top of DOS.

I know that many folks have already got some sort of KVM (or Xen) approach to running Windows on top of a Linux based kernel. This is good, but only for those in the know. The fact that Microsoft doesn't treat this capability like a first class citizen causes the vast majority of the community to ignore this option, and therefore prevents the GL vendors (e.g. Nvidia, ATI) from accepting that they should focus on Linux users as much if not more than their Windows or Mac OS users.

Imagine a world where you install Linux on bare metal and then run `apt install windows-10`. Then as a result you get a completely usable (with GL passthrough, and memory ballooned) Windows 10 instance. This is basically where WSL2 is heading but in reverse, you install Linux with a click in the Microsoft Store and then you have a Linux instance you can play with. Admittingly its a work in progress because it has no GL passthrough, or GUI support at all (that I've witnessed).

My personal hunch is that Microsoft will eventually get a majority of what people want into WSL2, but there is a small chance they may pass some inflection point where they themselves simply become what Eric Raymond refers to as an "emulation layer" or what I simply call a desktop environment.

## References

1. Raymond, Eric - [Last phase of the desktop wars?](Last phase of the desktop wars?)
2. Wikipedia - [Windows 3.0](https://en.wikipedia.org/wiki/Windows_3.0)

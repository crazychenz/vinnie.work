---
slug: 2021-08-24-vscode-doesnt-work-in-32bits
title: "VSCode Doesn't Work In 32bits!"
draft: false
---

## The Environment

I was recently taking some training through work. In this training I was provided a VM that contained all of the course labs and tools. As an avid VSCode user I naturally pointed my Remote SSH extension at the VM to remotely connect via VSCode.

The moment I entered my credentials I got a message like:

_VSCode is not supported on the target architecture._

<!--truncate-->

## What Is Going On?

If you look in the VSCode logs you'll find that the vscode-server failed to start and more details are found in a log located in `~/.vscode-server/???.log`. In that file, it indicates that VSCode doesn't work in 32 bit machines (i.e. i386, i686, and so forth).

A quick google about this reveals that vscode hasn't been supported on 32 bit systems since version 1.35. This can be seen on Github in [Remote-SSH: Unsupported architecture: i686...](https://github.com/microsoft/vscode-remote-release/issues/1529#issuecomment-541974218). This is due to the fact that nodejs is no longer supporting i386-ish systems anymore, hence VSCode giving up on supporting that architecture. This can be seen as happening circa 2018 in the Github issue [Dropping 32-bit builds](https://github.com/nodejs/build/issues/885).

Note: If you want 32 bit builds of nodejs you can checkout [Unofficial Builds](https://unofficial-builds.nodejs.org/). Unfortunately, VSCode doesn't plan to support their code on _unofficial_ builds.

## Ok, So What Now?

At first I tried some silly fixes, like installing an older version of VSCode on my client, turning off automatic updates, and then installing an older Remote SSH. This didn't work out because VSCode 1.35 / RemoteSSH 0.42 was old enough that it wouldn't allow me to use an alternate port for SSH.

The final solution I came up with was to simply upgrade my kernel. The idea here was to update only the kernel and leave the user space as much alone as possible. I didn't want to upgrade the user space because a bunch of the tools were version specific to work with my course's tools and course materials.

While this sounded like a simple enough task, instead of going in blind I googled various things. "Upgrade 32bit system to 64bit system" is where I started. You can only imagine how dumb that sounds and what clueless responses I would find on various forms. Eventually I found a sane result in stackoverflow with the question: [How can I switch a 32-bit installation to a 64-bit one?](https://askubuntu.com/questions/81824/how-can-i-switch-a-32-bit-installation-to-a-64-bit-one)

## The Solution

After reading the above referenced stackoverflow question and adjusting it to specifically meet my VSCode needs, I ran the the following commands:

```sh
sudo dpkg --add-architecture amd64
sudo apt-get update
sudo apt-get install \
    linux-image:amd64
    libstdc++6:amd64 \
    libc6:amd64 \
    gcc-multilib \
    linux-modules-extra-3.13.0-170-generic:amd64
sudo update-grub
```

Once that was all done I rebooted the VM, fired up my modern 1.59 VSCode with RemoteSSH and everything installed and worked as expected.

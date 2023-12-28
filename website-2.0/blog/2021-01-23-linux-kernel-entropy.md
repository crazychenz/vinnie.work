---
slug: 2021-01-23-linux-kernel-entropy
title: "Linux Kernel Entropy"
#date: "2021-01-23T12:00:00.000Z"
description: |
  Entropy initialization in the Linux Kernel is not deterministic.
---

## Overview

When attempting to run through some exercises for a previous article I ran into an issue where I couldn't get dropbear to work until some _undeterministic_ time in the future. At first glance, this was an extremely mysterious issue that had me digging in google results that were over at least 10 years old. (And with no apparent solution.)

<!--truncate-->

## The Setup

So I had what I'd call a pretty basic qemu emulator setup. I was emulating an `aarch64` system with busybox and dropbear in the system, OpenSSH as the client on the host, and qemu user networking over port 5522 on both sides.

## Troubleshooting

I was fairly confident that qemu was not the issue because I could show network traffic over netcat. Dropbear would just sometimes work and other times it would just hang without much in the way of feedback. After looking at the logs for dropbear I did notice it was _optionally_ using getrandom() to initialize its randomness. At this point I forced dropbear to use `/dev/urandom` for its randomness (in its build process). This simply pushed the issue from the application into the kernel where I received `... random: uninitialized ...` errors.

Hmm... there was an indicator that randomness had been initialized in the kernel. It resembled the following in `dmesg`:

```
[   SS.MMMMM] random: fast init done
```

But when does this happen? I restarted the qemu process and waited for `fast init done` to pop up in the console. After waiting for 10 minutes, it never came! I started to muck around with the system, trying some different things and then suddenly, there is was! What?!

I had to walk away from my desk twice to process what was going on. After some soul searching, I recalled that in some SSL libraries they have a process where sometimes they'll ask you to jiggle the mouse or mash the keyboard until they have sufficient entropy to self-sign a certificate. I've also read in the past in kernel code about using irregular interrupts to generate entropy in the system.

Could it be that I've isolated my emulated system to the point that it isn't receiving any interrupts except for my input? Time for an experiment...

With a fresh restart of the qemu, I started mashing the keyboard thinking that the key inputs were sufficient interrupt triggers. After about 200 characters typed, it worked. But that was way to much work on my part to just start a dropbox service. Is there a way I can automate this?

What if I syn flood the interface? I used `hping` to bombard a freshly booted qemu (from the host) while monitoring for `fast init done` in `dmesg`. Nothing. I guess the syn flood isn't getting used because there is no userspace registration for it to be used and therefore isn't trust worthy? I don't know this to be true and haven't looked at the kernel code on this specific guess. **Just a hunch.**

Perhaps if I do something similar but from the inside qemu guest system's user mode, it'll be enough to generate that entropy the kernel needs. I attempted something simple: `ping -A 10.0.2.2`. **That worked!** After some experimentation, it appears that `ping -c 512 -A 10.0.2.2` will do the trick.

## How Is This Uncommon?

It is my belief that a typical linux system runs with enough noise from various services and network connections on boot, most users will never experience this issue. By luck they are providing enough entropy to make the kernel happy.

I just happen to be creating a simplified environment that is isolated in a docker container and then further isolated in a qemu emulator system where there is zero network traffic and no running userspace services (i.e. zero entropy).

My only dissappointment is that there is not more information on what to do when entropy is not available. Perhaps a useful message in `dmesg` about "events to go" or something would have helped immensly in understanding the situation in which I found myself.

## Miniscule Research

For more information I did a tiny bit of research on the subject.

- Wikipedia talks about using [observed events](https://en.wikipedia.org/wiki/Hardware_random_number_generator#Using_observed_events) to populate entropy data.

- Arch Wiki has a good article on the whole process: [Random Number Generation](https://wiki.archlinux.org/index.php/Random_number_generation)

- StackOverflow: [What is random : crng init done](https://stackoverflow.com/questions/59249941/what-is-random-crng-init-done)

- StackExchange: [When I log in, it hangs until crng init done](https://unix.stackexchange.com/questions/442698/when-i-log-in-it-hangs-until-crng-init-done)

- [Openssh taking minutes to become available, booting takes half an hour ... because your server waits for a few bytes of randomness](https://daniel-lange.com/archives/152-Openssh-taking-minutes-to-become-available,-booting-takes-half-an-hour-...-because-your-server-waits-for-a-few-bytes-of-randomness.html) ... Take away: Linus himself was so fed up with a closely related issue that he submitted patches that have been upstreamed since Linux 5.4.

## Conclusion

In conclusion, the kernel prioritizes its entropy above security dependent functionality. This is due to Linux's prominance in the world of information security making it a primary target for hunting for security issues. Luckily, we can automate away some of this headache in our simulated environments with something as simple as `ping`. Also, we're using a stripped down tool like dropbear. I would hope that more full featured tools like OpenSSH and more modern kernel would have a better messaging system and lower latency in generating entropy on behalf of the user.

## Comments

<Comments />


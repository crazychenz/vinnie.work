---
slug: 2026-02-18-firecracker-faster-huh-how-why
title: '"Firecracker faster than QEmu!" Huh? How? Why?'
draft: false
---

Recently, I've been reading up on MicroVMs. I've been a long time user of QEMU for its flexibility and open nature. You can run KVM machines with near-native performance as well as emulate completely foreign architectures on an x86 (64-bit) based architecture. Its open source nature also allows developers to tailor feature sets and add new machine configurations within it framework. All good things, right?

Apparently this hasn't been good enough for Amazon because they've been developing and maintaining their own hypervisor called Firecracker. It boast fast loading times and security, but I call bullshit on all the review articles because they don't seem to know what is really happening within. What is Firecracker _really_? 

**Disclaimer:** I'm writing this article based on my "general knowledge" of hypervisor technology. Not a thorough set of experiments and results.

<!-- truncate -->

## Virtualization Hardware

Around 2005, Intel introduced VT-x (i.e. vmx) that provided hardware assisted virtualization instructions to its instruction set on Pentium based machines. Before this (as far back as 1980), there have been vendor specific instructions that can help facilitate resource isolation in the CPU, but the bulk of the isolation work had to be performed by the operating system and the guest OS had to be cooperative. Nowadays, virtualization has matured to the point where most operating systems support hardware assisted virtualization technology as well as facilities to be a guest themselves. This work is mostly hidden from users and developers and unfortunately makes it seem like virtualization is some independent piece of magic, when the reality is that virtualization would not work if it weren't for the efforts by the OS developers over the past 3 decades.

Virtualization Technology (VT) hardware, what is it? It allows a bare metal host operating system to protect itself from a guest operating system while creating the perception that the guest operating system is operating in ring 0 (i.e. the most privileged mode of the CPU). 

In summary, VT tech is a way to provide **hardware supported** (internal) system isolation between host code and guests code. That's it. No kernel, no resource management, no emulation. Only isolation!

## Virtual Machine Monitor (VMM), i.e. Hypervisor

Hypervisors (or VMMs) are the software that manage the logical concepts that most developers and users come to think of as "virtualization". It manages the resource allocation, initialization, and execution of _guests_. Its presumptuous to assume a guest "operating system" at this point because a VMM could launch an _application_. If a kernel doesn't provide a Userspace ABI, is it an operating system? Some will say yes, but it can also be considered an "application of the hardware". Many real-time operating systems (RTOS) systems don't have a traditional userspace.

Typical training and documentation on hypervisors will claim there are two types of hypervisor architectures.

* Type 1 (Bare-Metal) - The hypervisor is running on the hardware and all running operating systems run on top of it. The management of the hypervisor runs as a special privileged guest. Examples include Xen and Hyper-V.
* Type 2 (Hosted) - The hypervisor is running within the context of a operating system or traditional kernel. Examples include Oracle VirtualBox or Windows Hyper-V Manager.

I'm not here to say the above descriptions are the wrong way to think of it, but I will say that a "bare-metal" (Type-1) hypervisor fundamentally has a similar architecture to a "operating system": resource management, interrupt management, ABI, etc. That said, bare-metal hypervisors are **tailored** to be bare minimal to support the hypervisor system calls (i.e. hypercalls). Maximum VT support with minimal overhead is the name of the game.

In summary, a hypervisor (VMM) is responsible for allocating real resources as virtual resources to host and/or guests.

## Containers and Namespaces

Since 2002, the Linux kernel has been working on the concept of namespaces and cgroups.

- Mount namespaces in 2002.
- PID, IPC, Network namespaces in 2008.
- Control Groups (cgroups) added in 2008 - for application and resource isolation.
- User namespaces in 2013.

These are the components that enable the concept that folks lightly refer to as "containers" today. With a very minimal C program and the `clone()` syscall, you can launch an `init` or `shell` in a "container" without any proper container runtime installed. You can run a poor mans container because 99% of the functionality is implemented in the kernel. The bulk of what docker, runc, and other container run-times do is management file systems (i.e. container images) and policies that are applied to the kernel.

As we all know, containers are quick to start and launch application in isolation. But the security experts have indicated flaws. An application running in a container runtime as root can break out because it is still root in the kernel. This can partially be solved by running rootless container run-times that use user namespaces so that the discretionary access control indicates the application is running as user 0 (zero) when in reality its running as a user on the container runtime host. This works in some situations, but also fails in many situations where the application really does need to run as root (e.g. network configuration, lazy security practices in real production services).

Ok, so what can we do when a container needs to run as "real root" but we want to isolate it from other applications? Virtualization!

## MicroVMs

In the container example above, we don't need to emulate a complete system, we only need to emulate the bare essentials to run an application and enable inter-process communication (IPC) across the virtualization (VT) boundary.

In general, an application needs volatile memory (RAM), storage, and network access. An example implementation of code that supports these bare essentials are the `virtio` drivers provided by the Linux KVM community. Therefore, you can theoretically have a virtual machine or hypervisor (e.g. KVM) that only enables this functionality. The VM guest will be a tailored Linux kernel with a matching initramfs to support the minimal hardware in userspace. Finally, desired access to the storage is configured and the init binary is executed to completion. THIS is a _MicroVM_.

In contrast, a non-MicroVM needs to fool a dumb Linux kernel that its running on real hardware. A dumb Linux kernel will assume some sort of BIOS (for hardware input/output APIs), ACPI (for power management), and other modern or legacy systems. These systems have probe timeouts and other "one-time" initialization time costs because its presumed to be initializing real hardware. Note: Your real bare-metal servers still take many seconds to minutes to initialize for the same reasons. 

In summary, a MicroVM uses the same VT hardware, the same hypervisor architecture for isolation, and nearly the same kernel and initramfs as a normal VM. The only difference is the exclusion of unnecessary components based on the **assumption** that the kernel and the target application will be running on virtualized hardware and not real hardware.

## Firecracker & QEmu

So now we get to the original point of this article ... why Firecracker and not QEmu? Firecracker is a hypervisor that has been developed by Amazon for quick initialization of applications while maintaining good isolation via VT tech. Firecracker is written in Rust with the assumption being that memory corruption is a priority for vulnerability mitigation. (I'm wording it this way because Rust vulnerabilities still exist. Rust only mitigates pure memory corruption bugs and only in pure borrow checker contexts.)

Additionally, Firecracker is tailored to run only as a minimal application hypervisor. In other words, it can only be used to run "MicroVMs". Because of the hard-coded nature of Firecracker to do the minimum, the developers have been able to shave anywhere from 25ms to 200ms+ off the hypervisor or virtual initialization of system.

In contrast, QEmu has many more code paths to process: heavier shared object loading, CLI parsing and handling, framework overhead, and so forth. The extra effort add the exact thing that Firecracker is able to eliminate (25ms to 200ms+ of initialization time).

That said, both Firecracker and QEmu can run with the minimal `virtio` support and achieve sub-second initialization time. Both VMs will take the same time to decompress the same kernel, perform the same early kernel boot up, and run the target application (given they run on the same system with the same virtualization allocated resources).

## Conclusion

Firecracker is probably a great product for high performance demands because of the borrow checker in Rust and its tailored nature to eliminate unnecessary initialization code.

QEmu remains equally if not more valuable due to its extensive support of other hardware and configurations when needed. In example, QEmu can enable GPU pass-through, and can also eliminate a lot of the overhead that Firecracker does, but with a single change to the CLI call. Rebuilding QEmu without a lot of the CLI handling and other overhead is not overly complicated in a more performance demanding environment.

At this point, I'm really struggling to understand why Firecracker really exists other than "because Rust" and "because every ms counts".

## Comments

<Comments />
---
slug: 2023-02-05-inspecting-kubernetes
title: 'Inspecting Kubernetes (the Workshop)'
draft: false
---

## Overview

When things go wrong in Kubernetes, things can go really wrong and there isn't much documentation on how to inspect the system out of band of what a working `kubectl` can deliver. This can be maddening. This article covers some of what is going on under the hood of Kubernetes and Containerization so that you have some more tools in your collection for inspecting Kubernetes issues from within `kubectl` and out-of-band of Kubernetes.

<!-- truncate -->

## The Workshop Analogy

When `git` first made its debut, few really knew what to do with it. `git` was a _toolbox_ of things that enabled distributed source control (among other things), but other than the Linux kernel maintainers, there wasn't a prescribed workflow for other to follow in their own projects. It was just a toolbox of _tools_ (staging, commit, push/pull, merge, and so forth) to let you develop your own workflow. In fact, Mercurial (`hg`) is another distributed source control system that, at the same time, looked more appealing than `git` because it did prescribe to a specific workflow. Once we had Github, Gitlab, Bitbucket define a workflow for the masses (that were'nt necessarily kernel hackers), the `git` tool-set became more approachable.

Kubernetes, like `git` is a set of tools that are difficult to wrap your head around without a workflow. The one difference between Kubernetes and Git is that while Git is more of a toolbox, Kubernetes is a workshop of toolboxes, bench tools, and odd jigs that you'd never know what do to with unless someone told you. By this, I mean each resource type in Kubernetes has a deep knowledge base that is required to fully utilize it. Some of the components and resources are a bigger deal than others, for example understanding containerization would be a bigger tool to grasp, but understanding an Ingress route can be no less complex when you get more involved in the engine specific annotations.

As in any workshop, start with the tools that you know best and slowly increase your knowledge and quality of product by learning new tools one at a time and organically growing your repertoire. Also, larger and more dangerous tools should probably warrant some additional training before you jump right in (or you might lose a finger!). In this analogy I am referring to security and certificate management. If you get the security of your system wrong, it can produce the highest type of technical debt with the worst outcomes depending on how and when its discovered and fixed. Finally, there are _Custom Resource Definition_ (CRDs) in Kubernetes that would match a use case specific "jig" in my analogy. These are custom built resource types that can be dynamically registered or unregistered from a Kubernetes system as needed.

Realizing Kubernetes was just a workshop of tools, I took a very different approach to learning the system. The goal here is to figure out what you want to build and then develop your own workflow for that goal. This seems obvious now, but before I was worried I was always missing something important because of the documentation and common use cases folks tout in the intertubes.

Take great caution when reviewing online videos, tutorial documentation, or canned demonstrations. For my case specifically, none of them ever fit my use case and they all mostly fly blind without pulling back the hood to help me actually troubleshoot issues. This lead to over architected configurations that I either didn't fully understand or were just outright broken without much in the way of troubleshooting guidance (short of making a career out of Kubernetes).

## Linux Kernel Namespaces

Before you dive into Kubernetes and/or containers troubleshooting, you really should be aware of [Linux namespaces](https://en.wikipedia.org/wiki/Linux_namespaces). Note: Kubernetes Namespaces are **not** Linux namespaces. The Linux kernel maintainers over many years developed a kernel that could partition its subsystems into different _namespaces_. Personally, my first exposure to this was network namespacing. You can use network namespacing today with the `iproute2` tools:

- Create a network namespace: `ip netns add <name>`
- List network namespaces: `ip netns list`
- Execute a command in a network namespace: `ip netns exec <name> ping <host-addr>`

Wait!, what? ... `ip netns exec <name> <command> [args..]` looks an awful lot like `docker exec <name> <command> [args..]`, does it not? These network namespaces would allow you to have different services that could only access their own network stacks. This meant that each namespace had their own network interfaces, routing table, arp table, and so forth.

Note: You can inspect various kubernetes _Pod_ networks namespaces today with the `ip netns` command.

Another namespace implemented by the kernel was the _mount_ namespace. This allowed you to partition the virtual file system into different viewable namespaces on a per process basis. Before the namespace, you'd be forced to `chroot` or use other nasty layering and isolation tools.

From these namespaces and others came the concept of _containers_. I love the Docker CLI and how I can easily manage my namespaces with its API, but remember that you do not need a container runtime or container manager to conceptually have a "container". You only need a Linux kernel with a namespace implementation. Technically this means kernel v3.8+, but I would never recommend going with anything older than kernel v3.18+ if possible.

## Linux Namespace Tools

When running Kubernetes, there are several kinds of commands to get familiar with that have nothing to do with Kubernetes. The Linux kernel is aware of nearly everything that is happening because Kubernetes depends on namespaces and containers that are managed by the kernel and a container runtime. The only thing that Kubernetes is really the authority over is the relationships between the various container/namespace connections and access.

(AFAIK) In the case of k3s, you can inspect the state of the kubernetes "out of band" with a couple different tools:

- `ip netns <subcommand>` will show you the network namespaces.

  - View all of the network stack interfaces across all namespaces within the Node:

    ```sh
    for netns in $(ls -1 /run/netns); do echo ----- $netns ----- ; ip netns exec $netns ip a s ; done
    ```

- Network namespaces can also be seen in `/run/netns/*`.
- `lsns` (of `util-linux` package) will list all namespaces, their types, and the associated process or command running in the namespace. This is an ideal way to find out a target namespace.
- If you don't have access to `lsns`, you can always fall back on the `/proc/*/ns/*`/`/proc/*/task/*/ns/*` paths in the kernel process (`/proc`) folders. These locations list namespace inodes per process pid. The namespace inodes can be used to access the namespace with the `nsenter` command.
- `nsenter` will allow you to run commands within a namespace given that you know the namespace inode from `lsns` or `/proc`. The kinds of commands you might consider running in a namespace would be:
  - `ip` - To view the network stack settings for a namespace.
  - `bash` - To run an interactive prompt within the namespace for general discovery of resources.
  - `mount` - To view the mount points resources given to the namespace. (Logs could be a useful one here.)
  - `gdb` - To connect directly to the a namespaced process for low level debug and introspection from within the target process.

Also, you should not count out all of the tools built into the Kubernetes system that can give you reflection of the state of what is happening under the hood.

- `crictl` the container runtime CLI for `k3s`. This can be different from k8s engine to engine, but there usually is one. Most of the `crictl` commands match the commands of the `docker` CLI.

  - `crictl images` to see the cached container images in the Kubernetes Node.
  - `crictl ps` to see the running containers in the Kubernetes Node.
  - `crictl exec` to run a command within the container running in a Pod itself without Kubernetes API awareness.

- `kubectl logs` - A valuable command to dump the console output from a specific Pod. This is great for detecting errors based on missing or misconfigured settings that a service expected on start up (e.g. a bad `nginx.conf` will prevent the service from listening on the assigned port).

## Resources

- [K8S Cheatsheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [SO: How to find out namespace of a particular process?](https://unix.stackexchange.com/questions/113530/how-to-find-out-namespace-of-a-particular-process)

## Comments

<Comments />

---
slug: 2023-02-04-why-so-hard-kubernetes
title: 'Why so hard? Kubernetes!'
draft: false
---

This needs to be split up into:

- Vinnie's Kubernetes Overview
- Inspecting Kubernetes
- Kubernetes is a Workshop
- Immature Kubernetes Docs
- Vinnie's Single Node PaaS

## Blurb

Back in 2020 when I first started looking into building a mobile application I wanted to do things smart by architect-ing the backend system on Kubernetes. I think I went about it all wrong at the time. I took a very top down approach (which I very often do) jumped right into some cloud infrastructure on GKE and just started poking around with `kubectl` and the various GUIs. Turns out this doesn't work in Kubernetes land without some solid base knowledge. I had no context, no terminology. To make matters worse, I watched a few how-to videos on youtube that went kind of like: "`kubectl` this, `kubectl` that, and viola! You have a working infrastructure." In reality "Kubernetes is not making my job easier! Kubernetes is just creating another career's worth of complexity in my application."

In more recent times, I've returned to Kubernetes after a longer look at Platform As A Service (PaaS) as a whole.

<!-- truncate -->

## Platform As A Service

My docker container usage has grown to a level that is a bit unwieldy. My primary goal is to get the services into a more managed and stable state. With the right setup I believe I'm no where close to maximizing my ability to grow my container usage. My requirements are different than a lot of the documentation goes through:

- I have a single (x86) hardware system with normal residential resources (48-64GB Mem, a few TB of disk)
- I use a single TLS termination gateway (nginx) because I don't have the time or interest in running a FreeIPA or other Identity Management System. Managing certificates in some overly complex system buys me nothing at this point.

As a result I've been evaluating PaaS orchestration systems:

- Coolify
- Caprover
- Dokku
- A bunch that wouldn't install.

All of the above orchestration engines were either tied to Docker or Docker-Swarm. My past experience with Kubernetes really put a bad taste in my mouth. That was until I finally decided that maybe a Kubernetes based system might be better and I installed Rancher. Of course I naively installed Rancher as a Docker container because what could be easier? I went through the motions and watched some out of date videos on using Rancher. I managed to get an `nginx` service up and running with a HostPort and a NodePort but I could never figure out how to get the Ingress to work in that blasted thing.

After giving myself some time, I came around to the fact that Kubernetes is a bit like `git`. What I mean by that is when `git` first made its debut, few really knew what to do with it. `git` was a _toolbox_ of things that enabled distributed source control, but other than the Linux kernel maintainers, there wasn't a prescribed workflow. I was just a toolbox of _tools_ to let you develop your own workflow. In fact, Murcurial (`hg`) is another distributed source control system that, at the same time, looked more appealing than `git` because it did prescribe to a specific workflow. Once we had Github, Gitlab, Bitbucket define a workflow for the masses (that were'nt necessarily kernel hackers), the `git` tool-set became more approachable.

Kubernetes, like `git` is a set of tools that are difficult to wrap your head around without a workflow. The one difference between Kubernetes and Git is that while Git is more of a toolbox, Kubernetes is a workshop of toolboxes, bench tools, and odd jigs that you'd never know what do to with unless someone told you. Realizing Kubernetes was just a workshop of tools, I took a very different approach to learning the system. The goal here is to figure out what you want to build and then develop your own workflow for that goal. Take great caution when reviewing online videos, tutorial documentation, or canned demonstrations. For my case specifically, none of them ever fit my use case and they all mostly fly blind without pulling back the hood to help me actually troubleshoot issues.

## Rancher and K3S

Even though Rancher's Docker container didn't work for me, I still kept up hope that one day I would run Rancher because I did see the value in it if I could get Ingress to work as intended. Therefore, I decided to use k3s as my Kubernetes Engine. Supposedly its K8S API certified by some group of people and therefore should be compatible with cloud services or other certified engines if I ever decided to migrate. Great!

One of the beautiful things about K3S is that it is a single binary. If you've followed along with my blog here, you'll know that I have an unhealthy obsession with statically built binaries. This also makes installation quite simple for tinkering. You literally can download the binary from [GitHub](https://github.com/k3s-io/k3s) and run `k3s server` to have a Kubernetes cluster/node/api running on your system.

For a clean install, the [K3S documentation](https://docs.k3s.io/) recommends that you go the curl/sh route with something like:

```sh
curl -sfL https://get.k3s.io | sh -
```

That same script can help with installing a system as an agent as well, but that isn't important to me (yet), so moving on...

## Linux Kernel Namespaces

Before you learn about Kubernetes and/or containers, you must be aware of [Linux namespaces](https://en.wikipedia.org/wiki/Linux_namespaces). The Linux kernel maintainers over many years developed a kernel that could partition its subsystems into different _namespaces_. Personally, my first exposure to this was network namespacing. You can use network namespacing today with the `iproute2` tools:

- Create a network namespace: `ip netns add <name>`
- List network namespaces: `ip netns list`
- Execute a command in a network namespace: `ip netns exec <name> ping <host-addr>`

Wait!, what? ... `ip netns exec <name> <command> [args..]` looks an awful lot like `docker exec <name> <command> [args..]`, does it not? These network namespaces would allow you to have different services that could only access their own network stacks. This meant that each namespace had their own network interfaces, routing table, arp table, and so forth.

Note: You can inspect various kubernetes _pod_ networks namespaces today with the `ip netns` command.

Another namespace implemented by the kernel was the mount namespace. This allowed you to partition the virtual file system into different viewable namespaces on a per process basis. Before the namespace, you'd be forced to `chroot` or use other nasty layering and isolation tools.

From these namespaces and others came the concept of _containers_. I love the Docker CLI and how I can easily manage my namespaces with its API, but remember that you do not need a container runtime or container manager to conceptually have a "container". You only need a Linux kernel with a namespace implementation. Technically this means kernel v3.8+, but I would never recommend going with anything older than kernel v3.18+ if possible.

## Kubernetes Primer

When I jumped into Kubernetes, I knew all the things I know about namespaces and containers ... how hard could it be? Well, Kubernetes is solving a different problem. Kubernetes is entirely about **managing system state** through the use of semi-standard APIs, namespaces, containers, and so forth.

Here are some common terms you should already be familiar with before ever thinking about tinkering with Kubernetes:

- Linux Namespace - A partitioned set of resources defined and managed by the Linux kernel. (The thing that all containers depend on.)
- Container - The state of a running or created namespace, usually based on a container image.
- Container Image - A standardizes set of layers that define the mount namespace of a container to be created or run.
- Container Runtime - At its core is an executable that uses the clone() syscall to run containers in their assigned namespaces.
- Yaml (Yet Another Markup Language) - A common configuration format that is typically more human readable than JSON and more terse than XML. (YAML is a superset of JSON.)

For Kubernetes, specifically, there is are a number of new terms to define right up front:

- Namespace - This is a grouping or categorization of resources within Kubernetes.
- Node - Think of this as an (atomic) running (Linux) kernel. It could be a bare metal system, a virtual machine, or some other multi-kernel architecture, just so long as it has its own (Linux) kernel.
- Cluster - A cluster is a logical grouping of Nodes.
- Pod - A pod is a **tightly coupled** grouping of containers. (Usually a single container.)
- Service - An object for discovering and accessing a pod that is providing a _service_.
- Ingress - A set of rules for routing URL hosts/paths to services.
- _Labels_ - While not an "Object", labels are use all over Kubernetes objects to assist with locating and searching for objects. Each object gets a single unique name, but labels can have the same value or divulge metadata this isn't accessible elsewhere in the object.

- Deployment - A desired configuration of (stateless) pods for an application. By _desired_ I mean to say that the configuration could run in a "degraded" state where not all pods are all running at the same time.
- DaemonSet - Similar to a Deployment but is intended for running a Pod on every node. This can be used to run a local syslog service on all nodes.
- StatefulSet - Similar to a Deployment but the names of Pods are indexed so that references can refer to the same Pod allowing for local state to be stored in the container.

There are many many more terms, but these are the more basic objects that you'll likely use all the time.

## The Immaturity of Kubernetes Documentation

_Who the heck is this guy? Who is he to call Kubernetes immature? Google, Amazon, Microsoft have all made millions on Kubernetes!_

Let me start by saying that Google/GKE, Amazon/AWS, Microsoft/Azure, and others have developed a business model around Kubernetes whereby you purchase _convenient_ resources to run your applications. You can often do much of this with GUI interfaces and never have to look at any YAML resource descriptions ("CRD"s is what I think Kubernetes calls them?) In any case, the tech giants of the world have a very real use case for using Kubernetes and employing multiple teams of specially trained engineers to not only use Kubernetes by expand and evolve the actual code base to better suit their needs. They (Google, Amazon, Microsoft) don't have to worry about the nonsense documentation and utter un-intuitive manner in which Kubernetes is presented to the rest of the world. We'll buy it out of convenience alone. Ugh!

If you want to learn how to install Rancher into K3S, their documentation has you:

- Install `helm` - A repository tool (like apt or yum) for Kubernetes CRDs. Or from what I can tell, a template resolver for Kubernetes CRDs.
- Configure `helm` - To point to their rancher repository.
- Create a kubernetes namespace
- Install a `cert-manager` - Which by the way means you also need to determine your certificate strategy
- Use `helm` to install rancher.

Complaint: A better approach would be to simplify installation as much as possible. I literally should have a single YAML that I shove into my kubernetes with zero TLS, zero Helm.

Other Kubernetes documentation uses lots of shell-isms to hack their way to continence. While not the worst I've seen, the Kubernetes Dashboard Setup is quite ridiculous.

It starts out right with a single non-helm yaml:

```sh
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml`
```

But then to access the thing, you have to do all kinds of weird things like:

- Wait for a token to get created with the following command:

  ```sh
  while ! kubectl describe secret default-token | grep -E '^token' >/dev/null; do
    echo "waiting for token..." >&2
    sleep 1
  done
  ```

- Then grab the token with the following commands:

  ```sh
  APISERVER=$(kubectl config view --minify | grep server | cut -f 2- -d ":" | tr -d " ")
  TOKEN=$(kubectl describe secret default-token | grep -E '^token' | cut -f2 -d':' | tr -d " ")
  ```

This does not seem like the kind of thing that I would ever want to post on the official Kubernetes website. (It's very Agile looking to be honest!) Why isn't there a shell script or container that I can use to get this same functionality. Seems to me a better user experience might be:

```sh
# Download a helper script
curl -o https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/dash.sh
# Apply the CRDs for the service
kubectl apply -f https://raw.githubusercontent.com/kubernetes/dashboard/v2.7.0/aio/deploy/recommended.yaml
./k8s_dash_utl.sh tokenwait
./k8s_dash_utl.sh apiserver
./k8s_dash_utl.sh token
```

If I want to know how they are waiting for a token, how they are fetching a config or secret I'll look into the script. When did it become acceptable to to just drop conditionals and loops into a _simple_ copy paste command?! Almost feels like it could be exclusive to those that are shell savvy and less approachable to those that are not ... but no less capable of managing an IT infrastructure. Quite aggravating since this appears to be the quality of standard by a giant like Google at the moment.

## Explaining Kubernetes Resources

One of the most aggravating aspects of Kubernetes when I first approached it, circa 2020, were the number of options used to define a resource. I would go from Yaml to Yaml and see many levels of different options. This can be made even worse when you `get` a running yaml configuration from `kubectl`. In that case, all the implied options become explicit and you get `state` values that you can't set (but don't know that unless you read or try).

When you start to define or tweak resource Yaml definitions, you need to be aware of 3 key resources:

- [Kubernetes API Reference](https://kubernetes.io/docs/reference/kubernetes-api/) - Official Website Documentation

- `kubectl api-resources` - This command will give you a list of all the recognized resource types in your system and their associated command line names and abbreviations if applicable. This is a list of the top level of configurable resources that you can then dive into with `kubectl explain`.

- `kubectl explain` - This command will give you access to the API documentation directly in the terminal. You can access the various levels of options by creating a pseudo JSON path to the option that you are interested in. Here are some examples:

  - Find out more about "Deployment"s:

    ```sh
    kubectl explain deployment
    ```

  - Find out more about Pod Templates within a Deployment (Note: This isn't in the K8S cheatsheet!):

    ```sh
    kubectl explain deployment.spec.template.spec
    ```

Without using these 3 resources, any new definitions becomes a game of guessing the unknown of unknowns until you accidentally become a Kubernetes master.

## Under The Hood

When running Kubernetes, there are all kinds of commands to get familiar with. They all appear to be doing magical things, but is Kubernetes the only thing aware of what is going on? Of course not! The kernel is aware of nearly everything that is happening because, you guessed it, kubernetes depends on namespaces and containers that are managed by the kernel and a container runtime.

In the case of k3s, you can inspect the state of the kubernetes "out of band" with a couple different tools:

- `ip netns ls`/`/run/netns/*` will show you the network namespaces.
- `/proc/*/ns/*`/`/proc/*/task/*/ns/*` are folders that list namespace inodes per process.
- `nsenter` will allow you to run commands with a given namespace.
- `lsns` will list all namespaces, their type, and the associated process. (See `util-linux` package.)
- `crictl` the container runtime CLI for k3s. This can be different from k8s engine to engine, but there usually is one.

- View all of the interfaces in all namespaces:

  ```sh
  for netns in $(ls -1 /run/netns); do echo ----- $netns ----- ; ip netns exec $netns ip a s ; done
  ```

## Resources

- [K8S Cheatsheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [SO: How to find out namespace of a particular process?](https://unix.stackexchange.com/questions/113530/how-to-find-out-namespace-of-a-particular-process)

## Comments

<Comments />

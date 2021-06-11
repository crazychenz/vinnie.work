---
slug: 2020-10-12-python-wheel-manylinux
title: "Controlling Python Wheel Compatibility"
date: "2020-10-12T12:00:00.000Z"
description: |
  Building a pre-packaged python environment for deployment to remote python services.
---

## My Situation

Currently I am working on a project where I am writing a plugin for a service that is a sort of python as a service. You can think of it as a Function As A Service (FaaS) kind of architecture, but the idea is that you provide the service all the python dependencies for your functions when you deploy. Additionally, the service doesn't provide any build toolchains, therefore all dependencies should be delivered as a set of wheels instead of python source distributions.

<!--truncate-->

When deploying wheels, you are basically deploying libraries that are prebuilt. This hasn't been such a large issue for Windows binaries (so long as you match the bit size of the CPU), but the diversity of available symbols in Linux for pre-built binaries makes this an extremely awkward task.

The Python ecosystem has developed a [tagging system](https://www.python.org/dev/peps/pep-0425/) for wheels that allows systems like Pip to be able to determine what wheels are compatible with the associated Python environment. These wheels include things like the python version, architecture, and operating system. Because of the Linux diversity problem, Python has come up with standards for what symbols must be included within a linux system under that manylinux\* tags.

So here is my primary issue ... there is no reliable way to provide these tags within a requirement specifier that I can see. This fact prevents me from (cleanly) being able to build a deployable python package meant for a Python environment that is different from the Python environment on my system.

## Hacking In Mandatory Wheel Packages

The quickest way I found to workaround the problem described above was to downgrade my python version from 3.9 to 3.6. This was not enough when it came to packages that provided manylinux2010 and manylinux2014 versions for python 3.6 (e.g. cryptography).

It turns out that Python 3.6 implements [PEP 508](https://www.python.org/dev/peps/pep-0508/) which allows me to explicitly call out the link that I want the specified python requirement to come from. This has two advantages, one is that I can explicitly assign a wheel package to a given requirement. Assuming the source provides hash/digest checking and is trusted, you can lock down the dependency not only to a URL but the hash of the content behind that url _without_ having to enable hash-mode checking.

Here is an example (from PEP 508) for how to specify a requirement for pip with a URL specification:

```
pip @ https://github.com/pypa/pip/archive/1.3.1.zip#sha1=da9234ee9982d4bbb3c72346a6de940a148ea686
```

**Note:** The url can be a source distribution or a wheel distribution.

The major disadvantage of using this mechanism is that it is very explicit. In otherwords, I can't use something like the `~=` or `>=` specifier comparator symbols to just get fixes and updates automatically. Instead, I must go update each individual entry and that means updating the whole URL, not just a version bump. (i.e. In environments that use dependency lock files, you can't just delete the lock file and regenerate it with updated dependencies because the requirement is in the higher level declaration.)

## A Better Way

So while the above mechanism gets me over the hump, it has a bit of technical debt. There is another package system that I've used in the past called [AppImage](https://appimage.org/). What AppImage does to maximize portability is have developers build their applications for older Linux distributions. Anything that isn't supported by the stock linux distribution must then become a part of the packaged Application. You can think of AppImage as a framework for distributing Linux applications like a MacOS Application or Universal Windows Application.

The python manylinux\* PEP specifications have taken the same approach as AppImage. They maximize on portability by baselining their support to a particular Linux distribution and its version (e.g. CentOS).

Therefore, to build a python environment with dependencies downloaded for a system with only manylinux1 support, you need to look into the manylinux1 PEP. In that document it states that CentOS 5.11 is the standard for manylinux1. In fact, the same applies to manylinux2010 and manylinux2014 (with progressively newer CentOS versions). Here is a list of the PEP specifications for manylinux\* as of this writing.

- [PEP-513 - manylinux1](https://www.python.org/dev/peps/pep-0513/) (requires CentOS 5.11)
- [PEP-571 - manylinux2010](https://www.python.org/dev/peps/pep-0571/) (requires CentOS 6)
- [PEP-599 - manylinux2014](https://www.python.org/dev/peps/pep-0599/) (requires CentOS 7)

So what do we do with this information? Docker! Looking at [quay.io](https://quay.io/) or [docker hub](https://hub.docker.com/) for `manylinux1` will turn up a whole host of options that can be used. On docker hub, the most popular is provided by an [organization that specialized in cross-compilation](https://github.com/dockcross/dockcross) toolchains. Looking into their `Dockerfile` implementations you'll find that they are actually basing their manylinux1 builds from a [quay.io docker container](https://quay.io/repository/pypa/manylinux1_x86_64). To see the `Dockerfile` implementation for manylinux1 on quay.io, you have to view it [within a branch](https://github.com/pypa/manylinux/tree/manylinux1) due to CentOS 5 being end of life. Going to the [manylinux](https://github.com/pypa/manylinux) site directly will get you the manylinux2010 implementation at the time of this writing.

You can pull this quay.io manylinux1 container yourself with:

```
docker pull quay.io/pypa/manylinux1_x86_64
```

To summarize, if you want to develop a python environment that you know will work on any system that supports manylinux1, build it inside of the dockcross CentOS 5.11 docker container.

## In A Perfect World

Even though we now know the preferred way to handle building a highly portable deployable python environment, is it really what we want? I would argue that in a perfect world, we should be able to specify tags as part of our contraint files, requirements files, and dependency lock files. Something _similar to_ the following would be nice (or whatever syntax allows specification of tags within pip):

```
pip==1.3.1[manylinux1,cp36,x86_64]
```

Allowing a pip user to specify tags is significantly more lightweight than downloading a docker image and building a build process that involves an entire docker container, just to download manylinux1 dependencies without ciphoning in manylinux2010 or manylinux2014 dependencies.

## Other References

[What Are Python Wheels and Why Should You Care?](https://realpython.com/python-wheels/#building-a-pure-python-wheel)

[The challenges in designing a library for PEP 425](https://snarky.ca/the-challenges-in-designing-a-library-for-pep-425/)

[Meaning of `m` in `cp39m`](https://docs.python.org/2.3/whatsnew/section-pymalloc.html)

[Stackoverflow: Python wheel force ABI to "none"](https://stackoverflow.com/questions/36020189/python-wheel-force-abi-to-none)

[Stackoverflow: How to force a python wheel to be platform specific when building it?](https://stackoverflow.com/questions/45150304/how-to-force-a-python-wheel-to-be-platform-specific-when-building-it)

[Github Request: pip should support custom wheel platform tags](https://github.com/pypa/pip/issues/2875)

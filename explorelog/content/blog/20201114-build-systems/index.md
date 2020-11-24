---
title: "Build Systems for Embedded Development: From 30000 feet."
date: "2020-11-14T12:00:00.000Z"
description: |
  High level thoughts on build systems for doing bare metal embedded development.
---

## Overview

I've been developing software for over 20 years. In that time I've used make more than any other build system tool. It is the grand ol' build system that many developers find themselves cursing, regardless of the fact that OSS has been riding make for much of its existance. Over the past 10 years, I've also used variants of Autotools, SCons, CMake, and other custom solutions. I've even, twice, rolled my own build systems (and not just wrappers around make or scons).

With my current efforts in creating educational material on bare metal development I've been thinking that perhaps make as the primary tool for managing build dependencies isn't the best way to spend the student's time. Using make from scratch has the advantage of teaching the students about how make works and its syntax. After all, we are here to get under the hood and see how everything works. But what if we're not just here to play, what if there is a legitimate reason to develop some bare metal peice of code, what if instead of doing everything bare minimum, we need to focus on teaching folks to work in a more sustainable and reusable environment to further enhance their learning experience. That is what I am attempting to do with a more modern build system selection. i.e. Learn the fundamentals of bare metal development in the _evolving world_ of software engineering. If this means throwing hand crafted Makefiles out with the bath water, than so be it.... but in reality it isn't that way.

# Viable Options

## Ninja

Ninja is a pared down version of make but with a bit more intelligence built into its dependency input/output management. One design principle of ninja was to have a stronger dependency on external tools to develop its input files. Another way to think of this is that ninja aims to be the assembly code of build systems that are more approachable with a higher level build system language like CMake script or Google's `GN` meta build system. The best known project that uses Ninja would be Chrome, which is managed with GN.

I think that ninja is a great solution and something to consider for development workflows, but I don't ever want to have to think about ninja syntax or have to troubleshoot ninja syntax. At this point, I'd rather have to delve back into `make` land for low level build system debugging than learn an entirely new syntax that wasn't design for human consumption to begin with. (Luckily CMake allows this switching to be painlessly easy.)

I've found that I generally always develop tight make loops when working on a specific peice of code and commonly perform fresh builds of complete systems for integration tests. With these cases covering the 99% of my development cases, I really don't see a _strong_ need for ninja in most isolated cases. Where ninja really shines is in its modern parallelization of builds over many files. Smaller project won't notice a difference over make, but in larger projects, I've seen ninja save tens of minutes _per run_.

## Autotools

Autotools is the suite of GNU tools that provide a meta-build system on top of make. It includes the amazing autoconf that is capable of detecting the current system's capabilities in the most portable way imaginable (generally on \*nix systems). Autoconf coupled with automake and libtool allows your build system to automatically determine if it can be built on the local system and automatically generate a make file to match the given state of the user's machine and input preferences of the user.

One thing that many who have used Autotools before agrees on is that the learning curve is simply too high and the sustainability through generations of developers is just not there.

The reason you'd want to use something like autotools over the other options is for its powerful autoconf tool and its extreme portability across \*nix systems. It isn't just portable because its been around forever. It was orginally designed to be portable back when it was first conceived, which IIRC is why they picked an obsure language like m4 to develop it in ... m4 was everywhere.

Autotools also has the trait of shifting a lot of burden onto the maintainer of the code. The typical user that builds the code only for use simply has to run something like:

```
./configure && make install
```

This really goes along with Richard Stallman's philosophy of free software as well. He believes that all software source code should be made available to the user (e.g. for DIY repairs, analysis, and what not). By creating a way for all users of software to build source code, this makes this philosophy a bit more tenable.

From an OO perspective, autotools is a suite of tools that more or less follow the principle of single responsibility (i.e. they do one thing and they do that thing well). The tools listed below attempt to compile many different features into a cohesive tool. This can make them feel bloated and over engineered for more simple tasks. That said, because of the nature of autotools, we can sometimes harvest its tools for use in more modern build systems. For example, you can still use something like autoconf (in scons and cmake) to generate `config.h` files for your code's consumption.

## SCons

SCons describes itself as ...

> SCons is an Open Source software construction tool—that is, a next-generation
> build tool. Think of SCons as an improved, cross-platform substitute for the
> classic Make utility with integrated functionality similar to autoconf/automake
> and compiler caches such as ccache. In short, SCons is an easier, more reliable
> and faster way to build software.

Although 14 years old at the time of this writing, I recently read an article about [KDE's transition from autotools to CMake](https://lwn.net/Articles/188693/). The point that I am attempting to make from the article is that even though the KDE developers had a lot of excitment for SCons, due to the shear size and diversity of the project they ultimately decided that SCons wasn't a good solution. Several reasons were mentioned, but the ones that stand out to me were related to fragility and reliability of maintaining the flexibility provided by the build system.

On the flip side, as a game developer I am in love with Godot. Godot is currently built with SCons and they love it. I've found SCons to work well with their environment, but perhaps the simple fact that Godot is a dynamic tool for building software and is a much smaller code base has had an influence on their decision.

From the Godot documentation:

> Developers often need to compile for several of the platforms at the same
> time, or even different targets of the same platform. They can't afford
> reconfiguring and rebuilding the project each time. SCons can do this with
> no sweat, without breaking the builds.

These are only two testimonials for and against SCons amongst many on the internet, but I personally am thinking that CMake has a bit of a leg up on SCons from several perspectives. Obviously with SCons being implemented by one of the most popular programming languages in 2020 (i.e. Python) you can make it do what ever you want, but at what cost to maintenance, sustainability, and reliability? In conclusion, SCons is clearly an improvement above and beyond Autotools but when you compare SCons to CMake, the pros and cons get more murky and devolve into individual preference.

Observed Pros:

- Scons builds are relative to SConscript files. This may have the effect of being more usable in containers.

## CMake

CMake describes itself as ...

> CMake is an open-source, cross-platform family of tools designed to build,
> test and package software. CMake is used to control the software compilation
> process using simple platform and compiler independent configuration files,
> and generate native makefiles and workspaces that can be used in the compiler
> environment of your choice.

CMake is best known as a meta-build system. Like autotools, CMake takes in configuration and generates other build system configuration to perform the _actual_ build of the code. Unlike autotools, CMake has been developed to generate build system configuration files for not just make but also Visual Studio, XCode, ninja, and a number of other platforms.

CMake feels to me like an easier product to transition into. Because of its vast community (not unlike the others) and its ability to target outputs that match existing build systems (e.g. make, ninja, msbuild, xcode), you can envision a transition strategy towards CMake and away from CMake with ease. This seems like a major advantage over all the other build systems that I've used in the past. Assuming one were to become aquainted with CMake such that they can spin up a build environment to build a simple project like a bare metal project with the same effort as make, why not perform that with CMake, knowing that you have a sustainable package management system, and the ability to pivot to whatever platform you want.

## Conan

Although not a build system, Conan is a worth while mention. Instead of focusing on building software, Conan focuses on packaging software and their build environments. More similar to RPM's and the RPM's source package build system, Conan provides a repository of images but each package image is specific to the build options provided during its build. This is a fantastic solution for shops that perform embedded systems development or AOT compilation that want a solution for vetting well known and tested binaries. Additional benefits from using a system like this are for source reuse and binary reuse across checkout and build options, optimizing storage resources and build time efficiency.

`vcpkg` is another C/C++ package management system I aware of, but I've never used it.

## Conclusion

The conclusion I'm attempting to come to is that SCons and CMake are both good solutions for bare metal training. But because of the nature of how CMake is built to be used from many different types of environments and IDEs, it may be a more ideal approach for embedded systems development. For decades, hardware development seems to have favored Windows for many shops and tools. This means that sometimes its just more convienent to not be on a purely \*nix system. CMake eliminates the decision process here by provided a (mostly) platform independent way of describing our projects that are translated into the tools we intend to use.

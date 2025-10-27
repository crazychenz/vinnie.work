---
sidebar_position: 1
sidebar_label: Purpose (WIP)
---

<!-- pagebreak -->

# Purpose

:::warning

Work In Progress - Initial Rough Draft

:::

It is not (solely) my intention to provide yet another introduction to Android debugging and reverse engineering with this material. The real purpose of this material is to provide a context to the development of a new debugging framework that I've been developing. 

In short, my desire is to have a debugger experience where I can hook into bytecode and native (from the same tool or REPL), break/step/continue any place in that code, watch variable/register changes, and change those same variable/register states in between steps. This flexible and powerful capability has always existed for x86 and ARM debuggers, why not Java or Dalvik debuggers? _This is the gap._

From the back row:

- But what about the Android Debug Bridge (`adb`)?
- But what about Android Studio's debug interface?

To be clear, many _forward_ developers have these sort of capabilities built into their corporate tools (e.g. Android Studio), but I'm speaking from a _reverse_ engineer's perspective where I have no source code, I have no build system, and therefore require significantly more cleverness in inference and access to my target _binary_ under test.

The debugger work that I've been developing, attempts to fill the gap (above) that I was _very_ surprised still existed. It would appear that many of the developers and engineers that work in this space either suffer the fact that a more enriched experience does not exist, or know something that I don't know. Either way, I've asked and consistently found that there is nothing to replace what I've been working on.

More comments from commentators:

- But what about `jdb`?
- But what about `frida`?
- But what about `jadx`?
- But what about `Ghidra`?
- But what about `AOSP`?

And here is where we get to the **purpose** of this document. While I do intend for the material to be multi-purpose, the heart of this document is to layout a journey (not unlike my own) that you, the reader, can experience to understand the value of a new debugger experience for Android applications.

In summary, if you are an expert on all things Android and have no interest in seeing yet another overview on all the current ways to do Android analysis, please feel free to skip to the section on JvmDebugging. Note: There are some presumed dependencies in the section on "Setting Up ADB Environment" that you should also be cognizant of.

## Overview

The approach to this material is a top down approach, or what I like to refer to as a glass down approach. Let me explain. 

We, as humans, usually are taking in the output of the device through a piece of glass via a screen or monitor and therefore its the top most layer of the system. From there we can delve into (from top to bottom):

- Attributes of an application
- Attributes of the device
- Internals of the application
- Internals of the system
- The operating system internals
- The firmware

The key take away with a top down approach to analysis is that you can start at the point where you care (as an end user) and go as deep as required, then **stop**. You should not need to understand how to build a phone from the bottom up (writing an operating system, developing an Android application from scratch) to start doing analysis or understand some small facet of the _thing_.

## Prerequisites

The following material is (IMHO) an advanced topic. I will attempt to describe my thought process as I write, but I will also attempt to keep the material dense and information rich. My hope is that densely written information can be referred to as many times as needed but not require a reader to scan through unnecessary fluff. There is an expectation that the reader understand an unreasonable amount of base knowledge across a wide range of skill sets and technologies. I accept that everyone has different levels of skills in different areas, but that does not mean we need to level set on every piece of material. Instead, I encourage readers to break and familiarize themselves with any topics they find unclear or unfamiliar with via the search engine of choice or a preferred large language model. I don't intend for the material to be fully [grok](https://www.merriam-webster.com/dictionary/grok)-ed, but instead used as a rough outline for how to approach a problem (or question) and a future reference for future **me** when I've flushed all of this knowledge from my head by moving on to other things.

Note: For all specific procedures:

- Assume a 64bit x86-ish (amd64/x86_64/x64) Linux based system running on bare metal (no VMs, but maybe containers) and no hypervisors other than KVM (no VMWare, no VirtualBox).

- I use Debian 12 and Debian 13 as my base Linux OSes, so procedures may reflect constraints and assumptions based on those distributions.

- General understanding of `bash` usage and syntax.

- General understanding of how to read and run Java code. 

- General understanding of GNU toolchain (gcc, g++, ld, gdb) concepts.

- General understanding of the Linux kernel "syscall" interface.

- General understanding of Linux networking concepts.
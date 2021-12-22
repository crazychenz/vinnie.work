---
sidebar_position: 2
title: 🐱‍🏍 MCU Architectures 🦸
---

:::danger Incomplete

This document is not yet written.

:::

## Overview

There are quite a few micro controller unit (MCU) architectures in the wild. To name a few, we've got:

- MIPS - Used by (Original) Playstation, N64, Tesla Model S, PIC32, IoT. Licensed by MIPS Technologies.
- ARM - Used by Android, Apple, RaspberryPi, IoT. Licensed by ARM Holdings.
- PowerPC - Used by IBM, Apple. OpenSourced in 2019.
- AVR - Used by hobbyist (e.g. Arduino). Licensed by Microchip.

Its critical to know the architecture of your target device before anything else. This will determine what toolchains you'll need, what instruction sets you'll be looking at, and what the boot code will look like. This section gives some advice on the various architectures and the implementations or nomenclature of those architectures.

## ARM

### ARM Versions

ARM versions are crazy. You must pay very close attention to the context of an ARM version or you may find yourself in an ambiguous cloud of confusion. Let me start from the beginning.

Without going into the history, there are 3 major labels for all ARM processors:

- **Core** - The ARM core is defined by the register transfer level (RTL), a syntax that specifies the CPU core in source code. This source code is also referred to as a hardware description language. The definition of a core is the most physically specific label.
- **Architecture** - The ARM architecture is the instruction set and set of conventions that the core implements. The definition of an architecture is usually specific enough for software execute-ability.
- **Family** - The ARM family is a rough approximation of the generational relationship between the various architectures and cores. This is really only useful for casual conversation.

In example, you could have core `ARM926EJ-S`, architecture `ARMv5TE`, and family `ARM9E`.

I've often seen folks refer to a target device as having something simple like an `ARM9`. **This means nothing!** There is no such thing as an `ARM9`. In fact, the `ARM9T` family is based on the `ARMv4T` architecture. Therefore you could say `ARM9` and it be ambiguously interpreted as no less than 2 families, 4 architectures, and 9 cores.

### ARM Extensions Symbols

- `T` - Thumb instruction set.
- `D` - JTAG DEBUG Support
- `M` - Improved Multiplier
- `I` - Embedded ICE debug module.
- `E` - Digital Signals Processing (DSP) (implies TDMI).
- `J` - Jazelle Java Bytecode Execution

### ARM Profile Suffixes

- `-M` - Micro Controller
- `-R` - Real Time
- `-A` - Application

<!-- TODO: Consider an ARM version table. -->

<!-- ## Common 32bit ARM (~ARMv4 thru ~ARMv6)

What I'm referring to as _common_ 32bit ARM is a set of conventions and instructions that you'll see used by in many 32bit based ARMs. When you get to specific edges that involve debug registers, special exceptions, or any other core/arch specific feature set, you should reference the ARM documentation. ARM provides extensive documentation on all of their architectures at [developer.arm.com](https://developer.arm.com). For core specific features, you can checkout the relevant vendor's datasheets or checkout [WikiChip](https://en.wikichip.org/).

Note: Once you get into ARMv7a/ARMv8 and later you'll find more complex and modern architectures that should not be considered backward compatible with the older ARM generations. -->

## MIPS

Similar to ARM, MIPS is also a load/store RISC based instruction set. MIPS has been around since 1985. Since the introduction of MIPS, there have been many vendors that have licensed and extended the technology for their specific use cases. Older MIPS architecture versions were noted with roman numerals (i.e. I, II, III, IV, and V).

- MIPS I and II were 32 bits and focused on embedded systems and servers.
- MIPS III was one of the first commercially available 64 bit architectures. Was used by Nintendo 64, and the original Playstation.
- MIPS IV provided performance and very large floating point math needed by supercomputers and compute demanding workstations of the day. Was used by SGI (used by folks like Pixar), Playstation 2.
- MIPS V - Went the way of Half-life 3 and never happened.

Up until MIPS V, each version was a superset of its predecessor. Following MIPS V, this strict backward compatibility model was deliberately broken. To fix some of the issues that had crept in over the evolution of the architecture, MIPS removed/replaced some parts of the architecture with the MIPS32/64 line of architectures.

- MIPS64 Release 1 - Used many of the advances made in MIPS V. Used by Broadcom, Philips, LSI, and Cavium.
- MIPS32 Release 1 - Based on MIPS II with some MIPS III, IV, and V mixed in.
- MIPS32/64 Release 4 - Never happened, 4 is unlucky in Asia.
- MIPS32/64 Release 6 - Circa 2014 and the last official MIPS update.

In 2019, MIPS was momentarily open sourced in public domain, but has sense lacked any additional support. There still exist licenses that evolve the architecture for individual CPU implementations, but the future of MIPS seems to have faded with the advent of RISC-V.

**Tip:** If you're confused about MIPS compilations for an unknown platform, chances are you can get code running if you build for MIPS II with soft float support. MIPS II has the most restricted commonly provided architecture and should work with nearly all later MIPS architectures.

## RISC-V

RISC-V is the new architecture on the block. RISC-V is an open source (or open standard) instruction set. This open standard will allow vendors to adopt its advancements without having to license the technology from companies like ARM Holdings or MIPS.

We'll have to wait to see if the RISC-V bears impactful fruit. At the moment

- Google's Pixel 6 has RISC-V integrated into its security hardware.
- Nvidia intends to integrate RISC-V into their GeForce platform.
- Linux has supported RISC-V since late 2016.
- GNU Toolchains added RISC-V support in May 2017.
- LLVM has had RISC-V support since version 9, released Sept 2019.

Whether you are aware or not, _RISC-V is coming_. 👑🗡️💺

## Other Notable Mentions

- Intel 8051
- Intel x86
- IBM PowerPC
- Atmel AVR
- Sun Microsystems SPARC
- Tilera TILE-Gx
- Motorola 68000
- Microchip PIC

## Resources

https://en.wikichip.org/wiki/arm_holdings/microarchitectures/arm6

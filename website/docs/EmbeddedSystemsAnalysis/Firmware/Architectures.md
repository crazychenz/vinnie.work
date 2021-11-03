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

- **Core** - The ARM core is the register transfer level (RTL) that defines the CPU core in source code. This source code is also referred to as a hardware description language. The definition of a core is the most physically specific label.
- **Architecture** - The ARM architecture is the instruction set and set of conventions that the core implements. The definition of an architecture is usually specific enough for software execute-ability.
- **Family** - The ARM family is a rough approximation of the generational relationship between the various architectures and cores. This is really only useful for casual conversation.

In example, you could have core `ARM926EJ-S`, architecture `ARMv5TE`, and family `ARM9E`.

I've often seen folks refer to a target device as having something simple like an `ARM9`. This means nothing! There is no such thing as an `ARM9`. In fact, the `ARM9T` family is based on the `ARMv4T` architecture. Therefore you could say `ARM9` and it be ambiguously interpreted as no less than 2 families, 4 architectures, and 9 cores.

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

## Resources

https://en.wikichip.org/wiki/arm_holdings/microarchitectures/arm6

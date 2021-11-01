---
sidebar_position: 5
title: Digital Logic
---

:::danger Incomplete

This document is not yet written.

:::

```text
  - Logical Components (30mins)
    - Schematic symbols
    - truth tables
    - (Combinatorial / Sequential)
    - (state machines?)
  - Bus Concept - Schematic Expression, Serial v Parallel (60 mins)
    - I2C Bus - Clocks
    - Intro to Logic Analyzer (v OScope) (15mins)
  - Datasheets
    - Block diagrams (for architecture) (15mins)
```


<!-- ! Everything below is scratch and should be re-thought. -->

## Digital Logic

Yada yada yada - We could talk truth tables and states and laws of X, but really we need to know logic symbols, how they work and how to interpret them from datahseet diagrams.


## Flip Flops

- What is a flip flop? Component that stores a bit. (Comment on difference between a latch and a flip flop?)

- Active high vs active low

- Level triggered vs edge triggered (page 34)

## Clock

discrete steps of time (not wall clock!)

there can be multiple clocks in a single system, labeled clock domains

## RAM  / Memory

- A RAM cell will produce data when asked, and only when asked.

- DRAM - (leaks) Grid of capacitors that require periodic recharging. Smaller footprint but lots of control logic.
- SRAM - (stable) Grid of flip flops. No recharge but uses more transitors and has larger footprint.

### Addressing Memory (page 37-38)

- Show demux with chip select, row and column.

## Logic Types

Combinatorial Logic - All in parallel, no sense of time.
Sequential Logic - Processed based on state and time. State means the system "remembers" something.


## Concept Of A Bus

- Serial vs Parallel

- Peripheral Bus - CPU to peripherals.
- System Bus - CPU to memory.
- Local Bus - Peripherals connected to memory.

- Expressing Bus Expansion (page 29)

- Identify components with bus connections from picture (front and back?)

## Block Diagrams



## State Machines

<!-- TODO: Cover state machines with JTAG. -->

Designing software as a state machine?

## Design Memory Architecture

Boot code
Main executable
File Storage
Working Memory

### Properties
Depth - number of storage locations
Width - size of each storage location = number of data lines out
N = number of address lines = Depth = 2^N where N = log2(depth)

Example:

Depth = 1024
N = log2(1024) = 10
Width = 8
Size = 1024 x 8 = 8192 bits = 1024 bytes = 1kB

### Pin Outs

ROM:

A0 - A9 - Address lines
D0 - D7 - Data lines
CS - Chip Select
OE - Output Enable

RAM:

A0-A9
D0-D7
CS - Chip select
R/W~ - Read / Write

### Memory Mapping

Decoder Circuitry (MMU)

Memory Mapping (page 47)

Memory Ghosting


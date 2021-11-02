---
sidebar_position: 7
title: Memories
---

:::danger Incomplete

This document is not yet written.

:::

```text
  - Memories (45mins)
    - Volatile
      - Flip flops (transistors) / Latches (caps)
      - DRAM, SRAM, ??SDRAM ... other memories? DDR?
    - Nonvolatile
      - ROM, PROM, EPROM, EEPROM
      - Flash, NVRAM
    - Addressing Breakdown - chip select, rows/depth, columns/width
    - Calculating Memory Layouts
    - SPI (60mins)
      - In Circuit Analysis / Extraction  
```

## Flip Flops

- What is a flip flop? Component that stores a bit. (Comment on difference between a latch and a flip flop?)

## RAM  / Memory

- A RAM cell will produce data when asked, and only when asked.

- DRAM - (leaks) Grid of capacitors that require periodic recharging. Smaller footprint but lots of control logic.
- SRAM - (stable) Grid of flip flops. No recharge but uses more transitors and has larger footprint.

### Addressing Memory (page 37-38)

- Show demux with chip select, row and column.

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
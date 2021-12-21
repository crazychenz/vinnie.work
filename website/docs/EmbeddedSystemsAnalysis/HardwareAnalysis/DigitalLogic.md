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

## Introduction

Digital logic is a level of abstraction above the analog circuitry that make up the circuit. When describing memories in a previous section, we introduced the concept of a multiplexer:

![multiplexer symbol](./DigitalLogic/multiplexer.png)

Inside that yellow trapezoid is a series of gates that allow either signal `A` or `B` to pass through to `Z` depending on the value of `S0`. Keep in mind, the above multiplexer is about as simple as they come, the multiplexer can be implemented to accept as many input signals, output signals, or control/select signals as the application requires. The key take away is that when we see a trapezoid in your diagrams, its a multiplexer and you should be able to identify its inputs (long side), its outputs (short side) and its control signals (slanted side, usually top side).

## Bus Indicators

When communicating over serial, we have many single bits transmitted all in turn over the same transmission wire. When communicating in parallel, we're putting each bit of a value on an array of wires at the same time. This means that for a 32bit machine, we could have 32 wires going into a component (e.g. multiplexer). To prevent from making such a schematic diagram unreadable we often simplify the schematic with bus notation. Here are some examples:

![bus notation](./DigitalLogic/busnotation.png)

<!-- TODO: Discuss uses of a bus. -->

### Common Bus Use Cases

- Peripheral Bus - CPU to peripherals.
- System Bus - CPU to memory.
- Local Bus - Peripherals connected to memory.

<!-- TODO: As an exercise, identify some of the buses on a board from visual inspection. -->

https://en.wikipedia.org/wiki/Multiplexer

## Datasheets

When studying datasheets to understand digital logic, there are often entire logical schematics that describe the actual design of the digital logic of the circuits. In a previous section, we looked at the SN54LS164 Serial To Parallel Converter. Its digital logic schematic was:

![picture of logic schematic for sn54ls164](./DigitalLogic/sn54ls164-digital-logic-horiz.png)

## Digital Logic Primer

Digital logic schematics are developed from a collection of symbols that represent one or some combination of boolean logic. Here are some common examples:

![logic symbols](./PracticalEE/logical-511x195.png)

So for example, if you wanted a signal to perform `(A and B) or C`, you may do something like:

![A And B or C](./DigitalLogic/AAndBOrC.png)

In contrast to _software_, you must **not** think of each of these operations as being broken down into sequential steps. They are _combinatorial_, meaning that all of the boolean logic is performed instantaneously.

In Summary:

- Combinatorial Logic - All operations are performed in parallel, no sense of time.
- Sequential Logic - Processed based on state and time. State means the system "remembers" something.

When a small bubble is placed in front of one of the symbols, the result becomes inverted. For example, you can do something like `~(A and B) or C` with:

![Not A And B or C](./DigitalLogic/NotAAndBOrC.png)

### Truth Tables

To table out the input and outputs of a logic diagram, you can use a truth table. The following truth table represents our `~(A and B) or C` diagram.

| Expression      |   |   |   |   |   |   |   |   |
|----------------:|---|---|---|---|---|---|---|---|
| A               | F | F | F | F | T | T | T | T |
| B               | F | F | T | T | F | F | T | T |
| C               | F | T | F | T | F | T | F | T |
| ~(A and B) or C | T | T | F | F | F | F | F | F |

Note: An issue with using truth tables for everything is that they can very quickly become exponentially large.

### LAB: More Ways Than One

One nice thing about boolean logic is that you can refactor the equations so that they become more efficient. You can also refactor to get the same output with completely different operators. For example, you can replace an AND gate with two NAND gates.

An interesting property of boolean logic is DeMorgan's Law:

```text
a' or b' = (a and b)'
a' and b' = (a or b)'
```

As an exercise:

- Make an AND with a NAND. Answer: `(ab)''`
- Make an OR gate from a NAND. Answer: `((aa)'(bb)')'`
- Make an AND with a NOR. Answer: `(a+a)'+(b+b)')'`
- Make an OR with a NOR. Answer: `(a+b)''`
- Make an XOR with AND/OR/NOT, then convert all to NAND gates. Answer: `((a'b)'(ab')')'`

<!-- TODO: Mention that there can be more than two inputs per gate. -->

## Registers, Flip Flops, Latches

As mentioned in the Memories section, registers are a very small type of memory that plays a critical role in a CPU architecture. While many NN-bit (e.g. 8, 16, 32, 64) architectures have a set of registers, some components have registers that are a single bit. Registers are basically an array of these single bit storage bins. **Registers may be implemented as flip flops or latches.**

Flip-flops and latches both store a bit of information, but the key difference between the two is that flip flops are edge triggered (synchronous) and latches are level triggered (asynchronous). What we mean by this is that flip flops will only change its state when a clock edge is detected whereas a latch is continuously updating its state based on its input. While latches can be used, flip-flops are generally preferred for sequential circuits.

Here is a simple visualization that shows the difference between a latch and a flip flop:

![flipflop vs latch](./Memory/flipflop-latch.png)
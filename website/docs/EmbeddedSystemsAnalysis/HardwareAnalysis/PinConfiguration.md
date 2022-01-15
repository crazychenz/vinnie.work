---
sidebar_position: 5.1
title: "📍 LAB: Pin Configuration"
---

:::danger Incomplete

This document is not yet written.

:::

Triple Register Format
SR - Status Register (Read)
ER - Enable Register (Set)
DR - Disable Register (Clear)

Why is this better? No read/update/write cycle.

Know the difference in R0-R16 registers vs memory mapped registers.

What happens when you read a write only register?

<details><summary>Atmel Pin Configuration Exercise</summary>

Configure I/O lines 0-3 to have:

- 4 bit output port on I/O lines 0 to 3
- open drain
- pullup resistor

Configure IO lines 4-7 to have:

- Output signals
- driven high or low
- no pull up resistor

Configure IO lines 8-11 to have:

- input signals
- pullup resistor
- glitch filters
- input change interrupts

Configure IO lines 12-15 to have:

- input signals
- no input change interrupt
- no pull-up resistor
- no glitch filters

Configure IO lines 16-19 to have:

- peripheral a
- pull up resistor

Configure IO lines 20-23 to have:

- peripheral b
- no pull up resistor

Configure IO lines 24-27 to have:

- peripheral a
- input change interrupt
- pull-up resistor

</details>

<!-- TODO: Consider AIC datasheet exercise. -->

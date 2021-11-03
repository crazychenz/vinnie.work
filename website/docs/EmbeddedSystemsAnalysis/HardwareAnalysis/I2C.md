---
sidebar_position: 6
title: 'I2C: Inter-Integrated Circuit'
---

:::danger Incomplete

This document is not yet written.

:::

`dtparam=i2c_arm_baudrate=400000`

`99-i2c.rules`
`/etc/udev/rules.d`
`SUBSYSTEM=="i2c-dev", MODE="0666"`

I2C:

TWI is the same thing.
SMBus is a stricter subset used in PCs: Power management, fan control, sensing battery level, and so forth.
Multi-master serial bus: one or more ~~master~~controller devices, one or more ~~slave~~peripheral devices.
7-bit address space (112 node limit), 16 reserved addresses (10bit address space (1008 node limit) exist too)
arbitrary bus speeds (0hz to 5Mhz), common speeds: 10Kbps, 100Kbps, 400Kbps.
Practical distances of a few meters.
Bi-directional, open drain bus. - requires external pull-up resistors.
Two wires, SCL (clock) and SDA (data)

<!-- TODO: Draw Picture -->

Controller always controls SCL.
Start Condition - SDA falls while SCL is high.
Stop Condition - SDA rises while SCL is high.
Between Start and Stop, the bus is Busy.
SDA Bits are sampled when SCL is high.

First 9 bits are peripheral address + R/W bit + ACK bit.
Next 9 bits are data + ACK bit. Repeat until STOP condition.

## Resources

https://github.com/fivdi/i2c-bus/blob/master/doc/raspberry-pi-i2c.md

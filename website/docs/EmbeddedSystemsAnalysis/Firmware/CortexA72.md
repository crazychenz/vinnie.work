---
sidebar_position: 2.1
title: 💪 ARM Cortex-A72
---

:::danger Incomplete

This document is not yet written.

:::

## Overview

The RaspberryPi 4's primary MCU is the Broadcom BCM2711. The BCM2711 has a ARM Cortex-A72 core and is based on the ARMv8a architecture. The Cortex-A72 is a 64 bit architecture. The 64bit ARM instruction set is referred to in different ways including: `aarch64`, `a64`, `arm64`.

Some obligatory properties:

- The reference manual is 5158 pages. (Yes, five thousand one hundred fifty eight.)
- 2 instruction states: Aarch64 and Aarch32
  - See the reference manual for Aarch32 details. This material focuses on Aarch64.
  - Within Aarch64, only A64 instruction mode.
  - Note: **All** instructions are 32 bits.
- Bi-endian (i.e. can run big endian or little endian).
- Supports 8, 16, 32, 64, 128 data types.
- Pipelined.
- Exception Model

- 7 execution modes (i.e. USR, FIQ, IRQ, SVC, ABT, SYS, UND)

<!-- page 59 -->

- X0-X29 - 64 bit general purpose.
  - X0 - X7 - Parameters/Result
  - X8 - XR - Indirect result register (i.e. used to pass memory pointer allocated by caller.)
  - X16/X17 - IP0/IP1 - Used by linkers for branch extensions.
  - X18 - PR - Platform Register
  - X29 - Frame Pointer (FP)
  - X30 - Link Register (LR).
- W0-W30 - 32 bit general purpose access of X0-X30.
- PC - 64 bit program counter.
- SP - 64 bit stack pointer.
- NZCV - Condition Flags
- Floating Point support is required in ARMv8a
  - V0-V31 - 128 bit FP/vector registers.
  - Q0-Q31/D0-D31/S0-S31/H0-H31/B0-B31 - Variant width access of V0-V31 data, respectively 128, 64, 32, 16, and 8 bits.
  - FPCR - Floating Point Control Register
  - FPSR - Floating Point Status Register
- TPIDR_EL0 (i.e. X28) - Register used for thread local storage point (TLS) in Linux.
- Many other _system registers_. System registers end with `_ELx` where `x` is 0 - 3.
- ZXR => returns 0 (i.e. /dev/zero)
- WZR => ignores input (i.e. /dev/null)

- Exception Level Model
  - EL stands for Exception Level
    - User (EL0) -> SVC to call kernel (EL1).
    - Kernel -> HVC to call hypervisor (EL2).
    - Hypervisor -> SMC to call _secure_ state (EL3).
  - Each EL has its own SP, LR, SPSR.
  - Exception process:
    1. save state into SPSR
    2. set the link register ELR_ELx
    3. PSTATE.{D, A, I, F} is set to 1
    4. synchronous exceptions set reason in ESR_ELx
    5. execution moves to ELx
  - Exception Vector Table
    - EL1-3 gets its own. The base addresses of which are VBAR_ELx.
    - Each entry is 16 instructions long (i.e. 4 \* 32 = 128 bytes)
    - Table must be 2KiB aligned

Exceptions:

- Synchronous
- IRQ
  FIQ
  SError
  Synchronous

Exception Vector Code:

```asm
// Typical exception vector table code.
.balign 0x800
Vector_table_el3:
curr_el_sp0_sync:        // The exception handler for a synchronous
                         // exception from the current EL using SP0.
.balign 0x80
curr_el_sp0_irq:         // The exception handler for an IRQ exception
                         // from the current EL using SP0.
.balign 0x80
curr_el_sp0_fiq:         // The exception handler for an FIQ exception
                         // from the current EL using SP0.
.balign 0x80
curr_el_sp0_serror:      // The exception handler for a System Error
                         // exception from the current EL using SP0.
.balign 0x80
curr_el_spx_sync:        // The exception handler for a synchrous
                         // exception from the current EL using the
                         // current SP.
.balign 0x80
curr_el_spx_irq:         // The exception handler for an IRQ exception from
                         // the current EL using the current SP.

.balign 0x80
curr_el_spx_fiq:         // The exception handler for an FIQ from
                         // the current EL using the current SP.

.balign 0x80
curr_el_spx_serror:      // The exception handler for a System Error
                         // exception from the current EL using the
                         // current SP.

 .balign 0x80
lower_el_aarch64_sync:   // The exception handler for a synchronous
                         // exception from a lower EL (AArch64).

.balign 0x80
lower_el_aarch64_irq:    // The exception handler for an IRQ from a lower EL
                         // (AArch64).

.balign 0x80
lower_el_aarch64_fiq:    // The exception handler for an FIQ from a lower EL
                         // (AArch64).

.balign 0x80
lower_el_aarch64_serror: // The exception handler for a System Error
                         // exception from a lower EL(AArch64).

.balign 0x80
lower_el_aarch32_sync:   // The exception handler for a synchronous
                         // exception from a lower EL(AArch32).
.balign 0x80
lower_el_aarch32_irq:    // The exception handler for an IRQ exception
                         // from a lower EL (AArch32).
.balign 0x80
lower_el_aarch32_fiq:    // The exception handler for an FIQ exception from
                         // a lower EL (AArch32).
.balign 0x80
lower_el_aarch32_serror: // The exception handler for a System Error
                         // exception from a lower EL(AArch32).
```

- Reset vector is no longer part of the exception vector table. The reset address is _implementation defined_ and defined by the hardware input RVBARADDR and can be read by RVBAR_EL3 register. Boot code is executed from this address.

- Instructions are word aligned.
- A64 instructions are always little endian.
- Direct Branching can travel +- 128MiB
- a64 adds on page 402

LDP/STP

- [ARMv8 exception vectors and handling](https://stackoverflow.com/questions/44991264/armv8-exception-vectors-and-handling)
- [AArch64 Interrupt and Exception handling](https://krinkinmu.github.io/2021/01/10/aarch64-interrupt-handling.html)
- https://dynamorio.org/page_aarch64_far.html

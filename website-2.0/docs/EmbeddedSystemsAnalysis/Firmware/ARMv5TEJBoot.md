## AT91SAM9260/AT91SAM9G20 Boot Up Process

The MCU boot process first checks the values of REMAP pin and BMS pin. If REMAP=1, SRAM is mapped into address 0x0. If REMAP=1 and BMS=0, the MCU maps external memory that is connected to the EBI_NCS0 interface. If REMAP=1 and BMS=1, the MCU uses the boot code in the ROM to load the system. This can result in the system being loaded from a SPI interface or the special Atmel SAM-BA interface.

## ARMv5TEJ Boot Up Process

Regardless of the micro controller state, eventually its boot up process leads to the ARM926EJ-S power on reset (PoR) state. In this state the ARM core reads the memory mapped at address `0x0`. At this address is an ARM jump/branch instruction that is responsible for jumping/branching to the boot initialization code for the system.

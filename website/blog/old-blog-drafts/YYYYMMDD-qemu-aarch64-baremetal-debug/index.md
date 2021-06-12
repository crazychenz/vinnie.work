[//]: # (- ~~Get [Cortex-A Toolchain](https://developer.arm.com/tools-and-software/open-source-software/developer-tools/gnu-toolchain/gnu-a/downloads) _Free_ - Required to install GDB capable of understanding target architecture (aarch64). Also includes GNU toolchain for building bare metal applications.~~)
[//]: # (- Get [Buildroot](https://buildroot.org/download.html) _Free_ - Although using the ARM supplied toolchain sounds like a good idea, I found that they aren't completely self contained. In contrast, tool suites like OpenWRT, LEDE, and buildroot are completely self contained and can assist with building a kernel, userspace, and bootloader ... to boot!)

http://umanovskis.se/files/arm-baremetal-ebook.pdf

```sh
qemu-system-arm -M vexpress-a9 -m 32M -no-reboot -nographic -monitor
telnet:127.0.0.1:1234,server,nowait
```

```arm
ldr r2,str1
b .
str1: .word 0xDEADBEEF
```

```sh
arm-none-eabi-as -o startup.o startup.s
```

```sh
arm-none-eabi-ld -o first-hang.elf startup.o
```

```sh
arm-none-eabi-objcopy -O binary first-hang.elf first-hang.bin
```

```sh
qemu-system-arm -M vexpress-a9 -m 32M -no-reboot -nographic -monitor
telnet:127.0.0.1:1234,server,nowait -kernel first-hang.bin
```

From qemu monitor:

```
info registers
```

should return:

```
R00=00000000 R01=000008e0 R02=deadbeef R03=00000000
```

Create IVT: `startup.s`

```arm
.section .vector_table, "x"
.global _Reset
_Reset:
b Reset_Handler
b . /* 0x4 Undefined Instruction */
b . /* 0x8 Software Interrupt */
b . /* 0xC Prefetch Abort */
b . /* 0x10 Data Abort */
b . /* 0x14 Reserved */
b . /* 0x18 IRQ */
b . /* 0x1C FIQ */

.section .text
Reset_Handler:
ldr r2, str1
b .
str1: .word 0xDEADBEEF
```

Create linker script. `linkscript.ld`

```linker-script
ENTRY(_Reset)

SECTIONS
{
. = 0x0;
.text : { startup.o (.vector_table) *(.text) }
. = ALIGN(8);
}
```

Link it.

```sh
arm-none-eabi-as -o startup.o startup.s
arm-none-eabi-ld -T linkscript.ld -o better-hang.elf startup.o
arm-none-eabi-objcopy -O binary better-hang.elf better-hang.bin
```

## Setup C environment

```arm
/* Some defines */
.equ MODE_FIQ, 0x11
.equ MODE_IRQ, 0x12
.equ MODE_SVC, 0x13

.section .vector_table, "x"
.global _Reset
_Reset:
b Reset_Handler
b . /* 0x4 Undefined Instruction */
b . /* 0x8 Software Interrupt */
b . /* 0xC Prefetch Abort */
b . /* 0x10 Data Abort */
b . /* 0x14 Reserved */
b . /* 0x18 IRQ */
b . /* 0x1C FIQ */

.section .text

Reset_Handler:
/* FIQ stack */
msr cpsr_c, MODE_FIQ       /* Use fast interrupt mode. */
ldr r1, =_fiq_stack_start  /* optional (used for fill) */
ldr sp, =_fiq_stack_end    /* set the stack pointer */
movw r0, #0xFEFE /* these lines write 0xFEFEFEFE to R0 */
movt r0, #0xFEFE

fiq_loop: /* loop that fills stack with 0xFEFEFEFE */
cmp r1, sp
strlt r0, [r1], #4
blt fiq_loop

/* Start copying data */
ldr r0, =_text_end
ldr r1, =_data_start
ldr r2, =_data_end

data_loop:
cmp r1, r2
ldrlt r3, [r0], #4
strlt r3, [r1], #4
blt data_loop

/* Init BSS */
mov r0, #0
ldr r1, =_bss_start
ldr r2, =_bss_end

bss_loop:
cmp r1, r2
strlt r0, [r1], #4
blt bss_loop

/* Call entry point in C land.
bl main

/* When we get return from C, die.
b Abort_Exception

Abort_Exception:
swi 0xFF
```

```linker-script
ENTRY(_Reset)

SECTIONS
{
    .text : {
        startup.o (.vector_table)
        *(.text)
        *(.rodata)
    } > ROM
    _text_end = .;
    .data : AT(ADDR(.text) + SIZEOF(.text))
    {
        _data_start = .;
        *(.data)
        . = ALIGN(8);
        _data_end = .;
    } > RAM
    .bss : {
        _bss_start = .;
        *(.bss)
        . = ALIGN(8);
        _bss_end = .;
    } > RAM
}

MEMORY
{
  ROM (rx) : ORIGIN = 0x60000000, LENGTH = 1M
  RAM (rwx): ORIGIN = 0x70000000, LENGTH = 32M
}

```

Example source.c:

```c
#include <stdint.h>

volatile uint8_t* uart0 = (uint8_t*)0x10009000;

void write(const char* str)
{
    while (*str) {
        *uart0 = *str++;
    }
}

int main() {
    const char* s = "Hello world from bare-metal!\n";

    write(s);
    *uart0 = 'A';
    *uart0 = 'B';
    *uart0 = 'C';
    *uart0 = '\n';

    while (*s != '\0') {
        *uart0 = *s;
        s++;
    }
    while (1) {};

    return 0;
}
```

Building the C file:

```
arm-none-eabi-gcc -c -nostdlib -nostartfiles -lgcc -o cstart.o cstart.c
arm-none-eabi-ld -T linkscript.ld -o cenv.elf startup.o cstart.o
arm-none-eabi-objcopy -O binary cenv.elf cenv.bin
```

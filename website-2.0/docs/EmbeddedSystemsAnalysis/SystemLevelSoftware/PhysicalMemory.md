---
sidebar_position: 51
title: "Lab: Physical Memory"
---

:::danger Incomplete

This document is not yet written.

:::

## The Gist

### Preparation:

Either add `dtparam=act_led_trigger=none` to `/boot/config.txt` OR run `echo none > /sys/class/leds/led0/trigger` as root. We disable triggering so that the state of the pin doesn't change on us. The student can optionally sanity check their setup by having the kernel trigger the led on and off:

- Turn on with: `echo 1 > /sys/class/leds/led0/brightness` (as root).
- Turn off with: `echo 0 > /sys/class/leds/led0/brightness` (as root).

### Goal:

Access physical memory from user space with `/dev/mem` and `mmap()`. Given that this ACT led is running on GPIO Pin 47, use `/dev/mem` and `mmap()` to toggle the ACT led on and off.

The student should be able to locate the base address of the GPIO controller. They should additionally be able to locate and utilize the GPLEV1, GPSET1, and GPCLR1 registers.

#### Register Offsets

```text
PIN 47 Mask: 0x00000400
GPSET1 => 0x20 - Set the pin.
GPCLR1 => 0x2c - Clear the pin.
GPLEV1 => 0x38 - Get the pin level.
```

## Answer

```c
#include <stdio.h>
#include <stdint.h>
#include <stddef.h>
#include <stdlib.h>

#include <sys/mman.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>

int main()
{

  const int BASE_ADDR = 0xfe200000;

  int fd = open("/dev/mem", O_RDWR | O_SYNC);
  if (fd == -1) {
    printf("error opening /dev/mem.\n");
    exit(0);
  }

  volatile uint32_t *base = (volatile uint32_t *)mmap((void *)BASE_ADDR, 0x1000, PROT_READ | PROT_WRITE, MAP_SHARED, fd, BASE_ADDR);
  if (base == (void *)-1) {
    printf("Failed to mmap.\n");
    exit(0);
  }

  printf("BEFORE %08x [%02d] : %08x\n", (uint32_t)(base + 14), 14, base[14]);
  
  //This will set the bit.
  //base[8] =  0x00000400;

  // This will clear the bit.
  base[11] = 0x00000400;

  printf("AFTER %08x [%02d] : %08x\n", (uint32_t)(base + 14), 14, base[14]);

  return 0;
}

```

## Resources

https://forums.raspberrypi.com/viewtopic.php?p=136266#p136266
https://forums.raspberrypi.com/viewtopic.php?t=279758
https://raw.githubusercontent.com/raspberrypi/firmware/master/boot/overlays/README
https://raspberrypi.stackexchange.com/questions/697/how-do-i-control-the-system-leds-using-my-software
https://www.raspberrypi.com/documentation/computers/raspberry-pi.html
https://datasheets.raspberrypi.com/rpi4/raspberry-pi-4-reduced-schematics.pdf
https://datasheets.raspberrypi.com/bcm2711/bcm2711-peripherals.pdf
https://github.com/raspberrypi/linux/blob/9e87248154a633b18b4900ee742d9894b49e019b/arch/arm/boot/dts/bcm2711-rpi-4-b.dts
https://forums.raspberrypi.com/viewtopic.php?f=66&t=259366
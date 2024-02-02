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

  int fd = open("/dev/mem", O_RDWR | O_SYNC);
  if (fd == -1) {
    printf("error opening /dev/mem.\n");
    exit(0);
  }

  volatile uint32_t *base = (volatile uint32_t *)mmap((void *)0xfe200000, 0x1000, PROT_READ | PROT_WRITE, MAP_SHARED, fd, 0xfe200000);
  if (base == (void *)-1) {
    printf("Failed to mmap.\n");
    exit(0);
  }

  //int GPIO = 2;
  //int functionCode = 0b000;

  //int registerIndex = GPIO / 10;
  //int bit = (GPIO % 10) * 3;

  //unsigned oldValue = base[registerIndex];
  //unsigned mask = 0b111 << bit;
  //printf("Changing function of GPIO%d from %x to %x\n", GPIO, (oldValue >> bit) & 0b111, functionCode);
  //base[registerIndex] = (oldValue & ~mask) | ((functionCode << bit) & mask);

  // Fetch the value of GPIO0-GPIO9
  //uint32_t value = *(uint32_t *)((uint32_t)base + 0);

  // Wipe bits for GPIO2
  //value &= 0xFFFFFE3F;

  // Set bits for GPIO as input
  //value |= 0x00000000; 0x000001C0;

  // Set the register
  //uint32_t *dest = (uint32_t *)((uint32_t)base + 0);
  //*dest = value;

  base[58] = 0x19000AAA;

  for (int i = 0; i < 80; ++i)
  {
    printf("%08x [%02d] : %08x\n", (uint32_t)(base + i), i, base[i]);
  }
  //printf("Base Value: %02x\n", *(uint8_t *)((uint32_t)base + 0));
  //printf("Base Value: %02x\n", *(uint8_t *)((uint32_t)base + 1));
  //printf("Base Value: %02x\n", *(uint8_t *)((uint32_t)base + 2));
  //printf("Base Value: %02x\n", *(uint8_t *)((uint32_t)base + 3));
  return 0;
}

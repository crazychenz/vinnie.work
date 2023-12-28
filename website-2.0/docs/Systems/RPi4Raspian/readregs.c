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
  const BASE_ADDRESS = 0xfe200000;

  int fd = open("/dev/mem", O_RDWR | O_SYNC);
  if (fd == -1) {
    printf("error opening /dev/mem.\n");
    exit(0);
  }

  volatile uint32_t *base = (volatile uint32_t *)mmap((void *)BASE_ADDRESS, 0x1000, PROT_READ | PROT_WRITE, MAP_SHARED, fd, BASE_ADDRESS);
  if (base == (void *)-1) {
    printf("Failed to mmap.\n");
    exit(0);
  }

  for (int i = 0; i < 4; ++i)
  {
    printf("%08x [%02d] : %08x\n", (uint32_t)(base + i), i, base[i]);
  }
  
  return 0;
}

# Firmadyne

Firmadyne is an interesting beast. It looks to be an academic exercise that many folks have hailed as some amazing piece of software. The very real fact is that its a very rough suite of other open source tools that have been glued together to make a slightly more cohesive analysis solution.

That said, the one big benefit that firmadyne down bring to the table that I'd like to see re-used is the instrumented kernel. Personally, I've always thought that the emulator (i.e. qemu) would be an ideal location to hook in between the target firmware and the running system. I now see the value in doing this in the kernel when emulator complexity isn't required.

https://github.com/firmadyne/firmadyne
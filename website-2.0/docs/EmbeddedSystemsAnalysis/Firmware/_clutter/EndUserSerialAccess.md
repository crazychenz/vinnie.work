---
sidebar_position: 3
title: End User Serial Access
---

:::danger Incomplete

This document is not yet written.

:::

## Overview

Some systems provide a management port or serial access that is out side the influence of the network. The reason we want to connect to a serial port is so we can potentially:

<!-- TODO: Consider describing the concept of a console. -->

- Observe boot up messages that may present themselves before any logging or system services are available. Often kernels will just start outputting their boot state to the default system _console_. This _console_ in practice is mapped to the serial port that we're attempting to connect to.
- Control boot loaders. Some boot loaders like U-boot have a lot of useful analysis capabilities as well as the ability to modify system state.
- _Console_ access to the system. Often if you have serial access, the developers assume you have physical access to a device and therefore security isn't a factor, presenting you with root or some other administrator user interface.

A common looking interface for these serial ports are DB9 connectors that support full UART protocol. Other connections that I've personally seen include RJ11 connectors, RJ45 connectors, and even 3.5" headphone jack connectors.

<!-- TODO: Show serial connector pictures. -->

## UART Software

<!-- TODO: Describe how to interact with UART/Serial -->

<!-- TODO: Serial To Serial  VS  USB To Serial -->

### Screen (Linux)

[Screen](https://www.gnu.org/software/screen/) is probably the best all in one solution that you could use for Serial Communications. I don't often use it because it can conflict with my `tmux` configuration in weird ways, but if you aren't a power linux shell user this is likely a good place for you to start. `screen` has the ability to save your session if you lose your network connection or accidentally close a terminal window. Screen can also transfer sessions from one connection to another if you wanted to move from say a laptop to another machine (given the UART connection remains stable).

<!-- TODO: Show some screen basics -->

### Minicom (Linux)

[Minicom](https://salsa.debian.org/minicom-team/minicom) is usually my go to for _interactive_ UART access. This isn't to say its better than any other, its just what I grew up using the most. I will typically open a `minicom` in a `tmux` pane to get all the benefits previously mentioned in Screen.

### Putty (Windows)

<!-- TODO: Describe UART/Serial from windows. -->

[Putty](https://www.putty.org/) is without a doubt the most stable SSH, telnet, and serial tool for Windows. Although it doesn't come with windows, its free, very accessible, and extremely portable from Windows OS to Windows OS.

### Other Tools

- (Linux) [picocom](https://github.com/npat-efault/picocom) - Sometimes you'll find this tool installed on smaller SoC devices. (e.g. BeagleBoneBlack or Raspberry Pi)
- (MSDOS) [kermit](https://kermitproject.org/msk315.html) [[doc](https://kermitproject.org/onlinebooks/usingmsdoskermit2e.pdf)] - An MS-DOS terminal emulator and UART tool (the first tool I used for this kind of thing, circa 1998).
- (Windows) [HyperTerminal](https://en.wikipedia.org/wiki/HyperACCESS) - A microsoft provided serial console application. A goto if you find yourself on an older Windows Server machine.
  -(FreeBSD and others) [tip](<https://www.freebsd.org/cgi/man.cgi?tip(1)>)

### Interacting with tty directly from CLI

<!-- TODO: mention stty -->

Sometimes you need to transfer large files from a device over UART. This can be achieved a number of different ways (e.g. kermit, logging/transforms, and so forth). A quick and dirty way I've done this in the past is with the use of STDIN/STDOUT from command line with `echo` and `cat`.

The general idea assumes that:

- You know or can guess the target device's `/dev/ttyX` device path.
- The serial console in the target system is at a shell waiting for a command.
- The logged in user has access to write to the `/dev/ttyX` file path.

Given these contraints and assumptions, we can extract an entire file with a command like the following:

```sh
(cat /dev/ttyUSB0 > /tmp/passwd) & ; echo "cat /etc/passwd > /dev/ttyS0" > /dev/ttyUSB0
```

The idea here is that we log output from `/dev/ttyUSB0` to `/tmp/passwd` and then start a remote command by `echo`ing the remote command to `/dev/ttyUSB0`. This command just so happens to `cat` the contents of `/etc/passwd` to the other end of the connection, `/dev/ttyS0`. The catch is that there is no obvious EOF for the `cat > /tmp/passwd` command. Therefore you have to sort of guess when to kill the process.

## How To Configure The Connection

Serial connections implement a simple transmits and reception protocol where one wire sends bits in one direction and another wire sends bits in the other direction. The simple serial connection doesn't have a auto-negotiation protocol to determine the communication configuration, therefore the configuration needs to be pre-shared ahead of time (or already known). **In practical terms, the configuration can often be guessed.**

<!-- TODO: Talk more about UART. -->

The Common Configuration Options:

- Baud rate: The number of bits that are encoded into the line in a single time slice is the baud rate of the serial connection. Standard baud rates include: 1200, 2400, 4800, 9600, 14400, 19200, 38400, 57600, 115200, 128000 and 256000. (**I've almost always seen 9600, 38400, or 115200 used in practice.**)
- Data bits: The number of bits in a given byte across the wire. (**Almost always 8 for micro-controllers.**)
- Stop bits: The number of bits (or time) that the UART protocol waits between byte transmissions. (**Almost always 1.**)
- Parity: Whether or not to check for parity errors. **(Almost always None or N.)**
- Flow Control: When flow control is available it means there are extra pins indicating when its OK to send data (i.e. hardware flow control). In the event that you are using a simple 2 wire UART interface, the flow control **should always be controlled by software or off.**

There are some abbreviations for these configurations, for example 8 data bits, no parity, with 1 stop bit is referred to as `8-N-1`. Therefore a common configuration will look something like `9600 8-N-1` with software flow control being implicit.

<!-- TODO: Show some serial configurations in real documentation. -->

https://en.wikipedia.org/wiki/Universal_asynchronous_receiver-transmitter

## Boot Messages

<!-- TODO: Display the value of boot messages. -->

## U-Boot

<!-- TODO: Show some of the capabilities of U-Boot. -->

## Console Access

<!-- TODO: Show console access via serial. -->

## Resources

- https://www.hanselman.com/blog/connect-to-a-device-over-serial-com-port-on-windows-10-with-wsl1-tty-devices-with-windows-terminal-and-minicom
- https://unix.stackexchange.com/questions/117037/how-to-send-data-to-a-serial-port-and-see-any-answer

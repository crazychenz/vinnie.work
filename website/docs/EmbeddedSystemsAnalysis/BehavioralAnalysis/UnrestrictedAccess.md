---
sidebar_position: 30
title: 🔓 Unrestricted Access
---

:::danger Incomplete

This document is not yet written.

:::

## User Interfaces

Once you've identified the relevant ports exposed by the device, you should identify relevant tools that you can use to inspect the applications running on those ports. During this step it can be helpful to understand the intended behavior and user experience for the device. It also is a good place to start taking notes on inputs of the device (e.g. firmware update fields, _potentially_ un-sanitized user input fields). If you can login to a command line prompt, is it restricted or a _real_ shell? If you have a _shell_ is it as a user or root? What other user's exist in `/etc/passwd`?

Initially, accessing the various port could be as simple as a web browser or `curl` for ports 80 or 443. Sometimes using Chrome or Firefox developer tools can illuminate interfaces that aren't obvious from the rendered view. For port 161 or 162 you can use snmpget or snmpwalk (given you know the credentials). For ftp (port 21), ssh (port 22), telnet (port 23), you can use your favorite client to try to connect without credentials, with default credentials, or whatever credentials you may have.

<!-- TODO: Show example of curl. -->

<!-- TODO: Show example of SNMP walk. -->

<!-- TODO: Show example of Chrome developer tools. -->

<!-- TODO: Show example of restricted shell. -->

<!-- TODO: Show example of root shell. -->

Take away: Now that you have a _surface_ to work on, be resourceful in determining ways to work with that surface.

## End User Serial Port (UART)

Some systems provide a management port or serial access that is out side the influence of the network. The reason we want to connect to a serial port is so we can potentially:

<!-- TODO: Consider describing the concept of a console. -->

- Observe boot up messages that may present themselves before any logging or system services are available. Often kernels will just start outputting their boot state to the default system _console_. This _console_ in practice is mapped to the serial port that we're attempting to connect to.
- Control boot loaders. Some boot loaders like U-boot have a lot of useful analysis capabilities as well as the ability to modify system state.
- _Console_ access to the system. Often if you have serial access, the developers assume you have physical access to a device and therefore security isn't a factor, presenting you with root or some other administrator user interface.

A common looking interface for these serial ports are DB9 connectors that support full UART protocol. Other connections that I've personally seen include RJ11 connectors, RJ45 connectors, and even 3.5" headphone jack connectors.

<!-- TODO: Show serial connector pictures. -->

## Resources

- https://u-boot.readthedocs.io/en/v2021.04/index.html
- https://mediawiki.compulab.com/w/index.php?title=U-Boot:_Quick_reference
- https://variwiki.com/index.php?title=U-Boot_features
- http://software-dl.ti.com/processor-sdk-linux/esd/docs/06_03_00_106/AM335X/linux/Foundational_Components_U-Boot.html
- http://www.denx.de/wiki/U-Boot/WebHome
- https://a-delacruz.github.io/ubuntu/rpi3-setup-64bit-uboot.html
- https://stackoverflow.com/questions/64014958/cant-get-u-boot-running-on-raspberry-pi-4b-what-are-the-absolute-necessities
- https://andrei.gherzan.ro/linux/uboot-on-rpi/
- https://www.linaro.org/downloads/

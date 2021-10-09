---
sidebar_position: 2
title: Isolated Runtime Analysis
---

:::danger Incomplete

This document is not yet written.

:::

## Overview

This section is called runtime analysis, not because we intend to not plug anything into the device. Its more of a way to understand what the behavior of the device is with as much of the environment under our control as possible. If you have a development workstation or laptop plugged into the device with a network cable or UART console connection, no other part of the development workstation or the device should be plugged into the internet or other networks.

There are several reasons for this, the first being that devices that we do not yet understand could call back to their vendor's for purposes of licensing or awareness of the network its plugged into (i.e. violating privacy). Devices can advertise their existence and readiness to serve to the whole network or internet, depending on the configuration of the device. I've experienced many junior engineers not properly isolating systems correctly when they plug their device into a internal LAN, resulting in the device serving DHCP to the entire network. This rookie mistake can prevent other systems performing work for other projects from receiving a network relevant DHCP lease (i.e. prevent other users from getting access to the network).

Take away: Isolate your device until you fully understand the impact on the network and its general behavior.

## Network Analysis

### Know Its LINKED

In networking there is a lot of overloaded terms. For the sake of this discussion, a link is a hardware controlled connection between two ethernet nodes. Note: Typical linux firewalls have no control over whether a network device is linked to another. When you have physical access to the target device, the most straight forward way to determine if a device is linked is by looking at the LINK LED lights on both sides of the network connection. If they've successfully auto-negotiated the link, the LEDs will be lit. Auto-negotiation is the process that the network devices use to determine what speed they will be communicating at.

Troubleshooting tips for lack of a link light:

- Known good cable?
- Is the development interface side of the link UP?
- Is the target device powered on?

### Know It Can CONNECT

**Can you ping it?** While this will provide an easy way to determine if the system is available, if the ping fails it doesn't mean that you can't reach the system. Firewalls can block the ping protocol ICMP while still allowing UDP, TCP, or other protocols through.

When the ping doesn't work, I suggest having a good knowledge of network stacks. Network stacks are beyond the scope of this material, but in general I would ensure:

- Is there a switch or other network equipment I can remove from the setup?
- Is there a firewall rule on the development host blocking me?
- Can I arping the destination device?
- Is the target device in the `arp` table?
- Is there an IP `route` defined to access the target device?
- Am I using the correct subnet to access the device? (The manual is your friend here, otherwise read about `tcpdump` below.)

### Packet Capture

Whether you know if you can connect or not, its useful to watch for potential network traffic that the target device transmits when its first powered on. This can provide early indication of what ports the device interacts with (as a client) and what network its configured to talk on. The tool I always use for this is `tcpdump`. This is a CLI tool that, with root privileges, allows us to monitor traffic promiscuously (i.e. all packets whether they are intended for us or not). Tcpdump out of the box provides nice little protocol layer packet summaries that we can use to deduce subnets and ports. Tcpdump can also create complete packet capture files (PCAPs) for later analysis with tools like Wireshark.

<!-- TODO: Show tcpdump usage and analysis. -->

### What Does It Respond To

If we're now at the point where we know our device has an IP and what our device calls out to when it powers on, we'll want to know what other kinds of things it responds to. Due to the nature of TCP, this can be as simple as looking for any ports that respond to a SYN with a SYN/ACK. This task is performed by `nmap`. Nmap is quite a few other scanning mechanisms that each have their own pros and cons, but the one I've usually gotten the most mileage from is the TCP port scanning:

<!-- TODO: Show nmap port scans. -->

## User Interfaces

Once you've identified the relevant ports exposed by the device, you should identify relevant tools that you can use to inspect the applications running on those ports. During this step it can be helpful to understand the intended behavior and user experience for the device. It also is a good place to start taking notes on inputs of the device (e.g. firmware update fields, _potentially_ un-sanitized user input fields). If you can login to a command line prompt, is it restricted or a _real_ shell? If you have a _shell_ is it as a user or root? What other user's exist in `/etc/passwd`?

Initially, accessing the various port could be as simple as a web browser or `curl` for ports 80 or 443. Sometimes using Chrome or Firefox developer tools can illuminate interfaces that aren't obvious from the rendered view. For port 161 or 162 you can use snmpget or snmpwalk (given you know the credentials). For ftp (port 21), ssh (port 22), telnet (port 23), you can use your favorite client to try to connect without credentials, with default credentials, or whatever credentials you may have.

<!-- TODO: Show example of curl. -->

<!-- TODO: Show example of SNMP walk. -->

<!-- TODO: Show example of Chrome developer tools. -->

<!-- TODO: Show example of restricted shell. -->

<!-- TODO: Show example of root shell. -->

Take away: Now that you have a _surface_ to work on, be resourceful in determining ways to work with that surface.

## Wireshark

<!-- TODO: Show some wireshark usage. -->

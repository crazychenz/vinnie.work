---
slug: 2025-05-08-ipv4-preferred-over-ipv6
title: "IPv4 Preferred Over IPv6"
draft: false
---

## Overview

Lots of network applications stopped working in my developer virtual machine but would work within containers on the same VM. The network stack was working, the firewall didn't look weird ... what the heck?

<!-- truncate -->

## Unexpected Hangs

It really all started when I was doing my monthly self-hosted system maintenance. All I wanted to do was check my s3 bucket backups with `s3cmd ls s3://bucket-name/`. This would then just hang with no apparent reason. I could `curl` the endpoint. I could `ping` the endpoint. Finally, I gave `openssl s_client -connect endpoint.com:443` a go as well. _This did fail!_ One step closer, but nothing apparent.

The internet kept suggesting that it was a DNS error, but since I was able to `curl`, I dismissed this. When I came around to actually running `nslookup endpoint.com 9.9.9.9`, I noticed that I was getting a list of both IPv4/A records and IPv6/AAAA records. It hadn't occurred to me that somewhere in my network setup, IPv6 might not be routing correctly.

A quick test to verify it was the IPv6, I ran `openssl s_client -connect endpoint.com:443 -4`. Sure enough, I saw the certificate come through as expected.

## Solution

After a bit of research, it appears that glibc has a preference towards IPv6 now. To flip it so it'll prefer IPv4, you modify the `/etc/gai.conf` file. This is a file I've _never_ seen or heard about in my 30 years of being a developer. In any case, you can add `precedence ::ffff:0:0/96  100` to the file to indicate that you want IPv4 results from `getaddrinfo()` before IPv6 results.

Note: A more naive approach is to completely disable IPv6 in the network stack with something like: `sudo sysctl -w net.ipv6.conf.all.disable_ipv6=1`. I don't think this is wise. There are valid situations where you want to use IPv6, and I need to follow up at a later time with why IPv6 isn't working through this specific path.

## Curiosities

- **When did glibc flip to preferring IPv6?** - This issue was not a problem 6 months ago! I recently had a drive failure and did some updating as a result, not sure if this is what changed the behavior.
- **What in my network isn't forwarding IPv6 packets?** - VM Kernel?, Virtualbox?, Windows 11?, Wifi?, ISP's Router?, ISP?
- **How should I have known about `gai.conf`?** - In other words, I have little to no way to know that IPv6 was the issue in my standard troubleshooting process. I'll have to consider using `-4` and `-6` with `curl`, `ping`, and `openssl s_client` going forward.
  - ChatGPT Suggests: `python3 -c "import socket; print(socket.getaddrinfo('google.com', 80))"`

## Comments

<Comments />

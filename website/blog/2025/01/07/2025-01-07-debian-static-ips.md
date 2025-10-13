---
slug: 2025-01-07-debian-static-ips
title: "Debian Static IP Configuration"
draft: false
---

## Overview

My home network is now no less than 22 network nodes. Because of this, I've long since passed the feasibility of using only DHCP. When things go wrong, I want to troubleshoot from an IP, not a hostname. Therefore I've set static IP addresses for all of the long running network nodes. (Things like the xbox and cell phones are still DHCP).

Trouble is, this isn't as straight forward as I'd like it to be in Debian (specifically Bookworm).

<!-- truncate -->

## The Typical

Typically, I always favor `/etc/init.d/interfaces` or `/etc/rc.local` for network configuration. IMHO, there is no reason for more functionality than this when it comes to static addressing for a network that isn't designed to scale. This usually means killing off the invasive NetworkManager and systemd-networkd services.

```sh
sudo systemctl disable --now systemd-networkd
sudo systemctl disable --now systemd-resolved # For DNS
sudo systemctl disable --now NetworkManager
sudo apt update
sudo apt install ifupdown # For /etc/network/interfaces
```

## Debian Bookworm

I'm unsure if this issue exists in other distributions, but I've found it to be an issue in every one of my Debian Bookworm installations. You get to the point where you believe that you've disabled all the _smart_ network configuration systems, you've set the IP and everything looks good .... for the rest of the day!

The next day, you find that your services aren't working. I obviously am always thinking, maybe its the ISP, maybe its the ISP's router, maybe its the resources in my K8S cluster. After spending all of that time troubleshooting and eliminating possible failure points, I come to my dumb NAT gateway VM (with a presumably static IP) and I find that the address has changed. What the ...?

For some reason unknown to me, the `dhclient` binary is running and resetting my IP address to the DHCP leased address. I can only assume that this happens once every ~24 hours so its not something I'm going to easily associate an issue with. 

After some googling and light LLM questioning, I've determined that the path of least resistance will be to simple remove execute permissions from the `/sbin/dhclient` itself, kill the binary, and reset the network settings.

```sh
sudo chmod 644 /sbin/dhclient`
sudo killall dhclient
/etc/init.d/networking restart
```

The disabling of `dhclient` appears to have fixed my issue and while this isn't by any means a clean answer or explanation, I hope this bread crumb can help in the future when static IP addresses mysteriously disappear.

Please let me know if there is a cleaner method to this madness.

## Comments

<Comments />



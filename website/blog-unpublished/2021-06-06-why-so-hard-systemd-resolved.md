---
slug: 2021-06-06-blog-engine-take-3
title: 'Blog Engine ... Take 3'
draft: true
---

# Why So Hard? Setting DNS in modern (systemd) linux.

I've been using Linux for roughly 20 years now. Ever since I started using Linux and variants of the POSIX based OS (e.g. FreeBSD, Solaris) there have been some universal truths:

- Locally defined host names are in /etc/hosts
- Locally defined users are defined in /etc/passwd
- Locally defined DNS IP is stored in /etc/resolv.conf
- ... and a few others.

It would appear that for some reason, the distribution gods have decided to migrate away from these conventions. I have no idea what their motivations are, but when I am statically setting up a system I need a DNS. No one has time to remember all the IP addresses in a virtualized, containerized, and micro-service centric world.

While this was a straight forward thing with minimal documentation lookup, I thought it was worth writing about because I don't see systemd becoming a fad like many other distribution widgets.

## BLUF

To update the DNS IP addresses, you need to modify or create a `/etc/systemd/resolved.conf` file with contents similar to:

```ini
#  This file is part of systemd.
#
#  systemd is free software; you can redistribute it and/or modify it
#  under the terms of the GNU Lesser General Public License as published by
#  the Free Software Foundation; either version 2.1 of the License, or
#  (at your option) any later version.
#
# Entries in this file show the compile time defaults.
# You can change settings by editing this file.
# Defaults can be restored by simply deleting this file.
#
# See resolved.conf(5) for details

[Resolve]
DNS=9.9.9.9
FallbackDNS=8.8.8.8
#Domains=
#LLMNR=no
#MulticastDNS=no
#DNSSEC=no
#DNSOverTLS=no
#Cache=no-negative
#DNSStubListener=yes
#ReadEtcHosts=yes
```

In my case, Ubuntu (or systemd) generates a `/etc/resolv.conf` that points at systemd. After creating the previously mentioned file with the relevant IP address, run the following:

```
systemctl restart systemd-resolved
```

## Why Systemd? Just no.

I know this topic "is so 2014", but I've largely been able to avoid it for the past 10 years because it hasn't bleed into embedded systems yet. It appears that the point of systemd is to centralized the management of local system-wide services. While it side steps conflicts with the venerable `sysvinit`, it clearly has intended to overtake and replace the older conventions. This effort to replace `sysvinit` by Redhat comes with little surprise. After all, Redhat is a company that has to progress their product and that includes improving what they perceive to be the user experience.

In my opinion, they sort have missing the point though. Instead of groking the general community feedback on the product and taking a more community driven approach, they've doubled down on seeing their original vision through to not improve UX but instead take control of the UX. What I mean by that is that Redhat aims to tell the customer what they want for their own good, not unlike the Steve Jobs Apple that we all love/hate.

Naturally all the distributions with a commercial stake have followed suit and this is quite disappointing. Like a good lemming, I'm merely following the trend so that I can spend as little time as possible on tech and more time on solving problems. But that doesn't mean I don't see this moment as a degradation of what I believe to be the good ole days of Unix.

I've got my share of second hand power tools in my garage. It always amazes me how the tools that are 50 to 100 years old are everlasting, while the newer tools are more flimsy and require more regular maintenance or clever repairs. I see this knee jerk systemd product as just a newer more flimsy toolset that will have me constantly looking back at the `sysvinit` as the more robust toolset.

`sysvinit` isn't the only toolset being wholesale replaced. Standard network commands (e.g. `ifconfig`, `route`, `brctl`) are also being replaced by `iproute2` tools (e.g. `ip`) command. While the intention is unification, all that really happened is that the authors created yet another way to do the same thing and complicated the learning process.

> If you want to go quickly, go alone. If you want to go far, go together. - African Proverb

## References

https://en.wikipedia.org/wiki/Systemd

https://www.zdnet.com/article/linus-torvalds-and-others-on-linuxs-systemd/ (from 2014)

https://www.infoworld.com/article/3159124/linux-why-do-people-hate-systemd.html (from 2017)

https://www.howtogeek.com/675569/why-linuxs-systemd-is-still-divisive-after-all-these-years/ (from 2020)

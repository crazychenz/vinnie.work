---
title: Debian Configurations
---

## Networking

I still dislike NetworkManager and systemd doing networking. To disable in bookworm:

```sh
sudo systemctl disable --now systemd-networkd
sudo systemctl stop systemd-resolved  # If DNS resolution is also managed by systemd-resolved
sudo systemctl disable --now systemd-resolved
sudo systemctl disable --now NetworkManager
sudo apt update
sudo apt install ifupdown
```

Now you can update `/etc/network/interfaces` and `/etc/init.d/networking restart` for the win.

Example static config:

```
auto eth0
iface eth0 inet static
    address 192.168.1.100
    netmask 255.255.255.0
    gateway 192.168.1.1
    dns-nameservers 8.8.8.8 8.8.4.4
```

Example DHCP config:

```
auto eth0
iface eth0 inet dhcp
```
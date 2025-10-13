---
slug: 2020-11-25-remote-start-vm
title: "Use Case: You're Away From Home And Your Windows VM Host Reboots"
#date: "2020-11-25T12:00:00.000Z"
description: |
  Unfortunately, between Microsoft Updates happening more often now, and other things that potentially can cause my PC to reboot itself, I'll wake up to find that I have no connection to the VM I planned to work from.
---

## Situation

When I work from home, I often find myself working from my laptop for the portability. My laptop doesn't have all the resources that my desktop has, so I normally SSH into a Virtual Box VM that runs from my desktop PC. This works great when I am home, but I've found that on several occasions that I am on the road or not within physical reach of the PC hosting the VMs. Unfortunately, between Microsoft Updates happening more often now, and other things that potentially can cause my PC to reboot itself, I'll wake up to find that I have no connection to the VM I planned to work from.

<!--truncate-->

```
$ ping 192.168.1.Y
PING 192.168.1.Y (192.168.1.Y) 56(84) bytes of data.
From 192.168.1.X icmp_seq=1 Destination Host Unreachable
From 192.168.1.X icmp_seq=2 Destination Host Unreachable
From 192.168.1.X icmp_seq=3 Destination Host Unreachable
From 192.168.1.X icmp_seq=4 Destination Host Unreachable
```

### Updates and VM Configuration

To clarify:

- I know that I can configure my machine to not reboot until I tell it to, but I depend on up-to-date updates way more than I'll ever depend on Anti-Virus software, so IMHO it is critically important to protect the update process and update ASAP.

- I also understand that I can setup my VMs to automatically start up on boot. The issue I've had with this, for years, is that I easily forget what has started and then they just sit there consuming memory without me ever knowing until I run out of memory. Therefore, I always manually start my (development) VMs after a system restart.

## Remotely Starting A VM

If you have remote desktop access to the VM host, this is a trivial task that requires you to simply login to your machine via Remote Desktop Connection and then do what you normally would from there.

I didn't have remote desktop access (or an IP address), but what I do always setup is an SSHd service to my hosts. Trouble is that I also don't ever expose my virtual machine hosts directly to the internet. Instead, I have a Raspberry Pi I expose to the internet as a sort of VPN access point. From that I'm able to login to my private network and then pivot to any machine within.

First thing first, I needed to find the IP address of my Windows box. If I had to, I could use nmap from the RPi to scan the network for nodes. Instead, I installed Chromium on the RPi and then XForwarded that back to my laptop via Xming.

```
ssh -Y user@private-rpi-ip
sudo apt-get install chromium
# Wait ~15 minutes for install to complete. :)
chromium
```

Note: The above was run from cmd.exe (on my laptop). At the moment I can't seem to get my bash.exe to perform proper XForwarding.

From chromium, I was able to (slowly) access my Verizon router and obtain the IP address of my Windows virtual machine host. Once I had network access to the Windows box, I logged in with my Microsoft account. This is a username with an `@` symbol. Therefore, I annoyingly had to enter this into the SSH command as:

```
ssh 'user@domain.com'@private-ip-addr
```

Once I'd gained SSH access to the Windows machine, I navigated to my VirtualBox directory and started the desired VM with VBoxManage.exe:

```
cd "\Program Files\Oracle\VirtualBox\"
VBoxManage.exe list vms
VBoxManage.exe startvm desktop-ubuntu-dev
Waiting for VM "desktop-ubuntu-dev" to power on...
VM "desktop-ubuntu-dev" has been successfully started.
```

Woo hoo! Back to work...

## Comments

<Comments />

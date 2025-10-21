---
sidebar_position: 50
---

# Sniffing Application Traffic

<!-- - TODO: (5) Inspect application traffic:
  - Certificate injection
  - mitmproxy - VPN inspection, transparent capture -->



```
https://developer.android.com/studio/run/emulator-networking
https://wiki.qemu.org/Documentation/Networking
https://developer.android.com/tools/adb#forwardports

Override DNS Servers (10.0.2.[3-6]) with:
  -dns-server <serverList>
  -dns-server 8.8.8.8,9.9.9.9

HTTP Proxy (no UDP supported) via:
  -http-proxy <proxy>
  -http-proxy http://<username>:<password>@<machineName>:<port>
Troubleshoot with -debug-proxy
```


## Design Thoughts

Running emulator in network namespace forces its SLIRP to utilize a gateway of our making. This gateway is via the namespaced routing table. A flexible environment would have:

- A namespaced Bridge Device (br0)
- A namespaced Tap Device (tap0)
- A namespaced Peer Veth (veth1)
- A initns Peer Veth (veth0)


Make bridge act like a hub (w/STP):

```
bridge link set dev veth1 learning off
bridge link set dev tap0 learning off
```

- Configure default gateway to the `br0`.

- Optionally listen on `tap0` with a script for raw packet capture.

**Prepare Emulator's Namespace**:

```sh
sudo ip netns add ns0
sudo ip link add veth0 type veth peer name veth1
sudo ip link set veth1 netns ns0
sudo ip netns exec ns0 ip link add name br0 type bridge
# TODO: Consider a tap dev in initns as well?
sudo ip netns exec ns0 ip tuntap add dev tap0 mode tap
sudo ip netns exec ns0 ip link set dev veth1 master br0
sudo ip netns exec ns0 ip link set dev tap0 master br0
sudo ip netns exec ns0 bridge link set dev veth1 learning off
sudo ip netns exec ns0 bridge link set dev tap0 learning off
sudo ip netns exec ns0 ip addr add 10.0.100.2/24 dev br0

sudo ip netns exec ns0 ip link set dev    lo up
sudo ip netns exec ns0 ip link set dev veth1 up
sudo ip netns exec ns0 ip link set dev  tap0 up
sudo ip netns exec ns0 ip link set dev   br0 up
sudo ip netns exec ns0 ip route add default via 10.0.100.1

sudo ip addr add 10.0.100.1/24 dev veth0
sudo ip link set veth0 up
```

Note: Flush addresses with `# ip -4 addr flush dev "$dev" 2>/dev/null || true`


**Prepare TPROXY setup:**:

```sh
# 0) variables
export PROXY_PORT=3129
export FWMARK=1
export NFT_TABLE=mitm

# 1) allow binding non-local addresses
sudo sysctl -w net.ipv4.ip_forward=1
sudo sysctl -w net.ipv4.ip_nonlocal_bind=1

# 2) create an inet table and prerouting chain (if not already present)
sudo nft add table inet $NFT_TABLE
sudo nft add chain inet $NFT_TABLE prerouting { type filter hook prerouting priority mangle\; }

# 3) mark TCP packets arriving on veth0
sudo nft add rule inet $NFT_TABLE prerouting iifname veth0 \
  meta l4proto tcp meta mark set $FWMARK

# 4) deliver marked TCP packets to local transparent socket (tproxy)
sudo nft add rule inet $NFT_TABLE prerouting iifname veth0 \
  meta l4proto tcp meta mark $FWMARK tproxy to :$PROXY_PORT

# 5) policy routing: route marked packets to local table so replies are correct
sudo ip rule add fwmark $FWMARK lookup 100
sudo ip route add local 0.0.0.0/0 dev lo table 100

# Masquerade for things not TPROXY-ED (UDP, ICMP, etc)
sudo nft add table ip nat
sudo nft add chain ip nat postrouting { type nat hook postrouting priority 100 \; }
sudo nft add rule ip nat postrouting oifname wlo1 masquerade

# Docker drops all forwarded packets. Override that here.
# generic: sudo nft insert rule ip filter FORWARD accept
sudo nft add rule ip filter FORWARD iif "veth0" oif "wlo1" accept
sudo nft add rule ip filter FORWARD iif "wlo1" oif "veth0" accept
# sudo sysctl net.ipv4.conf.all.rp_filter
# sudo sysctl net.ipv4.conf.default.rp_filter
# sudo sysctl net.ipv4.conf.veth0.rp_filter
# sudo sysctl net.ipv4.conf.wlo1.rp_filter

# 6) load kernel modules if needed (some kernels require these modules)
#sudo modprobe nf_defrag_ipv4 nf_conntrack nf_conntrack_proto_tcp nf_conntrack_ipv4 xt_TPROXY nf_tproxy_core
```

**Start Emulator**:

```
sudo ip netns exec ns0 sudo -u $USER bash
# sudo setcap cap_net_raw+ep ~/.android/emulator/emulator
~/.android/env.sh
sudo -E env "PATH=$PATH:/usr/local/sbin:/usr/sbin:/sbin" ~/apks/playground/start-emulator.sh
```

Note: Can't setcap because setcap causes ld to ignore LD_LIBRARY_PATH which is used by the emulator.

**Test ADB**:

```
sudo ip netns exec ns0 sudo -u $USER bash
~/.android/env.sh
adb start-server
adb devices
adb shell ping 9.9.9.9
```

**Start Proxy**:

```
mitmproxy --mode transparent --listen-port $PROXY_PORT
```



## Vibe Script


```
#!/bin/bash

# Create namespace
sudo ip netns add ns_emu

# Create virtual interfaces
sudo ip link add veth_emuhost type veth peer name veth_emuvm

# Move veth_emuvm iface to namespace
sudo ip link set veth_emuvm netns ns_emu

# Add address to initns veth
sudo ip addr add 10.0.100.1/24 dev veth_emuhost
sudo ip link set veth_emuhost up

# Configure ns_emu namespace interfaces
sudo ip netns exec ns_emu ip addr add 10.0.100.2/24 dev veth_emuvm
sudo ip netns exec ns_emu ip link set veth_emuvm up
sudo ip netns exec ns_emu ip link set lo up
sudo ip netns exec ns_emu ip route add default via 10.0.100.1

# Enable IP forwarding, NAT, and Firewall Forwarding
sudo sysctl -w net.ipv4.ip_forward=1
sudo iptables -t nat -A POSTROUTING -s 10.0.100.0/24 -j MASQUERADE
sudo iptables -A FORWARD -i veth_emuhost -j ACCEPT
sudo iptables -A FORWARD -o veth_emuhost -j ACCEPT


sudo ip rule add fwmark 1 lookup 100
sudo ip route add local 0.0.0.0/0 dev lo table 100

# Mark and redirect TCP/UDP traffic from ns_emu network
sudo iptables -t mangle -A PREROUTING -i veth_emuhost -p tcp -j TPROXY \
    --tproxy-mark 0x1/0x1 --on-port 8080 --on-ip 127.0.0.1
sudo iptables -t mangle -A PREROUTING -i veth_emuhost -p udp -j TPROXY \
    --tproxy-mark 0x1/0x1 --on-port 8080 --on-ip 127.0.0.1
# Mark packets from localhost destined to ns_emu network
sudo iptables -t mangle -A OUTPUT -p tcp -d 10.0.100.0/24 -j MARK --set-mark 1


mitmproxy --mode transparent --set block_global=false


# Run emulator inside the network namespace
sudo ip netns exec ns_emu sudo -u $USER emulator -avd <avd_name> -no-snapshot



```
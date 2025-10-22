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

# TODO: Consider a tap dev in initns as well?
sudo ip netns exec ns0 bash <<'EOF'
  ip link add name br0 type bridge
  ip tuntap add dev tap0 mode tap
  ip link set dev veth1 master br0
  ip link set dev tap0 master br0
  bridge link set dev veth1 learning off
  bridge link set dev tap0 learning off
  ip addr add 10.0.100.2/24 dev br0

  ip link set dev    lo up
  ip link set dev veth1 up
  ip link set dev  tap0 up
  ip link set dev   br0 up
  ip route add default via 10.0.100.1
EOF

sudo ip addr add 10.0.100.1/24 dev veth0
sudo ip link set veth0 up
```

Note: Flush addresses with `# ip -4 addr flush dev "$dev" 2>/dev/null || true`


**Prepare TPROXY setup:**:

```sh
export PROXY_PORT=3129
export FWMARK=1
export NFT_TABLE=mitm

# List tables: sudo nft list tables
# Show table : sudo nft list table ip filter
# Show chain : sudo nft list chain ip filter FORWARD

# enable kernel options for mitm caps
sudo sysctl -w net.ipv4.ip_forward=1
sudo sysctl -w net.ipv4.ip_nonlocal_bind=1
for i in all default veth0 wlo1; do
  sysctl -w net.ipv4.conf.$i.rp_filter=0
done

# **prerouting** marking
sudo nft add table ip nat || true
sudo nft add chain ip nat prerouting { type nat hook prerouting priority 0 \; } || true
sudo nft add rule  ip nat prerouting \
  iifname veth0 \
  meta l4proto tcp \
  meta mark set $FWMARK
# tcp dport != 3129
# counter

# REDIRECT only packets that were marked
# - When TCP (this transport match required)
# - When marked with $FWMARK
# - Redirect to port 3129 (i.e. accept and redirect)
sudo nft add rule ip nat prerouting \
  meta l4proto tcp \
  meta mark $FWMARK \
  redirect to :3129

# **forward** acceptance
#sudo nft add table inet filter || true
# TODO: Try with our "inet filter forward" chain instead of DOCKER's "ip filter FORWARD" chain
sudo nft add rule ip filter FORWARD iif "veth0" oif "wlo1" accept
sudo nft add rule ip filter FORWARD iif "wlo1" oif "veth0" accept
sudo nft add rule ip filter FORWARD ct state established,related accept

# **postrouting** masquerade
sudo nft add chain ip nat postrouting { type nat hook postrouting priority 100 \; } || true
sudo nft add rule  ip nat postrouting oifname wlo1 masquerade
```

**toolbox, toybox**

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

mitmproxy - used for exploring flows
- save flows for HAR and JSON export
- using mitmproxy (transparently) with SSLKEYLOGFILE forces the TLS secrets out for us
  - with the key, we can do tcpdump in parallel and use wireshark + SSLKEYLOGFILE to decrypt pcaps
  - Note: cert pinning will block this

Net result:
- Pcaps with TLS traffic
- TLS secrets to get decrypted TLS streams
- mitmproxy flows
- decrypted HAR files
- decrypted JSON files
  
To decrypt from wireshark: Hamburger -> Edit -> Preferences -> Protocols -> TLS -> \
  "(Pre)-Master-Secret log filename" = $SSLKEYLOGFILE

```
sudo -E env "PATH=$PATH:/usr/local/sbin:/usr/sbin:/sbin" "SSLKEYLOGFILE=~/apks/pcaps/sslkeylog.txt"\
  mitmproxy --mode transparent --listen-port 3129 --listen-host 0.0.0.0
#mitmproxy --mode transparent --listen-port $PROXY_PORT --listen-host 0.0.0.0
# Consider: sudo setcap 'cap_net_bind_service,cap_net_admin,cap_net_raw+ep' "$(command -v mitmproxy)"
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
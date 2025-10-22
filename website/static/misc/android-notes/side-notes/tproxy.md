

# TPROXY

When doing proxy like things in Linux, you can opt to redirect all packets to the proxy or you can use whats called TPROXY. I wanted to configure mitmproxy (v12) to be a transparent proxy using TPROXY. This way the packet addresses would be preserved. Turns out there are some unfortunate behaviors associated with TPROXY:

- TPROXY will only send packets to a socket that is listening to the correct port with sockopt(IP_TRANSPARENT).
- tcpdump, wireshark, and other sniffers are not early enough to show TPROXY packets
  - This was exceedingly frustrating when I was first trying to use TPROXY.
- socat does support IP_TRANSPARENT (AFAIK)
- mitmproxy removed support for IP_TRANSPARENT (since v7 when they moved to asyncio).



**Prepare Encapsulated Namespace**:

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

# Permit forwarding and non-local addresses
# TODO: Add ipv6 forwarding
sudo sysctl -w net.ipv4.ip_forward=1
sudo sysctl -w net.ipv4.ip_nonlocal_bind=1

# create an inet table and prerouting chain (if not already present)
sudo nft add table inet $NFT_TABLE
sudo nft add chain inet $NFT_TABLE prerouting { type filter hook prerouting priority mangle\; }

# Note: Safer to keep these 2 rules separated.
# mark TCP packets arriving on veth0
sudo nft add rule inet $NFT_TABLE prerouting \
  iifname veth0 \
  meta l4proto tcp \
  meta mark set $FWMARK \
  counter

# deliver marked TCP packets to local transparent socket (tproxy)
sudo nft add rule inet $NFT_TABLE prerouting \
  iifname veth0 \
  meta l4proto tcp \
  meta mark $FWMARK \
  counter \
  tproxy to :$PROXY_PORT

# List tables: sudo nft list tables
# Show table : sudo nft list table ip filter
# Show chain : sudo nft list chain ip filter FORWARD

# policy routing: route marked packets to local table so replies are correct
sudo ip rule add fwmark $FWMARK lookup 100
sudo ip route add local 0.0.0.0/0 dev lo table 100
sudo ip route add local ::/0 dev lo table 100 

# Masquerade for things not TPROXY-ED (UDP, ICMP, etc)
sudo nft add chain ip nat postrouting { type nat hook postrouting priority 100 \; }
sudo nft add rule ip nat postrouting oifname wlo1 masquerade

# Docker drops all forwarded packets. Override that here.
# generic: sudo nft insert rule ip filter FORWARD accept
sudo nft add rule ip filter FORWARD iif "veth0" oif "wlo1" accept
sudo nft add rule ip filter FORWARD iif "wlo1" oif "veth0" accept
# Permit responses that came from our replies
sudo nft add rule ip filter FORWARD ct state established,related counter accept

# These can block TPROXY (in theory). We want these to be zero?
# sudo sysctl net.ipv4.conf.all.rp_filter
# sudo sysctl net.ipv4.conf.default.rp_filter
# sudo sysctl net.ipv4.conf.veth0.rp_filter
# sudo sysctl net.ipv4.conf.wlo1.rp_filter
```

**Test From namespace**:

```
sudo ip netns exec ns0 sudo -u $USER bash
# Setup wireshark or tcpdump from initns to verify packets are forwarded
curl www.wikipedia.org
```

**Start Proxy**:

You can verify TPROXY is working with:

```python
import socket
s = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
s.setsockopt(0, 19, 1)            # SOL_IP, IP_TRANSPARENT
s.setsockopt(socket.SOL_SOCKET, socket.SO_REUSEADDR, 1)
s.bind(('0.0.0.0', 3129))
s.listen(1)
while True:
    c, a = s.accept()
    print("ACCEPT", a)
    c.close()
```

## Resources

https://git.kernel.org/pub/scm/linux/kernel/git/stable/linux.git/tree/Documentation/networking/tproxy.rst?h=v5.10#n24
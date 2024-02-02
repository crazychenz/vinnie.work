---
slug: 2022-09-09-ifconfig-is-dead
title: 'ifconfig is dead'
draft: false
---

## Situation

Bottom line, `ifconfig` has finally reached a point of scarcity that I feel I need to switch to the heir apparent `iproute2`. So often do I get on an isolated network that doesn't have basic tools like `ifconfig`, `route`, or `vconfig` and because of the environment, my workaround `apt install net-tools` isn't always available.

<!-- truncate -->

## (Yet Another?) Conversion from legacy tools to `iproute2`.

Below I've listed some of my common conversions from legacy tools to `iproute2`.

Legacy packages (with Ubuntu 22) and tools include:

- `uml-utilities` - `tunctl`
- `bridge-utils` - `brctl`
- `net-tools` - `ifconfig`, `route`, `arp`, `netstat`
- `vlan` - `vconfig`

Command Conversions:

- Show all listening interfaces and their processes

  ```sh
  # Legacy:
  netstat -tnp
  netstat -unp

  # Modern:
  ss -tnp
  ss -unp
  ```

- Show all interfaces

  ```sh
  # Legacy:
  ifconfig -a

  # Modern
  ip addr show
  ```

- Show running interfaces

  ```sh
  # Legacy:
  ifconfig

  # Modern:
  ip addr show up
  ```

- Set an IP

  ```sh
  # Legacy:
  ifconfig <interface> <ip>

  # Modern:
  ip addr add <ip> dev <interface>
  ```

- Set an IP and netmask

  ```sh
  # Legacy:
  ifconfig <interface> <ip> netmask <netmask>

  # Modern:
  ip addr add <ip>/<maskbits> dev <interface>
  ```

- Remove interface layer 3 addresses

  ```sh
  # Legacy:
  ifconfig <interface> 0.0.0.0

  # Modern:
  ip addr flush dev <interface>
  ```

- Enable/disable interface

  ```sh
  # Legacy:
  ifconfig <interface> <ip> <up/down>

  # Modern:
  ip link set dev <interface> <up/down>
  ```

- Enable only layer 2 of device.

  ```sh
  # Legacy:
  ifconfig <interface> 0.0.0.0 up

  # Modern:
  ip addr flush dev <interface>
  ip link set dev <interface> up
  ```

- Change MAC Address

  ```sh
  # Legacy:
  ifconfig <interface> hw ether <mac>

  # Modern:
  ip link set dev <interface> address <mac>
  ```

- View route table (numbers only)

  ```sh
  # Legacy:
  route -n

  # Modern:
  ip route show
  ```

- Set default route

  ```sh
  # Legacy:
  route add default gw <ip>

  # Modern:
  ip route add default via <gw_ip>
  # OR
  ip route add default dev <interface>
  ```

- Add route for a subnet via interface

  ```sh
  # Legacy:
  route add -net <subnet>/<maskbits> dev <interface>

  # Modern:
  ip route add <subnet>/<maskbits> dev <interface>
  ```

- Add route for a subnet via gateway

  ```sh
  # Legacy:
  route add -net <subnet>/<maskbits> gw <gw_ip>

  # Modern:
  ip route add <subnet>/<maskbits> via <gw_ip>
  ```

- Delete route for a subnet

  ```sh
  # Legacy:
  route del -net <subnet>/<maskbits>

  # Modern:
  ip route delete <subnet>/<maskbits> via <gw_ip>
  # OR
  ip route delete <subnet>/<maskbits> dev <interface>
  ```

- See ARP table

  ```sh
  # Legacy:
  arp -an

  # Modern:
  ip neighbor show
  ```

- Add ARP entry

  ```sh
  # Legacy:
  arp -s <ip> <mac>

  # Modern:
  ip neighbor add <ip> lladdr <mac> dev <interface>
  ```

- Delete ARP entry

  ```sh
  # Legacy:
  arp -d <ip>

  # Modern:
  ip neighbor del <ip> lladdr <mac> dev <interface>
  ```

- Create VLAN

  ```sh
  # Legacy:
  vconfig add <parent_interface> <vlan>

  # Modern:
  ip link add link <parent_interface> name <vlan_interface> type vlan id <vlan>
  ```

- View link details (e.g. get VLAN id)

  ```sh
  # Legacy:
  # Encoded in interface name

  # Modern:
  ip -d link show dev <interface>
  ```

- Create bridge interface

  ```sh
  # Legacy:
  brctl addbr <bridge_interface>

  # Modern:
  ip link add name <bridge_interface> type bridge
  ```

- Add bridge port

  ```sh
  # Legacy:
  brctl addif <bridge_interface> <interface>

  # Modern:
  ip link set dev <interface> master <bridge_interface>
  ```

- Delete bridge port

  ```sh
  # Legacy:
  brctl delif <bridge_interface> <interface>

  # Modern:
  ip link set dev <interface> nomaster
  ```

- Create virtual interfaces (See [this SO question](https://unix.stackexchange.com/questions/87829/difference-between-virtual-interfaces-with-ifconfig-and-iproute2) for more info.)

  ```sh
  # Legacy:
  ifconfig <interface>:<veth_num> [options]

  # Modern:
  ip link add name <first_vinterface> type veth peer name <second_vinterface>
  ```

- See _tun/tap_ interfaces

  ```sh
  # Legacy:
  ifconfig -a

  # Modern:
  ip tuntap show
  ```

- Add tun device

  ```sh
  # Legacy:
  tunctl [-t <tun_interface>] [-u <user>]

  # Modern:
  ip tuntap add dev <tun_interface> mode <tun/tap> [user <user> group <group>]
  ```

- Delete tun device

  ```sh
  # Legacy:
  tunctl -d <tun_interface>

  # Modern:
  ip tuntap delete dev <tun_interface> mode <tun/tap>
  ```

## Noteworthy Commands

- Rename Interface (Note: Previous used udev to do this. See [this SO question](https://unix.stackexchange.com/questions/205010/centos-7-rename-network-interface-without-rebooting).)

  ```sh
  # Legacy:
  nameif [options]

  # Modern:
  ip link set dev <cur_interface> name <new_interface>
  ```

- Network Namespaces (Note: Network namespaces are only pointers in kernel space. Only `iproute2` tracks its own by name.)

  ```sh
  # List net namespaces
  ip netns list
  # Add net namespace
  ip netns add <net_namespace>
  # Del net namespace
  ip netns del <net_namespace>
  # Run command within net namespace
  ip netns exec <net_namespace> <command>
  # Ident process net namespace
  ip netns identify <pid>
  # Assigned interface to net namespace
  # Note: Usually you can assign to pid 1 to get back to 'init_ns'
  ip link set dev <interface> <net_namespace/pid>
  ```

## Training Tool

Now that we have some conversions, we can train ourselves to stop using the old tools by replacing them with a _hand smacker_ script. Something to say, "No! You do it this way!".

## Resources

- [Wikipedia: iproute2](https://en.wikipedia.org/wiki/Iproute2) - A simple wiki entry for `iproute2`. Note: No history section provide.
- [iproute2 Cheatsheet](https://baturin.org/docs/iproute2/) - A much more fleshed out list of useful `ip` operations.
- [iproute2 GIT repo](git://git.kernel.org/pub/scm/network/iproute2/iproute2.git)
- [iproute2's Initial Commit](https://git.kernel.org/pub/scm/network/iproute2/iproute2.git/commit/?id=1bca84eaf6cdcd7444d81ed75ae5f23071518b4f) - Committed 2004-04-15

## Comments

<Comments />

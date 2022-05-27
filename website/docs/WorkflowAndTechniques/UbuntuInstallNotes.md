---
sidebar_position: 3
title: Ubuntu Install Notes
---

## Installs

- docker-io
- tmux

## Add non-native architecture package repositories

- `sudo dpkg --add-architecture arm64`
- Add the following (for arm64, armhf, ppc64el, riscv64, s390x) to `/etc/apt/sources.list`:
  
   ```text
   deb http://ports.ubuntu.com/ubuntu-ports/ focal main restricted
   deb http://ports.ubuntu.com/ubuntu-ports/ focal-updates main restricted
   deb http://ports.ubuntu.com/ubuntu-ports/ focal universe
   deb http://ports.ubuntu.com/ubuntu-ports/ focal-updates universe
   deb http://ports.ubuntu.com/ubuntu-ports/ focal multiverse
   deb http://ports.ubuntu.com/ubuntu-ports/ focal-updates multiverse
   ```

- `sudo apt-get update`
- To install package do `sudo apt-get install ncurses-dev:<arch>`
- Note: i386 is included in stock `us.archive.ubuntu.com` repos.
- Note: The `x86` arch in Ubuntu/Debian is `amd64`.


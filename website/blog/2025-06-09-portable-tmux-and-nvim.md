---
slug: 2025-06-09-portable-tmux-and-nvim
title: "IPv4 Preferred Over IPv6"
draft: false
---

## Overview

As of late, I've been attempting to catch up with the flurry of new developer tools that now exists. Many of the TUI tools are golang or rust and therefore have nice portable static versions. This means one single binary that has all the things I need to use the tool. It goes in my ~/.local/bin and that is that (presuming you aren't ricing in catppuccin).

Now tmux and nvim are central to all of this portability and yet they remain relatively non-portable and are themselves written in C and C++ respectively. I'd like to fix this.

<!-- truncate -->

## Tmux

Tmux is the heart of the terminal and its pane/window/session management. I generally don't acknowledge anything before tmux-3.0 because before that it was a different config format and I usually opted for multiple windows and tabs with my terminal emulator. Since, tmux 3.0, I've been using a pretty simply configuration with some specific colors, pane labels, and the mouse turned on (for pane resizing).

For reasons specifically unknown to me at this time, it appears tmux-3.3 has made some leaps in its capabilities in regards to all the new dev tool hotness on the net. The trouble is that not all of my VMs and installed distributions have a out-of-the-box tmux that is 3.3+. Instead of one off building tmux for these older systems, I want a statically built tmux that I can drop in my ~/.local/bin and be done with it. Ideally I would be able to check this into my .dotfiles repository and `stow` it into my home directory everywhere.

To facilitate this, I'm using docker to isolate system dependencies from the build. I've tried to use the newest dependencies and I'm using musl as the libc because of its size and its ability to run completely static (unlike vanilla glibc).

Here is the Dockerfile:

```Dockerfile
FROM debian:12

RUN apt-get update && apt-get install -y \
  musl-tools build-essential curl pkg-config yacc

ENV TOP_DIR=/build-static-tmux
ENV PREFIX=$TOP_DIR/local
ENV CC=musl-gcc
ENV CFLAGS="-static -I$PREFIX/include"
ENV LDFLAGS="-static -L$PREFIX/lib64 -L$PREFIX/lib"
ENV CPPFLAGS="-I$PREFIX/include"

WORKDIR $TOP_DIR

RUN curl -LO https://github.com/libevent/libevent/releases/download/release-2.1.12-stable/libevent-2.1.12-stable.tar.gz \
  && curl -LO https://ftp.gnu.org/pub/gnu/ncurses/ncurses-6.5.tar.gz \
  && curl -LO https://github.com/tmux/tmux/releases/download/3.5a/tmux-3.5a.tar.gz \
  && curl -LO https://github.com/openssl/openssl/releases/download/openssl-3.5.0/openssl-3.5.0.tar.gz

RUN tar xf libevent-2.1.12-stable.tar.gz \
  && tar xf ncurses-6.5.tar.gz \
  && tar xf tmux-3.5a.tar.gz \
  && tar xf openssl-3.5.0.tar.gz

WORKDIR $TOP_DIR/openssl-3.5.0
RUN ./Configure no-shared no-dso no-tests no-secure-memory no-afalgeng \
    --prefix=$PREFIX linux-x86_64 \
  && make -j$(nproc) && make install_sw

WORKDIR $TOP_DIR/libevent-2.1.12-stable
RUN ./configure --prefix=$PREFIX --disable-shared --enable-static \
    --with-pic \
    CC=$CC CPPFLAGS="$CPPFLAGS" CFLAGS="$CFLAGS" \
    LDFLAGS="$LDFLAGS" LIBS="-lssl -lcrypto" \
  && make -j$(nproc) && make install

WORKDIR $TOP_DIR/ncurses-6.5
RUN ./configure --prefix=$PREFIX --with-normal --with-static --without-shared \
    --without-debug --without-ada --enable-widec --datarootdir=/lib \
    CC=$CC CFLAGS="$CFLAGS" \
  && make -j$(nproc) && make install

WORKDIR $TOP_DIR/tmux-3.5a
# Do some funky patchwork.
RUN sed -i '/NEED_FORKPTY_TRUE/d' Makefile.in \
  && cp $PREFIX/lib/libncursesw.a $PREFIX/lib/libncurses.a
RUN PKG_CONFIG_PATH="$PREFIX/lib/pkgconfig" ./configure --prefix=$PREFIX \
    --enable-static CC=$CC CFLAGS="$CFLAGS -DHAVE_FORKPTY" LDFLAGS="$LDFLAGS" \
    CPPFLAGS="-I$PREFIX/include -I$PREFIX/include/ncursesw" \
    LIBS="-lncursesw -levent" \
  && make -j$(nproc)
```

The above Dockerfile is run with:

```sh
docker build -t tmux-build .
```

Once the build has completed, extract the `tmux` binary with:

```
C=$(docker create tmux-build);docker cp $C:/build-static-tmux/tmux-3.5a/tmux .; docker rm $C
```

Note: `tmux` requires terminfo. This has been hardcoded into the build to exist at `/lib/terminfo`. If you want to change this, update the `--datarootdir` to the appropriate prefix in the ncurses `configure` script.

Yay, now we have a static tmux.

## Nvim

Unlike tmux, nvim has some dependencies that really don't want to be built statically. We work around this by using AppImage. The caveat with AppImage is that your system will need fuse. If this is not acceptable, you can lug around all the extra files or a tarball. I'm giving AppImage a go for simplicity.

One of the other issues with prebuilt nvim is that its built with newer glibc versions. This means it does not work on older distributions like Ubuntu Focal (20.04). To get around this, we're forced to build our own. Lucily, once you have the script up and running (with docker and AppImage), you can easily add support for older distrobutions by simply rewinding the base image in the _Dockerfile_ to an appropriate generation.

The following is a bit funky because we can not use fuse inside of a `docker build` context. Therefore we build the neovim package in the Docker environment and then use `linuxdeploy` to assemble the AppImage. I wanted to keep this simple, so I've combined the Dockerfile content and the follow-on AppImage build into a single script.

```sh
#!/bin/bash

docker build -t nvim-build - <<END_OF_DOCKERFILE
  FROM ubuntu:focal

  ENV DEBIAN_FRONTEND=noninteractive

  RUN apt-get update && apt-get install -y \
      build-essential ninja-build gettext cmake unzip curl

  WORKDIR /build
  RUN curl -LO https://github.com/neovim/neovim/archive/refs/tags/v0.11.2.tar.gz \
    && tar -xf v0.11.2.tar.gz

  WORKDIR /build/neovim-0.11.2
  RUN make CMAKE_BUILD_TYPE=Release \
    && make CMAKE_INSTALL_PREFIX=/neovim-0.11.2 install

  WORKDIR /
  RUN tar -czf neovim-0.11.2.tar.gz neovim-0.11.2
END_OF_DOCKERFILE

C=$(docker create nvim-build);docker cp $C:neovim-0.11.2.tar.gz .;docker rm $C
tar -xf neovim-0.11.2.tar.gz
strip neovim-0.11.2/bin/nvim

curl -LO https://github.com/linuxdeploy/linuxdeploy/releases/download/continuous/linuxdeploy-x86_64.AppImage
curl -LO https://github.com/linuxdeploy/linuxdeploy-plugin-appimage/releases/download/continuous/linuxdeploy-plugin-appimage-x86_64.AppImage
chmod +x linuxdeploy-*

mkdir Neovim.AppDir
mv neovim-0.11.2 Neovim.AppDir/usr
./linuxdeploy-x86_64.AppImage \
  --appdir Neovim.AppDir \
  --desktop-file Neovim.AppDir/usr/share/applications/nvim.desktop \
  --icon-file Neovim.AppDir/usr/share/icons/hicolor/128x128/apps/nvim.png \
  --output appimage

mv Neovim-x86_64.AppImage nvim
```

## Conclusion

Hurray, I now have a straight forward `tmux` and `nvim` that can go into my `~/.local/bin` and not think to much about it. Like I mentioned before, in the event that something doesn't work, I should be able to rebuild specifically for that distribution in the Docker environment, rerun the linux deploy and we'll have a freshly baked set of tools.

Of course as major versions progress, all things die. :)

## Comments

<Comments />

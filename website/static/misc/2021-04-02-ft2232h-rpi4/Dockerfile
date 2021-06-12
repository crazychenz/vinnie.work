FROM ubuntu:20.04

# Most things (e.g. bash) are better than /bin/sh.
# Note: This tricks `docker build` into using bash instead of
#       the dorked /bin/sh that is part of ubuntu base image.
# Note: This should be done first so all subsequent environment
#       settings are part of this new shell environment.
RUN rm /bin/sh && ln -s /usr/bin/bash /bin/sh

ARG DEBIAN_FRONTEND=noninteractive

# Provide shell a namespace it's running in.
ENV DOCKER_IMAGE_NAME=openocd-dev

# Prompts without color should be the edge case.
ENV TERM=xterm-256color

# Break that absurd bell!
RUN echo "set bell-style none" >> /etc/inputrc

# Update repository list and install baseline dependencies.
RUN apt-get update && apt-get install -y \
    net-tools iputils-ping \
    curl wget \
    python3 \
    vim vim-common \
    rsync \
    git \
    openssh-client telnet \
    minicom \
    gdb-multiarch \
    usbutils \
    && apt-get -y autoclean


# Allow sudoers to sudo without passwords.
RUN apt-get install -y sudo
RUN sed -i 's/ALL=(ALL:ALL) ALL/ALL=(ALL:ALL) NOPASSWD: ALL/' /etc/sudoers

# User defaults, ideally setup to match existing user's info with `whoami` and `id`.
ARG uid=1000
ARG gid=1000
ARG username=user
ARG groupname=user

RUN addgroup --gid ${gid} ${groupname}
RUN adduser --system --disabled-password --uid ${uid} --gid ${gid} ${username}
RUN adduser ${username} sudo
USER ${username}

RUN rsync -rv /etc/skel/ /home/${username}/
# Note: Recommended to use `sudo -E` in dockerfiles.
RUN echo alias sudo=\'sudo -E\' >> /home/${username}/.bashrc

# Install XPack OpenOCD
ARG XPACK_OPENOCD_NAME=xpack-openocd-0.11.0-1
ARG XPACK_OPENOCD_BASE=${XPACK_OPENOCD_NAME}-linux-x64.tar.gz
ARG XPACK_OPENOCD_URL=https://github.com/xpack-dev-tools/openocd-xpack/releases/download/v0.11.0-1/$XPACK_OPENOCD_BASE
ARG XPACK_OPENOCD_DST=/opt
RUN sudo -E curl -L $XPACK_OPENOCD_URL -o $XPACK_OPENOCD_DST/$XPACK_OPENOCD_BASE
RUN sudo -E tar -C $XPACK_OPENOCD_DST -xvf $XPACK_OPENOCD_DST/$XPACK_OPENOCD_BASE

# Add XPack OpenOCD To Path
ENV PATH=$XPACK_OPENOCD_DST/$XPACK_OPENOCD_NAME/bin:$PATH

WORKDIR /workspace

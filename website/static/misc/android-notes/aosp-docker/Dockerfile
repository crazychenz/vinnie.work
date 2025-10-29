FROM ubuntu:20.04

ARG USER_UID=1000
ARG USER_GID=1000

RUN apt-get update
RUN apt-get install -y git curl python3 unzip libncurses5 passwd
RUN apt-get install -y zip

RUN /sbin/groupadd -g $USER_GID user
RUN /sbin/useradd -u $USER_UID -g $USER_GID -m user

USER $USER_UID:$USER_GID

WORKDIR /home/user


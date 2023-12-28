---
title: "Componentized Docker"
date: "2021-02-01T12:00:00.000Z"
description: |
  Tired of constantly copy/pasting, losing, and re-implementing Dockerfile manutia and various configurations for container setup, I decided that componentizing the build is something that needs to be done.
---

## Bottom Line Up Front

I've developed conventions to reuse partial Dockerfiles to construct complete Dockerfiles for creating Docker images. These Dockerfile fragments can be dynamically manipulated and aggregated to allow for building of diverse sets of Docker images that are nothing more than loosely coupled and highly cohesive partitions of system configuration.

## Overview

I've been using Docker for years, but mostly by only using naiive setups that were treated more like virtual machines than anything else. During the 2020 pandemic lockdowns, I decided to take a deep dive into learning containerization. As part of my adventure, I learned about using Docker as an application in contrast to a service or platform. I learned about using docker-compose and its advantages with managing services. Finally, I spent a large amount of time learning about kubernetes and its deceptively complicatde ecosystem.

With all of my new container knowledge there has been a significant uptick in my utilization of containerization. I've truely become a beliver in containerization, but it needs to be used responsibly. Instead of containerizing each application, IMO you should containerize workflows or use cases. Sometimes this could be as simple as a single container per project or build system. I've used containers to encapsulate firebase development, react native development, godot development, llvm development, and many other use cases. 

With the more container use cases that are developed, the more you find particular patterns falling out that feel reusable. For example, how we setup site specific repository configuration or how container specific user accounts are created and configured are both highly reusable and highly cohesive.

## Dockerfile Break Down

All Dockerfiles that I create have several sections:

- The FROM directive, deciding where the base image is coming from.
- The package repository updates and base line image packages (e.g. apt-get update/install).
- Base line configurations (e.g. environmental, sudo).
- System application installation. (i.e. Typically things installed with root.)
- User creation and configuration.
- User application installations. (i.e. Typically things installed as a user.)
- Final wrap up (e.g. WORKDIR, SHELL, CMD, EXEC)

Within each of the defined sections above, there are typically multiple definable modules that can be created depending on the type of component or use case that is being configured. Each are developed with Dockerfile syntax and have a `.dockerfile` suffix so that Dockerfile editors perform the appropritate syntax highlighting.

A Dockerfile fragment representing the *top* of a complete Dockerfile:

```
FROM ubuntu:20.04

# Most things (e.g. bash) are better than /bin/sh.
# Note: This tricks `docker build` into using bash instead of
#       the dorked /bin/sh that is part of ubuntu base image.
# Note: This should be done first so all subsequent environment
#       settings are part of this new shell environment.
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

ARG DEBIAN_FRONTEND=noninteractive

# Provide shell a namespace it's running in.
ENV DOCKER_IMAGE_NAME=DOCKER_IMAGE_NAME_VALUE

# Prompts without color should be the edge case.
ENV TERM=xterm-256color

# Update repository list and install baseline dependencies.
RUN apt-get update && apt-get install -y \
    net-tools iputils-ping \
    curl wget \
    python3 \
    vim vim-common \
    rsync \
    git \
    openssh-client telnet \
    && apt-get -y autoclean
```

*Note:* The DOCKER_IMAGE_NAME_VALUE is a special string that will be used as as template variable to be replaced with a more meaningful name.

An example Dockerfile fragment for installing and configuring sudo:

```
RUN apt-get install -y sudo
RUN sed -i 's/ALL=(ALL:ALL) ALL/ALL=(ALL:ALL) NOPASSWD: ALL/' /etc/sudoers
```

An example Dockerfile fragment for configuring APT to use a local proxy:

```
RUN echo 'Acquire::HTTP::Proxy "http://192.168.1.22:3142";' > /etc/apt/apt.conf.d/01proxy && \
    echo 'Acquire::HTTPS::Proxy "false";' >> /etc/apt/apt.conf.d/01proxy
RUN apt-get update
```

## Dockerfile Buildup

With a healthy set of Dockerfile fragments we can begin to loosly couple them. I've chosen to go with just using `bash` as the primary means by which I manipulate and aggregate the Dockerfiles. Containerization is *mostly* a Linux technology and therefore there is little reason to complicate things with additional dependencies like node, python, and associated package trees. With `bash` and standard linux command line fare, we can use commands like `sed` for manipulations, `cat` for reuse, and `echo` for adhoc insertions. All of this is aggregated into a shell script that outputs the complete Dockerfile.

An example `Dockerfile.sh` that generates a complete Dockerfile looks like:

```
#!/bin/sh

# Configuration
C=../../components
IMAGE_NAME=react-native-dev

# Context Setup
mkdir imports
cp $C/ubuntu-20.04/user/docker-user-settings.sh imports/

# System Initialization
sed "s/DOCKER_IMAGE_NAME_VALUE/$IMAGE_NAME/" $C/ubuntu-20.04/ubuntu-20.04-base.dockerfile
cat $C/ubuntu-20.04/sudo.dockerfile
cat $C/ubuntu-20.04/localhost-apt-cache.dockerfile
cat $C/ubuntu-20.04/android-sdk.dockerfile

# User Setup
cat $C/ubuntu-20.04/usersetup.dockerfile

    # Application Setup (as user)
    cat $C/ubuntu-20.04/user/nvm.dockerfile
    echo "RUN sudo -E apt-get install -y openjdk-14-jre openjdk-14-jdk"

    # Finalization (as user)
    cat $C/ubuntu-20.04/workspace.dockerfile

# Obligatory newline
echo
```

As you can see, this is a simple linear shell script that outputs the various Dockerfile fragments to `stdout` in a particular order. In addition to the fragment output, we also configure the `IMAGE_NAME` that will be set inside the image's environment itself. Following the `IMAGE_NAME` configuration we copy files (e.g. `docker-user-settings.sh`) into the local build directory for inclusion into the `docker build` context.

If its not apparent, the `Dockerfile.sh` is made executable and run so that its output is piped into a `docker build` command. The actual command is too long for me to ever want to hand type more than once so its always located in a `build.sh` script adjacent to the `Dockerfile.sh` script. The `build.sh` may contain something like the following:

```
FINAL_TAG_NAME=$(whoami)/react-native-dev
TEMP_TAG_NAME=$FINAL_TAG_NAME-$(date +%Y%m%d-%H%M%S)

./Dockerfile.sh | docker build \
    -t $TEMP_TAG_NAME \
    ${*} \
    --build-arg username=$(whoami) \
    --build-arg uid=$(id -u) \
    --build-arg gid=$(id -g) \
    --build-arg groupname=$(id -gn) \
    -f - . && \
    docker tag ${TEMP_TAG_NAME} ${FINAL_TAG_NAME} && \
    docker rmi ${TEMP_TAG_NAME}
```

How this is supposed to work:

1. `Dockerfile.sh`'s output is piped into `docker build`. `docker build` specifies that its reading from standard input with the `-f -` argument. By explicitly using this argument, we're able to maintain that the current directory is the build context for the build process.
2. We provide a default name for the particular image. This is then appended with a timestamp as an image build attempt.
3. Once the image tag name is generated we give the build a go. If the build fails, any existing build of the image remains untouched and the failed build can be purged or left for further troubleshooting.
4. If the build goes according to plan, the name with the timestamp is retagged as the permanent name and the old tag is removed from the docker repository.

Its also worth noting that the `${*}` shoved in the command line is nothing more than a way to allow all argument of `build.sh` to be shoved directly into the `docker build` command. I most often use this to insert `--no-cache` when I know something has changed outside of Docker's observations (e.g. apt repository updates after `apt-get update` has been run).

## File Organization

The organization of the files is still very much a moving target, but I do have something that seems to be working for my current use cases.

Top Level Folders:
- `components` - This is where all the Dockerfile fragments are stored. This folder is organized by `FROM` base line. Therefore I have all of my current fragments stored in an `ubuntu-20.04` subfolder. In the `ubuntu-20.04` subfolder is one more folder where I separate user fragments. This is because as a user, in many cases, you need to use sudo and other workarounds.
- `images` - This is where all the `build.sh` scripts and `Dockerfile.sh` scripts reside. Within the `images` directory there is a subfolder for each Dockerfile use case.
- `services` - This is where docker-compose managed services are stored. These include HTTP proxies and APT proxies that can be made dependencies of the `docker build` process itself. These proxies decrease data usage and increase performance by not forcing each image rebuild to have to go out to the internet for all required files.
- `traditional` - A location for traditionally, tightly coupled, complete `Dockerfile` files. (Maybe this can be only a transitional folder? Although I expect to dump a lot of externally sourced Dockerfiles here for later conversion.)

## Comparison To Other Tech

When developing this, I wanted this to be quick and nearly effortless (i.e. no significant complexity). Use the tools I have to accomplish my needs and improve the development loop. As such, I thought to myself, is this something that docker-compose can help out with? How does K8S solve this problem?

Looking at the docker-compose documentation, there *is* the concept of providing more than one docker-compose.yml file to a docker-compose command. Docker-compose then follows some rudamentary precedence rules for merging the yamls. The main drawback that I could see was that it seemed docker-compose yaml merging was focused on the *running* of the container and not the generation of the image. 

The interesting take away I got from this exercise is that it would seem that what I've developed is likely something that could have been considered a proof of concept for one peice of kubernetes in its infancy. Kubernetes without a doubt can accomplish what I am attempting to do here, but at what cost. With my experience in kubernetes, there is a thin vail of portability that begins to quickly fade once you start working across different providers and frameworks. Each of these providers and frameworks also implement different versions of the K8S API. Finally, the K8S API has been designed for *all* use cases, whereas what I am attempting to do is simply make my docker builds more modular and reusable. 

In summary, I'm sure that there are tools that accomplish the same thing I am attempting to do, but they likely are not yet built into Docker proper and come with additional dependencies that I don't want to spend time learning, maintaining, and troubleshooting when `bash`, `sed`, `cat`, and `echo` work just fine.

## Wishlist Items

What I've got works and I think I'm going to stick with it for awhile to see how it matures. The largest gap I feel may become an issue down the line, esspecially if anyone else starts using my components would be a dependency tree. The idea is to have each fragment declare its dependencies and what it provides to dependents. With this information I would be able to check the order of use with a simple python topology sort.

Ultimately it would be nice to have a proper templating and incude support in the Dockerfile syntax.

## Conclusion

Right, so there we are. A simple convention that allows for the modularlization of Dockerfiles to reuse those little bits of Dockerfile fragments that should not have to be memorized but just referenced.






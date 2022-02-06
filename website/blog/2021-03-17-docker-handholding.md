---
slug: 2021-03-17-docker-handholding
title: "Docker: Automating the over-the-shoulder Docker setup help."
#date: "2021-03-17T12:00:00.000Z"
description: |
  Tired of having to install or troubleshoot docker installations for peers that haven't become familiar with the installation and setup procedure for Docker? I've started a simple check-and-suggest script that will hand hold developers through the setup of docker on Ubuntu systems.
---

## Overview

My excitement for using docker is something that not everyone can appreciate because not everyone has the same experiences. In many cases I just want to implement docker into a script to make a process more stable. The issue with this is that I often work in environments where all the developers checkout the entire code base and emulator the CI process on their own machines.

<!--truncate-->

A constant challenge with depending on developers running the complete CI process on their own developer machines is mismatched tools versions, missing tools, and so forth. There are typical baseline tool sets like gcc, make, and the like, but often you just want to use a new tool and not have to burden the entire team or yourself with setting up that tool. Welp, in a vast majority of situations, a container runtime can solve this very problem. Problem now is that docker is itself a tool that not all of my peers can appreciate and until that day, they possess little to know interest in setting up docker itself.

In some other more rare cases, there are developers that are frankly horrible administrators and just don't have the patience or capacity to setup docker. In these cases I find myself literally sitting down at a user's machine and running through the whole setup process myself. Then when I walk away I can only hope that the user can troubleshoot any breakage they introduce in the following weeks.

## My 5 Minute Solution

In an attempt resolve the above issues, I've scribbled up a simple helper script for hand holding the setup of docker. This will hopefully decrease the barrier for getting started with docker. It basically checks for a few conditions and provides advise for how to resolve any discovered issues. Every in the particular script assumes Ubuntu 18+, although it'd be very straight forward to add specific for Fedora/Redhat/CentOS. (Which I hope to do in time.)

The checks:

- Check that the `docker` client can be found in the path. Whether this exists or not is a good enough indicator as to whether the docker package has been installed with reasonable defaults.
- Check that there is a docker group. This is something that *a ton* of folks get caught up on. Some package managers won't setup a group by default. This means you have to not just create the group but restart the service for it to pickup the group.
- Check that the service is running. Its not always good enough to just install the service, sometimes you need to start the service. 
- Checking access to docker. Its not just enough to know that there is a docker group in the system, you, as a user, have to be an *active* member of the docker group. Once again, folks can get caught up with the fact that just because they've been added to a group, doesn't mean that the environment they are working in agrees with that. Logging out and back in is an often accepted remedy. Sometimes it can be as simple as re-initializing the shell environment with something like `newgrp docker`.

## The Script

```
#!/bin/bash

# Does system already have docker?
DISCOVERED_DOCKER=$(which docker)
if [ -z $DISCOVERED_DOCKER ]; then
    echo "Docker not found in path."
    echo "To continue, run: sudo apt-get install docker.io"
    exit 1
else
    echo "Docker found at: $DISCOVERED_DOCKER"
fi

# Does the system have a docker group?
DOCKER_GROUP_GREP=$(grep docker /etc/group)
if [ "$?" -ne "0" ]; then
  echo "No docker group found in /etc/group"
  echo "To continue, run:"
  echo "  sudo groupadd docker"
  echo "  sudo systemctl restart docker.service"
  exit 1
fi

# Is the docker service running?
DOCKERD_PS_RESULT=$(ps -C dockerd)
if [[ "$DOCKERD_PS_RESULT" == *"dockerd"* ]]; then
  echo "Detected running service."
else
  echo "Service doesn't seem to be running."
  echo "To continue, run: sudo systemctl start docker.service"
  exit 1
fi

# Does user have access to docker?
DOCKER_PS_RESULT=$(docker ps 2>&1)

if [[ "$DOCKER_PS_RESULT" == *"permission denied"* ]]; then
  echo "Failed to access docker as user."
  echo "To continue, run:"
  echo "  usermod -G docker $USER"
  echo "  newgrp - docker"
  echo 
  echo "Note: You may need to re-login for changes to take effect."
  exit 1
elif [[ "$DOCKER_PS_RESULT" == *"CONTAINER"* ]]; then
  echo "Docker access verified."
else
  echo "Unknown error, can not continue."
  exit 1
fi
```

# Potential Improvements

I've worked in environments where the internal docker repository was not hosted on a HTTPS endpoint. In these same environments, there are also credential that can be required for particular pull repositories. For these specialized environments, I'd like to have a simple set of checks to test whether users can actually pull from the repositories that I know they'll need.

Also, there are a whole slew of other checks that you may want to expect users to depend on within their docker environment.

- Is their firewall setup as intended?
- Do they have access to internal package management repo mirrors?
- Are supplemental local caching docker containers running? (e.g. apt-cacher-ng)

These checks can go on and on, but this general pattern of check and suggest seems clean, idempotent, and unobtrusive.
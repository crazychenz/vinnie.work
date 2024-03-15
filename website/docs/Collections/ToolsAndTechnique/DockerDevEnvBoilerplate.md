---
sidebar_position: 4
title: Docker Developer Environment Boilerplate
---

When using containers to setup an application specific development environment, I like to use similar patterns. This includes a set of baseline tools I install with every container for troubleshooting the container itself. I also like to setup a number of quality of life settings to make the use and integration of the container seamless and clear in my workflow.

## File System

Whenever I start a new project that is going to include a docker setup, the docker setups always go into their own folder. If its a simple  setup, it might just be something as simple as docker/Dockerfile.

For more complicated projects (e.g. micro-service-architecture), I'll have a `docker` folder with a subfolder for each image instance. For example:

- `docker/database/Dockerfile`
- `docker/service/Dockerfile`

The key takeaway is that the Dockerfile will never exist in the same directory as the source files of the project. This prevents `docker` from loading all of the project files into the `docker build` context (unnecessarily). With that said, I do store all of the files that I intend to put into the docker image in the folder with the `Dockerfile`. Sometimes I'll even create an `imports` directory specifically for files that I'll be ADDing to the image to clean up the _context_ folder.

The most common/minimal setup that I use is:

- docker
  - Dockerfile - The primary image creation configuration.
  - build.sh - The script that I use to simplify rebuilds.
  - bash-user-settings.sh - Quality of life settings for in-container use.
  - run.sh - The template script for running a docker container with this image.

## `Dockerfile` Boilerplate

Please see inline documentation/comments below for more information:

```Dockerfile
FROM ubuntu:20.04

# Most things (e.g. bash) are better than plain /bin/sh.
# Note: This tricks `docker build` into using bash instead of
#       the less capable /bin/sh that is part of ubuntu base image.
# Note: This should be done first so all subsequent environment
#       settings are part of this new shell environment.
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

# A common setting to prevent apt-get installs from asking questions.
ARG DEBIAN_FRONTEND=noninteractive

# Provide the user shell a namespace (i.e. image name) it's running in.
# This is provided as a --build-arg to docker build.
ARG image_name
ENV DOCKER_IMAGE_NAME=${image_name}

# Ensure that the container has color capabilities.
# Accessibility Note: Colors are for info enhancement and never required.
ENV TERM=screen-256color

# Break that absurd bell! (... that you hear with tab completions.)
RUN echo "set bell-style none" >> /etc/inputrc

# Initial repository list update
# Note: You may have to perform updates when mucking with apt configs
#       or whenever its been a minute between rebuilds.
RUN apt-get update

# Install tzdata with special options for unattended install.
RUN DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get -y install tzdata

# Install additional baseline dependencies.
# Some goodies here are:
# - A text editor (vi), network tools (ping, ifconfig)
# - Downloader (curl, wget, rsync)
# - Revision control system and github interface (git)
# - SSH client, telnet client
# - The *best* scripting runtime (python3)
RUN apt-get install -y net-tools iputils-ping curl wget \
    python3 vim vim-common rsync git openssh-client telnet \
    && apt-get -y autoclean

# Enable sudo and allow sudoers to sudo without passwords.
# Note: We always want to start containers as a user but have ability to sudo.
# Note: Recommended to use `sudo -E` in dockerfiles.
RUN apt-get install -y sudo
RUN sed -i 's/ALL=(ALL:ALL) ALL/ALL=(ALL:ALL) NOPASSWD: ALL/' /etc/sudoers

# User defaults setup to match existing user's info with `whoami` and `id`.
# Arguments are passed from build.sh with:
# --build-arg uid="$(id -u)"
# --build-arg gid="$(id -g)"
# --build-arg groups="$(id -Gn)"
ARG uid=1000
ARG gid=1000
ARG username=user
ARG groupname=user
ARG groups=user

# Create the user within the container and setup all associated groups.
RUN addgroup --gid ${gid} ${groupname}
RUN adduser --system --disabled-password --uid ${uid} --gid ${gid} ${username}
RUN adduser ${username} sudo
COPY append_groups.sh /root/append_groups.sh
RUN /root/append_groups.sh ${username} ${groups}

# Switch build context to user permissions
USER ${username}

# Setup the user home directory.
RUN rsync -rv /etc/skel/ /home/${username}/
# As recommended, alias sudo to `sudo -E`
RUN echo "alias sudo='sudo -E'" >> /home/${username}/.bashrc

# Add our quality of life shell configurations and set to auto-load.
COPY bash-user-settings.sh /home/${username}/.bash-user-settings.sh
RUN echo source ~/.bash-user-settings.sh >> /home/${username}/.bashrc

# Setup the default workspace that the container starts in.
# Note: I used to use /workspace, but /opt is more standard.
WORKDIR /opt
```

## `build.sh` Boilerplate

Having to type `docker build ... ... ...` every time you make any small change to a Dockerfile is very annoying. Instead of dealing with that headache I've opted to always provide myself with a `build.sh`. Note: I often will do the same for docker-compose configurations as well. The idea behind the `build.sh` is not just brevity, but also to hide away more complex things like the extract of uids, gids, and other user groups.

Please see inline documentation/comments below for more information:

```sh
#!/bin/sh

# Give all of your images a namespace. Often, $(whoami) is good enough.
IMAGE_NS=crazychenz
# Give this image specific build script a image name.
IMAGE_NAME=xltr
# You can throw a version in the tag, or tie it to a base image.
IMAGE_TAG=ubuntu-20.04

# Leave this alone. This is standard layout for full image names (minus host).
IMAGE_FULLNAME=${IMAGE_NS}/${IMAGE_NAME}:$IMAGE_TAG

# Here, we're are providing `docker build` with the Dockerfile via STDIN.
# With this pattern we can choose to provide our Dockerfile dynamically or
# from a file path. With this pattern we can also use a different context
# folder than our Dockerfile is located in.
# Note: We automatically extract uid, gid, and group ids from current user.
cat Dockerfile | docker build \
  --build-arg image_name="$IMAGE_NAME" \
  --build-arg uid="$(id -u)" \
  --build-arg gid="$(id -g)" \
  --build-arg groups="$(id -Gn)" \
  -t "$IMAGE_FULLNAME" -f - . \
  && echo "Created image $IMAGE_NS/$IMAGE_NAME"
```

You can also optionally add a `$@` or `${*}` to the command to allow a quick `./build.sh --no-cache` for a fresh rebuild.

```sh
cat Dockerfile | docker build \
  --build-arg image_name="$IMAGE_NAME" \
  --build-arg uid="$(id -u)" \
  --build-arg gid="$(id -g)" \
  --build-arg groups="$(id -Gn)" \
  $@ \
  -t "$IMAGE_FULLNAME" -f - . \
  && echo "Created image $IMAGE_NS/$IMAGE_NAME"
```

## `bash-user-settings.sh` / `append_groups.sh` Boilerplate

### `bash-user-settings.sh`

There are typically a number of things I like to be made aware of when I am running within a container:

- Am I actually in a container?
- What image is this container based on?
- What specific container of this image is running?
- What user am I running as? As in ... what will show up in my compiled code or tar files?
- What is the host name of the environment I'm running in?
- When did I last run a command in my buffer? Specifically the previous command.
- Am I in a git repo? What branch is checked out? Is it dirty, staged, or committed?

All of this is compressed into a single 2 line prompt that looks something like:

<div style={{ backgroundColor: "#111" }}>
<span style={{ color: "aqua", fontFamily: "monospace" }}>user</span>
<span style={{ color: "darkgray", fontFamily: "monospace" }}>@</span>
<span style={{ color: "lightgreen", fontFamily: "monospace" }}>desktopvm</span>&nbsp;
<span style={{ color: "orchid", fontFamily: "monospace" }}>[35dd92c7@xltr]</span>&nbsp;
<span style={{ color: "red", fontFamily: "monospace" }}>(master)</span>&nbsp;
<span style={{ color: "darkgray", fontFamily: "monospace" }}>2022-11-18-09:52:44</span><br />
<span style={{ color: "khaki", fontFamily: "monospace" }}>/opt$&nbsp;_</span>
</div><br />

Please see inline documentation/comments below for more information:

```sh
# Configure aliases fpr the terminal colors.
COLOR_LIGHT_BROWN="$(tput setaf 178)"
COLOR_LIGHT_PURPLE="$(tput setaf 135)"
COLOR_LIGHT_BLUE="$(tput setaf 87)"
COLOR_LIGHT_GREEN="$(tput setaf 78)"
COLOR_LIGHT_YELLOW="$(tput setaf 229)"
COLOR_YELLOW="$(tput setaf 184)"
COLOR_RESET="$(tput sgr0)"
COLOR_GREEN="$(tput setaf 83)"
COLOR_ORANGE="$(tput setaf 208)"
COLOR_RED="$(tput setaf 167)"
COLOR_GRAY="$(tput setaf 243)"

# Helper for showing colors in user specific terminal window+profile.
# Inspired by:
# https://www.lihaoyi.com/post/BuildyourownCommandLinewithANSIescapecodes.html
function show_colors {
    python <<PYTHON_SCRIPT
import sys
for i in range(0, 16):
    for j in range(0, 16):
        code = str(i * 16 + j)
        sys.stdout.write(u"\u001b[38;5;" + code + "m " + code.ljust(4))
    print u"\u001b[0m"
PYTHON_SCRIPT
}

# Define colors for git branch/checkout depending on state.
# Inspired by:
# https://coderwall.com/p/pn8f0g
function git_branch {
  git rev-parse --is-inside-work-tree &> /dev/null
  if [ "$?" -eq "0" ]; then
    local git_status="$(git status 2> /dev/null)"
    local on_branch="On branch ([^${IFS}]*)"
    local on_commit="HEAD detached at ([^${IFS}]*)"

    if [[ ! $git_status =~ "working tree clean" ]]; then
        COLOR=$COLOR_RED
    elif [[ $git_status =~ "Your branch is ahead of" ]]; then
        COLOR=$COLOR_YELLOW
    elif [[ $git_status =~ "nothing to commit" ]]; then
        COLOR=$COLOR_LIGHT_GREEN
    else
        COLOR=$COLOR_ORANGE
    fi

    if [[ $git_status =~ $on_branch ]]; then
        local branch=${BASH_REMATCH[1]}
        echo -e "$COLOR($branch) "
    elif [[ $git_status =~ $on_commit ]]; then
        local commit=${BASH_REMATCH[1]}
        echo -e "$COLOR($commit) "
    fi
  fi
}
export -f git_branch

# Fetch the date in a canonical format.
function get_prompt_date {
    echo -e "$COLOR_GRAY$(date +%Y-%m-%d-%H:%M:%S)"
}
export -f get_prompt_date

# Get docker identity. Useful for doing `docker exec`, `docker stop`, etc.
# Note: This used to rely on /proc/1/cpuset, but with newer dockers we
#       now rely on volume mounting the output of --cidfile from `docker run`.
# Inspired by:
# https://stackoverflow.com/questions/20995351
function get_docker_ident {
    DOCKER_CONTAINER=$(cat /containerid | cut -c1-8)
    DOCKER_IDENT="[$DOCKER_CONTAINER@$DOCKER_IMAGE_NAME]"
    if [ "$DOCKER_IDENT" == '[/@]' ]; then
        echo ""
    else
        echo -e "$COLOR_LIGHT_PURPLE$DOCKER_IDENT "
    fi
}
export -f get_docker_ident

# Note: Without \[ \] properly placed, wrapping will not work correctly.
# More info found at: https://robotmoon.com/256-colors/
USERHOST_PSENTRY='\[$COLOR_LIGHT_BLUE\]\u\[$COLOR_GRAY\]@\[$COLOR_GREEN\]\h '
PS1="${debian_chroot:+($debian_chroot)}$USERHOST_PSENTRY"
PS1="$PS1\$(get_docker_ident)"
PS1="$PS1\$(git_branch)"
PS1="$PS1\$(get_prompt_date)"
WORKINGDIR='\[$COLOR_LIGHT_YELLOW\]\w'
PROMPT_DELIM='\[$COLOR_RESET\]\$ '
export PS1="$PS1\n$WORKINGDIR$PROMPT_DELIM"

# All terminals append to a single history.
export PROMPT_COMMAND='history -a'

```

### `append_groups.sh`

This is a simple utility script for adding all of the host user's groups to the container.

```sh
#!/bin/sh

username="$1"
shift
for g in $@; do usermod -aG ${g} $username ; done
exit 0
```

## `run.sh` Boilerplate

Once the docker image is built, more often than anything else I'll find myself running the container. Instead of blistering my fingers typing out `docker run blah blah blah` all the time, I always setup what I call _run templates_. 

Here is a typical `run.sh`:

```sh
#!/bin/bash

# Get a temporary directory to store --cidfile output in.
CONTAINER_ID_FPATH=$(mktemp -d)

# Define common run parameters
CMD_PREFIX="docker run \
    -ti --rm \
    --network host \
    --cidfile ${CONTAINER_ID_FPATH}/containerid \
    -v ${CONTAINER_ID_FPATH}/containerid:/containerid \
    -v $(pwd):/opt \
    crazychenz/xltr:ubuntu-20.04"

# Determine if script was invoked with or without arguments and handle it.
if [ $# -gt 0 ]; then
  $CMD_PREFIX bash -li -c "${*}"
else
  $CMD_PREFIX bash -li
fi

# Remove the temporary directory. Assumes `docker run` blocks until exit.
rm -r ${CONTAINER_ID_FPATH}
```

The key take away in this script is the fact that I always volume mount `$(pwd)` to the Dockerfile `WORKDIR` path. This means that when ever I call `run.sh`, the container will always open with my current directory as the container's current directory. This also compliments another behavior that I observe: Always work on projects from the top-level folder of the project. For example, when working on the Linux kernel source code, I always address paths and compilations from the same folder as the top level Makefile. 

The above `run.sh` script is one of a dozen different _run template_ patterns that I use. Another one that I often use is to alias a tool within a container as a shell script. 

Here is an example of a run script for `yarn` within a NodeJS image I use:

```sh
#!/bin/sh

docker run -ti --rm \
  -v $(pwd):/opt/website \
  -w /opt/website \
  --network host \
  node:16-alpine yarn "$@"

```

With this run script, I simply _pretend_ that I have `yarn` installed in my current environment, but instead of actually running `yarn`, I run `yarn.sh <arguments>` and it automatically kicks off the container. This all works because all of the dependencies for the NodeJS environment are kept in the `node_modules` folder. The same can be applied to a python environment with virtualenv/pipenv.
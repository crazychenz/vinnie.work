---
slug: 2022-01-28-why-so-hard-buildkit
title: 'Why so hard?: Docker Buildkit'
draft: true
---

I talked about my first experience with build kit in [Why So Hard?: BuildKit to Local Repository](/blog/2021-11-04-why-so-hard-buildkit-to-local-registry). In short, Docker has decided to abandon a subset of their customer base in favor of what they believe is a more scalable and lucrative market space. It feels like a bait and switch. While I disagree with their decision and direction, their market share is undisputable and its likely that my peers will continue to use the service and therefore I believe its time for me to stop ignoring the future of Docker.

In summary, forget everything you think you know or like about Docker (especially `docker build`) and start from scratch. Ignore all the "its faster", "its more flexible", "its works with K8S!". None of this makes sense if we know nothing about Docker! We've forgotten it all! _Did you already forget?_

<!-- truncate -->

## Overview

My crude definition of this tool: A utility for management of the various Linux namespace domains (e.g. mount namespaces, network namespaces).

- Docker allows a user to build custom execution environments.

  > This interestingly goes against the old Unix adage about using shared libraries to prevent duplication and encouraging re-use. But as technology has gotten better and cheaper, the problem has changed from a matter of resources to a matter of repeatability, manageability, and distribution. In comparison, Mac OSX and Microsoft Windows have been using independent application environments for decades, albeit not as isolated as Linux's namespaces. But still, its interesting to see the *nix community fighting for shared resources and code reuse for eons only to become the exact opposite by duplicating the operating system for a single application. _But hey, its better than a single VM per application, right?_

- Docker, at times, will pretend to be an end-all-be-all containerization tool suite. The thing to understand is that containers are made up of several major categories:
  - Image Descriptions - The `Dockerfile` is an example of a description file that defines how to build and rebuild an image. There are many other files that can accompany the `Dockerfile` (e.g. `'.dockerignore`).
  - Runtime Environment - This is the Linux namespaces and execution environment instance that is running somewhere (e.g. locally, in a VM, or in the cloud.)
  - Open Container Images (OCI) - This is the serialized format that represents a baseline for an execution environment. You can think of this as the OS-App install disk.
  - Registries and Repositories - These are a collection of networked resources that facilitate the duplication and distribution of pre-existing configurations and images.
  - Clustering/Service Management - Dockers market value remains in its value to assist with setup and maintenance of micro service collection/clusters via k8s or swarm.

## Docker Build

Docker builds are managed with a tool suite known as buildkit. Its dangerous to think of buildkit as part of Docker. Buildkit operates independent of docker. Its loosely coupled into the `docker build` command, but that doesn't mean that it has access to the local Docker image repository or cares about any of the Docker daemon policies. It is its own entity that does what it wants!

Ok, so there are several terms to understand before I delve into my microscopic experience with this tool:

- `docker context` - This is a definition of a docker runtime host or endpoint (like K8S).
- `docker buildx` - This is the explicit sub-command call to use buildkit. `docker build` will also implicitly call buildkit nowadays.
- `docker buildx create` - Creation in buildkit means _create a new builder object_. The primary purpose of a builder object is to have a reference to a thing that stores buildkit configuration, and the build cache. Having a cache is a primary benefit of Docker because when you rebuild an image you don't want it built from scratch every single time.
- `docker buildx build` - Build an image with a given _builder_ (as defined with `docker buildx create`).

## My Development Use Case

When I'm building a Docker image, I want it to be repeatable (within reason) and I want it to be usable as base images for subsequent image creations.

### Building The Image

When building a docker image, the first thing to determine is a name. A _good_ docker image name includes the destination _host_, a _namespace_, and a _functional name_. Optionally, there is a tag that is used for version or revision information. Ok, so if I want to create an image on the `localhost:5000` that is a `swiss-knife` in the `crazychenz` namespace specifically for `ubuntu-20.04`, I would make the name:

```text
localhost:5000/crazychenz/swiss-knife:ubuntu-20.04
```

When we create the buildkit builder object, I usually give it a name that resembles what the image name will be. I replace `/` symbol with `__` since you can only use `._-` symbols in a builder name. Using the above name, I would derive something like the following for my builder name:

```text
crazychenz__swiss-knife__ubuntu-20.04
```

When doing development, I often find it easiest to use the host network for all of my containers. This allows me to just connect to ports on localhost to access container provided resources instead of messing with port mappings or virtual subnets (which is a whole other piece of docker). Buildkit needs to be told that its OK with host networking at the builder object level. Some forums recommend using the `--buildkit-opt '--allow-insecure-entitlements network.host'` option. I prefer to reserve the `--buildkit-opt` for configuration overrides and simply put the entitlement definitions in a configuration file (`buildkitd.toml`):

```toml
# See https://github.com/moby/buildkit/blob/master/docs/buildkitd.toml.md for more info.
debug = false
insecure-entitlements = [ "network.host" ]
```

Once you have that configuration file created, you can run the following command to create a builder:

```sh
 docker buildx create \
    --config buildkitd.toml \
    --driver docker-container \
    --driver-opt network=host \
    --name "crazychenz__swiss-knife__ubuntu-20.04" \
    --use
```

Note: At the time of this writing, Docker documentation will claim that you can use the `--driver docker` argument. This has been **false** for years for an entitlement situations. You'll see the error `error: failed to find driver "docker"` when this issue crops up.

After that we're ready to build our image. Remember, buildkit is not tightly integrated into Docker. Therefore we must instruct the buildkit `build` command to build the image _AND_ output the result into the local docker repository. This is exactly what the `--load` argument does.

```sh
cat Dockerfile | docker buildx build \
  --builder crazychenz__swiss-knife__ubuntu-20.04 --load \
  --network host \
  --build-arg image_name="$IMAGE_NAME" \
  --build-arg uid="$(id -u)" \
  --build-arg gid="$(id -g)" \
  --build-arg groups="$(id -Gn)" \
  -t "localhost:5000/crazychenz/swiss-knife:ubuntu-20.04" -f - . \
  && echo "Created image crazychenz/swiss-knife"
```

The `--build-arg` values are values that are used in the Dockerfile. In my normal environment I have the shell display the image name (via `image_name`) and I setup a user with the same uid/gid as the local user so that I don't have to worry about weird permission issues when I'm bind mounting a folder to work within.

The other thing I do a bit differently is delivering the `Dockerfile` via STDIN instead of using `-f`. This pattern gives me the option to replace `cat Dockerfile` with a shell script that can dynamically generate the `Dockerfile` content. The other non-obvious benefit ... In older versions of Docker this pattern allowed me to target a folder other than the `Dockerfile` folder as the _build context_. The notion that all files within a folder is uploaded as _build context_ is not relevant with regards to buildkit. Buildkit will only upload referenced files from the _build context_ location.

After that `docker buildx build` command is complete, there should be a new `localhost:5000/crazychenz/swiss-knife:ubuntu-20.04` entry in `docker images`. You should now be able to run the container from the local repository:

```sh
#!/bin/bash

CMD_PREFIX="docker run \
    -ti --rm \
    --network host \
    -v $(pwd):/workspace \
    localhost:5000/crazychenz/swiss-knife:ubuntu-20.04"

if [ $# -gt 0 ]; then
  $CMD_PREFIX bash -li -c "${*}"
else
  $CMD_PREFIX bash -li
fi
```

This setup does several things:

- The container is accessible from a terminal emulator via (`-ti`).
- The container will be automatically removed when I exit (saving space and making new command repeatable).
- The container uses host networking (allowing me to ignore special IPs or port mapping).
- The container always mounts the current directory into `/workspace`. This enables me to change directory into a project directory, run the container and just start working.
- The `run.sh` script will allow me to run a single build command or implicitly start a shell if no command is provided.

You can also do most of this with `docker-compose`, but I reserve the use of `docker-compose` for service management. This use case is for application development.

## Re-Using The Image

So far we've build and ran a Docker image, but how do we re-use an image as a base image of another? Buildkit (using the docker-container driver) has no direct access to the local image repository. Therefore we need to setup our own network accessible registry for buildkit. (Yep! Lets duplicate all the things!)

Before you start the registry, if you want to ensure that the pushed images persist a restart or power failure, its a good idea create a docker volume for `/var/lib/registry` or bind mount `/var/lib/registry` to some host folder. I opted for the docker volume:

```sh
docker volume create register
```

Now we can simply start the registry with:

```sh
docker run -d -p 127.0.0.1:5000:5000 --name registry -v registry:/var/lib/registry --rm registry:2
```

With the registry running, we need to push the image we just created to it. Note: Remember we named our image `localhost:5000/...`? That `localhost:5000` bit refers to this registry. If you have another host number or port, you'll want to rename (i.e. tag) your local image with the appropriate hostname and port. No worries, no image rebuilding required, its just a meta data change. To push the image to the registry, you just use `docker push`:

```sh
docker push localhost:5000/crazychenz/swiss-knife:ubuntu-20.04
```

Yay!, now buildkit can pull down that image into its build context for use in subsequent image construction. (What are we up to for copies? 3? WTF?) In an example, the following `Dockerfile` uses the pushed images to generate a new image with additional packages:

```Dockerfile
FROM localhost:5000/crazychenz/swiss-knife:ubuntu-20.04

USER root
ARG DEBIAN_FRONTEND=noninteractive
ENV DOCKER_IMAGE_NAME=aarch64-dev

RUN apt-get update && apt-get install -y build-essential
```

<details><summary>Script examples for building and running containers for this use case.</summary>

**build.sh**:

```sh
#!/bin/sh

IMAGE_HOST="localhost:5000/"
IMAGE_NS=crazychenz
IMAGE_NAME=swiss-knife
IMAGE_TAG=ubuntu-20.04

BUILDER_NAME="$IMAGE_NS__$IMAGE_NAME__$IMAGE_TAG"

# Check if builder exist
docker buildx inspect $BUILDER_NAME >/dev/null 2>/dev/null
if [ "$?" != "0" ]; then
  docker buildx create \
    --config buildkitd.toml \
    --driver docker-container \
    --driver-opt network=host \
    --name "$BUILDER_NAME" \
    --use
  echo "Created builder $BUILDER_NAME"
else
  echo "Using existing builder $BUILDER_NAME"
fi

cat Dockerfile | docker buildx build \
  --builder $BUILDER_NAME --load \
  --network host \
  --build-arg image_name="$IMAGE_NAME" \
  -t "$IMAGE_HOST$IMAGE_NS/$IMAGE_NAME:$IMAGE_TAG" -f - . \
  && echo "Created image $IMAGE_NS/$IMAGE_NAME:$IMAGE_TAG"
```

**run.sh**:

```sh
#!/bin/bash

CMD_PREFIX="docker run \
    -ti --rm \
    --network host \
    -v $(pwd):/workspace \
    localhost:5000/crazychenz/swiss-knife:ubuntu-20.04"

if [ $# -gt 0 ]; then
  $CMD_PREFIX bash -li -c "${*}"
else
  $CMD_PREFIX bash -li
fi
```

**buildkitd.toml**:

```toml
# See https://github.com/moby/buildkit/blob/master/docs/buildkitd.toml.md for more info.

debug = false
# root is where all buildkit state is stored.
# root = "/var/lib/buildkit"
# insecure-entitlements allows insecure entitlements, disabled by default.
#insecure-entitlements = [ "network.host", "security.insecure" ]
insecure-entitlements = [ "network.host" ]
```

**Dockerfile**:

```Dockerfile
FROM ubuntu:20.04

# Most things (e.g. bash) are better than /bin/sh.
# Note: This tricks `docker build` into using bash instead of
#       the dorked /bin/sh that is part of ubuntu base image.
# Note: This should be done first so all subsequent environment
#       settings are part of this new shell environment.
RUN rm /bin/sh && ln -s /bin/bash /bin/sh

ARG DEBIAN_FRONTEND=noninteractive

# Provide shell a namespace it's running in.
ARG image_name
ENV DOCKER_IMAGE_NAME=${image_name}

# Prompts without color should be the edge case.
ENV TERM=screen-256color

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
    && apt-get -y autoclean

# Allow sudoers to sudo without passwords.
# Note: Recommended to use `sudo -E` in dockerfiles.
RUN apt-get install -y sudo
RUN sed -i 's/ALL=(ALL:ALL) ALL/ALL=(ALL:ALL) NOPASSWD: ALL/' /etc/sudoers

# User defaults, ideally setup to match existing user's info with `whoami` and `id`.
ARG uid=1000
ARG gid=1000
ARG username=user
ARG groupname=user
ARG groups=user

RUN addgroup --gid ${gid} ${groupname}
RUN adduser --system --disabled-password --uid ${uid} --gid ${gid} ${username}
RUN adduser ${username} sudo
COPY imports/append_groups.sh /root/append_groups.sh
RUN /root/append_groups.sh ${username} ${groups}

USER ${username}

RUN rsync -rv /etc/skel/ /home/${username}/
RUN echo "alias sudo='sudo -E'" >> /home/${username}/.bashrc

ADD imports/bash-user-settings.sh /home/${username}/.bash-user-settings.sh
RUN echo source ~/.bash-user-settings.sh >> /home/${username}/.bashrc

WORKDIR /workspace
```

</details>

### Inspecting The Registry

Oh man, did I remember to push the updates for that image to the registry? What is the command to inspect the registry?

Sorry, docker doesn't include a built in way to read from a remote registry. You'll need to use `curl` and your enate ability to read information from JSON.

To retrieve a remote registry's catalog of images:

```sh
curl -X GET http://localhost:5000/v2/_catalog
```

To retrieve the tags for a given image (e.g. `crazychenz/swiss-knife`):

```sh
curl -X GET http://localhost:5000/v2/crazychenz/swiss-knife/tags/list
```

In practice, I've more commonly dealt with private remote registries through services like JFrog's Artifactory. For those that aren't interested in licensing Artifactory, there is a docker image that'll host a registry browser on Docker Hub:

```text
docker pull klausmeyer/docker-registry-browser
docker run --rm --network host --name registry-browser -p 8080:8080 klausmeyer/docker-registry-browser
```

Since we used a docker volume for our registry, we'll need to monitor the size of that over time. This is accomplished by running `docker system df -v` and locating the docker volume name in the listing.

## Conclusion

Now that wasn't so hard, was it? You only needed to create an extra builder object, a docker registry, and duplicate any base images 3 times (via push/pull to registry) across a network. Easy peasy.

## Resources

- [Docker Buildkit and GitHub docker registry](https://github.com/mvgijssel/setup/wiki/Docker-Buildkit-and-GitHub-docker-registry)
- [How to get a list of images on docker registry v2](https://stackoverflow.com/questions/31251356/how-to-get-a-list-of-images-on-docker-registry-v2)
- [Deploy a registry server](https://docs.docker.com/registry/deploying/)
- [Example buildkitd.toml](https://github.com/moby/buildkit/blob/master/docs/buildkitd.toml.md)

<!-- Evidence of poor community Docker support:

- [Cannot build from local image with buildctl (OCI Worker)](https://github.com/moby/buildkit/issues/1142)
- [buildx with network=none generates entitlement error](https://github.com/docker/buildx/issues/524)
- [Incorrectly documented --driver docker docs](https://docs.docker.com/engine/reference/commandline/buildx_create/) -->

## Comments

<Comments />


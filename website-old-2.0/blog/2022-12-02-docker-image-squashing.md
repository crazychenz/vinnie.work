---
slug: 2022-12-02-docker-image-squashing
title: 'Docker Image Squashing'
draft: false
---

## Background

Docker squashing is something that has been around for awhile. For those not in the know, when you create a Docker image it layers each of the commands in the Dockerfile into their own filesystem overlay. The aggregate of these overlays are what you containers starts with.

Now, when you have vary large files getting downloaded into the build process of an image, you can find yourself with a very bloated image. Squashing is generally the solution here.

<!-- truncate -->

In my specific case, I was able to build my image and see that it was ~20GB in size. The way I knew I wanted to _squash_ this image was because I could fire up a container of this image and run `du -d 0 -h` to see that the entirety of my filesystem was actually ~11GB. This was because the build context had a large zip file that was copied to the file system in one layer and then extracted in another. Bah!

## How I Don't Squash

Squashing has been a desirable action for a long time in the docker eco-system. You can see this through the mirad of third party squashing tools that you can have accomplish the tasks with varying levels of success. While I'll be happy to give a third party application a whirl, I want to know I can't do it with Docker proper first.

At one point, docker itself had a `--squash` flag integrated into its `docker build` process. Although, to access this flag you had to enable the _experimental_ features in the Docker daemon. When I personally got around to doing this, there was some kind of issue with layers not having valid parents. All this is to say that `--squash` was not the solution.

## Multi-Stage Builds

When looking through github issues about `--squash` and the error I encountered, I came across a comment that was something to the effect of: _We're going to remove --squash because of Multi-Stage Builds_. There was no clarification, just simply a "matter of fact". Huh?

Regardless of what the commenter has intended, this gave me the idea to use Multi-Stage builds for squashing. Fundamentally, isn't an image simply a file system? To test this I re-copied all the files from my big image to a image based on scratch:

```Dockerfile
FROM big_image as source

COPY --from=source / /
```

When I did that it certainly did copy the files and squash all of the layers. Unfortunately it also wipes all of the Docker environment settings. Therefore, you'll need to include those in your squashing Dockerfile:

```Dockerfile
FROM big_image as source

FROM scratch
COPY --from=source / /

ENV DO_THING=1
ARG username=user
USER ${username}
WORKDIR /opt
```

Ok! This worked very well. I've now got a working 11GB image where I previously had a 20GB image. But how should I prevent my squasher from falling out of sync with my original image builder? Multi-stage builds, duh!

The final Dockerfile:

```Dockerfile
FROM ubuntu:20.04 as big_image

# ... do big_image build commands ...

FROM scratch

COPY --from=big_image / /

ENV DO_THING=1
ARG username=user
USER ${username}
WORKDIR /opt
```

The one thing to watch out for here is that Docker will create dangling images when using multi-stage builds. The easy fix for this is to run `docker image prune` after the build.

## Comments

<Comments />

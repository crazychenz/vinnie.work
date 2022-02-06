---
slug: 2021-05-15-github-jenkins-docker-oh-my
title: 'Github Webhooks, Jenkins, and Docker Oh My.'
draft: false
---

Its been awhile since I've made a post due to a bunch of family related things and attempting to get over a feature hump in the current mobile application I've been working. The mobile app design and organization is beginning to gel into something I feel comfortable investing in. Therefore I spent the last weekend wiring up my continuous integration infrastructure for what I hope to be the rest of the application's life cycle.

<!--truncate-->

## Let It Marinade

_What? You didn't setup CI/CD from the beginning?_ Of course not. This particular project was a very new experience for me and I actually have re-implemented the entire backend about 4 times across many different services using different design patterns. I also have re-implemented the front end of the application 3 different times using 2 different frameworks. Therefore I didn't want to invest a bunch of time in testing, CI/CD, DevOps, and so forth until all of that upfront design was more solid.

## Jenkins, Fetch Me My Build

What I've ended up with so far is a managed Expo based react native application backed by a set of Azure functions that depend on a Postgres database. All the code is stored in a private Github repository.

My goal is to have all of the native binaries built, and automatic tests run (not in that particular order) whenever I push/merge changes into my special `stage` branch. When I originally set out to achieve this I thought that it was going to be a simple matter of install Jenkins, configure Github webhook, configure Jenkins job with a build script, and then watch the magic happen. **Not so fast!** I clearly over trivialized the configuration required, especially considering I was going to use Docker for nearly everything.

Immediate things to consider for setup included:

- DNS entry pointing to internet interface of Jenkins site.
- Port Forwarding rules from internet gateway/router to Nginx host.
- Nginx configuration listening on internet interface and forwarding to Jenkins host. (All my other Nginx interfaces only listen on VPN interfaces.)
- Nginx security rules that only allow communication from a whitelist of IP addresses. (This can be in `netfilter`/`iptables`, Nginx configuration, or both).
- Jenkins host setup with correct URL prefix.
- Jenkins host setup for Docker-outside-of-Docker (DooD).
- Jenkins host setup with docker volume that would be accessible from other docker containers.
- Build scripts setup with considerations that Jenkins may run as a different user.

## Jenkins with Docker

In my development environments, if I am going to be using a toolchain, SDK, or environment for any significant amount of time, I setup a docker image to hold all of the dependencies for that environment. This creates an extra complexity for Jenkins. I want to be able to run Jenkins from inside a docker container so whatever my build system is, it needs Docker setup. I also need to consider the permissions, network routing, and configuration required to have the docker system running independent and in harmony with Jenkins.

While not impossible, this isn't a trivial thing to attempt in a given evening. A little planning and understanding of the system and all of its setup are required.

In my particular case, I had to break many conventions that I had been using to organize my Docker ecosystem. This was due to the fact that having a Jenkins system was the first time I was thinking about running all my docker containers as another user on my development system. (Less of an issue if all synchronization occurs through git and the docker images are duplicated on another system.)

## Docker-outside-of-Docker (DooD)

So if everything requires a docker container to build and Jenkins itself is running from a docker container, Jenkins (from a container) needs the ability to invoke and direct another container to build the files it checked out in its namespace. The general solution to this is to build a Jenkins docker image that layers a docker-compose client into the container and when the container is run, it has `/var/run/docker.sock` mapped into it from the host. This of course assumes that the `dockerd` daemon is already running.

Another issue with having an external container build the code for Jenkins is that the source code is checked out by Jenkins in the Jenkins container. Using bound volume mounts are possible but messy because I must pass the Jenkins home directory path to the build scripts so they can delta them against the `WORKSPACE` environment variable to get the host path of the data. This is compounded by the fact that the host path needs to also be mapped back into whatever path the external container has the source code mapped into. My simple solution for this was to just mount the Jenkins home directory in a docker volume and mount it in the same location in both (or all relevant) containers. This way there is no file path translation that has to occur. **Note:** This feels fragile, but it works.


## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>

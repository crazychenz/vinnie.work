---
slug: 2022-12-15-docker-localhost
title: 'Accessing a Docker container's outer _localhost_.'
draft: false
---

## Background

When using Docker, you have the "dockerd host" (i.e. the platform managing the containers) and you have the running containers. Each container has a `localhost` and the "dockerd host" has its own `localhost`. Whether you use `--network host` or not, you can not use `localhost` to communicate between the "dockerd host" and the container.

<!-- truncate -->

If you are anything like me, you'll often find yourself setting up quick and dirty services running in a container that is hosted with `--network host` and available on `localhost` from the context of the "dockerd host". Let's say its a caching service. In addition to the caching service being available on the "dockerd" host, you'll then want to use that containerized caching service from another container ...only you can't because of the non-route-ability of localhost. For these quick and dirty one-offs, I don't want to have to think about domain names, user network configurations, or specific IP addresses. If `localhost` isn't an option (because of containerization), I now have to resort to the more complicated setups ... or do I?

## `host-gateway`

When using Docker containers within docker networks, sometimes there are the `host.docker.internal` and/or `gateway.docker.internal` host names that you can use to point at services on the host. In my case, these host names are not available. Although they can explicitly be made available via the `--add-host` argument.

When `dockerd` starts, it sets a `host-gateway` IP that is the default bridge between a "regular" container and its host. You can explicitly set this value using the `--host-gateway-ip` argument in the `dockerd` startup scripts. `host-gateway` is a special string that can be used in the `--add-host` argument of a `docker` command that creates containers (e.g. `run`, `create`, `build`). This argument automatically appends various hosts to the container's `/etc/hosts` file so that you don't have to setup a DNS or any other fancy service that needs to be managed.

Knowing this, you can explicitly set the `host.docker.internal` to IP mapping with `--add-host host.docker.internal:host-gateway`. 

## `dockerhost`

Explicitly adding `host.docker.internal` mapping to a container is all well and good, but I don't like _explicitly_ messing with mechanics that should be _implicit_ and I certainly don't like using reserved namespaces (i.e. `docker.internal`). The issue of using `host.docker.internal` is compounded by the fact that if I want to use a `Host` lookup based web service, I'd have to hi-jack the `docker.internal` domain in the web service configuration to handing the request effectively. And that just feels weird.

As a solution to this problem, I've started using a new pattern: Using a play on the term `localhost`, I've started using a new term `dockerhost`. 

`dockerhost` build Example:

```sh
docker build -t crazychenz/cache --add-host dockerhost:host-gateway $@ .
```

The above command enables me to host (in another container) a caching service that I can connect to from this new `docker build` process. Having this allows me to point a generic APT `sources.list` file at the caching service without having to worry about DNS, VPNs, or other complicated methods to manage the access to my "dockerd host".

## Conclusion

The primary takeaway here is that from now on, whenever developing a Dockerfile that is intended to host a service for other containers, I intend to always add the `--add-host dockerhost:host-gateway` argument to the build and possibly the runtime command.

## Resources

- [Docker Networking](https://docs.docker.com/desktop/networking/)
- [dockerd Arguments](https://docs.docker.com/engine/reference/commandline/dockerd/)

## Comments

<Comments />

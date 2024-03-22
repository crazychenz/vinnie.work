---
sidebar_position: 3
title: DNS
---

## Overview

Nearly everything that has to do with web services requires DNS entries. For example, if you want a web server to provide Host based routing to multiple _virtual_ hosts on the same IP, you need DNS entries. If you want to enable server side or client side TLS in web services, you'll most certainly want host names (although not strictly required). Plus, many advanced web features (e.g. progressive web applications) are required to only exist in an HTTPS context by the web browser. In summary, following a baseline OS install, having a DNS server setup is a must.

There are a few different DNS servers worth considering for a small-scale network. CoreDNS, bind, and dnsmasq to name a few. For my purposes, dnsmasq remains the best choice because of its built in DHCP and TFTP functionality. Combining DHCP, TFTP, and DNS affords you the ability to setup PXE boot on your network, enabling auto-provisioning of systems as they are connected and boot from the network. That said, for now we'll only focus on DNS in our "initial" environment.

For our initial environment, we're going to cheat a bit with the configuration of dnsmasq. For starters, we'll configure the dns entries directly within our `docker-compose.yml` file for dnsmasq. This is possible because Docker requires control over the `/etc/hosts` file via `--add-host` arguments and dnsmasq includes `/etc/hosts` in its resolver. Secondly, we're going to use the host network stack when starting up dnsmasq. There is a lot of complexity with hosting a service for nodes on an external network from one docker container to another that aren't within the same docker network. We can eliminate much of that complexity by hosting our DNS server in the host network. By default, most docker containers will use the host's DNS configuration (found in /etc/resolv.conf). If we need to be more explicit, we can add a `--dns=` argument to the relevant services.

## The Steps

Before we create our dnsmasq container, there are 2 pre-requisites in a Debian/Ubuntu environment:

1. Set the nameserver in `/etc/resolv.conf` to something external (e.g. 9.9.9.9).
2. Disable systemd-resolved DNS cache running on 127.0.0.1:53.
  `sudo su -c "systemctl stop systemd-resolved && systemctl disable systemd-resolved"`

Notice the dnsmasq related snippet of yaml from our initial services `docker-compose.yml` file:

```
dnsmasq_svc:
  image: git.lab/lab/dnsmasq:initial
  depends_on: []
  container_name: dnsmasq_svc
  build:
    context: context
    dockerfile_inline: |
      FROM alpine:3.19
      RUN apk add -U dnsmasq
  restart: unless-stopped
  network_mode: host
  dns:
  - 9.9.9.9
  - 1.1.1.1
  dns_search: lab
  extra_hosts:
  - dockerhost:host-gateway
  - git.lab:192.168.1.213
  - words.lab:192.168.1.213
  - dns.lab:192.168.1.213
  - www.lab:192.168.1.213
  - tls.lab:192.168.1.213
  entrypoint: ["/usr/sbin/dnsmasq", "--no-daemon"]
```

The service is made up of an `alpine:3.19` base with a `dnsmasq` apk package added. As mentioned before, docker controls the `/etc/resolv.conf` and `/etc/hosts` in the container and since these are sources of defaults for dnsmasq:

- We can control dnsmasq with the `dns:` attribute to specify what external DNSes to use to forward locally unresolved domain name lookups.

- We can define all of our local domain names in the `extra_hosts:` attribute as a single `/etc/hosts` entry that all other nodes on our network will have access to via DNS.

Since this is a docker compose configuration, you'll need to first build the services with:

```
docker compose build dnsmasq_svc
```

and then you'll want to run the service with:

```
docker compose up -d dnsmasq_svc
```

Note: If you are rebuilding dnsmasq_svc on an offline network, you'll need to either add the required internal entries to your /etc/hosts file on the host or keep an existing service running while building the image. If you are online, you may also set your host's `/etc/resolv.conf` `nameserver` setting to an external DNS, so that docker will know how to reach out to any required registries or other services. Its easy to forget how important the DNS service is until you point everything at it and then shut it down.

Once the `dnsmasq_svc` is up and running, replace your host's `/etc/resolv.conf` `nameserver` setting to our new nameserver. (You'll need to do this on all network devices.)

```
sudo su -c 'rm /etc/resolv.conf && echo -e "nameserver 127.0.0.1\nsearch lab\n" > /etc/resolv.conf'
```

## Updating DNS Entries

If you want to change the records, update `docker-compose.yml` and then run both:

```
docker compose down && docker compose up -d
```

Caution: `docker compose restart` will not work. It does not read `docker-compose.yml` updates or changes since the last `docker compose up`.

## Distribution

Containers that use their own _custom_ network use the embedded Docker DNS on their own 127.0.0.11 interface. You may be able to override this with various `dns` settings. Most often its more simple to use the default network for containers, which will default to using the host's `/etc/resolv.conf` settings. Therefore, if all of our containers use the default bridge network and our host's `/etc/resolv.conf` points to ourselve on our external network, thereby calling dnsmasq ... all containers will automatically use the dnsmasq settings.
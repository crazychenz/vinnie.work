---
slug: 2024-01-05-caddy-is-better
title: 'Caddy Is Better?'
draft: true
---

## Overview

Came across Caddy (v2) recently and took the time to take a peek at what it can really do for me. After gawking at its landing page posters for awhile, I've come up with several use cases I want to put Caddy through to see if it really is the haproxy/nginx/traefik app killer that I've been looking for.

<!-- truncate -->

## Current State Of Things

For static sites, reverse proxies, TLS termination, and ingress controllers I've been flipping back and forth between traefik, nginx, and haproxy. I'll provide a very quick summary of each from my personal experience:

**Apache** - Not mentioned above, but this is the first web server that I learned and used for years. It works, but it's configuration is overly flexible, explicit, and verbose. Apache also felt like it had a lot of bloat in its APR dependency.

**Nginx** - A fresh spin on what I used Apache for but it was more contained than apache and it had, what I believed to be, a more clean configuration for doing reverse proxy and virtual host routing than Apache provided. Nginx, at the time, was also the new and upcoming hotness that I wanted more experience with to stay relevant in the modern conversation.

**Traefik** - Put simply, I really find nothing here appealing. I've used traefik as an ingress controller with k3s because k3s includes it by default and I hate managing dependencies when I don't have to. The fact that I've only used traefik with Kubernetes works against it as well because I hate how K8S abstracts most of the workflow but has a significant amount of leaky abstraction with specific controllers like Ingress Controllers.

**Haproxy** - Realizing that I needed a lightweight reverse proxy that could be gracefully reconfigured live with some other various bells and whistles, I started using haproxy in all situations where I didn't need to host static files. Haproxy certainly did everything that I've expected of it, but it hasn't always been clear how to get it done without a ton of experimentation.

## My Use Cases

A list of my use cases:

- Automatic certificate renewal management for VPN protected services.
- "Simple" S3 image browser
- Workflow for git config controlled PaaS that has a non-K8S ingress.
- Offline reverse proxy with offline CA certificate management
- API/PWA hosting

So the question I have is: **Can Caddy replace all of the above mentioned tools while simplifying my implementations and configuration management?**

## Certificate Management

For a given standalone service in my environment, I currently have a cron script that runs as root and has access to the DNS provider API key (protected with root permissions). The cron script runs certbot unattended by using a DNS challenge with the DNS provider API key and then setting the returned files (i.e. Cert and Key) so that the web server can access them (*but not the API key*).

Following Caddy's documentation will have the web server be able to access the DNS provider API key. In my case, this would mean that if there was a vulnerability introduced or discovered in the web server executable, the malicious actor would be able to recover the key and use it to create certificates for any domains managed by my DNS provider account. This is VERY bad. Ultimately, Caddy's current implementation is insufficient for auto-certificate renewals for DNS challenges for services behind a VPN.

Note: If it weren't for the VPN or inaccessibility of the servers, an HTTP challenge would be sufficient for the ACME services.

### Secondary Caddy for Certificate Renewal

One thing I did try was configure a second Caddy that ran as root user instead of caddy user. This server bound to an arbitraily high localhost port and its only purpose was to renew certificates for the host names in the Caddyfile. When the certificate obtained event was triggers, a script could be run to copy or update the permissions of the certificate and key files. Once I got to this point, I felt that the only thing I was achieving was the removal of certbot and the cron entry. I'd also be messing with the Caddy paradigm of how the certificate files are stored and loaded.

```
{
  # 2019 is the default admin port
  admin 127.0.0.1:2020
  # Only listening on localhost
  default_bind 127.0.0.1
  # Arbitrarily high ports.
  http_port 65534
  https_port 65533
  storage file_system {
    # Without this, storage is in `root` user home directory.
    root /etc/caddy/storage
  }
  events {
    # Event handler script for copying/accessing certs to main caddy service.
    on cert_obtained exec /etc/caddy/fix-certs.sh {event.data.storage_path}
  }
}

(common_tls_opts) {
  dns digitalocean dop_v1_2eff4577abced9475de98173cdeaf309363bacedf713fae324109236deadbeef
}                                                                                                                         

https://hostname.vinnie.work {                                                                                                 
  # Include the common TLS options for automatic DNS-01 certificate renewal.
  tls {                                                                                                                   
    import common_tls_opts                                                                                                
  }                                                                                                                       
  # Do nothing service.
  handle {                                                                                                                
    abort                                                                                                                 
  }                                                                                                                       
}

# ... other host definitions here ...
```

Don't do this. It is convoluted and not clear what is happening. Ideally, caddy should implement a subcommand that would renew the certificate of another running process. The certificate renewal invocation could run with elevated privileges and implicitly not listen or respond to any requests.

### Caddy Certificate Renewal with Certbot

Until Caddy implements something like the above, I'm sticking with my cron/certbot/webserver setup:

Certbot Script: `/etc/periodic/monthly/renew-certs.sh`

```
#!/bin/sh

FULL_HOSTNAME=hostname.vinnie.work

# Use LetsEncrypt's Certbot to renew certificates.
certbot certonly --dns-digitalocean \
  --dns-digitalocean-credentials /root/certbot/certbot-creds.ini \
  -d ${FULL_HOSTNAME} -d otherhost.vinnie.work --expand \
  --agree-tos -m me@example.com \
  -n

# Permit caddy user to traverse relevant folders.
chmod 755 /etc/letsencrypt/live
chmod 755 /etc/letsencrypt/live/nas.vinnie.work
chmod 755 /etc/letsencrypt/archive
chmod 755 /etc/letsencrypt/archive/nas.vinnie.work

# Permit group members readability of relevant files.
chmod 640 /etc/letsencrypt/live/${FULL_HOSTNAME}/privkey.pem
chmod 640 /etc/letsencrypt/live/${FULL_HOSTNAME}/fullchain.pem

# Change the ownership of relevant files to permit caddy group.
chown root:caddy /etc/letsencrypt/live/${FULL_HOSTNAME}/*

# Update config in alpine's s6 service management.
/etc/init.d/caddy reload
```

`/etc/caddy/Caddyfile`:

```
(tls_opts) {
  tls /etc/letsencrypt/live/hostname.vinnie.work/fullchain.pem /etc/letsencrypt/live/hostname.vinnie.work/privkey.pem
}

https://hostname.vinnie.work {
  import tls_opts

  reverse_proxy http://127.0.0.1:1234
}

# ... Other Host Definitions Here ...
```

## "Simple" S3 image browser

One of the things that got me really excited about Caddy was the potential for using it as an image browser for my S3 photo bucket. With about an hour invested into researching this, I realized that my hopes were misinformed. There are some S3 modules on the Caddy site that indicate there may be some capability to access S3 for various purposes. The caddy.fs.s3 module is what should permit one to access objects from s3 for content hosted by Caddy. This module was a dud because it didn't have the necessary options to wire it into my Minio implementation. That said, I did find a solution that Caddy significantly helped with through the use of its `file_server { browse <templates> }`.

The first thing I did was write up a quick python script that would connect to Minio S3 with the minio python library. Using an account that could only list and get objects from a bucket, I grabbed all the images that I could identify from the bucket and used the pillow library to resize them and convert to a good enough quality JPG file. I was then able to use Caddy to quickly host this new "postcard" library of images into a browser that'll work good enough for me for now. (I can also copy the files into a desktop File Explorer and do it that way too, but who wants that?)

Create the python script:

```python
#!/usr/bin/env python3

from minio import Minio
from minio.error import S3Error
from pprint import pprint
from pdb import set_trace
import io
import os
import sys
from PIL import Image

client = Minio("s3.hostname.com",
  access_key="accesskey",
  secret_key="supersecretkey",
)

prefix_fpath = "/opt/thumbs"
bucket_name = "my-bucket-name"

for obj in client.list_objects(bucket_name, recursive=True):
    #pprint(obj)

    object_name = obj.object_name
    object_size = obj.size # in KB

    # parse the object_name with os.path and ensure path exists in dest folder
    if obj.is_dir:
        continue

    # The directory part of the object_name
    object_dpath = os.path.dirname(object_name)
    # The local folder that contains the directory part of the object_name
    object_lpath = os.path.join(prefix_fpath, object_dpath)
    # Make sure the local folder exists on the host
    os.makedirs(object_lpath, mode=0o755, exist_ok=True)
    # The file name part of the file path.
    object_fname = os.path.basename(object_name)
    # The file path split from the file path's extension.
    object_fparts = os.path.splitext(object_name)
    # The full file path of the converted JPG file.
    object_jpgname = os.path.join(prefix_fpath, "%s.jpg" % object_fparts[0])
   
    if os.path.exists(object_jpgname):
        # If the JPG already created, move on. (Idempotent)
        continue

    if object_fparts[1].lower()[1:] not in ('jpg', 'bmp', 'png', 'gif', 'ico', 'jpeg', 
            'jfif', 'jp2', 'jpx', 'pcx', 'tiff', 'tif', 'webp', 'xbm'):
        # Only attempt files we know we could have and that work with PIL.
        continue

    resp = client.get_object(bucket_name, object_name)
    data = resp.data

    try:
        orig_img = Image.open(io.BytesIO(data))
    except:
        print("Failed to parse %s, skipping." % object_name)
        # Can't parse means we move to the next object.
        continue

    # Convert to JPG color scheme.
    img = orig_img.convert('RGB')
    
    maxdim = 480 # maximum of 480 on either dimension
    if img.size[0] > img.size[1]: # do width
        percent = (maxdim / float(img.size[0]))
        size = int((float(img.size[1]) * float(percent)))
        img = img.resize((maxdim, size), Image.LANCZOS)
    else: # do height
        percent = (maxdim / float(img.size[1]))
        size = int((float(img.size[0]) * float(percent)))
        img = img.resize((size, maxdim), Image.LANCZOS)

    # Save as a quality that is low/good enough for identifying the image.
    # Quality is lowest without going into 1990's eye bleeding territory.
    img.save(object_jpgname, quality=32)

```

You should be able to run the python script from anywhere and repeatedly as long as the `prefix_fpath` value is an absolute path.

Now we need to create a template file that we can use with Caddy's file_server. To do this, I started with the default (or stock) template by using the command: `caddy file-server export-template > default.go`. Once you open this file, its got a lot of web development noise. I was able to narrow down where I needed to be by running from the `/opt/thumbs` folder: `caddy file-server --browse --listen 1.2.3.4:6080` and opening it in Chrome with Developer Tools. Selected Elements section and then select the element with the icon. This showed me that I was looking for a `<span class="name">`. Just above this you'll see a `{{template "icon" .}}`. That is what I replaced with an `<img>` tag. Here is the snippet that I ultimately ended up with:

```go
...
<tr class="file">
  <td></td>
  <td>
    <a href="{{html .URL}}">
      <!-- {{template "icon" .}} -->
      <img style="max-width: 200px; max-height: 200px;" src="{{html .URL}}" />
      <span class="name">{{html .Name}}</span>
    </a>
  </td>
  {{- if .IsDir}}
  <td>&mdash;</td>
...
```

Once you have that template in a place where Caddy can access it (as the caddy user), here is Caddyfile that uses it:

```Caddyfile
{
  http_port 6080
}

http://hostname.vinnie.work {
  file_server {
    root /opt/thumbs
    browse /etc/caddy/template/image.go
  }
}
```

## Offline reverse proxy with offline CA certificate management

The built-in CA into Caddy for localhost and offline HTTPS configuration is, IMO, the most valuable contribution that Caddy has brought to the field of web servers. I've written on several occasions how to mock CAs with a couple OpenSSL commands to get past this gap. Now that Caddy has set the example, I will certainly judge any web server or framework that doesn't include this critical functionality. If you think about it, most of the browser functionality requires a secure HTTPS context before it can be enable, the web server should build in support for this constraint. Caddy is the only self hosted option that I've ever seen implement this with an unprecedented level of care about the maintainer of the service.

Suppose you have a Vaultwarden service that you need a certificate for... All you have to do is setup the reverse_proxy with `tls internal` and then everything else is taken care of. The one caveat is that you do have to dig a bit to pull out the CA root certificate to install into your browser, but when you're doing offline services, this kind of thing is standard operating procedure anyways.

Caddyfile:

```Caddyfile
https://passwords.local.domain {
  tls internal
  reverse_proxy http://localhost:8080
}
```

## Workflow for git config controlled PaaS that has a non-K8S ingress.

TBD

## Comments

<Comments />

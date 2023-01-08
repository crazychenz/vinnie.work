---
slug: 2022-12-16-conditional-nginx-package-caching
title: 'Conditional Nginx Package Caching'
draft: false
---

## Background

Recently I moved into a new home. Excitedly, I went to sign up for the new fibre hotness in the area (with 1 Gbps download speeds). In the mean time, I purchased a 4G router that allowed be to supply my house with internet via a cell phone SIM card (i.e. ~ 10-20 Mbps). My scheduled appointment for the super fast internet was about 2 weeks later. Finally, the guys show up to run the fibre line! After observing that they were waiting around outside (by the pole) for about 2 hours, I went to go check on what was happening. In the end they made the determination that they could not install fibre internet for me because the pole was too rotten. Argh!

<!-- truncate -->

As a fallback I immediately signed up for the local broadband internet that was already installed within the property. Aggravatingly, it costs the same as the fibre service and its 1/10th the speed! The cell phone internet was already drastically slowing down my development in regards to package downloading. The broadband has been slightly better, but I really needed a boost. What to do, what to do ... Hello caching server!

## Nginx Cache Intro

I've used nginx as a reverse proxy for multiplexing multiple services through a single web server for years. Turns out, nginx also can cache the responses from the services it has proxied for. Here is a brief introduction:

Inside of your nginx configuration (_outside_ of the server block), define a location, name, index size, and max disk size with the `proxy_cache_path` directive.

```text
proxy_cache_path /opt/nginx/cache/pypi levels=1:2 keys_zone=pypi:10m inactive=365d max_size=10g;
```

Then you use the (now named) cache in a `location` block, like so:

```conf
  location /cache/ {
    proxy_pass https://files.pythonhosted.org/;
    proxy_cache pypi;
    proxy_temp_path /opt/nginx/cache/tmp/pypi 1 2;
    proxy_cache_valid "1d";
  
    resolver 1.1.1.1;
    proxy_ssl_server_name on;
    proxy_set_header Host $proxy_host;
    proxy_ignore_headers X-Accel-Expires Expires Cache-Control;
    add_header X-Cache-Status $upstream_cache_status; # HIT / MISS / BYPASS / EXPIRED
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    access_log off;
  }
```

Lets break this down into each line:

- `proxy_pass` - indicates the upstream service we're proxying.
- `proxy_cache` - the cache we'll use to store responses
- `proxy_temp_path` - indicates the path to copy files to before atomically moving them into the cache. This path should always be on the same disk and file system as the cache to prevent a non-atomic copy from occuring.
- `proxy_cache_valid` - the length of time that the fetched response will be cached before becoming a cache EXPIRED (i.e. a MISS). Note: The `inactive` in `proxy_cache_path` defines how long a response can exist in the cache before being deleted. `proxy_cache_valid` in contrast says how long a file remains valid "on request".
- `resolver` - Nameserver to use for resolving the `proxy_pass`.
- `proxy_ssl_server_name` - ??
- `proxy_set_header Host $proxy_host;` - explicitly sends the host name of the `proxy_pass` entry to the resolved IP for the `proxy_pass` end point. 
- `proxy_ignore_headers` - instruct nginx to ignore headers that would otherwise prevent caching. This is optional and you may remove this directive for services you trust to know when to cache.
- `add_header X-Cache-Status $upstream_cache_status;` - declare a new X-Cache-Status header be returned to the client indicating whether the request was a HIT, MISS, BYPASS, or EXPIRED.
- `proxy_cache_use_stale` - directive to instruct nginx to use the cache in defined error conditions. The way I think of this is ... use the cache when you can not connect to the upstream service (i.e. enable resiliency.)
- `access_log off` - Disable the logging of the service. Since this is purely a pass through proxy, we'll only need a log when debugging issues.

Assuming we listen for requests to `Host: localhost`, if everything is defined correctly in the configuration, you should now see the service caching all requests sent to `http://localhost/cache/$request_uri`. For example, if we wanted to download `PyYAML-6.0-cp311-cp311-win_amd64.whl` from PyPi, it would look something like:

```sh
curl -O https://files.pythonhosted.org/packages/59/00/30e33fcd2a4562cd40c49c7740881009240c5cbbc0e41ca79ca4bba7c24b/PyYAML-6.0-cp311-cp311-win_amd64.whl
```

Now, if you want to do the exact same thing with our new cache, you can do:

```sh
curl -O http://localhost/cache/packages/59/00/30e33fcd2a4562cd40c49c7740881009240c5cbbc0e41ca79ca4bba7c24b/PyYAML-6.0-cp311-cp311-win_amd64.whl
```

## Metadata vs Versioned Objects

Ok, now that we know how to enable proxied location blocks, we should be smart about our intentions. My personal use case is for caching package repositories. Each package management system can typically be broken down into two different types of files: meta data files or indices and versioned package binaries. Different package management systems have different signatures for their metadata and their packages. Since the packages are typically more uniform in their identification, I've opted to say everything not a package is metadata in my scenario and then explicitly identify what I think falls in the _package_ category.

For example:

- Ubuntu and Debian APT repository packages all end with `.deb`.
- Python's PyPi repository packages typically end with `.whl`, `.tgz`, `.tar.gz`, and so forth.
- NPM and Yarn repository packages typically end with `.tgz`.

**Why do we care about meta data vs package? Why not just cache ALL THE BITS?**

Any packages that have a version or revision identifier within their name can be cached forever. In contrast, metadata that is stored at a generic URL/URI that does not have any sort of revision identifier in the name (e.g. `Release`), _can be cached_, but only for a short period of time. This is because the metadata is more likely to be updated to include all of the package updates or additions recently applied. We don't really need a super up to date metadata repository, but we also don't want to fall very far out of date and run blindly with insecure or inferior software. There are a couple thoughts with how to handle this:

- At the moment, I personally prefer to cache my metadata for 1 day. This is because I'm usually OK with waiting for the new package indices to be downloaded once a day, but when you are building new docker images 6 times and hour, re-downloading the metadata can get boring quite quickly.
- Another thought process is to cache metadata for roughy 5-7 days. The first advantage with this is that its even less time having to watch a slower than required `apt-get update`. The second advantage is that its a small enough time to get updated packages in a reasonable amount of upgrade time, but large enough to see if there are supply chain issues inside of a typical news cycle.

## Different Expirations For Same Endpoint

Naively, when I was clipping along with all of this, I tried the following configuration:

```conf
  location /cache/ {
    proxy_pass https://files.pythonhosted.org/;
    proxy_cache pypi;
    proxy_temp_path /opt/nginx/cache/tmp/pypi 1 2;

    set $cache_duration "1d";
    if ($request_uri ~ .*\.(tgz|tar\.gz)$) {
      set $cache_duration "365d";
    }
    proxy_cache_valid $cache_duration;
  
    resolver 1.1.1.1;
    proxy_ssl_server_name on;
    proxy_set_header Host $proxy_host;
    proxy_ignore_headers X-Accel-Expires Expires Cache-Control;
    add_header X-Cache-Status $upstream_cache_status; # HIT / MISS / BYPASS / EXPIRED
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    access_log off;
  }
```

This will create an error that resembles:

```text
nginx: [emerg] invalid time value "$cache_duration" in /etc/nginx/nginx.conf
```

As the nginx code is currently written, `proxy_cache_valid` does not except `ngx_http_complex_value_t` types (i.e. it doesn't do variable inputs). The values of `proxy_cache_valid` are read once when the configuration file is parsed. I actually did spend a few hours working on a pull request to fix this so that `proxy_cache_valid` would accept a conditional value, but I ended up reverting all of my changes because the code changes were not trivial and I was concerned I wasn't taking enough of the performance impact into account. 

**So whats the answer?**

I think there are a couple ways to accomplish effective "conditional" `proxy_cache_valid` values with stock nginx, but I'll only show the method I use. In short, I setup an end point in my nginx configuration that acts as a `rewrite` router to redirect the client to a second end point in the nginx configuration where the actual proxy occurs.

Assume that:
- We're listening for HTTP on port 80.
- We're serving requests to `Host: dockerhost`
- Our routing end point URI is `/cache/try/debian/archive`
- Our metadata end point URI is `/cache/daily/debian/archive`
- Out package end point URI is `/cache/yearly/debian/archive`

Here is the configuration that routes `/cache/try/...` to `/cache/daily/...`/`/cache/yearly/...` and then finally proxies to `https://deb.debian.org/`.

```conf
server {
  listen 80;
  server_name dockerhost;

  location ~ /cache/try/(.*)$ {
    # Debian DEB Routing
    rewrite ^/cache/try/debian/archive/(.*\.(dsc|deb|tar\.xz|tar\.bz2|tar\.gz))$ /cache/yearly/debian/archive/$1?$args last;
    rewrite ^/cache/try/debian/archive/(.*)$ /cache/daily/debian/archive/$1?$args last;
  }

  location /cache/daily/debian/archive/ {
    proxy_pass http://deb.debian.org/;
    proxy_cache debian;
    proxy_temp_path /opt/nginx/cache/tmp/debian 1 2;
    proxy_cache_valid "1d";
  
    resolver 1.1.1.1;
    proxy_ssl_server_name on;
    proxy_set_header Host $proxy_host;
    proxy_ignore_headers X-Accel-Expires Expires Cache-Control;
    add_header X-Cache-Status $upstream_cache_status; # HIT / MISS / BYPASS / EXPIRED
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    access_log off;
  }

  location /cache/yearly/debian/archive/ {
    proxy_pass https://deb.debian.org/;      
    proxy_cache debian;
    proxy_temp_path /opt/nginx/cache/tmp/debian 1 2;
    proxy_cache_valid "365d";

    resolver 1.1.1.1;
    proxy_ssl_server_name on;
    proxy_set_header Host $proxy_host;
    proxy_ignore_headers X-Accel-Expires Expires Cache-Control;
    add_header X-Cache-Status $upstream_cache_status; # HIT / MISS / BYPASS / EXPIRED
    proxy_cache_use_stale error timeout http_500 http_502 http_503 http_504;
    access_log off;
  }
}
```

As you can see, our caching configuration just doubled from ~16 lines to ~31 lines. And that is roughly what is needed for each domain. At the moment, I personally have a setup for npm, yarn, pypi, debian, ubuntu, alpine, redhat-ubi, and centos. So the configuration has grown quite large. 

## Client Configurations

Now that we have a working caching service, we need to configure our clients. This'll likely become a document over in my "Inform" section, but for now I'll list a few usage examples.

I currently run the nginx proxy cache in a container where I map outside port 9876 to inside port 80 (i.e. `-p 9876:80`).

### NPM

```sh
# Set via CLI
npm config set registry http://dockerhost:9876/cache/try/npm/

# Environment Variable
NPM_CONFIG_REGISTRY=http://dockerhost:9876/cache/try/npm/

# Project or User specific config
echo 'registry = "http://dockerhost:9876/cache/try/npm/"' > ~/.npmrc
```

### Yarn

```sh
# Yarn 1
yarn config set registry http://dockerhost:9876/cache/try/yarn/

# Yarn 2
yarn config set npmRegistryServer http://dockerhost:9876/cache/try/yarn/

# Environment Variable
YARN_REGISTRY=http://dockerhost:9876/cache/try/yarn/

# Project or User specific config
echo 'registry = "http://dockerhost:9876/cache/try/yarn/"' > ~/.yarnrc
```

### APT in Dockerfile for Ubuntu 20.04 (focal)

Note: I'm currently using the HTTPS enabled `https://mirror.pulsant.com/` mirror which has a URI prefix `/sites/ubuntu-archive/`. The following is one method for configuring a Dockerfile to prioritize the cache service over the upstream service. In this example, we _prepend_ our `deb` entries before the upstream ones so that if we already have the package or lose internet we get the local cached version BUT if there are newer updates in the upstream servers, we'll get the package from upstream until our own metadata is upgraded (~ 1-7 days, depending on your nginx preferences). You can always opt to omit the `cat` command below and rely solely on the caching service.

(I do believe there is a much cleaner and smart way to do this, but I haven't gotten that far yet.)

```Dockerfile
RUN echo '\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal main restricted\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal-updates main restricted\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal universe\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal-updates universe\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal multiverse\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal-updates multiverse\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal-backports main restricted universe multiverse\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal-security main restricted\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal-security universe\n\
deb http://dockerhost:9876/cache/try/ubuntu/archive/sites/ubuntu-archive/ focal-security multiverse\n' > /tmp/sources.list
RUN cat /etc/apt/sources.list >> /tmp/sources.list
RUN mv /tmp/sources.list /etc/apt/sources.list
```

## Troubleshooting & Edge Cases

- When working through defining the behavior of NGINX, its not easy to see what NGINX is sending out to the upstream server. Of course I could use a packet sniffer or mitmproxy, but the setup for that is more complicated than I needed. Instead, you can point the upstream proxy at a `dockerhost` on another port (e.g. 1234) and then use netcat to capture the request:

  ```sh
  nc -l 1234 dockerhost
  ```

- Also, when testing the responses from NGINX, you can easily view these by showing the response headers via curl verbosity. This is particularly useful for examining the `X-Cache-Status` that we defined in our `location` blocks.

  ```sh
  curl -vv -O http://localhost/cache/try/debian/archive/...
  ```

- Notice that our configuration listens on clear text HTTP. This was a deliberate decision to avoid certificate management. This is deemed OK within a network where you have 100% positive control. If you are on a network where the trust of any other user could come into question, HTTPS must be used to maintain a secure state.

- **What about forward proxy caching like squid or Apache?** - Nginx does not come with this functionality built in. There are extensions that provide support, but unless you _have to_ use nginx, I would recommend using the best tool for the job, and nginx is not that.

## Conclusion

While I have observed that this configuration does work and it does route as I expect it too, I haven't done extensive testing on the expiration behavior and the behavior of the expirations when the nginx engine is restarted. At the moment, I store both metadata and package data in the same `proxy_cache_path`. You could easily opt to split these with multiple `proxy_cache_path` directives and then you can opt to manually clear the metadata cache once a day.

## Resources

- [ngx_http_proxy_module](http://nginx.org/en/docs/http/ngx_http_proxy_module.html)
- [Guide To Caching](https://www.nginx.com/blog/nginx-caching-guide/)
- [Reverse Proxy With Caching](https://www.nginx.com/resources/wiki/start/topics/examples/reverseproxycachingexample/)
- [NGINX Content Caching](https://docs.nginx.com/nginx/admin-guide/content-cache/content-caching/)

## Comments

<Comments />

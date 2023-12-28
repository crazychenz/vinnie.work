---
title: "Versatile networking shell scripts with gethostbyname() and ip_route_addr()."
date: "2021-04-19T12:00:00.000Z"
description: |
  Snippets of `gethostbyname()` and `ip_route_addr()` that can be used in shell scripts in make networking shell scripts more versatile by removing false network assumptions (e.g. Myth: Everything is always behind a default gateway.)
---

## Overview

Sometimes when writing test scripts in shell script I want to perform some networking functionality. Instead of hard coding this values I'll parameterize them or read them from a `.env` (dotenv) file.

This pattern has the effect of allowing other users to run the code. The problem with this is that I can't always assume that the host they are going to test uses the same gateway I use. Perhaps the device or node they want to test is directly off of a private switch behind their development workstation, in contrast to somewhere on the company network.

The other likely issue to crop up is that not all network aware code cares to implement name resolution. This can be notoriously hard to deal with in statically compiled binaries, and therefore you may want to allow test script users to specify host names for network nodes without the application under test having to perform the actual name resolution requests.

Finally, there are times when you want to feed an application a callback address, such as in the use case where you are using a redirector for open authentication. How do I code what the callback IP will be for the application performing the redirection.

## Solution Space

Bottom line up front, I've written these two bash functions:

```sh
function gethostbyname() {
  HOST=$1
  echo $(echo -e "import socket\nimport sys\nprint(socket.gethostbyname(sys.argv[1]))" | python - $HOST)
}

function ip_route_addr() {
  HOST=$1
  ATTR=$2
  DSTIP=$(gethostbyname $HOST)
  echo $(ip route get $DSTIP |grep $ATTR |sed -ne "s/^.* $ATTR /$ATTR /p" |awk '{print $2}')
}
```

The `gethostbyname()` is essentially an inline python script that calls the python `socket.gethostbyname()` method and returns the resolved address. This is great because we can feed it a host name or an IP address and it'll return an IP address.

Example Use:

```sh
$ echo $(gethostbyname www.vinnie.work)
52.73.153.209
```

The `ip_route_addr()` (given an IP address and not a hostname) serves several purposes:

- It can tell you which network interface it'll be routed out of.

  ```sh
  $ echo $(ip_route_addr www.vinnie.work dev)
  wan
  ```

- It can tell you which local IP address can be used as a callback.

  ```sh
  $ echo $(ip_route_addr www.vinnie.work src)
  192.168.1.200
  ```

- It can tell you which gateway will be used to talk to the given address.

  ```sh
  $ echo $(ip_route_addr www.vinnie.work via)
  192.168.1.1
  ```

A quick look at the code for the `ip_route_addr()` function and you'll see that its nothing more than a parsing of the output of iputils2's `ip route get` command. I had a need to pull out the individual values and wrote up this function.

**Caution:** There is an issue when using `ip_route_addr()` with "127.0.0.1". This is due to the fact that `ip route get` outputs this in a different format. If you want to support this, you may need to do something cleaver like insert an additional `sed` into the `ip_route_addr()` pipe similar to `"s/^local/via/"` at the beginning of the pipe and then the rest should fall inline.

## Conclusion

Useful for writing more versatile shell scripts that require network connectivity without making unnecessary assumptions about a user's network.

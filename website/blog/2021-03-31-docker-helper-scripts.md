---
slug: 2021-03-31-docker-helper-scripts
title: "Docker Run Helper Script"
#date: "2021-03-31T12:00:00.000Z"
description: |
  As a docker user, I've written a bunch of helper scripts to simplify my most common use cases. The `run.sh` script is the most commonly used script that I write for all images. As I've evolved this script, I've learned a few patterns that are commonly useful across projects.
---

## Overview

As a docker user, I've written a bunch of helper scripts to simplify my most common use cases. The `run.sh` script is the most commonly used script that I write for all images. As I've evolved this script, I've learned a few patterns that are commonly useful across projects.

<!--truncate-->

When using these run scripts, I usually only use them for one-off containers that are removed at the end of the execution. This creates a more deterministic and
repeatable system state for the program being executed. On the other hand, if I'm running a container as a long running process, I instead will lean into using docker-compose.

## Run Script Use Cases

- In the case that no parameters are provided, the container drops into an interactive bash prompt.
- In the case that parameters are provided, the container runs the parameters as its command.
- Use the current directory as the top level project folder that is mapped into the container. This means that the run script should always be run from the directory that is the top accessible scope of the container.
- For applications that prefer to store state and configuration (e.g. cache,credentials) in a home directory, I like to provide a home directory mapping to the run script. While having the home directory available by default, sometimes its useful to redirect or disable the home directory mapping from the command line without modifying the script.
- To simplify the container network configuration, I typically have all containers running on the host's network namespace. This allows me to access the host's localhost as well as provide services on the host's IPADDR_ANY and localhost interfaces.

### Parameter Handling

The parameter handling in run scripts had me confused for quite a while. Over time I tried using various techniques:

- Suffix the `docker run` command with `bash -li -c "${*}"`.
- Suffix the `docker run` command with `$@`.
- Suffix the `docker run` command with `${*}`.

All of these have problems. Specifically, there are behavioral differences between `$*`, `$@`, `"$*"`, `"$@"` how ever they are used. Bottom line up front, it turns out that `"$@"` is the correct usage, but if you don't believe me, you can run this test script to see the differences:

```sh
#!/bin/sh

echo '------------------------------------'
echo 0: $0 1: $1 2: $2

echo '------------------------------------'
echo '$*:'
for i in $* ; do echo $i ; done

echo '------------------------------------'
echo '$@:'
for i in $@ ; do echo $i ; done

echo '------------------------------------'
echo '"$*":'
for i in "$*" ; do echo $i ; done

echo '------------------------------------'
echo '"$@":'
for i in "$@" ; do echo $i ; done
```

You can see the difference by running this with a parameter that contains spaces:

```sh
./test.sh one "two three"
```

With parameters handling in the bag, we need to add some conditional code to inject a `bash -li` command when there are no parameters without interfering with the `"$@"` behavior. I handle this with a simple sub shell:

```sh
$([ "$#" -eq "0" ] && echo 'bash -li') "$@"
```

Note: The conditional `bash -li` can be added before or after `$@` because `$@` will evaluate to nothing when the `bash -li` is injected.

## Volume Mappings

The first thing that I always include is the `/workspace` mapping. This is the container path that always maps to the path from where ever the run.sh script was run from. The argument is `-v $(pwd):/workspace`.

More complex is the home directory mapping that can optionally be added to the runner script depending on the application in the docker image. Something that has sometimes bit me in the past is using the standard default variable setting in bash:

```sh
VARIABLE=${VARIABLE:-default}
```

This is not what you want to use if you want to conditionally include the value in the command when set but also when its null or empty. To do this, I instead use the `-v` argument to detect the existence of the variable instead of whether its set or not. In otherwords, `-z` and `-n` are not what you want if you want to detect the variable when its empty.

The setup line that'll allow you to detect if the variable is available, regardless of whether its empty or null and then set it to a default value is:

```sh
[ ! -v HOME_VOLMAP ] && HOME_VOLMAP="-v $(pwd)/home/$(whoami):/home/$(whoami)"
```

## Putting It All Together

Putting together the parameter handling and the home directory mapping switch, you come up with a simple yet versatile pattern that resembles:

**run.sh**:

```sh
#!/bin/bash

[ ! -v HOME_VOLMAP ] && HOME_VOLMAP="-v $(pwd)/home/$(whoami):/home/$(whoami)"

docker run \
    -ti --rm \
    --network host \
    $HOME_VOLMAP \
    -v $(pwd):/workspace \
    $(whoami)/image-name \
    $([ "$#" -eq "0" ] && echo 'bash -li') "$@"
```

Default run with bash prompt:

```sh
$ ./run.sh
```

Run with command:

```sh
$ gdb -ex "target remote :3333"
```

Run without home mapped:

```sh
$ HOME_VOLMAP='' ./run.sh
```

## Conclusion

At first glance, this seems overly simple and not worth writing about, but I've not seen any example like this before and it works wonders for my workflow. Having the home directory mapping allows me to isolate credentials and caching directory from my host home directory while increasing the performance of specific projects. Also, having the ability to run a default command or a set of parameters outside the definition in the Dockerfile is very useful for development, debug, and troubleshooting of systems that could otherwise become more manual then they need to be.

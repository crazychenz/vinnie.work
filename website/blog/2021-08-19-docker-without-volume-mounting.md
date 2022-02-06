---
slug: 2021-08-19-docker-without-volume-mounting
title: 'Docker Without Volume Mounting'
draft: false
---

## The Environment

Sometimes when you work in different environments there are different security policies that inevitably make my job very difficult if not damn near impossible. I can usually figure out something out that is incredible inefficient and just let the customer pay the additional cost. I ran into one of these environments the other day where I was given a VM to perform my development from. This VM was pretty locked down, but it did provide me sudo to `docker`. I thought, "Great, as long as we have `docker`, we should be good!" ... oh boy was I wrong.

<!--truncate-->

As it turns out, the VM locked down `docker` from being able to:

- Run in --privileged mode
- No passing --devices
- No adding capabilities
- **And no volume mounting!**
- ... And many other limitations

Most of the policies made sense to me. For example, allowing a user access to a privileged docker process is essentially the same as providing someone with `root`. Also, allowing someone the ability to run as root with the ability to map in any host directory via volume mounting, you may as well provide the user with `root` permissions.

## My Use Case

My typical docker workflow involves running some commands in a deterministic environment that create, mutate, or delete some set of files (e.g. compilation, script side-effect, and so forth). The trouble with the above environment is that I have no convenient access to files located on a reliable source (i.e. the host). By reliable source, I mean a location for files that doesn't disappear when I tear down the container. Typically I'll volume mount `$(pwd)` into the `WORKDIR` of the docker image.

In summary, I wanted to host the "working directory files" from the host and have the container access those files. Then I could simply run my docker invocations with `--rm` (or at least have some comfort that I won't lose bytes when the container goes away.)

## Some Not-So-Possible Solutions

- Volume mounting, whether a local folder map or a docker managed volume was out of the question.
- FUSE file systems (e.g. sshfs) couldn't be used because I couldn't forward the `/dev/fuse` device to the container and I couldn't add the required capabilities (e.g. SYS_ADMIN) to the container.
- In general, anything that required root on the host (other than running the docker process) didn't work. This included adding/removing any kernel modules, configuring file systems, and so forth.

One solution that I had come up with is SSHFSing from the host into the container. This would at least allow me to partially have a shared mount point between the host and the container. I could perform this from the host because the host did provide an accessible `/dev/fuse` device. Alas, this violated the reliable source constraint I gave myself, so while functional it ain't going to cut it.

A horrible solution would be to simply use gitlab as the middle ground for files. This means that we'd git clone whenever the container was started and then commit/push/pull the files whenever I needed to access from the host. While this might be a viable solution for a completely automated process, its quite intolerable for interactive development.

## Possible Solutions

What I've recently resorted to is a _continuous_ `rsync` capabilitiy. When googling that, you'll find 3 apparent solutions:

### lsyncd (Live Syncing Daemon)

`lsyncd` is an application that you can install into your system that utilizes inotify and rsync. This is the no fuss solution if installing and running lsyncd is an option. The [lsyncd github repository](https://github.com/axkibe/lsyncd) states an example invocation as being as simple as:

```sh
lsyncd -rsync /home remotehost.org::share/
```

You can install `lsyncd` with:

```text
# On CentOS from EPEL with:
yum install lsyncd

# On Ubuntu
apt-get install lsyncd
```

### inotify/rsync

Using inotify-tools and rsync command directly results in a DIY solution that does something similar to lsyncd.

The [inotify site](https://github.com/inotify-tools/inotify-tools/wiki) itself provides an example of how to rsync a change from a directory with a script:

```bash
# Pre-reqs: inotify-tools and rsync
#!/bin/sh

cwd=$(pwd)

inotifywait -mr \
  --timefmt '%d/%m/%y %H:%M' --format '%T %w %f' \
  -e close_write /tmp/test |
while read -r date time dir file; do
       changed_abs=${dir}${file}
       changed_rel=${changed_abs#"$cwd"/}

       rsync --progress --relative -vrae 'ssh -p 22' "$changed_rel" \
           usernam@example.com:/backup/root/dir && \
       echo "At ${time} on ${date}, file $changed_abs was backed up via rsync" >&2
done
```

Another [stackoverflow question](https://stackoverflow.com/questions/12460279/how-to-keep-two-folders-automatically-synchronized) takes a much more lean approach:

```bash
while inotifywait -r -e modify,create,delete,move /directory; do
    rsync -avz /directory /target
done
```

My personal preference is from the [Right Angles blog](http://www.danplanet.com/blog/2012/05/09/low-latency-continuous-rsync/) where they have a nice reusable script and go into more depth about how to efficiently use it with SSH. Here is the script:

```bash
#!/bin/bash

DEST="$1"

if [ -z "$DEST" ]; then exit 1; fi

inotifywait -r -m -e close_write --format '%w%f' . |\
while read file
do
        echo $file
    rsync -azvq $file ${DEST}/$file
    echo -n 'Completed at '
    date
done
```

The gist of the SSH configuration is that you need to add something like the following to your `~/.ssh/config` file:

```text
Host example.com
    ControlMaster auto
    ControlPath /tmp/%h%p%r
```

This configuration automatically generates a controlling socket file in the `/tmp` folder that is used to establish new channels over an existing SSH connection (i.e. tunnel).

### Watchman / Rsync

When using a system that doesn't have inotify (i.e. Mac/Windows) you can resort to Facebook's watchman application. Watchman provides a common interface for file change notifications on Linux, OSX, and Windows. There are also older versions that contain BSD support. Watchman's primary use case is to support javascript/typescript development, but can easily be used for other applications. One [medium article by Waqqas Jabbar](https://waqqas.medium.com/continuously-sync-files-with-a-remote-system-51fd51e8da75) states that you can create a `sync.sh` script:

```sh
for i in $@
do
   rsync $i user@remote:/home/user/code/$i
done
```

Then you can run the script with something like (Note: I've not tested this.):

```sh
watchman watch code/
watchman --trigger . rsync --sh ~/sync.sh
```

## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>
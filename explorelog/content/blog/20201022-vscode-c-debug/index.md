---
title: "Remote Containerized Debugging with VSCode C/C++"
date: "2020-10-22T12:00:00.000Z"
description: |
    A bit about developing in VSCode and debugging with gdb remotely 
    while using docker containers from docker containers.
---

## Background

Recently I've become increasingly interested in accelerating my usage of debuggers. For the past 10 or so years I've been a `gdb` user. By user, I mean I would always use GDB from the command line without TUI, performing breaks, watches, examine, and control commands. More often I have been able to get away from using debuggers by simply getting better at static analysis through tools like objdump. Now with a new arsenal of toolchains and development environments that I've been accumulating throughout 2020, I want to reacquaint myself with runtime debugging.

For awhile now, I've been using Visual Studio Code Server (code-server) to do my development. code-server is basically a way for me to host Visual Studio Code over a web connection so that no matter where I go, so long as I have access to the code-server host, I can bring up the Visual Studio Code from that host with all the same (saved) settings. This brought major advantages like not having to deal with RDP or VNC and not having to worry about host setups. It also brings along a few challenges as well.

Please note that this article is not about how to use the VSCode debugger and tasks, but instead how to setup debugging and tasks to meet our goals. For general debugging/debugger usage, please refer to the [official documentation](https://code.visualstudio.com/docs/editor/debugging).

## The Goal

My goals are to be able to build my code with a containerized toolchain, debug my builds with a containerized environment, and manage as much of this in the VSCode Server GUI as much as possible (from a containerized code-server.) Security is not a priority at the moment, but security should be considered with all decisions for easier mitigation later on. I'm also assuming that anything I do in code-server is also doable with Remote-SSH Development extension in VSCode (with less complexity).

To break this down, we need to:

* Drive container creation and deletion from a container.
* Build code within a container.
* Debug builds within a container (driven by VSCode).

## Prerequisites

This article will be targeting C/C++ development. Python, node, and chrome debugging is managed quit differently and thus isn't really covered here. To continue we need to install a crucial dependency, the [C/C++ Extension](https://marketplace.visualstudio.com/items?itemName=ms-vscode.cpptools). 

Note: When I attempted to install this from VSCode Marketplace, it actually installed the ARM64 version of the extension in my x86_64 Ubuntu VM. A bit of looking around found the github issue [code-server downloads aarch64 version of C/C++ extension](https://github.com/cdr/code-server/issues/2120). The gist is that you need to install the [offline version](https://github.com/microsoft/vscode-cpptools/releases) of the extension by downloading the vsix file to a location accessible to code-server then opening command palette and searching for "install vsix". Follow the signs from there to install and reload vscode.

In addition to having the extension installed, we also need a toolchain/debugger docker image to work with. I've created one with the following `Dockerfile`:

```
FROM alpine

RUN apk update && apk add libc-dev binutils clang lldb gcc openssh rsync zip gdb

# !! Major security ramifications here, we could alternatively use keys.
RUN echo 'PermitRootLogin yes' >> /etc/ssh/sshd_config && \
    echo 'PermitEmptyPasswords yes' >> /etc/ssh/sshd_config && \
    echo 'PasswordAuthentication yes' >> /etc/ssh/sshd_config && \
    ssh-keygen -A && \
    passwd -d root && \
    echo "ssh" >> /etc/securetty
EXPOSE 22
CMD ["/usr/sbin/sshd", "-D"]

WORKDIR /workspace
```

*A Quick Note:* I 100% prefer to use lldb for debugging and have attempted to use lldb with the following process for quite a few hours without success. Therefore I've installed gdb as a dependency for VSCode but fully intend on using lldb for any manual debugging sessions.

## Managing Containers from a (`code-server`) Container

Ok, so the first thing is that we need to figure out is how to run docker from inside of docker. There is a great article about how this is done for several different uses cases in the article titled [Using Docker-in-Docker for your CI or testing environment? Think Twice.](https://jpetazzo.github.io/2015/09/03/do-not-use-docker-in-docker-for-ci/)

The conclusion from that article is that, for our purposes, we must volume mount `/var/run/docker.sock` into our `code-server` docker image so it can control the host docker and sibling containers. Something to point out here is that it isn't just a matter of volume mounting for the win... we must also add docker to our code-server image and setup permissions so the container docker matches to host docker service group ids and user ids.

Here is the Dockerfile I constructed to extend the `linuxserver/code-server` docker image:

```
FROM linuxserver/code-server
  
# Allow VSCode To Control Host Docker
RUN apt-get update && apt-get install -y docker.io

# Provide Host Docker GID to match container GID.
# Required for /var/run/docker.sock mapping.
ARG DOCKER_GID
RUN groupdel docker
RUN groupadd -g $DOCKER_GID docker
RUN usermod -aG docker abc
```

What we're doing here is first installing the docker engine via APT. This will automatically create a docker group that will likely not match the host docker group's gid number. Therefore, after the incorrect group addition, we remove that group and add our own with our own host matched group id. Also, out of pure laziness I've added user abc to the docker group because that happens to match my uid, but using the docker group id approach could be done for the user id as well.

Where does the DOCKER_GID get defined? I created a `build-image.sh` script to fetch and inject that bit for me. I usually have a build script for my docker images so that I don't have to retype/fat-finger the image name for each rebuild or update. My build-image.sh for this process is:

```
#!/bin/sh

export DOCKER_ENT=`getent group docker`
export DOCKER_GID=`echo $DOCKER_ENT | cut -d: -f3`
docker build \
    -t crazychenz/code-server \
    --build-arg DOCKER_GID \
    .
```

Once you run the `build-image.sh` script, you should now have a code-server that is capable of performing docker commands. You can test this our by simply running `docker ps` from an integrated terminal in the running code-server.

Since code-server is a service, I always launch it with `docker-compose up -d`. My `docker-compose.yaml` looks like:

```
---
version: "3"
services:
  code-server:
    image: crazychenz/code-server
    hostname: code-server
    container_name: code-server
    environment:
      - PUID=1000
      - PGID=1000
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - /projects/config:/config
      - /home/$USER/.ssh:/config/.ssh
      - /home/$USER:/config/home
      - /home/$USER/.gitconfig:/config/.gitconfig
      - /projects:/projects
    ports:
      - 8443:8443
      - 8080:8080
    working_dir: /projects
    restart: unless-stopped
```

Assuming docker is working from code-server integrated terminal, you should now be able to proceed to the next sections.

## Building Code With Containerized Toolchain from Container

VSCode is intended to be a highly adaptable text editor, not an *integrated* development environment as most people seem to think it is. This means that its really up to the user how they intend to use it for development. I prefer to think of it as a toolkit of development widgets with an amazing community and sane defaults built in. One of these widgets are the Tasks that you can define in VSCode. Tasks are defined in `.vscode/tasks.json` and can really be any shell command that your system can run. In addition to shell commands, task types can be defined from extensions for more advanced usage (e.g. Python, Node). Common task definitions include actions like, build, clean, run, unit test, and so forth.

For our purposes, we want a task to be able to build our code. Here is an example `task.json` to accomplish this with our toolchain docker image:

```
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "Build main",
            "type": "shell",
            "command": "docker run -ti --rm -v ${workspaceFolder}:/workspace crazychenz/alpine-clang clang -g -o main main.c",
            "problemMatcher": []
        }
    ]
}
```

This task essentially launches a short lived docker container that simply builds the binary and then destroys itself. When not running services, its important to always teardown containers as quickly as possible so that containers don't generate a diverging state that can potentially make execution success less deterministic.

These tasks can be more dynamic using special [substitution variables provided by VSCode](https://code.visualstudio.com/docs/editor/variables-reference). Here are a list of the ones I've found most commonly used:

* `${workspaceFolder}` - Top of the workspace. (${workspaceRoot} is deprecated).
* `${file}` - Currently opened file path. (Nice for quick ${file}.o builds.)
* `${env:ENVIRONMENT_VAR}` - Substitute in any environment variable.
* `${input:userDefined}` - Enumerated list of options picked at task runtime.

A nice tip I got from the bottom of the documentation on these variables... Use an echo task to output the value of a variable if its in question:

```
{
    "version": "2.0.0",
    "tasks": [
        {
            "label": "echo ${workspaceFolder}",
            "type": "shell",
            "command": "echo ${workspaceFolder}"
        }
    ]
}
```

## Debugging Builds With Containerized Debugger

Similar to how we were able to setup tasks in VSCode, we can setup special debug sessions for VSCode. These sessions are defined in `.vscode/launch.json`. Because the debugger in VSCode has to maintain a constant connection with the debugger, setting this up is a lot less straight forward than setting up tasks.

There are several known ways to accomplish this connection with a containerized debugger. If you have the `docker run` capability from VSCode (as we do), than you can setup a pipe transport for this channel. In contrast, if you can't use `docker` for accessing the process to be debugged for any reason, you can also use `SSH` as the pipe transport.

Here is my preferred way to handle this with a `docker run`:

```
{
    "version": "0.2.0",
    "configurations": [
        {
            "name": "(docker run) Pipe Launch",
            "type": "cppdbg",
            "request": "launch",
            "program": "/workspace/main",
            "cwd": "/workspace",
            "args": [],
            "stopAtEntry": true,
            "environment": [],
            "externalConsole": true,
            "pipeTransport": {
                "debuggerPath": "/usr/bin/gdb",
                "pipeProgram": "docker",
                "pipeArgs": [
                    "run", "-i", "--rm",
                    "-v", "${workspaceFolder}:/workspace",
                    "${input:dockerImage}",
                    "sh", "-c"
                ],
                "pipeCwd": "${workspaceFolder}"
            },
            "sourceFileMap": {
                "/workspace": "${workspaceFolder}"
            },
            "linux": {
                "MIMode": "gdb",
                "setupCommands": [
                    {
                        "description": "Enable pretty-printing for gdb",
                        "text": "-enable-pretty-printing",
                        "ignoreFailures": true
                    }
                ]
            }
        }
    ],
    "inputs": [
        {
            "id": "dockerImage",
            "type": "pickString",
            "description": "Docker Run Image",
            "options": [
                "crazychenz/alpine-clang"
            ],
            "default": "crazychenz/alpine-clang"
            // type specific configuration attributes
        }
    ]
}
```

There is a ton of stuff defined here, so here is the breakdown:

* name - This is the name that appears in the debug dropdown menu.
* type - This is the string that indicates which extension is going to handle the launch.
* request - This is either `launch` or `attach` in our case. Launch is when you are launching the binary with the debugger whereas attach is when you attach a debugger to an already running process.
* program - This is the path of the binary to debug (from the perspective of the container).
* cwd - Current working direction (from the perspective of the container).
* args - Arguments to run the launched program with.
* stopAtEntry - Whether or not to break at start of the program execution.
* environment - Any additional environment variables to inject into the debugged process can be performed here.
* externalConsole - ???
* pipeTransport - Defines path to debugger binary and process used to pipe debugger communication channel. In our case, this is our `docker run` command so we don't have lingering containers when we're done debugging.
* sourceFileMap - This maps the container path to the VSCode path for source file mapping.
* linux.MIMode - This is the machine interface mode and can be `lldb` or `gdb`. I tried to get `lldb` running for a long time without success. `lldb` is the default setting for `osx`.
* inputs - These define the various ${input:VarName} variables that can be used in the launch configurations. If you look at pipeTransport.pipeArgs, there is a ${input:dockerImage} variable. The inputs at the bottom of the file define an enumerated list of docker images that can be selected to fill in this value. 

For more information, please refer to the [official documentation](https://code.visualstudio.com/docs/editor/debugging).

Assuming you already had the container up and running, you can setup the debug session's pipeTransport with something like the following for an SSH tunnel, assuming you know the user/ip/port and have credentials for the SSH connection.:

```
"pipeTransport": {
    "debuggerPath": "/usr/bin/gdb",
    "pipeProgram": "/usr/bin/ssh",
    "pipeArgs": [
        "-p",
        "12345",
        "-o",
        "StrictHostKeyChecking=no",
        "root@localhost"
    ],
    "pipeCwd": "${workspaceFolder}"
}
```

Alternatively, you can also perform a `docker exec` with a pipeTransport configuration that resembles the following, assuming you know the name of the container (its 'container_name_here' in this example):

```
"pipeTransport": {
    "debuggerPath": "/usr/bin/gdb",
    "pipeProgram": "docker",
    "pipeArgs": [
        "exec", "-i",
        "container_name_here",
        "sh", "-c"
    ],
    "pipeCwd": "${workspaceFolder}"
}
```

## Some Other References

* [How to compile/debug a C++ application in Docker with Visual Studio Code on Windows](https://stackoverflow.com/questions/51433937/how-to-compile-debug-a-c-application-in-docker-with-visual-studio-code-on-wind)

* [Developing inside a Container](https://code.visualstudio.com/docs/remote/containers)

* [Using VS Code for C++ development with containers](https://devblogs.microsoft.com/cppblog/using-vs-code-for-c-development-with-containers/)

* [Is it possible to debug a gcc-compiled program using lldb, or debug a clang-compiled program using gdb?](https://stackoverflow.com/questions/21132194/is-it-possible-to-debug-a-gcc-compiled-program-using-lldb-or-debug-a-clang-comp)

* [Configuring C/C++ debugging](https://code.visualstudio.com/docs/cpp/launch-json-reference)

* [Pipe transport](https://code.visualstudio.com/docs/cpp/pipe-transport)
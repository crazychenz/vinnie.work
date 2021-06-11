---
slug: 2020-11-26-volume-mount-home
title: "Use Case: Running Application Containers With Different Credentials per Project"
date: "2020-11-26T12:00:00.000Z"
description: |
  Its a common pattern to store user authentication tokens in a user's home directory. These services don't always allow users to have multiple logins simulataneously. Setup docker environments to contain all of the CLI environments to to use project specific authentication tokens and project specfic "global" package versions.
---

## Situation

Its a common pattern to store user authentication tokens in a user's home directory. This way we can login to a service that has a command line interface without having to enter credentials each time we use the command. The one service I know that has done this for me for decades is Subversion. Recently, I've also been logging into services like Firebase, Google Cloud Engine, and Expo.io. All of these services store their user authentication tokens in the user's home directory.

<!--truncate-->

To compound this issue, these services don't always allow users to have multiple logins simulataneously. I personally partition my work projects by using different accounts for different purposes (e.g. personal projects, company projects, and employer projects). Also, I always strive to setup docker environments to contain all of the CLI environments so that I can run different versions per project if necessary.

To resolve the situation described above, the goal is to setup conventions that allow the mentioned CLI services to be isolated to project specific environments allowing for various versions and login information per project or sub-project.

## Docker Image Creation

When creating Dockerfiles, I always setup a user so that the containers never run as root by default. This is because I always plan to inspect and mutate the resulting docker files from a user on the docker host. If the files are always created as root, I have to use sudo/su (neglectful behavior) to perform my tasks. To have the docker container run as a user I add a snippet like the following to all my Dockerfiles:

```
RUN adduser -u 1000 user
USER user
```

Note: The UID `1000` can be changed to match your UID. In the past I've dynamically grabbed the current user ID in an adjacent `build.sh` and injected that into the Dockerfile via docker build arguments.

If you ever want to run a container as root with docker, you just tell docker to do so with `-u root`:

```
docker run -ti --tm -u root docker-image bash
```

### Docker Network Usage

In the past I got a little port forwarding happy with my Docker containers (i.e. using many `-p` arguments with docker command). More recently, I've identified that in nearly all cases, I intend to use docker as an application container, not a network container. Therefore its much more sensible to replace all those `-p` arguments with a single `--network host` argument. This means that the network applications that run within docker run as if they were run on the host (network-wise).

## Docker Container Startup

When starting application containers, I always:

- Add terminal IO (`-ti`)
- Remove containers on exit (`--rm`)
- Mount /workspace to current working directory (`-v $(pwd):/workspace`)

The goal here is to track individual home directories for each project, therefore we now need to add an additional volume mount for home. But before we do that, we should grab the skeleton home directory out of the docker image. I usually do this through two terminals (or two panes in tmux).

From the first terminal window, run a plain ole docker container:

```
docker run --rm -ti docker-image bash
user@43b45cc934ef:/workspace$
```

The `43b45cc934ef` in the above command is the container ID.

From the second terminal window, create an environment directory and from that directory grab the docker image's default home directory:

```
mkdir _env
pushd _env
docker cp 43b45cc934ef:/home/user home
popd
```

Once the home directory has been captured, you can close the second terminal window and close the first docker terminal by running `exit` in the bash shell.

In the above set of commands we've created an `_env` folder that is intended to represent the stateful environment of the containers we'll be launching. This includes the user's home directory and potentially other things (e.g. `/opt` applications). It is my personal convention to stick the `/home/user` folder from the image into a `home` folder because I only ever use containers as one user. If you had a need for a multi-user environment, there is nothing stopping someone from creating `_env/home/user`. The only major difference is this would change how to run the docker container.

The next step is to actually run any various commands that need to be executed within the container. For this, I always have some sort of shell script that I use to execute the docker run command. The template for this shell script resembles the following:

```
#!/bin/bash

docker run \
    --network host \
    --rm -ti \
    -v $(pwd):/workspace \
    -v $(pwd)/_env/home:/home/user \
    docker-image \
    bash -li -c "${*}"
```

Note: I've found the `-li` options to be useful for bash to execute typical `.bashrc` and `.bash_profile` files. Without these, you'll find paths and shell settings to not exist or be loaded.

This script is typically a drop in prefix for most other commands I plan to run. For example, if I wanted to publish firebase functions to the google cloud I would typically run `yarn firebase deploy --only functions`. To run this command from our contained environment, I create a `firebase_env.sh` script with the above snippet and run it (from the _parent_ folder of \_env) like the following:

```
# Run once.
./firebase_env.sh yarn firebase login --no-localhost
```

```
# Run many times.
./firebase_env.sh yarn firebase deploy --only functions
```

Note: If you install firebase with the `-g` option, it typically gets installed in the user's home directory and is included in the user path. I always opt to install CLI tools in the specific project (at least at the babel level) so that projects can have project specific versions of their tools and we dont need to polute the CLI path. When doing this with `yarn`, you only need to prefix the normal command with `yarn` to run the command without poluting the environment with extra paths.

The above mentioned (run many) _deploy_ command will use the credentials that were stored in the `_env/home` directory by the (run once) _login_ command from above.

## The `develop.sh` script.

Having a `develop.sh` script is really the gold standard that I like to get to with any project development loop. Before this script, the typical developer loop is:

- Write code
- Save code
- Build code
- Run product
- Verify product

The vision of this script is that when run, all compilation and updates should happen automatically. For example, when I have a bunch of source code files and a toolchain to transpile/build the source code into a tool that is automatically unit tested or deployed to some viewer, I don't want to have to switch back to another terminal to tell the code to make itself and then switch to the viewer to tell it to reload the new build.

`develop.sh` script should setup an environment in which it starts by automatically building and testing/presenting the results. Then all subsequent file saves trigger a similar build and test/present action. Therefore, all I have to do is:

- Write code
- Save code
- Verify code

Many languages are fantastic at providing tools to support this basic loop. Older legacy systems can have more monolithic and slower running build that prevent this behavior out of the box. In these legacy situations, I believe the correct action is to setup an environment in which you can have `develop.sh` focus purely on the immediate code being modified and only the unit tests relevant to that code. This should result in a tight developer loop that takes seconds instead of many minutes or hours.

In summary, for systems that already have the develop concept, like expo or gatsby, the script may look something like the following:

**develop.sh (for a gatsby project)**

```
./gatsby_env.sh yarn gatsby develop --host <ip-addr-here>
```

**develop.sh (for an expo project)**

```
./expo_env.sh yarn expo start
```

# Conclusion

To round everything up, in this article we've mentioned:

- Using application containers as a user with the same network namespace as host.
- Extracting the user's home directory per project for per project authentication tokens.
- Running remote CLI services with docker container as user per project.
- Using `develop.sh` with application container to streamline developer loop.

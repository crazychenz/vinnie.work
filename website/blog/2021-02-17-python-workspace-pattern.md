---
slug: 2021-02-17-python-workspace-pattern
title: "A Python Workspace Pattern"
#date: "2021-02-17T12:00:00.000Z"
description: |
  When working with python applications there are many different contexts and use cases for managing the state of the application. This article covers one pattern that I've used with great success.
---

## Overview

When working with python applications there are many different contexts and use cases for managing the state of the application. This article covers one pattern that I've used with great success. In short, its based on a folder heiarchy convention, virtualenv, and some bash-isms. If you are not a bash user, you'll want to tailor the relevant shell script for your preferred shell's environment.

<!--truncate-->

## Use Cases

Ok, so lets break down the use cases for the following implementation:

- We want to be able to revert our environment to a sane state without closing the tab/pane/terminal session. This is something that can be tricky when using the typical `source ./venv/bin/activate` of virtualenv. Without properly managing this, you can find yourself in a situation where you have to close the tab/pane/terminal just to get back to a clean state.

- We want to be able to rebuild all of the virtual environment with a single argument free command. This is because when you are fiddling with package metadata in a package installed in place, you have to ensure that the `egg-info` and other metadata is updated. Additionally, when fiddling with what I call workspace requirements, you need to rebuild the virtualenv to be sure that you've captured all the changes (especially when requirements are _removed_).

- We want to be able to _stage_ python distributions in a special folder. These _staged_ python distributions get precedence over our other requirements. This is nice because sometimes we don't want to have to worry about always modifying the requirements file or publishing packages just to test.

- We want to be able to keep a local lightweight repository of packages so that wrapping everything up for an offline enduser is a snap.

## The Folder Heiarchy Convention

```
├── config
|   └── requirements.txt
├── pkgs
├── py-src
│   ├── framework
│   ├── typeA_plugin1
│   └── typeA_plugin2
├── venv
└── activate.sh
```

The above tree is the layout for an example _workspace_. The _workspace_ houses all of the code we need for our application. It can be spread over multiple revision control systems, contain multiple build systems, and be implemented with multiple languages. The one major assumption with any workspace is that all commands to use and manipulate the workspace should be executed or aware of the root of the workspace.

Breakdown of each item in the above layout:

- config - This is the directory that should house all of the
- requirements.txt - This is a python requirements file for the workspace. It can be the result of a `pip freeze` or hand crafted. I typically checkin/commit to the repo a hand crafted version and release a `pip freeze` version.
- pkgs - A folder that contains all the released/deployable python distribution packages (e.g. source distributions, wheels).
- py-src - A folder that contains all of the _staged_ python distributions. These are distributions that are currently being worked on and will be installed in place if in the requirements.txt file. _staged_ packages always get precedence over packages in `pkgs` or other PYthon package repositories. _staged_ packages also do not take version into consideration.
- venv - This is a folder that is auto-generated as part of the workspace activation. It is the virtualenv folder.
- activate.sh - This is the bash script that is responsible for _activating_ the workspace. An activated workspace is setup with expected environment variables and dependencies so the developer can be confident that everything will work before they even begin.

## Activation

I'll just show you the bash script now and then walk through what each piece is doing below.

```
#!/bin/bash --init-file

## --- Config Variables ---

SHELL_RCFILES=${SHELL_RCFILES:-"/etc/bash.bashrc $HOME/.bashrc"}

VENV_NAME=${VENV_NAME:-venv}
VENV_PYTHON=${VENV_PYTHON:-python2}

# These are global flags and mostly used for verbosity.
VENV_FLAGS=${VENV_FLAGS:-"-q"}
PIP_FLAGS=${PIP_FLAGS:-"-q --no-python-version-warning"}

## --- No config below here. ---

echo "Activating $VENV_NAME in new shell."
for rcfile in $SHELL_RCFILES; do source $rcfile ; done

# Inspired by https://mharrison.org/post/bashfunctionoverride/
save_function() {
    local ORIG_FUNC=$(declare -f $1)
    local NEWNAME_FUNC="$2${ORIG_FUNC#$1}"
    eval "$NEWNAME_FUNC"
}

function halt_and_catch_fire() {
    echo Something went wrong, removing virtualenv.
    rm -rf venv
    exit 1
}

function build_venv() {
    echo Building virtualenv $VENV_NAME from scratch.
    virtualenv $VENV_FLAGS -p $VENV_PYTHON $VENV_NAME
    if [ $? -ne "0" ]; then halt_and_catch_fire ; fi
    source ./$VENV_NAME/bin/activate
    # Save off the virtualenv deactivate for when we want to rebuild without exiting shell.
    save_function deactivate venv_deactivate
    # Manually install each requirement
    cat <<'END_OF_PYTHON_SCRIPT' | sed 's/^        //' | sed "s/PIP_FLAGS/$PIP_FLAGS/" | python
        from os import path, listdir, system
        from subprocess import check_output
        from pkg_resources import parse_requirements as parse

        # Get requirements
        reqs = list(parse(open("config/requirements.txt").read()))

        # Get staged packages
        pkg_to_path = {}
        for stage in listdir("py-src"):
            stage_path = path.join("py-src", stage)
            setup_path = path.join(stage_path, "setup.py")
            try:
                cmd = "python {path} --name".format(path=setup_path)
                name = check_output(cmd, shell=True).strip()
                pkg_to_path[name] = stage_path
            except Exception as exc:
                print("Skipping {path}: {exc}".format(path=stage_path, exc=exc))

        # Install all requirements with staged getting precedence.
        for req in reqs:
            if req.name in pkg_to_path:
                print("Installing {name} from {path}.".format(name=req.name,path=pkg_to_path[req.name]))
                system("pip install PIP_FLAGS -U -e {path}".format(path=pkg_to_path[req.name]))
            else:
                print("Installing {name} from *package*.".format(name=req.name))
                system("pip install PIP_FLAGS -f pkgs -U {name}{spec}".format(name=req.name, spec=req.specifier))
END_OF_PYTHON_SCRIPT
    if [ $? -ne "0" ]; then halt_and_catch_fire ; fi
    venv_deactivate
}

function rebuild_venv() {
    venv_deactivate
    rm -rf venv
    build_venv
    source ./$VENV_NAME/bin/activate
    save_function deactivate venv_deactivate
}

if [ ! -d venv ]; then
    echo "Checking for ${BASH_SOURCE[0]} dependencies."
    DEPS_FOUND="yes"
    for dep in virtualenv $VENV_PYTHON; do
        which $dep >/dev/null 2>/dev/null
        if [ $? -ne "0" ]; then
            echo Missing \"$dep\"
            DEPS_FOUND="no"
        fi
    done
    if [ "$DEPS_FOUND" == "no" ]; then
        echo "Found missing dependencies. Exiting."
        exit 1
    fi

    build_venv
fi

# Activate the virtualenv
source ./$VENV_NAME/bin/activate
save_function deactivate venv_deactivate

# Override the virtualenv deactivate with our function.
function deactivate() {
    echo "Deactivating $VENV_NAME (i.e. exiting shell)."
    exit 0
}

function wshelp() {
    cat <<'END_OF_HELP' | sed 's/^    //'
        Commands:
          wshelp - This help message.
          deactivate - Exits currently activated shell.
          rebuild_venv - Deletes current venv and rebuilds it.
END_OF_HELP
}

echo "Activation complete."
echo
echo "Type 'wshelp' to see available commands."
echo
```

Ok, so that is alot, but its really a baseline that can be reused and evolved for project specific needs. In a previous project I worked on, we had something similar (with a lot more complexity) squirred away in what we called the _workspace toolkit_. This toolkit would then just be sourced into the activate script and all the workspace specific settings could be applied below. For this, we assume we have a smaller project with a small team so that kind of modularity is not required.

Lets start from the top:

```
#!/bin/bash --init-file
```

This is just a handy way to say, I want to run the following script and then drop into an interactive shell. This one line is what allows us to isolate our environment. Whatever shell you start in, `activate.sh` kicks off another `bash` shell. This new shell will encapsulate all environment changes so that when you're ready to clear it all out, you simply execute `exit`. In contrast, you could find yourself creating an unmaintable `deactivate` function to cleanup the various changes made. I've gone down this path in the past and it didn't end well.

```
## --- Config Variables ---

SHELL_RCFILES=${SHELL_RCFILES:-"/etc/bash.bashrc $HOME/.bashrc"}

VENV_NAME=${VENV_NAME:-venv}
VENV_PYTHON=${VENV_PYTHON:-python2}

# These are global flags and mostly used for verbosity.
VENV_FLAGS=${VENV_FLAGS:-"-q"}
PIP_FLAGS=${PIP_FLAGS:-"-q --no-python-version-warning"}
```

These are the configurations that the user may control. We use the bash syntax that allows us to set a default value if the user hasn't already set a value. This is really useful for using the _dot env_ pattern. With dot env you basically set all of your configurations up in a `.env` file and then simply source that file whenever you run the command that needs the settings. Note: It is recommended to always add `.env` to the ignore settings for your revision control system.

```
for rcfile in $SHELL_RCFILES; do source $rcfile ; done
```

When starting a new shell, we want to keep all the user settings that the developer is used to. The default for bash is to load the /etc/bash.bashrc and ~/.bashrc scripts. We allow the user to override this setting, but that is the default.

```
# Inspired by https://mharrison.org/post/bashfunctionoverride/
save_function() {
    local ORIG_FUNC=$(declare -f $1)
    local NEWNAME_FUNC="$2${ORIG_FUNC#$1}"
    eval "$NEWNAME_FUNC"
}
```

A simple mechanism for renaming bash functions.

```
function halt_and_catch_fire() {
    echo Something went wrong, removing virtualenv.
    rm -rf venv
    exit 1
}
```

When something goes unexpectently wrong, we burn the virtualenv and exit the environment.

```
function build_venv() {
    echo Building virtualenv $VENV_NAME from scratch.
    virtualenv $VENV_FLAGS -p $VENV_PYTHON $VENV_NAME
    if [ $? -ne "0" ]; then halt_and_catch_fire ; fi
    source ./$VENV_NAME/bin/activate
    # Save off the virtualenv deactivate for when we want to rebuild without exiting shell.
    save_function deactivate venv_deactivate
    # Manually install each requirement
    cat <<'END_OF_PYTHON_SCRIPT' | sed 's/^        //' | sed "s/PIP_FLAGS/$PIP_FLAGS/" | python
        from os import path, listdir, system
        from subprocess import check_output
        from pkg_resources import parse_requirements as parse

        # Get requirements
        reqs = list(parse(open("config/requirements.txt").read()))

        # Get staged packages
        pkg_to_path = {}
        for stage in listdir("py-src"):
            stage_path = path.join("py-src", stage)
            setup_path = path.join(stage_path, "setup.py")
            try:
                cmd = "python {path} --name".format(path=setup_path)
                name = check_output(cmd, shell=True).strip()
                pkg_to_path[name] = stage_path
            except Exception as exc:
                print("Skipping {path}: {exc}".format(path=stage_path, exc=exc))

        # Install all requirements with staged getting precedence.
        for req in reqs:
            if req.name in pkg_to_path:
                print("Installing {name} from {path}.".format(name=req.name,path=pkg_to_path[req.name]))
                system("pip install PIP_FLAGS -U -e {path}".format(path=pkg_to_path[req.name]))
            else:
                print("Installing {name} from *package*.".format(name=req.name))
                system("pip install PIP_FLAGS -f pkgs -U {name}{spec}".format(name=req.name, spec=req.specifier))
END_OF_PYTHON_SCRIPT
    if [ $? -ne "0" ]; then halt_and_catch_fire ; fi
    venv_deactivate
}
```

This big nasty peice of code is responsible for building the virtualenv. It used to be that you could use the constraints file to dictate whether to install from a path or use a given version of a dependency. Since PIP 20.x, this functionality was declared undocumented and removed. Argh! So instead, I've wrote the janky code above. It basically performs the following:

1. Create an empty virtualenv using the given python binary (defaults to python2)
2. Activates the virtualenv so that all subsequent python script and commands will use the virtualenv.
3. Save the virtualenv deactivate function as venv_deactivate (so we can implement our own deactivate function)
4. Fetch and parse the `requirements.txt` file.
5. Fetch and analyze the staged python distributions.
6. Install all of the staged python distributions referenced in the `requirements.txt` file, regardless of version.
7. Install all of the non-staged python distributions referenced in the `requirements.txt` file using the configured pip repositories and the `pkgs` folder.
8. If anything goes wrong, we burn and die.
9. We deactivate the environment in anticipation of a later activation.

```
function rebuild_venv() {
    venv_deactivate
    rm -rf venv
    build_venv
    source ./$VENV_NAME/bin/activate
    save_function deactivate venv_deactivate
}
```

As previously mentioned, we wanted the ability to rebuild the virtualenv in its entirety without leaving our isolated shell environment. This `rebuild_env` function does just that. It will deactivate the current environment, remove the environment, build the virtualenv from scratch, and then finally activate the virtualenv with all the new hotness.

```
if [ ! -d venv ]; then
    echo "Checking for ${BASH_SOURCE[0]} dependencies."
    DEPS_FOUND="yes"
    for dep in virtualenv $VENV_PYTHON; do
        which $dep >/dev/null 2>/dev/null
        if [ $? -ne "0" ]; then
            echo Missing \"$dep\"
            DEPS_FOUND="no"
        fi
    done
    if [ "$DEPS_FOUND" == "no" ]; then
        echo "Found missing dependencies. Exiting."
        exit 1
    fi

    build_venv
fi
```

This block of code is where we determine if we're just going to activate or if we need to build the virtualenv. It checks for the existance of the venv directory to determine if it needs to build the virtualenv from scratch. It then does a quick and dirty dependency check. I've seen this implemented with more sophisticated tools like rpm, deb, and system pip itself with version checking and the works. `which` should serve our purposes just fine. Once we feel confident the dependencies for the workspace are met, we build the virtual env.

```
# Override the virtualenv deactivate with our function.
function deactivate() {
    echo "Deactivating $VENV_NAME (i.e. exiting shell)."
    exit 0
}
```

This is our deactivation function. In reality all you really need to do to deactivate is run `exit`. I included the deactivate stub for those with virtualenv muscle memory and its also a nice place to cleanup other file system artifacts (e.g. sockets, pipes, temp files).

```
function wshelp() {
    cat <<'END_OF_HELP' | sed 's/^    //'
        Commands:
          wshelp - This help message.
          deactivate - Exits currently activated shell.
          rebuild_venv - Deletes current venv and rebuilds it.
END_OF_HELP
}

echo "Activation complete."
echo
echo "Type 'wshelp' to see available commands."
echo
```

Last thing I provide is a list of supported commands for the user. When dealing with multiple workspaces over long periods of time, having a `wshelp` command to determine what workspaces support what commands can save a lot of time and effort.

## Examples:

My "normal" prompt looks something like:

```
chenz@desktop-ubuntu-vm 2021-02-17-11:03:52
/projects/stable/plugin-pattern$
```

When activate, from scratch it'll look something like:

```
chenz@desktop-ubuntu-vm 2021-02-17-11:04:37
/projects/stable/plugin-pattern$ ./activate.sh
Activating venv in new shell.
Checking for ./activate.sh dependencies.
Building virtualenv venv from scratch.
Installing framework from py-src/framework.
Installing framework.typeA.plugin1 from py-src/typeA_plugin1.
Installing framework.typeA.plugin2 from py-src/typeA_plugin2.
Activation complete.

Type 'wshelp' to see available commands.

(venv) chenz@desktop-ubuntu-vm 2021-02-17-11:04:43
/projects/stable/plugin-pattern$
```

Notice the prompt prefix `(venv)` to indicate we're in an activated virtualenv. No so apparent, we're using a new shell. This can been seen by inspecting the shell pid with `echo $$` before and after activation.

To deactivate:

```
(venv) chenz@desktop-ubuntu-vm 2021-02-17-11:04:43
/projects/stable/plugin-pattern$ deactivate
Deactivating venv (i.e. exiting shell).
exit
chenz@desktop-ubuntu-vm 2021-02-17-11:05:03
/projects/stable/plugin-pattern$
```

To re-activate:

```
chenz@desktop-ubuntu-vm 2021-02-17-11:05:03
/projects/stable/plugin-pattern$ ./activate.sh
Activating venv in new shell.
Activation complete.

Type 'wshelp' to see available commands.

(venv) chenz@desktop-ubuntu-vm 2021-02-17-11:05:34
/projects/stable/plugin-pattern$
```

**Note:** Nothing was installed. This is because the `venv` folder already existed and only the environment was activated. The packages are already installed. The point to be made here is that in a larger project an _initial_ activation can take a few minutes to complete, where a reactivation can take less than a second.

To clean the virtualenv:

```
(venv) chenz@desktop-ubuntu-vm 2021-02-17-11:05:34
/projects/stable/plugin-pattern$ deactivate
Deactivating venv (i.e. exiting shell).
exit
chenz@desktop-ubuntu-vm 2021-02-17-11:07:25
/projects/stable/plugin-pattern$ rm -rf venv
chenz@desktop-ubuntu-vm 2021-02-17-11:07:30
/projects/stable/plugin-pattern
```

Basically, we're _deactivating_ with `deactivate` and removing the `venv` folder.

## Other potential use cases

With workspace activation you can plug in all kinds of goodies to simplify life without committing to it "all the time" like you would with a `~/.bashrc`. Here are some suggestions:

- Commands to assist with managing revision control. For example, you could have a `update src` command that would recursively go through and look for repositories that can be updated (or pushed to a secondary host for backup.)
- Commands to assist with analytics, such as looking for information leaks, function usage, test runners, log analysis, etc.
- Commands to assist with releasing and publishing the application and its components. This could include automatic version bumping, building release packages and sending them off to the CI/CD system of choice.
- Commands for upgrading the workspace itself.
- Commands to launching containerized (i.e. docker, k8s, podman) versions of all previously mentioned commands.

## Conclusion

I find using workspace patterns incredibly useful and productive when managing any more than a single project on a single host (which is always the case). The script mentioned in the article is focused on Python projects, but I've used this very same pattern with make based projects and npm based projects.

## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>

---
slug: 2025-08-03-managing-neovim
title: "Managing Neovim Dependencies"
draft: false
---

## Overview

Been using neovim more in recent months. I think its a great replacement for vim, but it suffers greatly because all its modern bells and whistles also require an internet connection. I'm not a fan of this. To make matters worse, it has a great many external dependencies.

<!-- truncate -->

On many occasions, professionally and personally, I want to sit down to a computer and know that it is an independently functioning piece of equipments. Sure, I need to download packages and dependencies from a plethra of respositories and respository types. But once that is done, leave me alone!

RANT: Dear developers, if your product thinks it needs to check for updates, I DO NOT CARE IF YOU CAN'T!! Also, if your product does manage to reach out to an update server and find there is an update, design a way to notify me without interrupting my dataflow or typing experience. Note: 90% of the time I'm using my editor or tools from a git repo with a registered email address, email me! The more practicle method may be to use a "notify them next time" thing so that I don't lose key strokes in the middle of typing.

## Neovim Options

I tried a few of the pre-packaged neovim experiences, which by the way were not prepackaged at all (e.g. nvchad). In general, these tools are lua configurations that themselves become a complex system of lists of "download thing X". I was not a fan.

Starting from something more sane, I resulted to working from the kickstart.nvim setup. Its a single file with templates for using lazy plugin manager, tree-sitter, and mason for linting and LSP management. All of this is WAY to separate. Perhaps this is a symptom of the immaturity of Neovim's ecosystem.

- To manage Mason packages: `:Mason`
- To see Tree Sitter Options: `:TSInstallInfo`
- To install tree sitter option: `:TSInstall` ... or update `init.lua`
- To see or update Lazy plugins: `:Lazy`
- To change lazy plugin options: update `init.lua`

What all this ends up being is a mess of architecture dependent shared objects or libraries, and git repositories littered throughout the file system. Luckily, most are kept within the ~/.local/share/nvim folder namespace. But it still feels very undefined (outside of the code implementation.)

## Managing Neovim Ideas

What I really want is to maintain all of neovim's precense into a single folder. Before I settled on this, I ran through some ideas:

- Using docker with a root volume mount and using chroot or proot, pivot root withing the container so that I can run nvim within a container but its view of the system would be the same as it would outside of the container. ... to complicated and edge-casey.
- Using a more sane docker approach where I would need to volume mount large swaths of my file system for a semi-normal experience. ... to edge-casey and meh.
- Using AppImage to build and collect all of the dependencies into a single bundle. I'd then have a single thing to distribute and use. This is great for static configurations, but horrible for tinkering, so it'd really only handle half of what I want.
- Developing a mirror for all things Tree-sitter and Mason. This would require modifying the upstream plugin manager code or some networking wizardry to trick the upstream plugin managers. Both are achieveable and I'd consider this approach if there is a stronger requirement or lack of alternatives.

## Custom Neovim File Heirarchy

Ok, so all of that was either low ROI or trash. Instead, I settled on ... bash scripts. One bash script to run neovim in a customized environment. Another bash script (possibly many) to "update" neovim to download, install, and build my relocatable neovim environment.

First, I've decided to squirrel away all of my neovim files away in `~/.local/bin/nvim-portable`. Within that folder, I have a script called `update-nvim-x86_64-linux-glibc-apt`. As you can see, its specifically named for its environment. I can modify and adjust this for any other relevant environment and it'll work.

```sh
#!/bin/sh

set -e

curl -LO https://github.com/neovim/neovim/releases/latest/download/nvim-linux-x86_64.tar.gz
tar --strip-components=1 -xf nvim-linux-x86_64.tar.gz
mkdir -p config
mkdir -p plugins

# Add or upgrade all the dependencies.

# Always update the package list once
echo "Running sudo to install any dependencies."
sudo apt-get update
sudo apt-get install -y git make unzip gcc ripgrep fd-find curl
```

It downloads neovim, extracts neovim to the current folder, and creates what will become the config and plugins folders.

Next, we have the launch script. I keep one script in the `nvim-portable` folder and a second copy in my `$PATH`.

```sh
#!/bin/bash

NVIM_HOME="$(cd "$(dirname "${BASH_SOURCE[0]}")/nvim-portable" && pwd)"
export XDG_CONFIG_HOME="$NVIM_HOME/config"
export XDG_DATA_HOME="$NVIM_HOME/plugins"
exec "$NVIM_HOME/bin/nvim" "$@"
```

The script sets up the `$NVIM_HOME` variable relative to the scripts location. It then utilizes the XDG environment variables to point to alternative configuration and plugin locations. This prevents Neovim from spreading outside of the `nvim-portable` folder (making it easier to transfer or archive for offline environments.) Finally, it executes the `nvim` binary relative to `$NVIM_HOME`

## In Summary

By using XDG environment variables and having a well defined update/install mechanism, I feel like the Neovim package is much more managed. Before, I had to worry about at least 3 different locations if I wanted to transplant nvim from one location to another. Now its 1, maybe 2 if you count to extra `nvim` launch script that sits adjacent and within `nvim-portable`.

There are lots of obvious improvements that could be made to this:
- Permitting NVIM_HOME overwriting via default settings
- Having one launch script instead of two, where one may look around for its bound `nvim-portable` folder.
- Having a more intelligent update process that also updated packages.
- Optionally permitting ~/.config/nvim for cleaner .dotfiles integration.

These are all things for another day.

## Comments

<Comments />




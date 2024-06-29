---
slug: 2024-06-29-controlling-vscode-from-tmux
title: "Controlling VSCode From Tmux"
draft: false
---

## Overview

Ever have a list of files in the side bar of VSCode that was unearthly long? It can get really annoying having to scroll up and down through that list to trace through some control flow of a program or multi-micro-service application. One possible solution for that is the IPC mechanism built into VSCode from the CLI. At any point in your VSCode terminals, you can run `code <path>` to open a file in the running VSCode.

But it doesn't work in Tmux! ... well I found a fix.

<!-- truncate -->

## Fixing tmux

If you checkout out the working environment of a VSCode started terminal, you'll find several VSCODE_* environment variables. Something like:

```
VSCODE_GIT_ASKPASS_NODE=/home/chenz/.vscode-server/cli/servers/Stable-5437499feb04f7a586f677b155b039bc2b3669eb/server/node
VSCODE_GIT_ASKPASS_EXTRA_ARGS=
VSCODE_GIT_IPC_HANDLE=/run/user/1000/vscode-git-9523617afc.sock
VSCODE_GIT_ASKPASS_MAIN=/home/chenz/.vscode-server/cli/servers/Stable-5437499feb04f7a586f677b155b039bc2b3669eb/server/extensions/git/dist/askpass-main.js
VSCODE_IPC_HOOK_CLI=/run/user/1000/vscode-ipc-91467da4-1baf-4c12-80be-d64ea0640fea.sock
```

It turns out that the `VSCODE_IPC_HOOK_CLI` environment variable is a socket that is used by the (remote) `code` command to deliver "Open _this_ file", "Add _that_ folder" IPC commands to the (local) `code` client.

For reasons currently unknown to me, this socket become irrelevant when launching a terminal program like `screen` or `tmux`. After reading some github issues ([#2763](https://github.com/microsoft/vscode-remote-release/issues/2763), [#6362](https://github.com/microsoft/vscode-remote-release/issues/6362)), there is a nice quick workaround.

Within a shell instance within a tmux pane, you can run:

```sh
export VSCODE_IPC_HOOK_CLI=$(ls -tr /run/user/$UID/vscode-ipc-* | tail -n 1)
```

Note: There are many different variations of this on the internet. Likely due to the changes in VSCode file layout over the years. In general, the trick is finding the newest running VSCode socket. This may not be what you are looking for, but if you are only running a single VSCode client (like me), it appears to work good enough.

For a nice automation, throw the above line into your `.bashrc`. I recommend using a function so you can quickly reload the variable if you reload VSCode and reattach to a previous tmux session.

```
reload_vscode_ipc() {
  export VSCODE_IPC_HOOK_CLI=$(ls -tr /run/user/$UID/vscode-ipc-* | tail -n 1)
}; reload_vscode_ipc
```

## Bringing It Back

Right, so now instead of dealing with a file listing that is depressingly stuck to the side of your extra wide monitor and as long as a flight path from earth to the moon, you can find a terminal on your remote ssh host and `code <path>` it open.

## Comments

<Comments />



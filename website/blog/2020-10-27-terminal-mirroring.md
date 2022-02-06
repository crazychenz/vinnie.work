---
slug: 2020-10-27-terminal-mirroring
title: "Terminal Collaboration"
#date: "2020-10-27T12:00:00.000Z"
description: |
    Quick and elegant (read-only) terminal sharing for collaboration
    and demonstrations.
---

## Overview

In the current world climate we're always looking for the next best screen sharing technology or collaboration tool. Today I came across a need to provide a tour of some code and demonstrate some examples of running various commands. I was on an isolated network so the availability of collaboration tools were very limited.

<!--truncate-->

## Maybe `tmux`

One tool that I was thinking should be able to solve my problem was `tmux`. `tmux` is a terminal multiplexer tool that allows me to start multiple sessions of the same terminal window and have them all be synchronized with each key stroke. After some quick research, indeed `tmux` is technically able to provide session access to multiple users.

The big caveat here is that `tmux` can not provide any security for users with access to your sessions. Users that can access your session can act as you on the system, hence they can create their own sessions and wreak havoc in an instant. If you have 100% trusts in your guests, you essentially need to have the `tmux` socket and all users of the window assigned to a common group.

```bash
# Setup permissions and socket location
sudo mkdir /shared-sockets
sudo groupadd tmuxfriends
sudo chgrp tmuxfriends /shared-sockets
sudo chmod g+ws /shared-sockets
sudo usermod -aG tmuxfriends thisuser
sudo usermod -aG tmuxfriends otheruser

# Create tmux window and session as this user
tmux -S /shared-sockets/session

# Join tmux window from otheruser login
tmux -S /shared-sockets/session attach

# Join tmux window from otheruser login (readonly)
tmux -S /shared-sockets/session attach -r
```

Even though there is an option for readonly, its the *otheruser* that gets to choose whether the session will be read-only or not, not the host. Also, if you opt to allow the other user to participate, it can get tricky without some out-of-band coordination because it'll be similar to having two users on the same computer using their own keyboard and mice on the same monitor. (i.e. you can't chat with each other in the terminal window.)

## Simple and Secure

Instead of using `tmux` socket as the primary access to view a hosted terminal, use `script` and `tail` to share a terminal window.

1. Host the terminal with: `script -f /tmp/mysession`.
2. Join the terminal with `tail -f /tmp/mysession`.

It's that simple. What we're doing here is basically outputting the state of our terminal to a file both users can access and then using tail follow to display that output onto the terminal. So far I've tested this with vim, and tmux and it works very well.

One slight issue is that tail doesn't prevent the user from bumping keys into their own TTY. To prevent this you can change the tail command to something like:

```bash
(stty -echo ; tail -f /tmp/mysession) || stty echo
```

This one liner will turn off echoing and prevent fat fingering anything into the tail output until the user exits the shell command with Ctrl-C.

Beautiful, simple, portable, and effective!

## References

* [What are other ways to share a tmux session between two users?
](https://unix.stackexchange.com/questions/2523/what-are-other-ways-to-share-a-tmux-session-between-two-users)

* [The Tao Of tmux](https://leanpub.com/the-tao-of-tmux/read)

## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>

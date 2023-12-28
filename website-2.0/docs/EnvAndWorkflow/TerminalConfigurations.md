---
sidebar_position: 4
title: Terminal Configurations
---

## Overview

I do about 80% of my job in various consoles, terminals, and shells. As such, I've developed a number of configurations that I carry around with me. I've listed some in various blog posts, but since I am constantly updating and tweaking, I wanted a more _living_ home for these.

## Tmux

My #1 goto when I fire up any terminal that I plan to spend more than 30 mins on.

### Standard Configuration

```ini
set -g mouse on
set -g default-terminal "screen-256color"
set-option -g default-command bash

set -g window-style 'fg=colour230,bg=colour235'
set -g window-active-style 'fg=colour230,bg=colour233'

set -g pane-active-border-style 'fg=colour237,bg=colour234'
set -g pane-border-style 'fg=colour232,bg=colour234'
set -g pane-border-format '###{pane_index} [ #{pane_tty} ] S:#{session_name} M:#{pane_marked} #{pane_width}x#{pane_height}'
set -g pane-border-status 'bottom' # off|top|bottom

bind-key x kill-pane
```

**Features**:

- Mouse support so I don't need to remember any select pane or resize pane keyboard magic hotkeys and commands.
- By default, tmux will enable colors on the screen.
- In general I like to use a dark theme, therefore the window/pane backgrounds switch between varying levels of dark gray, but different enough that I can easily see when terminal is active.
- I list some pane information at the bottom of each pane:
  - Pane Index (for when we don't have a mouse)
  - Pane Tty - Allows some fun hackery when capturing dumps or logging
  - Session - Allows me to be aware of what session I'm in when I need to reset my SSH connection for whatever reason.
  - An indicator of whether the pane is Marked or not. Tmux marks have bitten me a bunch in my workflow in the paste so I like to always be aware of its state.
  - Dimensions - For those times you want that exact 80x25 terminal pane. :)
- I've added a special `Ctrl-B, x` to kill the current pane. I really don't use this.

### Light Theme

On the flip side, when I'm using a laptop or monitor outside, its often much better to have a light theme. This configuration does just that.

```ini
set -g mouse on
set -g default-terminal "screen-256color"
set-option -g default-command bash

set -g window-style 'fg=colour237,bg=colour251'
set -g window-active-style 'fg=colour237,bg=colour231'

set -g pane-active-border-style 'fg=colour237,bg=colour234'
set -g pane-border-style 'fg=colour232,bg=colour234'
set -g pane-border-format '###{pane_index} [ #{pane_tty} ] S:#{session_name} M:#{pane_marked} #{pane_width}x#{pane_height}'
set -g pane-border-status 'bottom' # off|top|bottom

bind-key x kill-pane
```

**Switching Themes**:

If you're going to have multiple themes, you are going to want an easy way to switch between the two. For this I have a configs in my home directory set like the following:

```text
lrwxrwxrwx  1 user user   31 Jan 1 2022 .tmux.conf -> .tmux.conf.dark
-rw-rw-r--  1 user user  509 Jan 1 2022 .tmux.conf.dark
-rw-rw-r--  1 user user  333 Jan 1 2022 .tmux.conf.light
-rwxrwxr-x  1 user user   80 Jan 1 2022 light.sh
-rwxrwxr-x  1 user user   79 Jan 1 2022 dark.sh
```

Then all I need to do is run `light.sh` or `dark.sh` to switch to the relevant theme.

**light.sh**:

```sh
#!/bin/sh
ln -sf ~/.tmux.conf.light ~/.tmux.conf
tmux source-file ~/.tmux.conf
```

**dark.sh**:

```sh
#!/bin/sh
ln -sf ~/.tmux.conf.dark ~/.tmux.conf
tmux source-file ~/.tmux.conf
```


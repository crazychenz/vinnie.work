---
title: Tmux Configurations
---

## Minimal Tmux Config

Tmux is my #1 goto when I fire up any terminal that I plan to spend more than 30 mins on. It also happens to be the default terminal for my VSCode terminal.

### Baseline Configuration

The following is a dead simple configuration that I can even fat finger if required.

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

### Minimal Light Theme

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
tmux source ~/.tmux.conf
```

**dark.sh**:

```sh
#!/bin/sh
ln -sf ~/.tmux.conf.dark ~/.tmux.conf
tmux source ~/.tmux.conf
```

## Fancy Tmux Config

This is a configuration isn't a "works everywhere" thing. This is the config
that you'll setup on a dedicated developer laptop or workstation.

### Pre-Requisites

- Connect to internet.
- Install tmux (>3.0): `apt-get install tmux`
- Install `git`: `apt-get install git`
- Install a [nerd font](https://www.nerdfonts.com/) for all terminal apps
- Install Neovim from [github release](https://github.com/neovim/neovim)
  - Note: `apt-get` version isn't new enough for latest `nvchad`.
  - Extract into `/usr/local/nvim`
  - Add to path: `export PATH=$PATH:/usr/local/nvim/bin`
  - Add aliases for vi to nvim: `alias vi=nvim`.
  - Restart shell with new path: `bash` xor `sudo reboot`.
- Install `nvchad` [via GitHub](https://nvchad.com/docs/quickstart/install/).
  - `git clone https://github.com/NvChad/starter ~/.config/nvim && nvim`

### Tmux Config

Setup the following `~/.tmux.conf` with a plugin manager and several plugins.

```conf
# Plugin Options
set -g @catppuccin_flavor 'mocha' # latte, frappe, macchiato or mocha
set -g @catppuccin_window_status_style "rounded"
set -g status-right-length 100
set -g status-left-length 100
set -g status-left ""
set -g status-right "#{E:@catppuccin_status_application}"
set -agF status-right "#{E:@catppuccin_status_cpu}"
set -ag status-right "#{E:@catppuccin_status_session}"
set -ag status-right "#{E:@catppuccin_status_uptime}"
set -agF status-right "#{E:@catppuccin_status_battery}"

# List of plugins
# See more at: https://github.com/tmux-plugins/tpm
set -g @plugin 'tmux-plugins/tpm'
# See more at: https://github.com/tmux-plugins/tmux-sensible
set -g @plugin 'tmux-plugins/tmux-sensible'
# See more at: https://github.com/christoomey/vim-tmux-navigator
set -g @plugin 'christoomey/vim-tmux-navigator'
# See more at: https://github.com/tmux-plugins/tmux-yank
set -g @plugin 'tmux-plugins/tmux-yank'
set -g @plugin 'catppuccin/tmux#v2.1.2'
set -g @plugin 'tmux-plugins/tmux-battery'
set -g @plugin 'tmux-plugins/tmux-cpu'

# Initialize TMUX plugin manager (keep this line at the very bottom of tmux.conf)
run '~/.tmux/plugins/tpm/tpm'

## Extra Configs

# Start windows and panes at 1, not 0
set -g base-index 1
set -g pane-base-index 1
set-window-option -g pane-base-index 1
set-option -g renumber-windows on

# Shift arrow to switch windows
bind -n S-Left  previous-window
bind -n S-Right next-window

# set vi-mode
set-window-option -g mode-keys vi
# keybindings
bind-key -T copy-mode-vi v send-keys -X begin-selection
bind-key -T copy-mode-vi C-v send-keys -X rectangle-toggle
bind-key -T copy-mode-vi y send-keys -X copy-selection-and-cancel

bind '"' split-window -v -c "#{pane_current_path}"
bind % split-window -h -c "#{pane_current_path}"

## Baseline Minimal Config

set -g mouse on
# Enable 256 colors. (Sometimes preferred in containers).
#set -g default-terminal "screen-256color"
# Enable 24 bit color.
set-option -sa terminal-overrides ",xterm*:Tc"
set-option -g default-command bash

set -g window-style 'fg=colour230,bg=colour235'
set -g window-active-style 'fg=colour230,bg=colour233'

set -g pane-active-border-style 'fg=colour237,bg=colour234'
set -g pane-border-style 'fg=colour232,bg=colour234'
set -g pane-border-format '###{pane_index} [ #{pane_tty} ] S:#{session_name} M:#{pane_marked} #{pane_width}x#{pane_height}'
set -g pane-border-status 'bottom' # off|top|bottom
```

Once you start tmux, run `<prefix>+I` to activate tpm and the plugins.



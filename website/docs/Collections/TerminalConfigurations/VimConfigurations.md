---
title: Vim Configurations
---

## Introduction

Vim is great, but I'm currently using NeoVim (w/ NvChad) as my baseline. My usual workflow involves simplton stock Vi like behaviors for quick accesses and changes or NvChad level of customized distribution for more indepth and dedicated development or productivity.

## NeoVim Config

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

### Tmux Config (for working with NeoVim)

Setup the following `~/.tmux.conf` with a plugin manager and several plugins.

```conf
## List of plugins
# See more at: https://github.com/tmux-plugins/tpm
set -g @plugin 'tmux-plugins/tpm'
# See more at: https://github.com/tmux-plugins/tmux-sensible
set -g @plugin 'tmux-plugins/tmux-sensible'
# See more at: https://github.com/christoomey/vim-tmux-navigator
set -g @plugin 'christoomey/vim-tmux-navigator'
# See more at: https://github.com/tmux-plugins/tmux-yank
set -g @plugin 'tmux-plugins/tmux-yank'

# Other examples:
# set -g @plugin 'github_username/plugin_name'
# set -g @plugin 'github_username/plugin_name#branch'
# set -g @plugin 'git@github.com:user/plugin'
# set -g @plugin 'git@bitbucket.com:user/plugin'

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
#set -g default-terminal "screen-256color"
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

### NeoVim (~v0.10) Config

Add the following to `~/.config/nvim/lua/mappings.lua`:

  ```lua
  map("n", "<C-h>", "<cmd>TmuxNavigateLeft<CR>")
  map("n", "<C-l>", "<cmd>TmuxNavigateRight<CR>")
  map("n", "<C-j>", "<cmd>TmuxNavigateDown<CR>")
  map("n", "<C-k>", "<cmd>TmuxNavigateUp<CR>")

  map('n', '<leader>hp', "<cmd>Gitsigns preview_hunk<CR>")
  map('n', '<leader>hb', "<cmd>Gitsigns toggle_current_line_blame<CR>")
  ```

Replace in `~/.local/share/nvim/lazy/NvChad/lua/nvchad/mappings.lua`:

- `map("n", "<leader>h", function()` with `map("n", "<leader>hh", function()`
- `map("n", "<leader>v", function()` with `map("n", "<leader>vv", function()`

This will force `SPC + hh` and `SPC + vv` to launch the relavant terminal splits. But it permits us to use the `SPC + h` as a prefix for a number of other key mappings.

Add the following to `~/.config/nvim/lua/plugins/init.lua`:

  ```lua
  {
    "christoomey/vim-tmux-navigator",
    lazy = false,
    cmd = {
      "TmuxNavigateLeft",
      "TmuxNavigateDown",
      "TmuxNavigateUp",
      "TmuxNavigateRight",
      "TmuxNavigatePrevious",
      "TmuxNavigatorProcessList",
    },
    keys = {
      { "<c-h>", "<cmd><C-U>TmuxNavigateLeft<cr>" },
      { "<c-j>", "<cmd><C-U>TmuxNavigateDown<cr>" },
      { "<c-k>", "<cmd><C-U>TmuxNavigateUp<cr>" },
      { "<c-l>", "<cmd><C-U>TmuxNavigateRight<cr>" },
      { "<c-\\>", "<cmd><C-U>TmuxNavigatePrevious<cr>" },
    },
  },
  ```

Add the following to `~/.config/nvim/init.lua`:

  ```lua
  # Allow tmux to control background color.
  vim.cmd("hi Normal guibg=NONE")
  ```

Open/Restart `nvim` and run `Lazy sync` to install the plugin.

### Features

Once complete, you'll have:

- Stock `nvchad` feature set.
- All the above base config for tmux.
- Windows 1-indexed (better UX based on keyboard layout)
- Shift+`<Arrow>` for window switch in tmux.
- Navigate between tmux and neovim with `<C-[hjkl]>`.

## References

- [Dreams of Code - Tmux Intro](https://www.youtube.com/watch?v=DzNmUNvnB04)
- [Dreams of Code - NeoVim Intro](https://www.youtube.com/watch?v=Mtgo-nP_r8Y)

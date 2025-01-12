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

### NeoVim (~v0.10) Config

Add the following to `~/.config/nvim/lua/mappings.lua`:

  ```lua
  vim.api.nvim_del_keymap('n', '<leader>b')
  vim.api.nvim_del_keymap('n', '<leader>h')
  vim.api.nvim_del_keymap('n', '<leader>v')

  require("which-key").add({
    mode = { "n" },
    { "<leader>bd", "<cmd>bd<CR>", desc = "Close Buffer" },
    { "<leader>bn", "<cmd>bn<CR>", desc = "New Buffer" },
    { "<leader>hp", "<cmd>Gitsigns preview_hunk<CR>", desc = "Git Hunk Preview" },
    { "<leader>hb", "<cmd>Gitsigns toggle_current_line_blame<CR>", desc = "Toggle Git Blame" },
    { "<C-h>", "<cmd>TmuxNavigateLeft<CR>", desc = "Pane Left" },
    { "<C-l>", "<cmd>TmuxNavigateRight<CR>", desc = "Pane Right" },
    { "<C-j>", "<cmd>TmuxNavigateDown<CR>", desc = "Pane Down" },
    { "<C-k>", "<cmd>TmuxNavigateUp<CR>", desc = "Pane Up" },
    { "<leader>hh", function()
        require("nvchad.term").new { pos = "sp" }
      end, desc = "new horiz term" },
    { "<leader>vv", function()
        require("nvchad.term").new { pos = "vsp" }
      end, desc = "new vert term" },
    { "<leader>ss", "<cmd>Telescope treesitter<CR>", desc = "Search Symbols in File" },
    { "<leader>sd", "<cmd>Telescope lsp_definitions<CR>", desc = "Search Symbol Definition" },
    { "<leader>sr", "<cmd>Telescope lsp_definitions<CR>", desc = "Search Symbol References" },
  })
  ```

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

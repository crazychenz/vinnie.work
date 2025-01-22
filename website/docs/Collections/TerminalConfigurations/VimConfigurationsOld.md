---
title: Tmux Configurations
---

## Vim

Install NERDTree (sidebar file explorer):

`git clone https://github.com/preservim/nerdtree.git ~/.vim/pack/vendor/start/nerdtree`

Add to `.vimrc` to use `\n` to switch back to side bar:

```vimrc
nnoremap <leader>n :NERDTreeFocus<CR>
autocmd VimEnter * NERDTree | wincmd p
autocmd BufEnter * if tabpagenr('$') == 1 && winnr('$') == 1 && exists('b:NERDTree') && b:NERDTree.isTabTree() | quit | endif
```

## NeoVim

`~/.config/nvim/init.lua` (or `~/.config/nvim/init.vim`)

Config Example:

```
vim.opt.tabstop = 2
vim.opt.expandtab = true
```

Baseline Customizations:

- Packer
- navarasu/onedark.nvim
- nvim-tree/nvim-web-devicons
- LSP server for code completion
- nvim-tree - explorer
- treesitter - syntax highlight
- telescope - similar to cscope
- fugitive
- undotree
- VonHeikemen/lsp-zero.nvim

Starter Configs: nvchad

https://www.youtube.com/watch?v=w7i4amO_zaE

https://github.com/wbthomason/packer.nvim

`git clone --depth 1 https://github.com/wbthomason/packer.nvim ~/.local/share/nvim/site/pack/packer/start/packer.nvim`

```
-- This file can be loaded by calling `lua require('plugins')` from your init.vim

-- Only required if you have packer configured as `opt`
vim.cmd [[packadd packer.nvim]]

return require('packer').startup(function(use)
  -- Packer can manage itself
  use 'wbthomason/packer.nvim'

end)
```

`~/.local/share/nvim`
`~/.config/nvim/lua/chadrc.lua`


## Tips

Cheatsheet: SPC c h

Theme: SPC t h

Syntax Highlighting: TSInstall <language> / TSInstallInfo

Find Files: SPC f f

Find Open Files: SPC f b

Explorer: Ctrl + n
- Mark: m
- Create File: a
- Copy: c
- Paste: p
- Rename: r

Tmux package manager'
tmux-sensible

tmuxcheatsheet.com

christoomey/vim-tmux-navigator - neovim plugin

## Baseline

- Install git: `apt-get install git`
- Install ripgrep: `apt-get install ripgrep`
- Install a [nerd font](https://www.nerdfonts.com/) for all terminal apps

- Install Neovim from [github release](https://github.com/neovim/neovim)
  - Extract into /usr/local
  - Add to path
  - Restart shell with new path

- Install nvchad starter config: `git clone https://github.com/NvChad/starter ~/.config/nvim && nvim`

- Install tmux (3+) `apt-get install tmux`
- Install [tmux plugin manager](https://github.com/tmux-plugins/tpm): `git clone https://github.com/tmux-plugins/tpm ~/.tmux/plugins/tpm`
- Configure tmux:

  ```text
  # List of plugins
  set -g @plugin 'tmux-plugins/tpm'
  set -g @plugin 'tmux-plugins/tmux-sensible'

  # Other examples:
  # set -g @plugin 'github_username/plugin_name'
  # set -g @plugin 'github_username/plugin_name#branch'
  # set -g @plugin 'git@github.com:user/plugin'
  # set -g @plugin 'git@bitbucket.com:user/plugin'

  # Initialize TMUX plugin manager (keep this line at the very bottom of tmux.conf)
  run '~/.tmux/plugins/tpm/tpm'
  ```


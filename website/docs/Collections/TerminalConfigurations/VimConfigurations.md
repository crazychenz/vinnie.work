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
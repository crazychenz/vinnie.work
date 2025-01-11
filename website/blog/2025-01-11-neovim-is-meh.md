---
slug: 2025-01-11-neovim-is-meh
title: "NeoVim is Meh"
draft: false
---

## Overview

Recently I decided to revisit some of my staple habits and tools for development. This included the question, "What is the new generation using for console text editing?". I was under the naive perception that most are using nano because most are likely using a GUI IDE like VSCode or XCode as their work horse and there is little reason to bother with the likes of emacs and vim anymore. Apparently, this was grossly wrong ...

<!-- truncate -->

## The State of Vim

I never really looked at the history of Vi. Apparently `vi` proper was written by Bill Joy. `vi` was then cloned (presumably in contrast to a port) on various other platforms. One of these was a clone named `Stevie` for Amiga. Bram Moolenaar, the developer of `vim`, developed his text editor as a fork of `Stevie`. This itself was kind of a new thing to me ... for over 20 years I was under the impression that `vim` was a direct fork of `vi`.

Bram Moolenaar, the self-proclaim dictator of `vim` for life, has sadly passed in 2023. Some will say that because of this, `vim` itself has died. Not true. `vim` is alive and well with many contributors on its [official repo](https://github.com/vim/vim). That said, there are likely going to be shifts and a loss of stability when a long term regime changes. This is more than enough justification to see what other options exist.

## Why Vim?

When I first started programming, I had no real preference for a text editor. I floated between a great many text editors, usually leaning on whatever the official IDE was for the language I was using. I eventually found a passion for working on embedded systems and development. This very much kept me in the terminal most of my day and the local senior developers in the area all used Vim, therefore I used Vim.

Now, aside from the reality of the situation, I've always maintained that real developers should find a powerful console editor and get good at it. This is primarily because of the number of times you find yourself in a console and you need to do some non-trivial file changes or analysis. Leaning on IDEs or GUI text editors always has unnecessary overhead and usually doesn't have as strong a community as your `vim` and `emacs` communities.

Vim is everywhere. In nearly every POSIX system I've ever used, I can type `vi` and get some kind of editor. I prefer `vim` for UX, but I can easily adjust my behaviors for a minimal `vi` implementation to get text editing done. This has served me well over the past 20 years. 

That said, I am a VSCode user. VSCode's killer feature for me is its Remote-SSH extension that allows me to pretend that my VSCode is running on the remote machine, GUI or not, (like XWindow but better?). Unfortunately, VSCode has evolved into quite a bulky and bloated piece of software. Because of this, it also has increased its minimal requirements to run. Example: Running VSCode Remote-SSH via an Alpine system is difficult if not impossible. Because of this, `vim` becomes the superior _non VSCode_ editor for me.

## Why NeoVim Now?

Don't get me wrong, I'll still use `vi` everywhere without a second thought. But for developer focused systems that I plan to spend more dedicated time on, I'm thinking that maybe I should be looking at `vim` alternatives. An easy way to determine this is "What systems have I already configured tmux for?". Those are the systems that get more TLC.

For the above described systems, I've started to give NeoVim a go. It seems to have good community support. It has all of the drop in support I need as a classical `vim` user.

## NeoVim Thoughts

I'm not convinced that NeoVim is any better or worse than `vim`. For every UX improvement, it seems like there is a cost of complexity and troubleshooting. There are 2 different ways to configure the tool: `vimscript` and `lua`. I want NeoVim to be more opinionated and simply dedicate itself to lua with an optional plugin for vmscript. IMO, NeoVim is trying to hard to be `vim` and `nvim` to everyone.

Some of the more flashy features of NeoVim include File Explorer, Syntax Highlighting, and Code Discovery (all of which exists in `vim`). The only feature I've observed in NeoVim that I've not used in `vim` is the _LSP_ plugins for code suggestions.

Of course if you want any of this, you have to learn lua, learn each plugin's options, learn NeoVim's FHS, learn existing mappings of the system (for deconfliction), learn how to troubleshoot bad NeoVim config, and once all that is complete you'll have a working setup until the next upgrade. _Did I mention there appears to be no guarantee of backward compatibility in how are things are configured from version to version?_ It is far from: scroll through options, check boxes, and click Ok that I get from other tools.

Ultimately, NeoVim feels like a tool that has the same configuration complexity as a nodejs project, _bleh_. I am going to continue to use NeoVim for the time being, but I'll likely only be using whatever comes with my package manager. Using a starter configuration like `nvchad` is simple enough to get going, presuming you know the revision to use for the NeoVim version you have.

## Comments

<Comments />

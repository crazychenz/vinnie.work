---
title: "Git Better"
date: "2020-10-08T12:00:00.000Z"
description: |
  A more thoughtful setup of git for modern setups.
---

I've lightly been using git for many years. This was mostly so that I could naigate the linux kernel tree and for exploration of the tool itself. My current office has been deeply invested in subversion since 2005 and can't seem to find a smooth transition plan for moving to git.

Employer aside, when I started my graduate degree around 2017, I used git exclusively at home for pet projects and school projects. As an avid subversion users, I would freqently use git as I use subversion (with an addition push for publication). I always used git from a terminal window and manually used diff/patch for analyzing changes and tracking bug fixes. (I'm aware of subversion brancing/merging, but diff/patch has been more efficient for me unless I need to collaborate within a branch.)

Moving one more tiny step forward, I'd like to start to streamline my git setup on my system to be more efficient and git minded instead of just pretending git is another RCS variant of subversion. At the same time, there are a number of workflows I've become familar with in my use of subversion and I'd like to integrate those into git.

## Command Line Prompt Decorations on Linux for SSH/tmux

### Introduction

I've been seeing a lot of users on youtube tutorials using a lot of fanciness in their shell prompt settings. In the past, I've done a fair bit of PS1 modification to alert me to particular states, but it seems to be trendy these days to have a full situational awareness of your revision control system in the prompt (e.g. what branch, clean/dirty checkout, local/remote repo). Looking into this I quickly found 2 options:

- [git-bash-prompt](https://github.com/magicmonty/bash-git-prompt) - This looked more like something I would write. **Its simple and looks very portable.** My reservation with using this tool is that it isn't as pleasing to the eyes as the second option. Also, this isn't the tool that originally got me hunting for this feature.

- [powerline](https://github.com/powerline/powerline) - This is the tool I've been seeing everywhere. I originally discovered this tool's name from [How to Jazz Up Your Bash Terminal](https://www.freecodecamp.org/news/jazz-up-your-bash-terminal-a-step-by-step-guide-with-pictures-80267554cb22/). Other folks refer to posh, or zsh, which it also supports. But I prefer stock tools (to avoid all the annoying setup), so I usually opt for bash. Powerline is a python library and daemon that is capable of providing all that nice environmental state and git state into your prompt and in the status bar line in some terminal editors and interpreters. **Caution:** It looks nice and useful, but its a pain to setup and install. (Note to self ... checkout [oh-my-bash](https://github.com/ohmybash/oh-my-bash)) \[[src](https://github.com/powerline/powerline) | [docs](https://powerline.readthedocs.io/en/master/usage/shell-prompts.html)\]

### Powerline Installation

Right, so, powerline installation (with [git status](https://github.com/jaspernbrouwer/powerline-gitstatus)):

```
pip3 install --user powerline-status powerline-gitstatus
```

Activate powerline in bash by adding something like the following to `.bash_profile` or `.bashrc`. (Note: The install path of powerline python tool with install in different locations depending on OS. I'm using Ubuntu 20.x.)

```
export PATH=$PATH:$HOME/.local/bin
powerline-daemon -q
POWERLINE_BASH_CONTINUATION=1
POWERLINE_BASH_SELECT=1
. $HOME/.local/lib/python3.8/site-packages/powerline/bindings/bash/powerline.sh
```

### Powerline Fonts

Powerline looks good because it uses some special characters that aren't normally provided with typical font families. Therefore you need to either get a decent font from [Nerd Fonts](https://www.nerdfonts.com/) or grab a font from the [powerline patched font faces](https://github.com/powerline/fonts).

On windows, I downloaded the release from github, unziped the font I wanted and double clicked to install it. I've noticed that Scott Hanselman also has some [windows instructions](https://www.hanselman.com/blog/HowToMakeAPrettyPromptInWindowsTerminalWithPowerlineNerdFontsCascadiaCodeWSLAndOhmyposh.aspx) on his blog as well.

If `apt` is your package manager, you can install the fonts with:

```
sudo apt-get install fonts-powerline
```

If `dnf` is your package manager, you can install the fonts with:

```
sudo dnf install powerline-fonts
```

I've personally opted to go with "DejaVu Sans Mono for Powerline". Now here is what I think will be the biggest pain for powerline. The font face needs to be configured by the application presenting the prompt, not the host serving the prompt. Therefore, I need to install the powerline compatible fonts in all environments I plan to use it from and configure the presentation applications to use the particular font face.

- Visual Studio Code - Open settings with Ctrl-, and search for "terminal font". Then you can just drop your font face name in the field: `"DejaVu Sans Mono for Powerline", Consolas, 'Courier New', monospace`

- Windows Terminal - Open settings and add a [fontFace property](https://docs.microsoft.com/en-us/windows/terminal/customize-settings/profile-settings#text-settings) to the profile or default section for all profiles. I added it to the default section:

```
  {
    "$schema": "https://aka.ms/terminal-profiles-schema",
    ...
    "profiles": {
      "defaults": {
        "fontFace": "DejaVu Sans Mono for Powerline"
      },
      "list": [
        {
          "name": "Local Git/MinGW Bash",
          "fontFace": "DejaVu Sans Mono for Powerline",
          ...
        }
      ]
    },
    ...
  }

```

**Note:** Its likely that whatever applications you plan to present powerline from won't register the newly installed fonts until they are completely restarted.

### Powerline Configuration

To configure powerline for git, we have to manually jam in a bunch of options into powerline configuration files that seem to be buried in python installation directories that have little business storing config files, but this is what I got to work. Its worth mentioning here that this configuration occurs on the host that serves the prompt, not the presenter host.

Assuming Ubuntu with a user installation, open the `default.json` file located at an address similar to `~/.local/lib/python3.8/site-packages/powerline/config_files/colorschemes/default.json` and merge in the following gitstatus\_\* entries to the existing powerline groups object.

```
{
  "name": "Default",
  "groups": {
    ...
    "gitstatus_branch":          { "fg": "gray8",           "bg": "gray2", "attrs": [] },
    "gitstatus_branch_clean":    { "fg": "green",           "bg": "gray2", "attrs": [] },
    "gitstatus_branch_dirty":    { "fg": "gray8",           "bg": "gray2", "attrs": [] },
    "gitstatus_branch_detached": { "fg": "mediumpurple",    "bg": "gray2", "attrs": [] },
    "gitstatus_tag":             { "fg": "darkcyan",        "bg": "gray2", "attrs": [] },
    "gitstatus_behind":          { "fg": "gray10",          "bg": "gray2", "attrs": [] },
    "gitstatus_ahead":           { "fg": "gray10",          "bg": "gray2", "attrs": [] },
    "gitstatus_staged":          { "fg": "green",           "bg": "gray2", "attrs": [] },
    "gitstatus_unmerged":        { "fg": "brightred",       "bg": "gray2", "attrs": [] },
    "gitstatus_changed":         { "fg": "mediumorange",    "bg": "gray2", "attrs": [] },
    "gitstatus_untracked":       { "fg": "brightestorange", "bg": "gray2", "attrs": [] },
    "gitstatus_stashed":         { "fg": "darkblue",        "bg": "gray2", "attrs": [] },
    "gitstatus:divider":         { "fg": "gray8",           "bg": "gray2", "attrs": [] }
  }
}
```

After setting up the powerline colorscheme for gitstatus, you'll need to activate the gitstatus in the powerline utility by merging in the following data into `~/.local/lib/python3.8/site-packages/powerline/config_files/themes/shell/default.json`. Notice, you must put the object into the segments.left array.

```
{
  "segments": {
    "left": [
      ...
      {
        "function": "powerline_gitstatus.gitstatus",
        "priority": 40
      }
    ],
    "right": [
      ...
    ]
  }
}
```

### Additional Powerline Configs

The default settings for powerline will stretch the prompt pretty far in the horizontal direction and then put the cursor to the right of it. Instead of having that really long line of stuff, I prefer to have multi-line prompts where the top line is typically long lived state and the bottom line is short lived state. Long lived state includes things like virtual environment labels, host names, and git branch names. Short lived state includes things like the current working directory and command counters.

Here is a snapshot of my powerline theme config:

```
{
  "segments": {
    "above": [
      {
        "left": [
          {
            "function": "powerline.segments.shell.mode"
          },
          {
            "function": "powerline.segments.common.net.hostname",
            "priority": 10
          },
          {
            "function": "powerline.segments.common.env.user",
            "priority": 30
          },
          {
            "function": "powerline.segments.common.env.virtualenv",
            "priority": 50
          },
          {
            "function": "powerline.segments.shell.jobnum",
            "priority": 20
          },
          {
            "function": "powerline_gitstatus.gitstatus",
            "priority": 40
          }
        ],
        "right": [
        ]
      }
    ],
    "left": [
      {
        "function": "powerline.segments.shell.cwd",
        "priority": 10
      }
    ]
  }
}
```

## VSCode Usage and Extensions (cherry picking changes for stage)

One of the absolute best features I've never known about

## Aliases (st, co, ie, tcr) - Can I add aliases to repo?

Git has a pretty [good documentation on aliases](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases) themselves. I just thought I would jott up the aliases I like to use.

As a subversion user for many years I type `svn st` probably more than any other revision control command. Going between subversion and git and having to type out `git status` is frustrating. To compound this fustration, I've been using a tool by Michael Henry called [svnwrap](https://pypi.org/project/svnwrap/) that simplifies the output of `svn status` so it looks at lot like `git status -s` (but svnwrap has more clever coloring). Hence, I use the `git st` to perform:

```
git config alias.st 'status -s'
```

In subversion land, a checkout is usually coming from a remote server and is usually run when I am starting a new project or pulling an existing project into a new enironment for the first time. The best analogy I can use for git is `clone`. I've developed a habit over the years of using the subversion abbreviation `co` to checkout subversion working copies so I enjoy using the same verb for cloning repositories from git.

```
git config alias.co clone
```

From the git documentation itself, they use a funny example of "perhaps you want to have a command you think should exist or improve usability" ... almost like they know this is an issue but reuse to remove it so they can have their alias example. :) Instead of using the non-expressive `reset HEAD` to unstage a file, simply create an `unstage` alias.

```
git config alias.unstage 'reset HEAD --'
```

When pulling in subversion, its referred to as performing an update. Therefore having a `git up` should actually just run `git pull`. Git command will even suggest this if you don't already have an alias setup.

```
git config alias.up pull
```

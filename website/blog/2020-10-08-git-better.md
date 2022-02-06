---
slug: 2020-10-08-git-better
title: "Git Better"
#date: "2020-10-08T12:00:00.000Z"
description: |
  A more thoughtful setup of git for modern setups.
---

I've lightly been using git for many years. This was mostly so that I could navigate the linux kernel tree and for exploration of the tool's distributed properties. My current office has been deeply invested in Subversion since 2005 and can't seem to find a smooth transition plan for moving to git.

<!--truncate-->

Employer aside, when I started my graduate degree around 2017, I used git exclusively at home for pet projects and school projects. As an avid subversion users, I would freqently find myself thinking like a subversion user where I would want to simply get the source code and then put changes back upstream as soon as possible to prevent future conflicts or long lived branches.

I intend to move forward by streamlining my git setup on my systems to be more efficient and git minded instead of just pretending git is another RCS variant of subversion. The things I would like to accomplish include:

- Integration of git into all of my command line prompts (e.g. powerline)
- Setup of aliases and scripts to streamline various workflows and workflow steps.
- Explore more advanced workflows for use with git, like Git with VSCode and merge only master.
- Removal of `master` as the name of a branch

## My Environment

I like to work from several different locations on several different computers hosting different operating systems. This creates several problems that I need to account for.

My typical home setup is that I run my primary development environment from a Linux VM on my desktop machine from my house. From this VM I host a VSCode code-server docker container that I can do all my development from and it doesn't matter if I'm on my laptop, my desktop, or a chromebook. I just bring up a modern Edge or Chrome and start coding away in a remote linux VSCode while having Windows 10 as my UX.

The main issue I run into with the primary environment is that it doesn't do squat for me when I am away from my home network and I don't have a really good internet connection. With a laptop that only has 8GB of system memory (4GB taken by Windows 10), I don't have enough memory to run both a backend VM, my development tools in Windows, and a browser (not to mention Discord and Spotify).

Finally, at work everything is Linux. Linux thin clients talking to Linux desktop environments connected to Linux backend servers.

In summary, the goals listed in the previous section need to satisfy environments that include Windows-frontend to Linux-backend, Linux-frontend to Linux-backend, and Windows-frontend to Windows-backend.

## Knowing Presentation from Controller

One of the gotchas with setting up modern terminal visuals like powerline is knowing the difference between the presentation components and the controller components of the system and knowing each of their responsibilities. Put simply, the interactive shell is the controller and it sends state information to the presentation layer. The presentation layer is dump and simply forwards the state to the user but when some visual preference or que (e.g. fonts, colors, bells, symbols). To break this down into tangible examples:

- Windows Terminal, Gnome/Mate terminal, a browser, or VSCode Integrated Terminal are the presentation layer.
- bash, zsh, or powershell are the controller layer.

Now here is the catch, because of ssh and tmux, the presentation layers and controller layers can exist in different systems and different platform types. Therefore, we must configure the backend of all systems we plan to connect to and develop from and configure all the heterogenious frontends that we plan to connect from and develop from. Yikes!

## Picking a Presentation Font

Powerline looks good because it uses some special characters that aren't normally provided with typical font families. Therefore you need to either get a decent font from [Nerd Fonts](https://www.nerdfonts.com/) or grab a font from the [powerline patched font faces](https://github.com/powerline/fonts). I recommend going with a Nerd Font font because they include extra characters that powerline and powerline-like plugins prefer to use. I even found that the powerline patched fonts from github aren't always good enough for setups like the Operator theme for oh-my-posh.

If `apt` is your package manager, you can install some powerline fonts with:

```
sudo apt-get install fonts-powerline
```

If `dnf` is your package manager, you can install some powerline fonts with:

```
sudo dnf install powerline-fonts
```

I've personally opted to go with "DejaVuSansMono NF" from [Nerd Fonts](https://www.nerdfonts.com/).

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

## Integrate Git into Linux prompt

### Introduction

In the past, I've done a fair bit of PS1 modification to alert me to particular states of my shell environment, but it seems to be trendy these days to have a full situational awareness of your revision control system in the prompt (e.g. what branch, clean/dirty checkout, local/remote repo). Looking into this on the intertubes I quickly found 2 options:

- [git-bash-prompt](https://github.com/magicmonty/bash-git-prompt) - This looked more like something I would personally write. **Its simple and looks very portable.** My reservation with using this tool is that it isn't as pleasing to the eyes as the second option. Also, this isn't the tool that originally got me hunting for this feature.

- [powerline](https://github.com/powerline/powerline) - This tool seems to be generating the look I've been seeing everywhere. I originally discovered this tool's name from [How to Jazz Up Your Bash Terminal](https://www.freecodecamp.org/news/jazz-up-your-bash-terminal-a-step-by-step-guide-with-pictures-80267554cb22/). Other folks refer to posh, or zsh, which it also supports but I am looking to configure my setup with bash. Powerline is a python library and daemon that is capable of providing all that nice environmental state and git state into your prompt and in the status bar line in some terminal editors and interpreters. **Caution:** It looks nice and useful, but its a pain to setup and install. (Note to self ... checkout [oh-my-bash](https://github.com/ohmybash/oh-my-bash)) \[[src](https://github.com/powerline/powerline) | [docs](https://powerline.readthedocs.io/en/master/usage/shell-prompts.html)\]

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

## Integrate Git into Windows Powershell (posh)

Scott Hanselman has some [windows instructions](https://www.hanselman.com/blog/HowToMakeAPrettyPromptInWindowsTerminalWithPowerlineNerdFontsCascadiaCodeWSLAndOhmyposh.aspx) on his blog. The gist of it is run the following commands and confirm you want to proceed for each:

```
Install-Module posh-git -Scope CurrentUser
Install-Module oh-my-posh -Scope CurrentUser
Install-Module -Name PSReadLine -AllowPrerelease -Scope CurrentUser -Force -SkipPublisherCheck
```

Open the Powershell profile configuration file by running from powershell itself `notepad $PROFILE` and add the following lines to that file:

```
Import-Module posh-git
Import-Module oh-my-posh
Set-Theme Paradox
```

From here you should be able to open a new powershell (from Windows Terminal) and see the updated prompt. If you get an access error, open Powershell with Administrator rights and plug in the following:

```
Set-ExecutionPolicy -Scope LocalMachine -ExecutionPolicy Unrestricted`
```

Now you should be able to open a Powershell as user (from Windows Terminal) and everything will work.

## VSCode Usage and Extensions

OK, so now that we have VScode Terminal, Windows Terminal, Powershell, and Bash all configured, we're on to controlling Git from VSCode. Out of the box, VSCode appears to have some minimal Git capabilities such as tracking changes in the current branch.

My absolute favorite feature that VSCode provides is the ability to stage single hunks of change sets from a single file with multiple change sets. For example, suppose I have a file where I changed an import at the top of the file and I changed the style of some loop toward the bottom of the file. Previously I would have to do some crazy diff/patch dancing to create clean commits or more likely I would just commit a style commit and functional commit in the same commit and document it as such. Either case is inefficient before and after the commit. With VSCode, I simply stage the change from the top of the file, commit, and then stage the change at the bottom of the file and commit a second time, creating a clean history.

To get more out of git with VSCode, I've installed the GitLens extension. This allows me to easily browse and switch between tags and branches. It is a little noiser with information that I would like but it does group my branches into a tree when I use slashes in branch names. For example, each post I make on this site is its own branch prefixed with `post/`.

## Aliases and Scripts

Git has a pretty [good documentation on aliases](https://git-scm.com/book/en/v2/Git-Basics-Git-Aliases) themselves.

As a subversion user for many years I type `svn st` probably more than any other revision control command. Going between subversion and git and having to type out `git status` is frustrating. To compound this fustration, I've been using a tool by Michael Henry called [svnwrap](https://pypi.org/project/svnwrap/) that simplifies the output of `svn status` so it looks at lot like `git status -s` (but svnwrap has more clever coloring). Hence, I use the `git st` to perform:

```
git config alias.st 'status -s'
```

From the git documentation itself, they use a funny example of "perhaps you want to have a command you think should exist or improve usability" ... almost like they know this is an issue but reuse to remove it so they can have their alias example. :) Instead of using the non-expressive `reset HEAD` to unstage a file, simply create an `unstage` alias.

```
git config alias.unstage 'reset HEAD --'
```

When pulling in subversion, its referred to as performing an update. Therefore having a `git up` should actually just run `git pull`. Git command will even suggest this if you don't already have an alias setup.

```
git config alias.up pull
```

When you work on multiple machines with git, you'll find yourself wanting to push all your branches into a commonly accessible repository (e.g gitlab, github). But oddly, they have no simple mechanism for pulling down all of the branches into another system from the clone command or another command. Instead, I've found a number of [stackoverflow answers](https://stackoverflow.com/questions/67699/how-to-clone-all-remote-branches-in-git) that hack in solutions to this problem.

My personal variant of the stackoverflow answers looks something like this (as a oneliner):

```
for branch in $(git branch --all | grep '^\s*remotes' | egrep --invert-match '(:?HEAD|trunk$)' | sed 's"remotes/origin/""'); do git branch --track $branch remotes/origin/$branch ; done
```

It has also been recommended to run the following after importing all the remote branches:

```
git fetch --all
git pull --all
```

## Conclusion

I haven't yet covered renaming master to something else or various workflows I would like to discover because those are in the next post. This post was getting long as it is. In any case, there you go ... Nerd Fonts for the presentation win, oh-my-posh and powerline for the controller win, and GitLens to use Git more effectively in VSCode. ... This is the second version of this post, hopefully I don't learn to much more and feel inclined to re-write it again. :)

## Comments

<iframe src="/comment-iframe.html" height="1024" width="100%" onLoad=""></iframe>

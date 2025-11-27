---
slug: 2025-11-27-peeking-at-others-toolboxes
title: "Peeking At Other's Toolboxes"
draft: false
---

## Perusing Reddit

As I'm sure many other do, I peruse reddit for current events, curiousities, and new things to discover. One habbit I have is to see a new tool that looks like it could remotely apply to some use case I've encountered in my past and then I'll share it to myself in a chat application. The hope here is that I'll actually go back and look more into it when I have time. As you can probably guess, that chat stream gets ever longer without me ever going back and checking on the entries.

Because I've found some extra time Thanksgiving morning to go back through the list a bit, I've taken a bit of a dive into [`Dark-Alex-17`'s `dtools` repository]() as advertised in [this reddit post](https://www.reddit.com/r/bash/s/swSpcDMxU7). Its yet another toolbox repo that's been tailored to a specific engineer's experience and use cases. I very much appreciate this kind of thing because it's like rummaging through a physical workshop and finding all of the tools and things that you may not have know about, or in my case I usually find things I've seen in passing, but now get extra points for being used in the wild.

<!-- truncate -->

## Tailored Toolsets

The `dtools` is tailored for the developer's needs. I can very much appreciate the care and feeding that has gone into this toolset. I think it shows a level of dicipline of the developer. Especially with regard to having standard library components, documentation, and completions. I mean, I never give myself the time to implement completions for my own personal scripts (unless used by other users).

That said, I have no time or interest to learn yet another small framework for managing my CLI or TUI workflows. But even so, that doesn't mean there are a lot of little goodies that I've taken away from looking at this repository... 

## Snippets

### Searching Git History

One clever piece of code I found was this snippet:

```sh
# shellcheck disable=SC2154
declare search_string="${args[search-string]}"

git rev-list --all | (
    while read -r revision; do
      git grep -F "$search_string" "$revision"
    done
  )
```

It bascially does a `git grep` on each revision in the entire repo so you can search for a string across all of the history. Something I'd use very rarely, but a great idea to accomplish this!

### Colorful Echoing

`dtools` color aliases are something that look remarkably simple that I've never thought of before:

colors.sh:

```sh
enable_auto_colors() {
  ## If NO_COLOR has not been set and stdout is not a TTY, disable colors
  if [[ -z ${NO_COLOR+x} && ! -t 1 ]]; then
    NO_COLOR=1
  fi
}

print_in_color() {
  local color="$1"
  shift
  if [[ "${NO_COLOR:-}" == "" ]]; then
    printf "$color%b\e[0m\n" "$*"
  else
    printf "%b\n" "$*"
  fi
}

red() { print_in_color "\e[31m" "$*"; }
green() { print_in_color "\e[32m" "$*"; }
yellow() { print_in_color "\e[33m" "$*"; }
blue() { print_in_color "\e[34m" "$*"; }
magenta() { print_in_color "\e[35m" "$*"; }
cyan() { print_in_color "\e[36m" "$*"; }
black() { print_in_color "\e[30m" "$*"; }
white() { print_in_color "\e[37m" "$*"; }

bold() { print_in_color "\e[1m" "$*"; }
underlined() { print_in_color "\e[4m" "$*"; }

red_bold() { print_in_color "\e[1;31m" "$*"; }
green_bold() { print_in_color "\e[1;32m" "$*"; }
yellow_bold() { print_in_color "\e[1;33m" "$*"; }
blue_bold() { print_in_color "\e[1;34m" "$*"; }
magenta_bold() { print_in_color "\e[1;35m" "$*"; }
cyan_bold() { print_in_color "\e[1;36m" "$*"; }
black_bold() { print_in_color "\e[1;30m" "$*"; }
white_bold() { print_in_color "\e[1;37m" "$*"; }

red_underlined() { print_in_color "\e[4;31m" "$*"; }
green_underlined() { print_in_color "\e[4;32m" "$*"; }
yellow_underlined() { print_in_color "\e[4;33m" "$*"; }
blue_underlined() { print_in_color "\e[4;34m" "$*"; }
magenta_underlined() { print_in_color "\e[4;35m" "$*"; }
cyan_underlined() { print_in_color "\e[4;36m" "$*"; }
black_underlined() { print_in_color "\e[4;30m" "$*"; }
white_underlined() { print_in_color "\e[4;37m" "$*"; }
```

My person color preferences use `tput` and are directly embedded in the string I intend to use them in. I also happen to support a light mode and dark mode for adjusting to sunny or indoor environments:

```sh
COLOR_RESET="$(tput sgr0)"
if [ -e "$(realpath ~)/.light_theme" ]; then
  COLOR_LIGHT_BROWN="$(tput setaf 178)"
  COLOR_LIGHT_PURPLE="$(tput setaf 90)"
  COLOR_LIGHT_BLUE="$(tput setaf 61)"
  COLOR_LIGHT_GREEN="$(tput setaf 70)"
  COLOR_LIGHT_YELLOW="$(tput setaf 94)"
  COLOR_YELLOW="$(tput setaf 184)"
  COLOR_GREEN="$(tput setaf 64)"
  COLOR_ORANGE="$(tput setaf 208)"
  COLOR_RED="$(tput setaf 196)"
  COLOR_GRAY="$(tput setaf 243)"
else
  # Configure aliases for the terminal colors.
  COLOR_LIGHT_BROWN="$(tput setaf 178)"
  COLOR_LIGHT_PURPLE="$(tput setaf 135)"
  COLOR_LIGHT_BLUE="$(tput setaf 87)"
  COLOR_LIGHT_GREEN="$(tput setaf 78)"
  COLOR_LIGHT_YELLOW="$(tput setaf 229)"
  COLOR_YELLOW="$(tput setaf 184)"
  COLOR_GREEN="$(tput setaf 83)"
  COLOR_ORANGE="$(tput setaf 208)"
  COLOR_RED="$(tput setaf 167)"
  COLOR_GRAY="$(tput setaf 243)"
fi
```

I'd love to see a combination of these two things in my general toolset.

### Code Fencing or Flow Filtering

Another little thing that I've found myself duplicating over and over everywhere are distribution filters for various scripts and processes. `dtools` has a [folder](https://github.com/Dark-Alex-17/dtools/tree/main/src/lib/filters) of filers for different context. The debian filter looks like:

```sh
filter_debian_based_os() {
	if grep -qiv '^ID_LIKE=.*debian' /etc/os-release; then
      red_bold "This command can only be run on debian-based systems."
    fi
}
```

Personally, I would never want to directly reference a library's filter like this, but what I do want is a collection of filters that I can have the system spit out for direct copy and paste into other code. Of course if you are online and have that GPT or Claude tab already open, its just as easy to ask a LLM for the answer, but that requires vetting the bullshit response. If I have a set of pre-vetted filter code that I can copy into a given script, that would make boilerplate a lot simpler. I would pre the above code (for my use case) to be something like:

```sh
show_filter_debian_based_os() {
cat <<<EOF
	if grep -qiv '^ID_LIKE=.*debian' /etc/os-release; then
      red_bold "This command can only be run on debian-based systems."
    fi
EOF
}
```

If I sourced that into my current shell, I type "show_filter", hit TAB TAB and then I'll see all the options. With `fzf` integrated, you'll get the full search experience.

## Tools

Now, the biggest thing to get from a repository like this is the actual underlying tools that are used by the developer. It seems like since circa 2020, there has been an explosion of great cross platform tooling developed without a lot of marketing. Although a lot of these tools have also fallen out of maintenance, I simply don't know they are there unless I'm frantically scouring the internet for something to help me with a _current_ project. I love looking at new tools, often resulting in some pretty critical judgments as to their actual or potential value add to my past and current experiences. 

Note: There is also a reference to another [linux utility library](https://github.com/ChrisTitusTech/linutil) that I have no plan to checkout now. Basically a swiss army knife with a fuzzy finder and TUI for each of the tools integrated. ... A little too much hand holding for me personally.

### CLI Tools

Long story short, `dtools` makes use of a lot of open source CLI tooling that I've either seen in passing or I've not seen before. For my own posterity, I'll list some of the tools that popped out to me:

- [BleachBit](https://www.bleachbit.org/) - Cross platform cache and temporal data cleaner. This one is interesting because I always think of these kinds of tools as Windows bloatware. I've never seen something like this for Linux. I would NEVER suggest using something like this, but its neat folks consider Linux when deving sanitizers now.

- [qpdf](https://github.com/qpdf/qpdf) - I've personally done a massive amount of PDF parsing, mutations, and rendering work in the past. In my own work, I always constrained the PDF handling to pure python for portability and simplicity in dependency management. That limitation has really caused a blind spot for other PDF tools like this C++ based tool.

- [PDFtk](https://www.pdflabs.com/tools/pdftk-the-pdf-toolkit/) - A proprietary PDF toolkit that has both CLI and GUI tools for manipulating PDFs _offline_.

- [SonarQube](https://github.com/SonarSource/sonarqube) - This is one I see alot. From what I understand, its a framework for static code analysis to find potential bugs or security vulnerabilities. IMHO, have a good security model and know that any sufficiently complex code base will be vulnerable, not because _your code_ is bad, but because the whole _system_ is vulnerable. (Completely out of the control of any single developer). [SonarQube Wikipedia Link](https://en.wikipedia.org/wiki/SonarQube).

- [Zimit](https://zimit.kiwix.org/#/) - What the heck is this? It claims its a tool for mirroring a website offline? Offline website copies are something I do a lot of. I have no trust in the internet's posterity or stability, so if I see something useful, I copy it. Not sure what Zimit gives you that wget/curl, tar, and python doesn't.

- [Mermaid Server](https://github.com/TomWright/mermaid-server) - Ok ... a flow chart online. This could be useful for someone's self hosted lab. For me, I'm going to use draw.io for manual charts and graphviz for automated charts. I guess there is a use case where developing mermain graphs for integration into another markdown or RST documentation could be useful.

- [Simpleproxy](https://manpages.ubuntu.com/manpages/trusty/man1/simpleproxy.1.html) - I don't know how I've never seen this one before! I personally would use SSH proxy, netcat, or socat for anything like this. But its good to know about other tools for when you're on systems that don't have tools you usually use.

- [Ntfy](https://ntfy.sh/) - Yet another pub-sub service. But I do like it when cross-platform services like this are made dead simple for use in something like a shell script. It makes monitoring something like a cron job very easy to manage. [Ntfy Github Repo](https://github.com/binwiederhier/ntfy)

- [Wrkflw](https://github.com/bahdotsh/wrkflw) - Tools to debug Github Actions offline. I'd like to look more into this, time permitting. The spirit of this is a great idea because Github Actions hid way to much from the developer IMO. Personally, I've always managed replicating Github Actions offline via Gitea and whatever other infrastructure is involved (e.g. K8s, Docker, CICD Framework).

- [Gama](https://github.com/termkit/gama) - Github Action Manager. If you have a lot of changing actions, this seems like it could be useful. I personally hope that I don't have to mess with Actions after their setup. If this tool is a primary aspect of my job, there is likely something else smelly in the environment.

- [neoss](https://github.com/PabloLec/neoss) - What a crazy name! I'll _never_ use this tool. I will agree that `ss` is a horrible tool to use. Its the replacement for `netstat` which is equally horrible. I'd love to see a replacement command that is smarter about providing the information I care about without knowing non-intuitive command line arguments.

- [Grip](https://github.com/joeyespo/grip) - Preview README in Github before pushing. I guess this requires to much brain for me. I'd rather push to a branch and look at it if I couldn't push to main. Its a readme and _shouldn't_ break the build!


### TUI Tools

- [Harlequin](https://harlequin.sh/) - SQL TUI - I prefer SQL REPLs, but this is the kind of thing that is quite useful when working with folks that are more green or being able to have a candid on-the-fly conversation about some aspect of a database or its schema.

- [Gobang](https://github.com/TaKO8Ki/gobang) - Database management TUI - Written in Rust FWIW.

- [Euporie](https://github.com/joouha/euporie) - Jupyter In Terminal - I don't like Jupyter at all, but I completely appreciate that its a great interface for walking through a flow for scienctists and researchers. I've found data scientists to really love using Jupyter. I personally prefer tmux, vim, and regular python!

- [Visidata](https://www.visidata.org/) - Spreadsheet/Tabular data visualizations in a TUI. Seems neat if you are into charting and clustering. I usually don't go that deep on data.

- [Wiki-TUI](https://wiki-tui.net/latest/) - Search and read Wikipedia in the terminal. This one looks really neat and I fully intent on adding this into my dotfiles.

- [Gitui](https://github.com/gitui-org/gitui) - Yet another GIT GUI. Lazygit looks and feels better. Not sure if Gitui is faster ... but I do git ops so infrequently, UX takes priority over speed. Also, I 99.99% of the time use raw `git`. I've only ever used git GUIs for searching history or logs.

- [jirust](https://github.com/Code-Militia/jirust) - Jira TUI in Rust. Jira tries to be everything to everyone. I use Jira because my coporation uses Jira. Other than that, Jira can dig a 6-foot hole and jump in.

- [Stu](https://lusingander.github.io/stu/) - S3 Bucket TUI - So long as this works for non-Amazon S3 buckets, this could be a cool tool. I've really struggled to find a "good" tools for browsing S3 buckets. Personally I want to mount S3 buckets to my VFS and be done with it all!

- [Nerdlog](https://github.com/dimonomid/nerdlog) - Log view TUI with histogram. Kind of neat. I'll always lean towards journalctl because I can trust its there. But if want to do some light visualization, this may indicate some issues more apparently.

- [Patat](https://github.com/jaspervdj/patat) - Terminal based presenter. I've always been fascinated by HTML presentations .. specifically MDX to HTML based presentations that are JS powered under the hood. This tools takes it one level deeper with purely terminal based slides. IMO, you are forced to minimize the text. The downside is that while I can trust a browser on all platforms, I can't trust there is a projectable and usable terminal. ... but I'd try it.

- [nnn](https://github.com/jarun/nnn) - Yet another terminal file manager. I've yet to find a use for something like this. Good ole cp/mv/ls/cd/pwd has done me well. `yazi` is the file manager that I have integrated into my dotfiles workflows at the moment, but I'm always interested in how other tools express the file system. Off topic, there are almost no Linux file explorers that provide sufficient file viewing in a side pane (similar to Window Explorer). Dolphin is the _only_ one I've found reliable and is probably a third of the reason I've choosen to use KDE for all my personal systems when I evicted Windows.

- [wego](https://github.com/schachmat/wego) - Another (cute) terminal based weather application. Often, the only thing I need weather for is hourly forecasting or radar based forcasting, therefore these kinds of apps are 100% bloatware.

- [slack-term](https://github.com/jpbruinsslot/slack-term) - Slack TUI. My employer uses Mattermost and Teams so I have no use. But if I changed jobs, I'd consider a slack TUI. The gotcha is that I would absolutely need a desktop notifier and the terminal app will likely not integrate such a feature. (Although its definately doable for common desktop environments like Gnome and KDE)!

- [Calcure](https://anufrievroman.gitbook.io/calcure) - Your standard calendar grid in a TUI. Claims to integrate with Google, Next, and Apple with some extra work. At the moment I have a company outlook calendar and a personal Google calendar and I've no patience to do anything about them. I hate calendars and appointments.

- [Joplin](https://joplinapp.org/help/apps/terminal/) - Note taking TUI. I don't know whats wrong with a standard file system and vim/emacs/nano. If you like having more things to remember, give it a go!

- [kmon](https://github.com/orhun/kmon) - A kernel monitoring tool, similar to top. That said, while I thought this could be cool, its seems a bit simple for my tastes. For what it demos, I can accomplish in a tmux config. Personally, I'd want to see way more depth into Kernel analysis ... let me quickly explore and inspect many aspects of sysfs, procfs, debugfs, securityfs, syscall audit logs, kprobes, shared memory, file system metadata, network stack status, and so forth. Having dmesg and module management doesn't do anything for me.

- [wavemon](https://github.com/uoaerg/wavemon) - TUI for monitoring wifi signals. Wifi signal strength icon and emoji indicators are absolute crap and lie. I always want to see signal strength to 3 significant digits. Is not just about knowing the current strength, you want to know if its getting better or worse over time and the conditions of your environment when that occurs. Having a tool like wavemon can help with that. Of course there are more direct ways to query the same information with wpa_supplicant and iwconfig like tools that you'll find way more common.

- [trippy](https://github.com/fujiapple852/trippy) - Fun little network analysis tool. This is the kind of thing I expect to show up on a scifi television show to look impressive on the monitors while a clueless actor spouts off some technical jargon. It looks fun to play with, but I'd never use it as a serious tool when working with serious network people.

- [UptimeKit-CLI](https://github.com/abhixdd/UptimeKit-CLI) - TUI for checking on uptime of various systems. I've used Uptime Kuma for my self-hosted services for years, but this is neat because its "top"-like for my whole service network. I'll be giving this one a go.

- [wg-cmd](https://github.com/andrianbdn/wg-cmd) - Wireguard configuration TUI. I use tailscale. Not sure how useful something like this would be above and beyond that standard commands.

- [proxyfor](https://github.com/sigoden/proxyfor) - Yet another proxy packet monitoring tool (like mitmproxy).

- [wuzz](https://github.com/asciimoo/wuzz) - Yet another HTTP inspector.

- [slumber](https://slumber.lucaspickering.me/) - Yet another HTTP API debugger (like Postman)

- [atac](https://atac.julien-cpsn.com/) - Yet another HTTP API debugger (like Postman)

- [Browsh](https://www.brow.sh/) - This is a neat little app. It appears to use a remote-browser to capture the content and throw it through some kind of filter to render the content on a text based terminal. I'd be curious if can run on a framebuffer console environment. Otherwise, I'm more likely to open a real browser.

- [Carbonyl](https://github.com/fathyb/carbonyl) - Browsh, but based on Chrome.

- [jqp][https://github.com/noahgorstein/jqp] - `jq` visualizer. I like it!

- [desed](https://github.com/SoptikHa2/desed) - `sed` visualizer. I like it!

- [play](https://github.com/paololazzari/play) - `grep`/`sed`/`awk` sandbox visualizer.

- [regect](https://github.com/kloki/regect) - regex visualizer. I like it!


### Other Tools

- [FreeRDP](https://github.com/FreeRDP/FreeRDP/wiki/PreBuilds) - FreeRDP is a remote desktop tool that can be used to access a Windows host from Linux.

- [asciinema](https://asciinema.org/) - Terminal session recorder. I've seen and heard about this one all over the internet. I've never actually used it, but I really need to for a bunch of the stuff I write verbosely about on my site.






## Comments

<Comments />
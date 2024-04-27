---
slug: 2024-04-27-scp-bg3-saves
title: 'SCP Baulder's Gate 3 Saves'
draft: false
---

Finding a way to SCP Baulder's Gate 3 saves took me roughly 15 minutes to figure out, but wow, that's to long to learn how to copy a file. `:)` Leaving a bread crumb here for this weird SCP use case.

```sh
scp -Tr user@host:'"c:/Users/user/AppData/Local/Larian Studios/Baldur'"'"'s Gate 3/PlayerProfiles/Public/Savegames/Story"' .
```

The trick was to use `'"'"'` to escape the single quote (`'`) inside of a pair of single quotes (`'`).

## Rsync On Windows

To get rsync functionality in windows, I prefer to host it within a [Git For Windows _SDK_](https://github.com/git-for-windows/build-extra/releases) install. This prevents me from having to deal with WSL or a whole other cygwin for the one tool.

Note: Git for Windows SDK is ~2.4GB to download (after the install begins).

More information can be found in [this SO Question](https://stackoverflow.com/questions/32712133/package-management-in-git-for-windows-git-bash).

Once you install _Git For Windows SDK_:

```sh
pacman -S rsync
```

And then you can:

```sh
rsync -sav "agrie@desktop.vinnie.work:/c/Users/agrie/AppData/Local/Larian Studios/Baldur's Gate 3" .
```

## Comments

<Comments />
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

## Comments

<Comments />
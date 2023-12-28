---
slug: 2020-11-09-autohotkeys-music-control
title: AutoHotkeys Music Control
#date: "2020-11-09T12:00:00.000Z"
description: |
  A simple mapping of unused Apple Keyboard function keys for media control in Windows.
---

My family often requests my attention while I'm listening to a video or music. Having the volume and pause/play actions mapped are very important to me so I can give them the attention they deserve. Looking at my apple keyboard, there are F16-F19 keys that are completely unused in my Windows/Linux environment. Therefore I mapped them to the following actions:

<!--truncate-->

- F16 - Volume Down
- F17 - Volume Up
- F18 - Volume Mute
- F19 - Media Play/Pause

The idea behind F19 is that button will be the most in demand, and since F19 is in the most upper right corner, it'll be the easiest to locate quickly. The mapping was done with an application called [Autohotkeys](https://download.cnet.com/AutoHotkey/3000-2084_4-10279446.html). Its a simple Windows application that has a typical install.exe and a next next next install process.

One Autohotkeys is installed, you'll need to create a script. Here is the one that I use for the above mapping to take effect.:

```
f16::Send {Volume_Down}
return

f17::Send {Volume_Up}
return

f18::Send {Volume_Mute}
return

f19::Send {Media_Play_Pause}
return
```

Super simple, super useful. **And it works.**

One last note ... apparently there are keyboard that have function keys up to F24?

## Comments

<Comments />

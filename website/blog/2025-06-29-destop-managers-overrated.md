---
slug: 2025-06-29-desktop-managers-overrated
title: "Desktop Managers are overrated."
draft: false
---

## Overview

In one particular network, I went through a long adventure of troubleshooting _random_ reboots. I still haven't _solved_ the problem, but I have gotten things to a stable state and I wanted to share everything I can recall from this nonsense situation. Gist: It involves power management and getting rid of all desktop managers without effecting usability or workflow.

<!-- truncate -->

## _Random_ Reboots

I had recently upgraded a number of systems on the network to Debian 12.11, a long needed upgrade from Ubuntu 20.04. After the upgrade, I noticed that the machine next to me was regularly rebooting. Due to the age of the device, I shrugged it off as possibly a bad power supply or something bad in the hardware. As least the machine I was working on wasn't rebooting.

After locking my screen and going for a wee, I can back in about 5 minutes to find that my machine had rebooted?! That was weird. I cautiously started using the system again but began scanning logs for reasons for the reboot... Was is an update? Was is a cron? Was is a hibernation gone wrong? There was nothing in the logs!

Immediately I disabled all sleep, suspend, and hibernation in my systemd:

```
sudo systemctl mask sleep.target suspend.target hibernate.target hybrid-sleep.target
```

Update `/etc/systemd/logind.conf`:

```
HandleLidSwitch=ignore
HandleLidSwitchDocked=ignore
HandleSuspendKey=ignore
HandleHibernateKey=ignore
```

`sudo systemctl restart systemd-logind`

I proceeded to do some more work over the next couple of hours. I then locked up and left that network alone for the rest of the day. When I returned the following morning, I checked the uptime... 2 mins?! Checking the logs from previous boots...

- `sudo journalctl -b -1`
- `sudo journalctl -b -2`
- `sudo journalstl -b -3`

They all were about 6-7 minutes until they rebooted! Nothing to indicate why they rebooted. After some more troubleshooting and trying things out, I finally determined that the system was rebooting only when locked or at the login screen. It would boot up just fine and it would never reboot while I was actually working, only when I locked the screen and when to the bathroom or whatever. (Very frustrating.)

Some of the other things I tried included checking for watchdogs. You know, those needy little things that need to be pet every 5 minutes or whatever. I attempted to disabling everything watchdog related:

- Added to `/etc/default/grub`'s GRUB_CMD_LINE_LINUX_DEFAULT: `nowatchdog`.
- Added to `/etc/modprobe.d/blacklist-watchdog.conf`:

  ```
  blacklist watchdog
  blacklist mei_wdt
  blacklist wdat_wdt
  ```
- Disabled service: `sudo systemctl stop watchdog && sudo systemctl disable watchdog`
- Updated Live Grub and rebooted: `sudo update-grub && sudo reboot`

Ok ... no more watchdogs, no more ..... It rebooted! By this time I was pretty obsessed with this issue and was actually staring at a screen doing nothing for like 8 minutes waiting for it to reboot. It turned out that the monitor would blank after 10 minutes of sitting on the GDM (GNOME Desktop MAnager) login screen. Was this an issue with GDM?

## Login/Lock Reboots

Ok, so the boots were no longer _random_. They happened exactly when the screen blanked during a login or lock. This included things like idle locks that happened about 10 minutes of no activity ... whether I was logged in or not. But only after the monitor went into power save mode.

OK, lets disable all of the GNOME sleep things:

```
gsettings set org.gnome.desktop.session idle-delay 0
gsettings set org.gnome.desktop.screensaver idle-activation-enabled false
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing'
gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'nothing'
... some others also that I don't recall ...
```

Turns out that gsettings are user specific, so you need to run this for what ever user the GDM login screen is using. It also requires dbus to run gsettings. And you can't exactly login to another X session to do this stuff because then the GDM login will no longer be running. (OMG) The only sensible way to access the machine locally is through another tty (via Ctrl+Alt+2). You could also remote in with SSH.

Once you've logged into a console via tty2 (or something other than tty1), you run `loginctl` to get the user. I don't recall the exact user, but I think it was something like `Debian-gdm` as the user. This meant that to set the gsettings for that user, I need to do something like the following:

```
sudo -u Debian-gdm dbus-launch gsettings set org.gnome.desktop.session idle-delay 0
sudo -u Debian-gdm dbus-launch gsettings set org.gnome.desktop.screensaver idle-activation-enabled false
sudo -u Debian-gdm dbus-launch gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-ac-type 'nothing'
sudo -u Debian-gdm dbus-launch gsettings set org.gnome.settings-daemon.plugins.power sleep-inactive-battery-type 'nothing'
```

This was a nice try, but things would still powersave after about 10 minutes.

Hmm ... ok, so what if we replace GDM with LightDM? Long story short, nope! Once LightDM would hit powersave, it would reboot. When I installed LightDM, I also removed all of GNOME and Wayland and installed only lightdm and openbox to simplify the environment quite a bit.

I was getting pretty desperate by this point. I just wanted the machine to not boot when I turned my back. I also didn't want to completely disable the screensaver mode because I didn't want burn in on the monitors. Note: Power saving is of zero concern on this network. I figured if the machine rebooted during login, that was significantly less impactful than if it rebooted while locked (with potentially unsaved work or state). With openbox, I installed and configured `i3lock`, locked the screen and left for the day.

When I returned the next day, to my great relief, i3lock was still running. I had an uptime of ~19 hours. Hurray! One half of the problem had a work around. Note: `i3lock` is probably horribly power inefficient for un-broken systems, but it worked for me. :)

So how do we fix the login screen issue? I replaced LightDM with XDM ... the most minimal X Desktop Manager I could find. Its login screen is configured with `/etc/X11/xdm/Xsetup`. In there I used `xset` to setup the low level X11 display blanking:

```
# Disable power management
xset -dpms
# blank screen after 30 seconds
xset s 30 0
```

The intention here was to blank the screen like i3lock had done, but without power management. Roughly 1 minute later, reboot.

I wasn't sure if the kernel had something to do with this, so I added a few more kernel command line flags and rebooted. The parameters were: `intel_idle.max_cstate=1 i915.enable_psr=0 i915.enable_fbc=0 processor.max_cstate=1 intel_pstate=disable`. There were suppose to prevent the kernel from initiating and power level changes itself. After a quick `sudo update-grub && sudo reboot`, I waited about 6 minutes and the system rebooted. Sigh....

## Keeping It On

Ok, so if we can't allow it to blank at all for reasons, lets keep it on.

Fine, lets get a `xscreensaver` running so that its always on and we avoid burn in. I setup `xscreensaver` with a simple "Galaxy" option and then run it in `/etc/X11/xdm/Xsetup` with:

```
export HOME=/home/admin
export DISPLAY=:0
sudo -u admin xscreensaver -no-splash &
```

Note: We run the screensaver as admin because it won't run as root. I was sure to give the admin user all the Xauthority and other permissions required, but all xscreensaver did was kill the keyboard and mouse access. It didn't start the screen saver and it never came back from its _locked_ state. Ugh... I'm sure this is a permission issue but I don't want to troubleshoot 30 year old technology at this point. WTF.

Damn it all, removed xdm and considered telling users they had to use startx. But this is ridiculous, why should the users have to take an extra step ... did I make the wrong decision using Debian on these systems? (Of course not, I'm sure as hell not going to use Ubuntu ever again.) This whole thing is likely a driver issue, but that is an issue that needs time and patience. I need a workaround now.

Ok, so lets think this through, why do we need a desktop manager at all?

- Login?  .... getty.
- Screenlock? .... i3lock.
- Idle Lock? ... xautolock.
- Optional Screen Saver? .... xscreensaver.

## A World Without a DM

The expectation of the user is that they login with their username/password and they get an xsession on their screen. Why can't we do this for all users from getty? We can with `/etc/profile.d/`

Create an executable script: `/etc/profile.d/startx.sh`:

```sh
#!/bin/sh

if [ "$(systemctl get-default)" = "graphical.target" ]; then
  if [ -z "$DISPLAY" -a "$(tty)" = "/dev/tty1" ]; then
    if [ ! -f "$HOME/.skip-startx" ]; then
      exec startx
    fi
  fi
fi
```

- This script will run whenever any user logs into the system.
- It will make sure we're running as a graphical.target (in contrast to multi-user.target) as expected in systemd.
- It will make sure the user is not already running X by checking $DISPLAY. This can happen because the user profile is run whenever opening a terminal (e.g. xterm) in X.
- It will make sure that we are only proceeding automatically on "tty1". This allows the user to still Ctrl+Alt+2 into another tty with console only access.
- Finally, it checks if the user has opt-ed out of this automation by looking for a `.skip-startx` file in their home directory.

Now we need to disable the display manager via systemctl: `sudo systemctl mask display-manager.service`. This allows us to keep everything in a `graphical.target`.

Finally, we'll reboot and we now have our plain old getty login. Login, and we get our X session automatically started.

## Last Ditch Effort to Blank getty

In theory, I should be able to `sudo systemctl edit getty@tty1` and add the following:

```
[Service]
ExecStartPost=/bin/sh -c 'openvt -s -w -- /bin/bash -c "setterm --blank 1 --powersave off --powerdown 0 >/dev/tty1"'
StandardOutput=tty
TTYPath=/dev/tty1
```

This works great for blanking the getty screen after 1 minute. Something I would like to have used. Unfortunately ... reboots were to follow!

Ok, so I can't blank the screen at all for now. Lets minimize the impact of burn in by removing all of `/etc/issue` and now my getting only takes up `host login:` in the upper left corner. I personally think this was an acceptable compromise considering all of the other due diligence and issues.

## Lock Screen Setup

Depending on your setup, there are some additional integrations to consider:

- You want the user to be able to lock their screen with a hot key (I prefer Meta+L).
- You want the user to be able to lock their screen with a menu or command palette.
- You want the system to auto lock after idle time.

I've done all of this for Openbox, but there are plenty of other docs on setting up Openbox.

## Conclusion

In conclusion, I've got some major takeaways.

- The first takeaway is that there are an obscene number of configuration points for power management in Linux and I'm sure I've only touched on a few:

  - bios
  - kernel command line
  - systemd
  - setterm
  - xset
  - dbus/gsettings
  - X

- The second takeaway is that desktop managers don't really do much past what getty and i3lock do.
  - They exist to look pretty and proliferate the myth of the "Year of the Linux Desktop".
  - I suppose there could be some accessibility aspects that I'm not considering, but I'd be very surprised if screen readers are not able to handle terminals or tools like getty. If that is a gap, I'd love to know because that should be a trivial update to the getty code base.
  - I mentioned that i3lock is likely inefficient because it prevented my machine from sleeping. While this is true, having `xset` handle the power management for you makes the i3lock power consumption a moot point. It'll likely go to sleep anyway, and this isn't to mention that the systemd sleep options are also still available to the system.

- I probably shouldn't mention this as a first in the conclusion, but locking in terminal is a thing:
  - `vlock` is a thing that allows you to lock your console screen without X running. This was considered useful for the situation where a user would login to a non-graphical shell and be required to run `startx`. Having `vlock` can make those users and security teams happy. Note: You can use a background script that checks atime or mtime of `/dev/tty1` or `$(tty)` for activity and no-activity will run `vlock`.
  - Note: `tmux` also has a built in locking mechanism with idle timeouts that is configurable in `tmux.conf`.

## In Summary

You can remove your desktop manager and instead:

- Run getty as your login
- Auto startx on tty1, just like the desktop manager.
- Lock you setup with i3lock and xautolock.

Minimal, clean, flexible, easy to debug, robust, transparent.

## Thoughts

... now I wonder how hard is it really to code a modern getty? You know ... something with more opt-in features but without Xorg, wayland, framebuffers, or GPUs.

## Comments

<Comments />




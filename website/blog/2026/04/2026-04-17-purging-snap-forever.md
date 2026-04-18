---
slug: 2026-04-17-purging-snap-forever
title: "Purging Snap Forever"
draft: false
---

I've had a lot of bad experiences with snap. For a time, it drove me to pure Debian. Debian of course has its own issues, especially in regards to hardware support. Therefore I've switched back to Ubuntu, critically **WITHOUT** snap.

The synopsis is:

```sh
# See the impact before removal. (Know what needs to be replaced.)
snap list

# Tell snap to remove all the things it manages.
snap remove --purge <snap-name>

# Stop snap services (and prevent anything from restarting them).
systemctl stop snapd
systemctl disable snapd
systemctl mask snapd
systemctl stop snapd.socket
systemctl disable snapd.socket
systemctl mask snapd.socket

# Remove snap from the system (and prevent anything from re-installing).
apt purge snapd
apt autoremove
apt-mark hold snapd
```

<!-- truncate -->

## My Problems With Snap

- It doesn't have a conventional way to allow mirroring. From a functionality perspective, I now **depend** on my ISP and upstream services to install applications. From a security perspective, I can't manually defer or scan for supply chain issues before users install.
  
- Snap depends on loop back devices. This design decision is very hacky. I use loop back devices to mock up ext file systems for embedded system deployment and for extraction from ISO files. Why do I need to run production applications from a loopback device?!

- Snap is horribly slow. There are easy design fixes Canonical could apply for this, but I suppose they've made their bed.

- Firefox is now required to use snap (unless you configure a Mozilla PPA). A primary platform tool should not depend on the immaturity of a tool like snap. If I attempt to `apt install firefox`, it calls snap! :: dead stare :: .... No. When I snap install, use snap. When I apt install, you better use apt to install that application.

So yeah, snap can go kick rocks.

## The Alternative

While I would love to live in a world where everything is in apt and always (functionally) as up to date as I need it, this is not the case. Snap was attempting to solve a real problem, it just did it in a horrible way.

Flatpak is the closest competitor of snap and provides a nice cross-distribution design. Its based on containerization. Not your K8s, Docker, Podman containerization, but its own Bubblewrap container runtime library. (Remember, containers are more of a Linux kernel feature than anything).

Flatpak has both a system installer (for all users) and a user based mode (for single user installs in the home folder). The system installer and the user installers all manage their own upstream repositories, so I can keep mirrors of applications I want to support available.

Aside from Flatpak, I also heavily use bash scripts to pull from Github Release repositories directly. If a project has been built with AppImage, Go, or Rust, its almost guaranteed that there is a static-ish binary available that I can download, shove in `~/.local/bin` folder and call it a day.

In brief, nearly all of my (upstream) third party GUI applications come from Flatpak. Nearly all of my (upstream) third party CLI applications come from GitHub. And I always prioritize the apt install over either if its functionally adequate.

To install Flatpak:

```sh
sudo apt install flatpak
# Add upstream respository for system installs:
flatpak remote-add --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
# And with the user mode version:
flatpak remote-add --user --if-not-exists flathub https://dl.flathub.org/repo/flathub.flatpakrepo
```

Flatpak uses the following folders:

- `/var/lib/flatpak`
- `~/.local/share/flatpak`

## My Recommendations

All Linux desktop environments have their pros and cons (IMHO), but my preferences lie in KDE and Plasma. Because of Ubuntu's mucking with firefox, I've now made it a convention to always include a fallback browser for moments when I'm having issues with a Firefox or Chrome based browser, be it updating, hacking, or some goofy upstream issues. For KDE, this is the Falkon browser. At a minimum, (in contrast to say `curl`) its good enough to DuckDuckGo for answers and download other standalone versions of more mainstream browsers. 

Installing Falkon (the KDE browser):

```sh
apt install falkon
```

### FlatPak Setup

If you want Flakpak installs to show up in your desktop environments search, ensure that the Flatpak folders are set in XDG_DATA_DIRS environment variable for your profile.

```sh
DDIRS=/home/$USER/.local/share/flatpak/exports/share
DDIRS=$DDIRS:/var/lib/flatpak/exports/share
export XDG_DATA_DIRS=$DDIRS:$XDG_DATA_DIRS
```

If you want to ensure Flatpak applications are auto updated:

`~/.config/systemd/user/flatpak-update.service`:

```ini
[Unit]
Description=Auto-update Flatpak apps

[Service]
Type=oneshot
ExecStart=/usr/bin/flatpak update -y

```

`~/.config/systemd/user/flatpak-update.timer`:

```ini
[Unit]
Description=Run Flatpak auto-update daily

[Timer]
OnCalendar=daily
Persistent=true

[Install]
WantedBy=default.target

```

Then run:

```sh
systemctl --user daemon-reload
systemctl --user enable --now flatpak-update.timer

```

## Some Applications

```sh
# Zen (A Firefox based browser built on "calm")
flatpak install -u flathub app.zen_browser.zen

# Draw.io for diagramming
flatpak install -u flathub com.jgraph.drawio.desktop

# Pinta (My Linux alternative to Paint.Net)
flatpak install -u flathub com.github.PintaProject.Pinta

# Spotify Music Player
flatpak install -u flathub com.spotify.Client

# WezTerm (My current terminal emulator of choice)
flatpak install -u flathub org.wezfurlong.wezterm

# Zulip Chat Application
flatpak install -u flathub org.zulip.Zulip

# Steam Game Launcher
flatpak install -u flathub com.valvesoftware.Steam

# VLC Video Viewer
flatpak install -u flathub org.videolan.VLC

# OBS Studio Video Capture Application
flatpak install -u flathub com.obsproject.Studio

# Inkscape Vector Graphics Editor
flatpak install -u flathub org.inkscape.Inkscape

# Blender 3D Modeling Software
flatpak install -u flathub org.blender.Blender

# Audacity Audio Recording and Shaping Application
flatpak install -u flathub org.audacityteam.Audacity

# Remmina Remote Desktop Application (VNC & RDP)
flatpak install -u flathub org.remmina.Remmina

# VirtManager Linux/KVM Virtual Machine Manager
flatpak install -u flathub org.virt_manager.virt-manager

# SyncThingy Background File Synchronization
flatpak install -u flathub com.github.zocker_160.SyncThingy

# Godot Game Engine and Editor
flatpak install -u flathub org.godotengine.Godot

```

## Comments

<Comments />

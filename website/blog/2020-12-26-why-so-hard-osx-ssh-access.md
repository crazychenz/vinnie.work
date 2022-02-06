---
slug: 2020-12-26-why-so-hard-osx-ssh-access
title: "Why so hard?: Access OSX over SSH with non-admin account."
#date: "2020-12-26T12:00:00.000Z"
description: |
  A small adventure in troubleshooting Mac OS X in regards to allowing non-admin accounts access to SSH services on the host.
---

## The Problem

I recently ran into an issue where my Raspberry Pi file share server fell over because of hardware currosion due to some unfortunate moisture exposure. In response, I had planned to replace the file share server with a Mac Mini that was available until I could get a replacement RPi. The service is basically SFTP and the users are responsible for having SFTP clients that meet their needs.

<!--truncate-->

Since the team I am working with isn't large, I manually created the members as individual (_non-admin_) accounts in OSX and assigned each a password. After this, I tested my personal (_admin_) account with the SSH service and everything worked great. Next, I tested a non-admin account and it didn't work!

```
$ ssh joe@192.168.1.10
Password:
Connection closed by 192.168.1.10 port 22
```

## Troubleshooting

I attempted to fix it by examining the system preferences of "Remote Login" and repeatably checking `/etc/ssh/sshd_config`. I attempted to locate the issue by running through the following commands in different situations.

To reload SSHd with its configurations, you can run:

```
sudo launchctl unload /System/Library/LaunchDaemons/ssh.plist
sudo launchctl load -w /System/Library/LaunchDaemons/ssh.plist
```

To stop the SSHd service (and allow it to automatically restart):

```
sudo launchctl stop com.openssh.sshd
```

Also, to examine the system service from command line, you can boost and examine the log output with something similar to:

```
sudo log config --mode "level:debug" --subsystem com.openssh.sshd
sudo log stream --level debug  2>&1 | tee /tmp/logs.out
```

After you perform the action you want to examine, stop the `log stream` process and grep or analyze the `/tmp/logs.out` file.

Note: To reset log level, run:

```
log config --mode "level:default" --subsystem com.openssh.sshd
```

All of this troubleshooting wasn't getting me anywhere. After no success and with it getting late in the day, I decided to sleep on it.

## Solution

After waking in the morning, I found an Apple StackExchange question on the subject, [Is it possible to access a Mac via SSH without administrator access?](https://apple.stackexchange.com/questions/52715/is-it-possible-to-access-a-mac-via-ssh-without-administrator-access). There was an answer in that question page that led me to a Mac OSX Hints page, [Use dseditgroup to allow users access to services (ssh, screen sharing, and more)](http://hints.macworld.com/article.php?story=20131008155803807).

Here is where I found the magical formula. Assuming you have an admin account like say `vinnie` and a non-admin user account like say `joe` or a user group like say `staff`, you can allow `joe:staff` to access the OSX SSH service by running the following commands with admin access:

```
dseditgroup -o edit -n /Local/Default -u vinnie -p -a joe -t user com.apple.access_ssh
dseditgroup -o edit -n /Local/Default -u vinnie -p -a staff -t group com.apple.access_ssh
```

Screen Sharing is another such service that requires this kind of policy updating:

```
dseditgroup -o edit -n /Local/Default -u vinnie -p -a joe -t user com.apple.access_screensharing
dseditgroup -o edit -n /Local/Default -u vinnie -p -a staff -t group com.apple.access_screensharing
```

## Rant

Now ... I'm happy that I found out the right command to get SSH to work on OSX and I hope to never have to learn yet another way to get this to work, but why is it _this_ way? I am all for increasing security, but at the **cost of usability**? I figured there would be an option in the Security section of the System Preferences to all me to add users to these groups. But alas I found none. I only own the Mac Mini so I can run XCode builds of applications I generally support on other platforms. I personally can't stand OSX and iOS and this is just another notch on the list or reasons not to associate with these products.

When I think about it, another technology in Linux that drove folks to a similar madness was SELinux. SELinux in spirit was a great advancement in Linux kernel security, but it still to this day has a usability problem that has led to more inferior products like AppArmor. At least in the case of SELinux there was a permissive mode ... I doubt Apple would consider such things as useful.

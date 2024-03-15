---
slug: 2024-03-15-auto-start
title: 'Auto Start'
draft: true
---

Why is automatically starting a process so difficult and different from platform to platform? 

## Summary

In nearly every case, there are processes or services that I want launched on boot. Many of these services do have methods for automatically starting, but they only consider themselves and not the environment that they'll exist within.

<!-- truncate -->

For example:

- I have 4 VMs I always want started with I boot one machine. VMWare can simply autostart all of them on boot, but there isn't any dependency management. This is critical when one VM is a storage VM and another is a Git Repo that depends on that storage and the third depends on the git repo.

- Some applications are things that you want to auto start when you login (e.g. an email client or VSCode). Others are services that you want to start when the system is powered on. The latter case is much less documented? I don't know why, but when I boot VMs from a system at boot, its because I don't ever plan to login as a user ... I'll more likely connect via VSCode Remote SSH from another system (like my laptop).

  Maybe this is why OSX Server and Windows Server exists?

## Auto-Start Conventions

Resolving this can be wildly different from platform to platform. From the available shell scripting languages, the launching conventions, to the security measures. I've lost too much time on this non-sense to not document some of the mechanisms I've discovered. Time to get things automatically started so I can stop worrying about missing services when my consumer machines decide to reboot for updates or power outages.

[Auto-Start Conventions](/docs/Collections/ToolsAndTechnique/AutoStart)

Once you've got a script actually running when and how you want to, you can sanity check yourself by implementing some resource tests. In the case of running VMs with some cheap health checks (via ICMP), see the following sections.

## Smart Start (Windows) Powershell Script

`smart-start.ps1` example:

```
Start-Transcript -path "C:\path-to\smart-start.log" -append

function Test-VMLifeSigns {
  param (
    $Target
  )
  $retries = 0
  $max_retries = 15
  do {
    $resp = Test-Connection $Target -Count 1 -Quiet
    sleep 2
    $retries = $retries + 1
  } while ($resp -eq $null -And $retries -lt $max_retries)
  if ($resp -eq $null) {
    echo "No Connection."
    exit
  }
}

echo "Running VMs before smart start."
vmrun -T ws list

echo "Starting vm"
VMrun -T ws start C:\path-to\vm\vm.vmx nogui
if ($LASTEXITCODE -ne 0) {
	echo "vm failed to start."
	Exit 1
}
echo "Waiting for vm life signs"
Test-VMLifeSigns -Target vm-ip-or-host-goes-here

echo "Running VMs after smart start."
vmrun -T ws list

Stop-Transcript
```

The above script:

- Start-Transcript logs everything to the specified file. Personally I have this popup when I log in with following enabled in NotePad++ so I can watch the VMs loading without opening VMWare Workstation (when relevant).

- Test-VMLifeSigns - This is a function that will block while there are no life signs of the VM having initialized. This is a very cheap way to manage dependencies. It's very linear, but I can easily ensure that the VMs are loaded in the correct order without having to drop in arbitrary sleep timers. Note: The life sign is currently a ping, but could easily be changed to use an HTTP request.

- We're using VMWare on our windows platform (because VirtualBox didn't work as well when Windows 11 was first released), therefore we're using `vmrun.exe` to launch VMs.

- Before we launch more VMs, we dump to running list of VMs.

- Launch a VM in a headless mode (nogui) and then wait for life signs before continuing on.

- In this case there are no more VMs to run because this is only an example.

- After all VMs or processes have been launched, we dump to running list of VMs again and finalize all logging.

## Smart Start (Mac OS) Bash Script

`smart-start.sh` example:

```
#!/bin/bash

VBOX=/usr/local/bin/VBoxManage

/usr/bin/whoami
/bin/date

function test_mount {
  PATH_UNDER_TEST=$1

  retries=0
  max_retries=15
  while [ $retries -lt $max_retries ]; do
        /bin/ls -d $PATH_UNDER_TEST
        RESP=$?
        if [ $RESP -eq 0 ]; then
          break
        else
          /bin/echo $PATH_UNDER_TEST not found. $retries of $max_retries
        fi
    /bin/sleep 2
    retries=$( expr $retries + 1 )
  done
  if [ $RESP -ne 0 ]; then
    /bin/echo "No Mount."
    exit
  fi

}

function test_connection {
  HOST_UNDER_TEST=$1

  retries=0
  max_retries=15
  while [ $retries -lt $max_retries ]; do
        /sbin/ping -c 1 -t 2 $HOST_UNDER_TEST
        RESP=$?
        if [ $RESP -eq 0 ]; then
          break
        else
          /bin/echo $HOST_UNDER_TEST not found. $retries of $max_retries
        fi
    /bin/sleep 2
    retries=$( expr $retries + 1 )
  done
  if [ $RESP -ne 0 ]; then
    /bin/echo "No Connection."
    exit
  fi
}

test_mount /Volumes/store3_ssd/vms

sleep 20
/bin/echo "Tailscale IP:"
/Users/chenz/go/bin/tailscale ip -4

/bin/echo "Available VMs before smart start."
$VBOX list vms

/bin/echo "Starting vm"
$VBOX startvm --type headless vm
if [ $? -ne 0 ]; then
        echo "vm failed to start."
        exit 1
fi
/bin/echo "Waiting for vm life signs"
test_connection vm-ip-or-host-goes-here

/bin/echo "Running VMs after smart start."
$VBOX list runningvms
```

The above script:

- We define the absolute path of VirtualBox's VBoxManage executable into VBOX.

- We dump the user we're running as and the datetime of the system to the console.

- test_mount - This function blocks while we wait for the external disk drive isn't mounted. This needs to be done because in my case I'm using a MacMini that doesn't have any ports for expandable internal storage.

- test_connection - This is a function that will block while there are no life signs of the VM having initialized. This is a very cheap way to manage dependencies. It's very linear, but I can easily ensure that the VMs are loaded in the correct order without having to drop in arbitrary sleep timers. Note: The life sign is currently a ping, but could easily be changed to use an HTTP request.

- Blocks execution until the external media is mounted and readable.

- While not ideal, this example currently uses a sleep timer to give the VPN (tailscale) time to startup. We then dump the status of tailscale to the console for logging purposes.

- Before we launch VMs, we dump to running list of VMs.

- Launch a VM in a headless mode (nogui) and then wait for life signs before continuing on.

- In this case there are no more VMs to run because this is only an example.

- After all VMs or processes have been launched, we dump to running list of VMs again and finalize all logging.

Even though this script has been written in a Mac OS environment, because its in bash it should work as-is in Linux after replacing platform specific paths.

## Where Is The Linux Smart Start Script?

If you need a Linux version, you should be able to lean in on the Mac OS version. 

I personally operate on a shoe string budget of only 3 machines that are powerful or resourced enough to hosts an array of VMs. As such, all of those systems are end-user systems with desktops. Any one who knows me knows that I (while I love the Linux ecosystem and do all my development in linux) have a notable dislike of _any_ Linux Desktop and would rather use Windows as my GUI/IDE experience before ever dealing with any Linux desktop as my host environment.

As for Mac OS, Xcode only runs on Mac OS (thanks to Apples "Think Same" philosophy) and so I keep the ability to run Xcode available instead of running Linux as the host OS.

## Comments

<Comments />

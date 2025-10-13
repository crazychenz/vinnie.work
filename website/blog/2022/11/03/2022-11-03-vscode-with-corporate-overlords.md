---
slug: 2022-11-03-vscode-with-corporate-overlords
title: 'Running VSCode with Corporate Overlords'
draft: false
---

## Background

Sometimes I find myself having to do development in corporate environments where you aren't given administrative privileges to the machine at your desk. I know that many would make certain hand gestures at such a situation and walk away. But sometimes the problems that the corporate overlords are paying you to solve is just to interesting to walk away. In that case, you find ways to work with the cards you've been dealt. 

For years now I've stuck a Visual Studio Code shortcut in my Startup folder (`Win+r` -> `shell:startup`). This way, when I login to my Windows machine, VSCode simply will pop up with my previous workspace state. When you work with multiple different Remote-SSH host windows all within a virtual environment that resets when you logout you need more than just a shortcut.

<!-- truncate -->

## Workflow

Ok, so in my corporate environment I'm given persistent storage on a network drive. The issue with this is that VSCode will not run from this network drive and I can not isolate the keys and certificates in a manner that satisfies SSH.

Presuming you have write access to the `C:` drive, you can manually copy the keys folder to `C:`, add yourself to the folder as a principal with full control and then remove all the inherited objects. Additionally you can recursively copy the VSCode folder from the network drive to `C:`. But the key here is that we want to automate this so that it happens automatically when we login to the corporate system. For this we turn to PowerShell...

## PowerShell Script

```ps1
# Filename: start-vscode.ps1

$principal_user = "user"
$vscode_src_folder = "P:\VSCode\"
$vscode_dest_folder = "C:\VSCode\"
$vscode_argument = "P:\devjournal\"
$certs_src_folder = "P:\certs\"
$certs_dest_folder = "C:\certs\"

# Only copy VSCode if the folder's been removed from destination.
if (Test-Path -Path $vscode_dest_folder) {}
else {
    Copy-Item -Path $vscode_src_folder -Destination $vscode_dest_folder -Recurse
}

# Only copy and configure certs folder if its been removed from destination.
if (Test-Path -Path $certs_dest_folder) {}
else {
    Copy-Item -Path $certs_src_folder -Destination $certs_dest_folder -Recurse

    # FIRST, Add ourselves as a principal with full control of this folder, sub-folders, and files.
    $acl = Get-Acl $certs_dest_folder
    $rule = New-Object System.Security.AccessControl.FileSystemAccessRule($principal_user, "FullControl", "ContainerInherit,ObjectInherit", "None", "Allow")
    $act.SetAccessRule($rule)
    $acl | Set-Acl $certs_dest_folder

    # Second, Remove the inherited objects from our parent folder (that make SSH unhappy).
    $acl = Get-Acl $certs_dest_folder
    $acl.SetAccessRuleProtection($true,$false)
    $acl | Set-Acl $certs_dest_folder
}

$code_exe_path = $vscode_dest_folder + "Code.exe" + " " + $vscode_argument
Invoke-Expression $code_exe_path
```

This script does the following:

- Recursively copies a persistent VSCode installation to a temporal, but executable, location.
- Recursively copies a persistent certificate and key folder to a temporal, but executable, location.
- Adds ourself to the certificate folder as a principle with full control over this folder, sub-folders, and files.
- Removes all inherited objects from our parent folder. (This is required for SSH to be happy.)
- Invokes VSCode with a constant folder.

Note: We invoke VSCode with a constant folder because when you're working with several instances of VSCode, its hard to track which one will start first when you open VSCode automatically on login. To make this more deterministic, we simply open the same local folder every time. Then from this initial instance I can launch my other remote instances.

## Running PowerShell

Once you get the PowerShell script running, there is some extra work to get it to work from the Startup folder. First, you'll need a `.cmd` script. The following is the `start-vscode.cmd` script I use:

```cmd
PowerShell -Command "Set-ExecutionPolicy Unrestricted" >> "%TEMP%\start-vscode-log.txt" 2>&1
PowerShell P:\start-vscode.ps1 >> "%TEMP%\start-vscode-log.txt" 2>&1
```

This sets some execution permissions that allow the `cmd` script to execute the PowerShell in a non-interactive manner. From here I store both the `start-vscode.ps1` and `start-vscode.cmd` in my network drive `P:`. Finally, in the Startup folder (press `Win+r`, enter `shell:startup`, click `OK`), create a Shortcut that executes the `start-vscode.cmd` script. 

Note: One quality of life thing you can do is set the Shortcut to run the terminal minimized so that the terminal window doesn't annoyingly pop-up and then pop-away when you start up.

## Conclusion

With the understanding that this is on the simpler side of PowerShell use cases, if you are more of a Linux user, like myself, I think this powershell setup makes a fantastic base for evolving automation for "on login" events.

... and don't let the corporate overlords spoil the party!

## Comments

<Comments />

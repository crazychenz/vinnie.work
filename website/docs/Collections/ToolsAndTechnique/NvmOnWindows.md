---
title: NVM On Windows
---

## Installation

Find the nvm-setup.zip at the [nvm-windows github repo](https://github.com/coreybutler/nvm-windows). Download and extract the zip file. There should be a single `nvm-setup.msi` file. This should be run as administrator.

## Usage

When running nvm as a user, you'll likely get an `access denied` return of some kind. This is because of some symlink trickery that nvm is using in the Windows environment. There are two workaround for this:

- The first is to run `nvm use` from a `cmd.exe` or Powershell running as administrator. Note: You only need to run the `nvm use` command here. Other command consoles will reflect the change from this.

- As reported from [Damir's Corner - Using nvm on Windows](https://www.damirscorner.com/blog/posts/20211126-UsingNvmOnWindows.html), a second option is to use Windows' version of `sudo`. The gist:

```powershell
Start-Process -Verb RunAs nvm -Args "use 12.22.7"
```

When ever you run that command, you'll likely need to accept a security dialog.

If you want to turn that `Start-Process` command into a convienent cmdlet in PowerShell, you can create a function like the following:

```powershell
Function Nvm-Use12
{
    Start-Process -Verb RunAs nvm -Args "use 12.22.7"
}
```

## Other Observations

When using `nvm use` on Windows, you have to be explicit about the version you want to use. On linux I can `nvm use 12` where on Windows you must specify `nvm use 12.22.7`. Because of this, its to your advantage to imprint `nvm list` in your head so you can query the version specifiers whenever you plan to switch node installs.

After getting `nvm` up and running, I almost always immediately install `yarn`. When using `yarn` in Windows 10, you can ensure that you can run it as a unsigned script by running `Set-ExecutionPolicy Unrestricted` in a console as Admin. I don't know the *correct* thing to do to make `yarn` work securely, but this got me past my immediate blocker.
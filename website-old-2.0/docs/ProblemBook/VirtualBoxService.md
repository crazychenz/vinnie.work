---
title: VirtualBox Service
---

## Setup

1. Create whatever Virtual Machine you want to run as a service using what is normal for you.

   - Recommended to ensure the network address is known. For example, set a static IP.
   - Recommended to setup SSH access, VNC, or RDP ahead of time.

2. Download [onlyfang's VboxVmService](https://github.com/onlyfang/VBoxVmService) tool.

   I usually install this tool into a simple location like `C:\bin\vmservice`.

3. Create a `VBoxVmService.ini` file in the `C:\bin\vmservice` folder. In the ini file, you need to specify the the location of the VM metadata created by VirtualBox GUI (i.e. VBOX_USER_HOME). The VBOX_USER_HOME value is typically a user folder like `C:\Users\<user>\.VirtualBox`. Then each virtual machine that you want to run as a service is added as an indexed entry. For example, the entry with `VmName=desktop-ubuntu-dev` is the first Virtual Machine to run as a service.

```ini
[Settings]
VBOX_USER_HOME=C:\Users\user\.VirtualBox
RunWebService=no
PauseShutdown=5000

[Vm0]
VmName=desktop-ubuntu-dev
ShutdownMethod=savestate
AutoStart=yes

[Vm1]
VmName=desktop-windows-dev
ShutdownMethod=savestate
AutoStart=yes
```

4. Reboot your machine and ensure that you can access the Virtual Machine.

## Troubleshooting

The VBoxVmService tool runs the configured VMs as a Windows Service, which in turn is executed as the local SYSTEM user. This means that if you want to modify the VM whiles its running as a service, you'll want to run `VBoxManage.exe` or `VirtualBox.exe` as the SYSTEM user.

### Pre-Req: Install SysInternals

My initial inclination is to use the old `runas.exe` tool. This will not work because `runas` predates the new security model since Windows Vista. Instead I prefer to use `psexec` which is part of the [Microsoft provided SysInternals Suite](https://docs.microsoft.com/en-us/sysinternals/downloads/).

1. Download the SysInternals Suite zip file.

2. Extract the SysInternals zip file into a simple and known folder (e.g. `C:\bin\sysinternals`).

   **Note:** Unlike many other compressed file distributions, SysInternals does *not* have an internal folder. If you *extract here*, it's going to dump a hundred some files directly into that directory.

3. Add SysInternals path (`C:\bin\sysinternals`) to the user's PATH environment variable.

   Edit windows environment variables by doing on of the following:

   - Right Click "My PC", Click Properties, Advanced System Settings (next to related links), Advanced Tab, Environment Variables Button
   - Run within a command prompt: `rundll32.exe sysdm.cpl,EditEnvironmentVariables`

   Once the path is set, reset any relevant terminals or command applications to register the new environment variables. SysInternals is not *installed*.

### Running VirtualBox as SYSTEM

1. From command prompt (run as Administrator), run: `psexec -i -s cmd.exe`. This'll launch a secondary prompt that is running as SYSTEM.

2. Within the SYSTEM command prompt, you can use `VBoxManage.exe` as you usually would or you can launch the `VirtualBox.exe` GUI.

```cmd
"C:\Program Files\Oracle\VirtualBox\VBoxManage.exe"
```

```cmd
"C:\Program Files\Oracle\VirtualBox\VirtualBox.exe"
```

## Other Tools

In theory you can run `psexec -s cmd.exe` as a entry point for Windows Terminal. The issue is that whenever I've attempted this there has been other issues with how things like tab complete work or how the environment variables are set. When I tried running `psexec -i -s wt.exe`, the STDIN wasn't working. If I felt this was something I was going to be needed more often, I'd suggest looking at some of the other third party tools that allow running commands as SYSTEM.

- [AdvancedRun](https://www.nirsoft.net/utils/advanced_run.html)
- [Process Hacker](https://processhacker.sourceforge.io/)

## Resources

- [How to Run a Program as SYSTEM (LocalSystem) Account in Windows](https://www.winhelponline.com/blog/run-program-as-system-localsystem-account-windows)
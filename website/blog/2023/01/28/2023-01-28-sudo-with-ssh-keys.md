---
slug: 2023-01-28-sudo-with-ssh-keys
title: 'sudo with SSH Keys'
draft: false
---

## Background

I've recently been beefing up my security posture by added very secure and randomly generated passwords to all systems that I have console access too. This in turn has created a new issue where I need to copy/paste that password whenever I `sudo`.

Turns out there is a solution to this problem that has been around since at least 2013. I'm talking about the ability to use SSH keys to authenticate `sudo` commands so you don't have to constantly unlock the secure password from the password vault and you don't need to submit to `NOPASSWD:` in `/etc/sudoers`.

<!-- truncate -->

## Quick Overview

The library I'm talking about is the `pam_ssh_agent_auth.so` PAM plugin. For a quick overview of how to install, please continue reading. Following the integration procedure, there are some caveats to be aware of.

- Setup pam_ssh_agent_auth:

  - Install with `sudo apt-get install libpam-ssh-agent-auth`.
  - Add the following to `/etc/pam.d/sudo`:

    ```text
    #%PAM-1.0

    auth sufficient pam_ssh_agent_auth.so file=/etc/security/authorized_keys

    # ... the rest of the file ...
    ```
  
  - Add `Defaults env_keep += SSH_AUTH_SOCK` to `/etc/sudoers`. The top of my `/etc/sudoers` resembles:

    ```text
    #
    # This file MUST be edited with the 'visudo' command as root.
    #
    # Please consider adding local content in /etc/sudoers.d/ instead of
    # directly modifying this file.
    #
    # See the man page for details on how to write a sudoers file.
    #
    Defaults env_keep += SSH_AUTH_SOCK
    Defaults        env_reset
    # ... the rest of the file ...
    ```

  - Copy private key to server (e.g. `~/.ssh/id_rsa`). I simply do:

    ```sh
    scp ~/.ssh/id_rsa user@hostname:/home/user/.ssh/id_rsa
    ```

  - Add public keys to `/etc/security/authorized_keys`. Something like:

    ```sh
    sudo cp ~/.ssh/id_rsa.pub /etc/security/authorized_keys
    sudo chmod 640 /etc/security/authorized_keys
    ```

  - Add `eval $(ssh-agent)` to `~/.bashrc` to setup `ssh-agent` environment variables each time a bash shell is invoked.
  
  - Re-login to server with `ssh <user>@<hostname>`
  
  - Run `ssh-add` your private key (e.g. `~/.ssh/id_rsa`) _when you want to `sudo`._

  - You should now be able to `sudo cat /etc/passwd` without a password.
    - Note: `NOPASSWD:` was never added to `/etc/sudoers`.

## Caveats and Considerations

We've added a private key to our machine and told a central file that PAM can use the private key for authentication (likely for root permissions). But what are the security implications of this?

If you keep your private key unencrypted, there is really no security advantage to using `pam_ssh_agent_auth.so` over `NOPASSWD:`. The primary benefit of having a private SSH to authenticate your `sudo` session is to provide a pseudo two factor authentication (2FA) where the SSH key is something you _have_ and the passphrase to unlock the key is the thing you _know_. Because of the attributes of 2FA and local nature of the SSH private key, its generally considered safer to have a weaker and more memorable passphrase to unlock the key (in contrast to single factor password authentication).

One unfortunate implementation detail of `pam_ssh_agent_auth.so` is that it depends on an ssh-agent to have an unlocked key to operate. I would have preferred to require the passphrase for each execution of `sudo`. Instead, you have to externally load/unload the key (i.e. identity) from the `ssh-agent` manually. This could probably be scripted, but my need for such automation isn't quite there yet.

In addition to the above, its highly recommended to disable all remote password logins and root logins! Obviously make decisions that meet your needs, but the whole point is to avoid single factor authentications.

**If we remove password logins, why even have a secure password?** - Randomly generated and secure passwords remain effective for console access. If you have a VMWare console, KVM console, Rack Console, and so forth, you may find yourself requiring access when all other methods fail. To prevent from completely taking a system down into run level one or doing a `init=/bin/bash` trick, you can likely login via console and yours 40 character password. (Uck!)

And while I know this falls on deaf ears, enabling SELinux remains an effective way to protect Linux systems. SELinux remains the only effective Linux Security Module that protects critical information from unauthorized `root` access. (I say this hypocritically because I _hate_ writing SELinux policy.)

## One Last Security Consideration

While `pam_ssh_agent_auth.so` is an amazing solution, it hasn't remained very maintained. SourceForge lists the last modification in 2016. The [repository on GitHub](https://github.com/jbeverly/pam_ssh_agent_auth) was last updated 2 years ago with the last GitHub release being 0.10.4 in Jul 2020.

The lack of updating is likely due to the much more popular LDAP and/or Radius integration into the system to control groups remotely. The downside is these systems aren't as secure unless they support a PKI infrastructure with client certificate verification. Kerberos tokens are traditionally supplied with a mere password.

# Resources

- [GitHub: pam_ssh_agent_auth](https://github.com/jbeverly/pam_ssh_agent_auth)
- [SO: sudo without password when logged in with ssh private keys?](https://superuser.com/questions/492405/sudo-without-password-when-logged-in-with-ssh-private-keys)

## Comments

<Comments />







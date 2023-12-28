---
slug: 2023-06-02-k3s-coredns-issue
title: 'K3S CoreDNS Issue'
draft: false
---

## Overview

Due to the metric driven corporations like Microsoft, Google, and Apple, two-factor authentication has become a sort of an infection. While most of the 1st world's population will benefit by the increased security of 2FA, it remains a fact that there are a significant number of folks that will be left behind due to the fact that they don't have smart phones or access to smart phones at the point of authentication.

<!-- truncate -->

Most documentation and concerns by the 2FA supports ignore all of the people that don't have smart phones, but those that are savvy enough should be able to work around this limitation if the service's authentication process permits the user to view their authenticator private key. If you can get access to the authenticator private key, you can use authenticators anywhere. They are not only on mobile phones as most of the internet would have you believe.

## Applications

Vaultwarden is a password manager that you can self host in Docker. It includes a TOTP entry that can be used without logging into an external service.

## Oathtool Toolkit

[Oathtool Toolkit](https://www.nongnu.org/oath-toolkit/) is an open source project that includes the code required to perform the TOTP operations required for 2FA. This includes libraries that can be used in your own projects and a prebuilt project that can be using from a command line.

### Oathtool CLI

Depending on your distribution, there are a number of prebuilt packages you can install to use [oathtool cli](https://www.nongnu.org/oath-toolkit/oathtool.1.html) "out of the box":

- Debian/Ubuntu: `apt-get install oathtool`
- CentOS 7: `dnf install oathtool`
- Alpine: `apk install oath-toolkit`
- Docker: `docker pull toolbelt/oathtool` (~7.5MB)
- Windows: _TBD_

CLI:

```
oathtool --totp <private_key>
```

Running a standard `oathtool --help` or checking out the [manual](https://www.nongnu.org/oath-toolkit/oathtool.1.html) will get you a number of arguments to expand its usage.

### Oathtool Python

- [jaraco's oathtool](https://github.com/jaraco/oathtool) Python Install: `pip install oathtool`

CLI:

```
python -m oathtool $key
```

Code:

```
import oathtool
private_key = 'the private key goes here'
print(oathtool.generate_otp(private_key))
```

## My Implementation

It is worth noting that while oathtool presents a simple way to generate one time passcodes based on a private key, it still remains the responsibility of the user to protect their private key. If you read the oathtool, it'll recommend ways to protect your private key at rest with GNU's implementation of PGP, gnupg2. There is nothing wrong with this, but I don't like adding superfluous dependencies. I already have OpenSSL on nearly every system I run, therefore I can use it for my key encryption.

### Desired CLI:

```
$ 2fa crazychenz@github.com
Password:
123456
```

### Design

- `2fa` is a script within my PATH (specifically `~/.local/bin/2fa`) that will use the first argument as the profile part of a path that starts with `~/.2fa/`. Therefore, if I'm attempting to connect to `crazychenz@github.com`, the full path of the private key to decrypt will be `~/.2fa/crazychenz@github.com/`.

- If the profile does not exist, the private key will be read with bash's `read`.
  - The file itself will always be created by encrypting with AES and a provided user password.

- If the file already exists, we'll use openssl to request the decryption password.

### Code

```
#!/bin/bash
# Check to see if a pipe exists on stdin.
TGT=$1
TGT_BASE_PATH="${HOME}/.2fa"
TGT_PATH="${TGT_BASE_PATH}/${TGT}"
TGT_FPATH="${TGT_PATH}/otp-priv-key.aes.enc"
OATHTOOL="docker run --rm -i toolbelt/oathtool --totp --base32 -"

function encrypt_private_key_and_fetch_passcode {
  # Get private key
  echo "Enter (or copy/paste) the authenticator's private key."
  echo "Note: The paste will not be shown on the screen."
  read -p "Private Key: " -s _private_key
  echo

  echo "Provide a password to protect the private key for this profile."

  # OpenSSL 1.1.1+
  echo $_private_key | openssl enc -aes-256-cbc -md sha512 -pbkdf2 -iter 1000000 -salt -in /dev/stdin -out "${TGT_FPATH}"

  # Fetch passcode
  echo "Your first timed one time passcode using your private key is:"
  echo $_private_key | ${OATHTOOL}

  # Wipe private key
  _private_key=''
}

function decrypt_private_key_and_fetch_passcode {
  echo "Provide the profile password for the given private key."
  openssl enc -d -aes-256-cbc -md sha512 -pbkdf2 -iter 1000000 -salt -in "${TGT_FPATH}" | ${OATHTOOL}
}

if [ -z "${TGT}" ]; then
  echo "Usage: $0 <profile name>"
  echo
  echo "-- Current Profiles: --"
  ls -1 "${TGT_BASE_PATH}"
  exit 1
fi

if [ ! -d "${TGT_PATH}" ]; then
  mkdir -p "${TGT_PATH}"
  chmod 700 "${TGT_PATH}"
fi

if [ -f "${TGT_FPATH}" ]; then
  decrypt_private_key_and_fetch_passcode
  exit 0
else
  encrypt_private_key_and_fetch_passcode
  exit 0
fi
```

### Other Approaches

Another approach I considered was to use a more secure AES password that was protected by an SSH keypair and then you'd need to use a SSH private key to decrypt the AES key and finally decrypt the private key. This seemed over engineered and possibly a bad idea if I ever lost my current SSH private key. The same approach could be used with an X509 certificate and key, typically stored as a PKCS12 (p12) file.

## BS Products That Require Mobile Devices or Internet

- Authy - Mobile and Desktop Apps require login
- Microsoft Authenticator - Requires mobile device.

## Comments

<Comments />

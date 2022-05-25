---
sidebar_position: 50
title: Stream
---

## 2022-05-20
 
- Google Drive mount for Linux
  - Use rclone:
    - `curl https://rclone.org/install.sh | sudo bash`
    - Google API Console
      - (For OAuth Client ID) Create rclone consent
      - Create rclone desktop app credential (for client_id and secret)
    - `rclone config` - Recommended to setup from XWindows environment
    - `rclone mount --daemon gdrive: /opt/gdrive`
    - Win.
  - Note: There is no official client for Linux
  - https://github.com/odeke-em/drive - Developed by previous Google Drive Employee

- Install Chrome from command line:
  - `wget https://dl.google.com/linux/direct/google-chrome-stable_current_amd64.deb`
  - `sudo dpkg -i google-chrome-stable_current_amd64.deb`

- Building Expo (EAS) Gradle project locally.
  - Alpine is linked with musl.
  - Buster-slim (i.e. debian) is linked with glibc.
  - Android builds (e.g. gradle) downloads dependencies that require specific linkage, like glibc. This means that you can't build expo android apps with alpine, you must you a glibc linked distro. 
  - Take away: **dynamic-binary dependency downloader build-systems are an anti-pattern!**

- https://invertase.io/ - Company specializing in mobile dev tools.
  - https://notifee.app/ - React-Native (top sys bar) Notification Library
  - https://docs.page/ - Free/Simple Open source documentation (like Docusaurus).

## 2022-05-19

- Remove a path from $PATH: 
  - `export PATH=$(echo $PATH | sed 's/:/\n/g' | sed "/$1/d" | tr '\n' ':')`

## 2022-05-17

- Remove SSH Host Fingerprint and SSH
  - `ssh-keygen -f ${HOME}/.ssh/known_hosts -R "[127.0.0.1]:2222" && ssh -p 2222 root@127.0.0.1`

- Linux 3.2 `headers_install` will remove libc headers.
  - Must `headers_install` first or rsync from a stage directory.

- Install linux headers from `linux_build`:
  - `make ARCH=<arch> O=. -C <src-path> headers_install INSTALL_HDR_PATH=<out-path>`

- With regards to projects that don't explicitly support parallel builds (-jX).
  - Do not short cut `make && make install` with `make install`.

- Linux 4.20 requires `libssl-dev` package.
  - Without it'll complain about missing `openssl/bio.h` when building `vmlinux`.

- When dealing with environment variable changes, its good to open another shell.
  - On exit, the original PATH (and other variables) are restored.
  - You can add an indication of shell depth with:
    - ``INIT_DISTANCE=$(($(pstree -Acs $$ 2>&1 | sed 's/-.-/\n/g; s/[\`|]-/\n/g; s/ //g; /^$/d;" | wc -1) - 6))``

## 2022-05-16

- When using `openssl enc`:
  - OpenSSL 1.1.0 implicitly uses -md md5
  - OpenSSL 1.1.1 implicitly uses -md sha256
  - Explicit Encrypt: `openssl enc -aes-256-cbc -md md5 -in $1 -out $1.txt`
  - Explicit Decrypt: `openssl enc -d -aes-256-cbc -md md5 -in $1.txt -out $1`

## 2022-05-12

- When emulating...
  - If you're only analyzing userspace, emulate with newest kernel for >= 2.6.0.
  - If you're building for older kernel, you only need the libc to support syscall interface.

## 2022-05-10

- Crosstools-NG 1.19.0
  - Use `CT_CC_VERSION`, `CT_KERNEL_VERSION`, `CT_LIBC_VERSION`
  - Update `.config`:
    - `sed -i '/^CT_PREFIX_DIR/c CT_PREFIX_DIR="${CT_PREFIX}${CT_TARGET}"' ${WD_PREFIX}builds/${STAGER_TARGET_ALIAS}/.config`
  - For `mipsel-static-linux-gnu`, disable native-gdb.
    
- For Ubuntu Hardy (6.10)
  - Enable no password sudo with `echo '%sudo ALL=NOPASSWD: ALL' >> /etc/sudoers`

- binutils 2.24 and building for MIPS.
  - Starting with version 2.24.51.20140728 MIPS binutils complain loudly about mixing soft-float and hard-float object files. [patch](https://patchwork.linux-mips.org/project/linux-mips/patch/1415366034-356535-1-git-send-email-manuel.lauss@gmail.com/)
  - Instead of using the patch, consider using crosstools-ng 1.19.0
    - ct-ng 1.19.0 uses binutils 2.19.1a.
    - The lowest 1.24.0 can go is binutils 2.26.

---
sidebar_position: 50
title: Stream
---

## 2023-01-08

- Generate EC KeyPair with `node:crypto` and fetch key data from DER export:

```javascript
import { generateKeyPair, KeyObject } from "node:crypto";
import asn from "asn1.js";

generateKeyPair('ec', 
  {
    namedCurve: 'secp256k1',
    publicKeyEncoding: { type: 'spki', format: 'der' },
    privateKeyEncoding: { type: 'pkcs8', format: 'der' }
  },
  (err, publicKey, privateKey) => { // Callback function
    if(err) {
      console.log("Err is: ", err);
      return;
    }

    // See https://github.com/crypto-browserify/parse-asn1/blob/master/asn1.js

    var AlgorithmIdentifier = asn.define('AlgorithmIdentifier', function () {
      this.seq().obj(
        this.key('algorithm').objid(),
        this.key('none').null_().optional(),
        this.key('curve').objid().optional(),
        this.key('params').seq().obj(
          this.key('p').int(),
          this.key('q').int(),
          this.key('g').int()
        ).optional()
      )
    })

    var PrivateKeyInfo = asn.define('PrivateKeyInfo', function () {
      this.seq().obj(
        this.key('version').int(),
        this.key('algorithm').use(AlgorithmIdentifier),
        this.key('subjectPrivateKey').octstr()
      )
    })

    var ECPrivateKey = asn.define('ECPrivateKey', function () {
      this.seq().obj(
        this.key('version').int(),
        this.key('privateKey').octstr(),
        this.key('parameters').optional().explicit(0).use(ECParameters),
        this.key('publicKey').optional().explicit(1).bitstr()
      )
    });
    
    var ECParameters = asn.define('ECParameters', function () {
      this.choice({
        namedCurve: this.objid()
      })
    });

    var privateKeyInfo = PrivateKeyInfo.decode(Buffer.from(privateKey.toString('hex'), "hex"), 'der');
    var ecPrivateKey = ECPrivateKey.decode(privateKeyInfo.subjectPrivateKey, 'der');
    
    console.log(privateKeyInfo);
    console.log(ecPrivateKey);
    console.log(ecPrivateKey.privateKey.toString('hex'));
    console.log(ecPrivateKey.publicKey.data.toString('hex'));
  }
);
```

- De-facto authoritative asn1 Javascript library: https://www.npmjs.com/package/asn1.js
- Online ASN.1 decoder: https://lapo.it/asn1js
- Simple-ish Re-Encryption Reference Implementation: https://github.com/yjjnls/recrypt-js
- SO Explanation of Re-Encryption: https://crypto.stackexchange.com/questions/99617/how-proxy-re-encryption-works-layman-perspective
- Safe Elliptic Curves: http://safecurves.cr.yp.to/
- Available Curves in NodeJS: https://www.tutorialspoint.com/crypto-getcurves-method-in-node-js

- List all methods in JavaScript object: https://flaviocopes.com/how-to-list-object-methods-javascript/

```javascript
const getMethods = (obj) => {
  let properties = new Set()
  let currentObj = obj
  do {
    Object.getOwnPropertyNames(currentObj).map(item => properties.add(item))
  } while ((currentObj = Object.getPrototypeOf(currentObj)))
  return [...properties.keys()].filter(item => typeof obj[item] === 'function')
}
```

## 2022-12-02

- Capturing web traffic:

  - Packet Capture
    - tcpdump - Good for network package capture.
    - _Takeaway_: Largely a bad way to capture traffic unless you are doing network level inspection.
  - Proxy Capture
    - mitmproxy - Good for web traffic and asset capture. Not good for viewing.
      - `mitmproxy -w <path>` - To save flows to a file.
      - `mitmproxy -r <path>` - To read flows from a file.
      - Note: **You can not read AND write from command line.**
      - Best flow is to write interactively in app and then otherwise use `-r` on the command line.
    - _Takeaway_: Proxy capture can do a lot to capture assets and see inside the TLS session but it really comes down to offloading what a browser's developer tools would provide anyway.
  - Browser Extension Capture
    
    - Save WE - Browser Extension that saves a site as single HTML for offline viewing.
    - WebScrapBook - Browser Extensions that saves all tab assets for offline viewing.
      - Lots of options and different ways to archive page.
    - _Takeaway_: Capturing via extensions are probably the best option for archival purposes because you get the whole DOM to help assemble the various parts.
    - _TODO_: Still looking for that extension that automatically captures all assets on the first download and then assembles an archive of the site for all sites I visit as a user.

- [wttr.in](http://wttr.in) is a neat terminal weather site.

## 2022-10-14

- Installed VirtualBox 7.

  ```sh
  sudo apt-get update
  sudo apt-get install build-essential linux-headers-`uname -r`
  # Insert VBox Additions Disc and Run the install
  sudo usermod -aG vboxsf $USER
  sudo shutdown -r now
  ```

- [VSCode: Open Local File In Remote Mode](https://github.com/microsoft/vscode/issues/136218)
  - Note: There is no support for adding local folder in remote mode. Instead, when using local VM, setup shared folders and mount local remotely (if appropriate).

- Many vendors have developer portals, for example: [DigiKey Developer Portal](https://developer.digikey.com/)



## 2022-08-28

- [YouTube: God-Tier Developer Roadmap](https://www.youtube.com/watch?v=pEfrdAtAmqk)
- My personal tiered _code iceberg_:

  - Tier 1: Scratch, Basic - For those that have never coded before.
  - Tier 2: Powershell, VBScript, Batch Scripts, Simple Shell Scripting
  - Tier 3: Python, Javascript, Ruby
  - Tier 4: SQL, Lua, bash, pwsh, VisualBasic, HTML, CSS
  - Tier 5: Java, C#, Typescript, Go, Dart
  - Tier 6: C, C++, Rust
  - Tier 7: Assembler, VHDL, Verilog, Digital Logic Gates

- HBOMax ... what a shit show right now! HBOMax in their infinite wisdom doesn't allow you to login and cancel your account from abroad (e.g. UK). To work around this:
  - Got CyberGhost VPN.
  - Cleared all HBOMax cookies from Chrome.
  - Accessed hbomax.com and canceled my subscription!
  - There was some DNS setting, reboots, and other frustrations to get this to work.
  - CyberGhost Private Browser
    - Doesn't show up as Chrome, so it was also blocked by hbomax.com
    - Triggered as virus by Windows Defender. A bit sus, but I overrode it in Defender.

## 2022-08-06

- We have arrived.

## 2022-05-27

- [Portable Process Substitution](https://unix.stackexchange.com/questions/309547/what-is-the-portable-posix-way-to-achieve-process-substitution)
- Docusaurus Styling
  - [Theo Chu's Doc's](https://theochu.com/docusaurus/styling/)
  - [Docusaurus Styling & Layout Docs](https://docusaurus.io/docs/styling-layout)

## 2022-05-26

- [Environment variables of a running process on Unix?](https://serverfault.com/questions/66363/environment-variables-of-a-running-process-on-unix)
- `` echo -ne "VAR=val1 VAR2=val2" | (eval `cat`;exec ./printsecret SECRET) ``
- Wipe node environment values or configuration values in memory after use

  - [libsys](https://github.com/streamich/libsys) - Execute syscalls from node.
  - [change /proc/PID/environ after process start](https://unix.stackexchange.com/questions/302948/change-proc-pid-environ-after-process-start) - Explains using `prctl()` to clear `/proc/self/environ`.
  - [OpenSSL Secure Heap in Node](https://github.com/nodejs/node/pull/36779)
  - [OpenSSL Secure Heap node Issue](https://github.com/nodejs/node/issues/30956)
    - ... not a good idea at the moment (but possible!)

- SSH key encryption with OpenSSL

  - [Encrypt and decrypt a file using SSH keys](https://www.bjornjohansen.com/encrypt-file-using-ssh-key)

  - Encrypt

    ```
    openssl rand 32 | \
      tee >(openssl rsautl -encrypt -oaep -pubin -inkey <(ssh-keygen -e -f ~/.ssh/id_rsa.pub -m PKCS8) -out secret.key | \
      openssl enc -aes-256-cbc -base64 -in data.txt -out data.txt.enc -pass stdin
    ```

  - Decrypt

    ```
    openssl rsautl -decrypt -oaep -inkey ~/.ssh/id_rsa -in secret.key | \
      openssl enc -d -aes-256-cbc -base64 -in data.txt.enc -out data.txt.dec -pass stdin
    ```

  - Decrypt remotely and execute.

    ```
    (ssh -T -q user@127.0.0.1 cat /path/to/key) | \
      openssl rsautl -decrypt -oaep -inkey ~/.ssh/id_rsa | \
      openssl enc -d -aes-256-cbc -base64 -in data.txt.enc -pass stdin | \
      (eval `cat`;exec ./printsecret ANOTHER)
    ```

## 2022-05-25

- Use `setlocale(LC_ALL, "")` to inherit locale from env. ISO requires that all C programs default to `C` locale.
- You **can not** use `:` in a path used in `$PATH`. You can not escape ':' in a meaningful way within $PATH.
  - [How to escape colon (:) in $PATH on UNIX?](https://stackoverflow.com/questions/14661373/how-to-escape-colon-in-path-on-unix)
  - [The POSIX portable file name character set](https://www.ibm.com/docs/en/zos/2.3.0?topic=locales-posix-portable-file-name-character-set)
- Detecting unicode is not standardized.
  - [Is there a way to check whether a string contains unicode characters in C++](https://stackoverflow.com/questions/27522421/is-there-a-way-to-check-whether-a-string-contains-unicode-characters-in-c)
- You can not use printf and wprintf in same STDOUT without hackery. This is because of FILE\* settings. Note: Can be read with fwide().
  - [printf and wprintf in single C code](https://stackoverflow.com/questions/8681623/printf-and-wprintf-in-single-c-code)

## 2022-05-24

- Multi-call Pattern for Containers

  ```sh
  : ${TOP_WORKSPACE_DIRECTORY:-"$(pwd)"}
  docker run -ti --rm \
    -w /workspace/$(realpath --relative-to=${TOP_WORKSPACE_DIRECTORY} $(pwd)) \
    -v $(realpath ${TOP_WORKSPACE_DIRECTORY}):/workspace \
    container_name $(basename $0) "$@"
  ```

- [EMUX](https://github.com/therealsaumil/emux) - Similar to firmadyne without the emphasis on scalability.
- [cppreference - mblen](https://en.cppreference.com/w/c/string/multibyte/mblen) - Location of decent `strlen_mb` implementation.
    <details><summary>Code</summary>

  ```c
  #include <string.h>
  #include <stdlib.h>
  #include <locale.h>
  #include <stdio.h>

  // the number of characters in a multibyte string is the sum of mblen()'s
  // note: the simpler approach is mbstowcs(NULL, str, sz)
  size_t strlen_mb(const char* ptr)
  {
      size_t result = 0;
      const char* end = ptr + strlen(ptr);
      mblen(NULL, 0); // reset the conversion state
      while(ptr < end) {
          int next = mblen(ptr, end - ptr);
          if(next == -1) {
            perror("strlen_mb");
            break;
          }
          ptr += next;
          ++result;
      }
      return result;
  }
  ```

    </details>

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
    - `` INIT_DISTANCE=$(($(pstree -Acs $$ 2>&1 | sed 's/-.-/\n/g; s/[\`|]-/\n/g; s/ //g; /^$/d;" | wc -1) - 6)) ``

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

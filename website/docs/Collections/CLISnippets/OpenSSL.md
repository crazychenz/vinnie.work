---
sidebar_position: 2
title: OpenSSL Overview
---

## Symmetric Cryptography

Encrypt:

```sh
openssl enc -aes-256-cbc -md md5 -in $1 -out $1.txt
```

Decrypt:

```sh
openssl enc -d -aes-256-cbc -md md5 -in $1.txt -out $1
```

Notes:

- OpenSSL 1.1.0 implicitly uses `-md md5`
- OpenSSL 1.1.1 implicitly uses `-md sha256`

## SSH Cryptography

Sometimes you want to asymmetrically protect an encryption without having to
create a new key-pair. With a little finesse you can use an existing SSH
key-pair to accomplish this.

I've found that one use case for this is for storage of a `.env` file that
you want to be able to use to start a service. We want to keep the file
stored securely but in a manner where you will not be able to decrypt without
_knowing_ a password (i.e. the SSH private key passphrase). Additionally, the
actual SSH private key could be thought of as the thing you _have_. Bam!, now
you have 2 factor authentication to unlock the `.env`.

Encrypt `data.txt` to `data.txt.enc` with `aes256` using an SSH public key:

```sh
openssl rand 32 | \
  tee >(openssl rsautl -encrypt -oaep -pubin -inkey <(ssh-keygen -e -f ~/.ssh/id_rsa.pub -m PKCS8) -out secret.key | \
  openssl enc -aes-256-cbc -base64 -in data.txt -out data.txt.enc -pass stdin
```

Decrypt `data.txt.enc` to `data.txt.dec` with `aes256` using SSH private key:

```sh
openssl rsautl -decrypt -oaep -inkey ~/.ssh/id_rsa -in secret.key | \
  openssl enc -d -aes-256-cbc -base64 -in data.txt.enc -out data.txt.dec -pass stdin
```

Given an encrypted file (as encrypted above) that can be _sourced_ into your
shell environment, you can grab the file from a remote source, decrypt, and
load the `.env` into your environment with the following one-liner:

```sh
(ssh -T -q user@127.0.0.1 cat /path/to/key) | \
  openssl rsautl -decrypt -oaep -inkey ~/.ssh/id_rsa | \
  openssl enc -d -aes-256-cbc -base64 -in data.txt.enc -pass stdin | \
  (eval `cat`;exec ./printsecret ANOTHER)
```

Note: Replace `exec ./printsecret ANOTHER` with the service command you want to run with the new environment.

## Certificate Utilities

Create a CA certificate chain for client certificate verification:

```sh
cat root.cert.pem intermediate.cert.pem > cachain.cert.pem
```

Note: Include all applicable intermediate certificates in the concatenation.

Verify the client certificate matches the CA certificate chain:

```sh
openssl verify -verbose -CAfile cachain.cert.pem client.cert.pem
```

## PKCS12 / `.p12` / `.pfx`

Create a PKCS12 file:

```sh
openssl pkcs12 -export -out client_certs.p12 -inkey client.key.pem \
  -in client.cert.pem -certfile cachain.cert.pem -name "Friendly Name"
```

Note: Set _Friendly Name_ to easily locate the loaded certificate in GUI listings.

## Setup A Certificate Authority

OpenSSL is a toolbox that has what you need to setup your own CA. The issue is that it has a number of configuration file and database file setups to accomplish correctly. This are non-portable configurations that are fragile and not intended for production. It is recommended to use another more complete CA system that comes with a well defined flow of operations (in contrast to a lose set of tools). Something that also includes ACME support is a major benefit. If you insist on using OpenSSL for CA setup, simply refer to [OpenSSL Certificate Authority](https://jamielinux.com/docs/openssl-certificate-authority/).

## Adhoc Certificate Authority

Assuming you wanted to create a root certificate for some servers and one of the servers was `test.home.domain`. Using OpenSSL you could do the following.

1. Create Root CA certificate and key PEM files:

```sh
openssl req -x509 -days 18250 \
  -newkey rsa:4096 -keyout ca.key.pem \
  -out ca.cert.pem -extensions v3_ca
```

2. Create certificate signing request PEM:

```sh
openssl req -nodes \
  -new -newkey rsa:2048 -keyout test.home.domain.key.pem \
  -out test.home.domain.csr.pem -subj "/CN=test.home.domain"
```

3. Sign certificate with Root CA key:

```sh
openssl x509 -req \
  -in test.home.domain.csr.pem \
  -days 18250 \
  -CA ca.cert.pem -CAkey ca.key.pem -CAcreateserial \
  -out test.home.domain.cert-only.pem \
  -extfile <(printf "subjectAltName=DNS:test.home.domain")
```

4. Generate full certificate chain:

```sh
cat test.home.domain.cert-only.pem ca.cert.pem > test.home.domain.cert.pem
```

5. Rinse and repeat from step 2 for all servers.

6. Use the `test.home.domain.cert.pem` and `test.home.domain.key.pem` in your HTTPS services (e.g. web servers).

7. Use the `ca.cert.pem` in your intended clients (e.g. browsers).

This process has the advantage of not requiring a complex or hard to managed CA service for some quick modern browser compliant web service security behaviors.

Note: This process uses `-nodes`. Remove this argument to protect signing keys with a password (recommended for long lived services.)

### Utility Script

For those that find openssl's numerous arguments unappealing, I've written an opinionated utility to simplify the process.

Equivalent command for all of the above would look like: `./adhoc-cert.py test.home.domain`.

- It automatically generates CA certificate and key if not provided or not already created.
- It automatically generates the server certificate and key into a similar folder.
- Provide `--dns` (i.e. FQDN) and/or `--ip` arguments to specify additional domain names for a single certificate/key pair.
- You can use `--dns 'home.domain --dns '*.home.domain` to generate a wild card certificate for entire domain.
- Developed and tested with `OpenSSL 3.0.2 15 Mar 2022 (Library: OpenSSL 3.0.2 15 Mar 2022)`.

<details><summary>adhoc-certs.py</summary>

```python
#!/usr/bin/env python3

'''
usage: adhoc-cert.py [-h] [--prefix PREFIX] [--cert-only CERT_ONLY] [--key KEY]
                     [--csr CSR] [--cert CERT] [--cacert CACERT] [--cakey CAKEY]
                     [--caname CANAME] [--caprefix CAPREFIX] [--dns DNS] [--ip IP]
                     name

Create adhoc (signed) x509 certificates.

positional arguments:
  name                  Server/Client (fqdn) value for implicit behavior. ([a-z][A-Z] String).

options:
  -h, --help            show this help message and exit
  --prefix PREFIX       Server/Client Prefix Output Path
  --cert-only CERT_ONLY
                        Certificate Output Path (PEM)
  --key KEY             Private Key Output Path (PEM)
  --csr CSR             Certificate Signing Request Output Path (PEM)
  --cert CERT           Full Certificate Chain Output Path (PEM)
  --cacert CACERT       CA Certificate Output/Input Path (PEM)
  --cakey CAKEY         CA Signing Key Output/Input Path (PEM)
  --caname CANAME       CA Name for implicit path generation ([a-z][A-Z] String)
  --caprefix CAPREFIX   CA Prefix Output Path
  --dns DNS             DNS Name Entry for Certificate
  --ip IP               IP Entry for Certificate
'''


from argparse import ArgumentParser
from subprocess import run, PIPE, DEVNULL
from tempfile import NamedTemporaryFile, mkstemp
import os
import shutil

from pprint import pprint
from pdb import set_trace

DEFAULT_CANAME = 'ca'

class ArgumentProcessor(object):


  def __init__(s):
    s.do_create_ca_pair = False
    s.config_parser()
    s._args = s.parser.parse_args()
    s.process_ca_args()
    s.process_cert_args()


  def config_parser(s):
    s.parser = ArgumentParser(
      description='Create adhoc (signed) x509 certificates.'
    )

    # Positional Argument
    s.parser.add_argument(
      'name',
      nargs=1,
      default=None,
      help='Server/Client (fqdn) value for implicit behavior. ([a-z][A-Z] String).'
    )
    # TODO: Include password in env, cli, readline?
    s.parser.add_argument(
      '--prefix',
      default=os.environ.get('ADHOC_PREFIX', None),
      help='Server/Client Prefix Output Path'
    )
    s.parser.add_argument(
      '--cert-only',
      default=os.environ.get('ADHOC_CERTONLY', None),
      help='Certificate Output Path (PEM)'
    )
    # TODO: Include password in env, cli, readline?
    s.parser.add_argument(
      '--key',
      default=os.environ.get('ADHOC_KEY', None),
      help='Private Key Output Path (PEM)'
    )
    s.parser.add_argument(
      '--csr',
      default=os.environ.get('ADHOC_CSR', None),
      help='Certificate Signing Request Output Path (PEM)'
    )
    s.parser.add_argument(
      '--cert',
      default=os.environ.get('ADHOC_CERT', None),
      help='Full Certificate Chain Output Path (PEM)'
    )

    s.parser.add_argument(
      '--cacert',
      default=os.environ.get('ADHOC_CACERT', None),
      help='CA Certificate Output/Input Path (PEM)'
    )
    # TODO: Include password in env, cli, readline?
    s.parser.add_argument(
      '--cakey',
      default=os.environ.get('ADHOC_CAKEY', None),
      help='CA Signing Key Output/Input Path (PEM)'
    )
    s.parser.add_argument(
      '--caname',
      default=os.environ.get('ADHOC_CANAME', DEFAULT_CANAME),
      help='CA Name for implicit path generation ([a-z][A-Z] String)'
    )
    s.parser.add_argument(
      '--caprefix',
      default=os.environ.get('ADHOC_CAPREFIX', DEFAULT_CANAME),
      help='CA Prefix Output Path'
    )

    # s.parser.add_argument(
    #   '--dn',
    #   required=True,
    #   default=None,
    #   help='Distinguished Name For Certificate'
    # )
    s.parser.add_argument(
      '--dns',
      default=[],
      action='append',
      help='DNS Name Entry for Certificate'
    )
    s.parser.add_argument(
      '--ip',
      default=[],
      action='append',
      help='IP Entry for Certificate'
    )


  def process_ca_args(s):
    s.cacert = s._args.cacert
    s.cakey = s._args.cakey
    s.caname = s._args.caname
    s.caprefix = s._args.caprefix

    # 1. If set, check for existing s.cacert and s.cakey
    if s.cakey and s.cacert:
      if not os.path.exists(s.cacert) or not os.path.exists(s.cakey):
        print("Failed to find given cacert and cakey, recreating.")
        s.do_create_ca_pair = True
      else:
        print("Using user provided cacert and cakey")
        # todo: check access (no access throws error)
        pass

    # When either cakey or cacert not set, clobber both with defaults
    else:
      s.cacert = os.path.join(s.caprefix, f'{DEFAULT_CANAME}.cert.pem')
      s.cakey = os.path.join(s.caprefix, f'{DEFAULT_CANAME}.key.pem')
      # 2. If default exists, use default.
      if os.path.exists(s.cacert) and os.path.exists(s.cakey):
        # todo: check access (no access throws error)
        print("Using default cacert or cakey.")
        s.do_create_ca_pair = False
      # 3. If no existing defaults, recreate
      else:
        print("No given cacert or cakey, recreating.")
        s.do_create_ca_pair = True


  def process_cert_args(s):
    s.name = s._args.name[0]
    s.prefix = s._args.prefix
    s.cert = s._args.cert
    s.key = s._args.key
    s.csr = s._args.csr
    s.cert_only = s._args.cert_only
    s.dns = s._args.dns
    s.ip = s._args.ip
    s.subject_alt_names = []

    if not s.prefix:
      s.prefix = s.name
    if not s.cert:
      s.cert = os.path.join(s.prefix, f'{s.name}.cert.pem')
    if not s.key:
      s.key = os.path.join(s.prefix, f'{s.name}.key.pem')
    if not s.csr:
      s.csr = os.path.join(s.prefix, f'{s.name}.csr.pem')
    if not s.cert_only:
      s.cert_only = os.path.join(s.prefix, f'{s.name}.cert-only.pem')

    if len(s.dns) == 0:
      s.dns.append(s.name)
    for entry in s.dns:
      s.subject_alt_names.append(f'DNS:{entry}')
    for entry in s.ip:
      s.subject_alt_names.append(f'IP:{entry}')


class CertManager(object):
  def __init__(s):
    s.args = ArgumentProcessor()

    if s.args.do_create_ca_pair:
      s.create_ca_pair()

    if s.args.name:
      s.create_server_cert()


  def concat_files(s, fpaths, dst):
    with open(dst, "w") as dstobj:
      for fpath in fpaths:
        with open(fpath, "r") as fobj:
          dstobj.write(fobj.read())
        dstobj.write('\n')


  def create_ca_pair(s):
    # todo: os.environ.get('CAPASS', None)

    # Create the subdirs for the ca prefixes
    os.makedirs(os.path.dirname(s.args.cakey), exist_ok=True)
    os.makedirs(os.path.dirname(s.args.cacert), exist_ok=True)

    cmd = [
      'openssl', 'req', '-x509',
      '-nodes',
      '-days', '18250',
      '-newkey', 'rsa:4096',
      '-keyout', s.args.cakey,
      '-out', s.args.cacert,
      '-extensions', 'v3_ca',
      '-subj', f'/CN={s.args.caname}',
    ]

    ca_run = run(cmd, stderr=DEVNULL)
    if ca_run.returncode != 0:
      print(f"cmd({ca_run.returncode}):{' '.join(cmd)}\n{ca_run.stdout}")


  def create_server_cert(s):
    # todo: os.environ.get('PASS', None)

    os.makedirs(os.path.dirname(s.args.key), exist_ok=True)
    os.makedirs(os.path.dirname(s.args.cert), exist_ok=True)

    cmd = [
    'openssl', 'req', '-nodes', '-new',
    '-newkey', 'rsa:2048',
    '-keyout', s.args.key,
    '-out', s.args.csr,
    '-subj', f'/CN={s.args.name}',
    ]

    csr_run = run(cmd, stderr=DEVNULL)
    if csr_run.returncode != 0:
      print(f"cmd({csr_run.returncode}):{' '.join(cmd)}\n{csr_run.stdout}")

    extfile_out = f'subjectAltName={",".join(s.args.subject_alt_names)}\n'
    (fd, fpath) = mkstemp()
    with os.fdopen(fd, 'w') as fobj:
      fobj.write(extfile_out)

    cmd = [
      'openssl', 'x509', '-req',
      '-in', s.args.csr,
      '-CA', s.args.cacert,
      '-CAkey', s.args.cakey, '-CAcreateserial',
      '-out', s.args.cert_only,
      '-extfile', fpath,
    ]

    crt_run = run(cmd, stderr=DEVNULL)
    if crt_run.returncode != 0:
      print(f"cmd({crt_run.returncode}):{' '.join(cmd)}\n{crt_run.stdout}")
    os.remove(fpath)

    # Merge cert and cacert for "full chain" cert
    s.concat_files([s.args.cert_only, s.args.cacert], s.args.cert)


CertManager()
```

</details>

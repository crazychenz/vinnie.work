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
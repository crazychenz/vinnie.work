---
slug: 2024-01-04-smallstep-product-skim
title: 'Smallstep Product Skim'
draft: true
---

## Overview

Quick review of Smallstep PKI tooling. In short, this looks like a fantastic tool for a large audience, but I do wish it had just a bit more in the way of ACME client support (i.e. DNS Challenges).

<!-- truncate -->

I've previously written on certificates several times. I usually focus on using the tools commonly available such as OpenSSL and avoiding large over-engineered solutions. Getting away from the "stock only" mindset, there are a few newer tools I've found that appear to heading in the correct direction for usability without the need for understanding the full PKI framework to nuts and bolts. 

[Smallstep](https://smallstep.com/) is (mostly) an all-in-one PKI solution. It is a CA server for issuing server and client certificates (as well as JWT, TOTP, and SSH key issuer). It also can act as an ACME provisioner so that certificate issuing is automate-able. This is great for completely offline solutions. ... Something very lacking in the short sighted Agile world of today.

In addition to being an ACME provisioner, it also has some ACME client support. Primarily, it supports HTTP challenges for requesting certificates from provisioners like LetsEncrypt. So far, this is great, but one of the major drawbacks of Smallstep CA (_at this time_) is that it **does not have support for LetsEncrypt's ACME DNS challenge scheme** (AFAIK). ACME's DNS challenge is the primary method I use for my current configurations (via Certbot). Note: Caddy, a user of smallstep, has ACME DNS challenge capabilities, but also comes with security concerns.

While Smallstep installation on Alpine is done via package management, all the other distribution binaries are more manual and require the use of a 3rd party `cosign` application to verify their authenticity. This isn't that bad, but it is _yet another dependency_. Ideally I'd want to `apt` or `dnf` the package from any number of top 10 distributions and platforms. But the one upside is that Smallstep's CLI is an all-in-one static binary, FWIW.

- [Smallstep Install Docs](https://smallstep.com/docs/step-cli/installation/).
- [Smallstep Releases](https://github.com/smallstep/cli/releases)

## Comments

<Comments />

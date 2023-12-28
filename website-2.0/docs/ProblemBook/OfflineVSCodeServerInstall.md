---
sidebar_position: 10
title: Offline VSCode Server Install
---

:::danger Incomplete

This document is not yet written.

:::

```text
https://update.code.visualstudio.com/commit:3866c3553be8b268c8a7f8c0482c0c0177aa8bfa/server-linux-arm64/stable

https://update.code.visualstudio.com/commit:3866c3553be8b268c8a7f8c0482c0c0177aa8bfa/server-linux-x64/stable

mkdir -p ~/.vscode-server/bin/3866c3553be8b268c8a7f8c0482c0c0177aa8bfa/

# If you can't run node it could be because of a missing libc6.

sudo apt-get install libc6-arm64-cross
```

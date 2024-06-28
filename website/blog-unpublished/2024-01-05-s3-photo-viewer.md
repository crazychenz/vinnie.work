---
slug: 2024-01-05-s3-photo-viewer
title: 'S3 Photo Viewer'
draft: true
---

## Overview

1. Alpine: `apk -U add s3fs-fuse`
2. Create S3 account for upload
3. Mount s3 drive with upload account
4. Create SSH key permitting access to s3 mount
5. Setup FolderSync from phone with ssh key
6. Webhook from FolderSync to web service that can run thumbnailer.py
7. View images with Caddy.
8. Resync PhotoPrism to pickup new thumbnails?

<!-- truncate -->

https://smallstep.com/docs/step-cli/installation/

https://github.com/smallstep/cli/releases/tag/v0.25.1

https://dl.smallstep.com/gh-release/cli/gh-release-header/v0.25.1/step_linux_0.25.1_amd64.tar.gz

`STEPPATH=<path to step artifacts> STEPDEBUG=1`

`step ca init --context vinnie.work`

## Comments

<Comments />

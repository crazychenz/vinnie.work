#!/usr/bin/env bash

docker run -ti --rm \
  -v $(pwd)/aosp:/opt/aosp -w /opt/aosp \
  -u $(id -u):$(id -g) \
  android-builder

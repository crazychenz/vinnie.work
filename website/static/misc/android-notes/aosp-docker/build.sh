#!/bin/bash

docker build -t android-builder \
  --build-arg USER_UID=$(id -u) \
  --build-arg USER_GID=$(id -g) \
  -f Dockerfile context



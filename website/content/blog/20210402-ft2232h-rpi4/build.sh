#!/bin/sh

cat Dockerfile | docker build \
    -t $(whoami)/openocd-dev \
    --network host \
    ${*} \
    --build-arg username=$(whoami) \
    --build-arg uid=$(id -u) \
    --build-arg gid=$(id -g) \
    --build-arg groupname=$(id -gn) \
    -f - .
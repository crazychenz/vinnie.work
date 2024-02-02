#!/bin/sh

# Note: This container is run with priviledges so it can have access to hardware.

docker run \
    -ti --rm \
    --network host \
    --privileged \
    -v /dev/bus/usb:/dev/bus/usb \
    -v $(pwd):/workspace \
    $(whoami)/openocd-dev \
    bash -li -c "${*}"
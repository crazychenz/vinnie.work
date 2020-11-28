#!/bin/sh

docker run \
    --network host \
    -e REACT_NATIVE_PACKAGER_HOSTNAME=10.0.0.85 \
    --rm -ti \
    -v $(pwd):/workspace \
    -v $(pwd)/_env/home/user:/home/user \
    crazychenz/node-lts \
    bash -li -c "${*}"


    #--name sayok-test
    #--hostname sayok-test
    # -p 19000:19000
    # -p 19002:19002
    # -p 19006:19006

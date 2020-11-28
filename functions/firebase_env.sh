#!/bin/sh

docker run \
    --network host \
    --rm -ti \
    -v $(pwd):/workspace \
    -v $(pwd)/_env/home:/home/user \
    crazychenz/firebase-node10 \
    bash -li -c "${*}"


    # --name sayok-test
    # --hostname sayok-test
#    -p 4000:4000 \
#    -p 5001:5001 \
#    -p 5080:5080 \
#    -p 5000:5000 \
#    -p 9000:9000 \
#    -p 9099:9099 \
#    -p 8085:8085 \
#    -p 4400:4400 \
#    -p 4500:4500


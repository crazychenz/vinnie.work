#!/bin/bash

#test
docker run \
    -ti --rm \
    --network host \
    -v $(pwd):/workspace \
    crazychenz/docusaurus \
    bash -li -c "${*}"


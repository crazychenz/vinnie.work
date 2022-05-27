#!/bin/sh

docker run -ti --rm \
  -v $(pwd):/opt/website \
  -w /opt/website \
  --network host \
  crazychenz/node-14-alpine yarn "$@"

#!/bin/sh

docker run -ti --rm \
  -v $(pwd):/opt/website \
  -w /opt/website \
  --network host \
  node:16-alpine yarn "$@"

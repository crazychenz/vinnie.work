#!/bin/sh

BUILD_VERSION=$(date +%Y%m%d-%H%M%S)

./pack.sh build www-vinnie-work \
  --path website \
  --builder paketobuildpacks/builder:base \
  --env BP_NODE_RUN_SCRIPTS=build \
  --env BP_WEB_SERVER=nginx \
  --env BP_WEB_SERVER_ROOT=/workspace/build \
  --buildpack paketo-buildpacks/ca-certificates@3.5.1 \
  --buildpack paketo-buildpacks/node-engine \
  --buildpack paketo-buildpacks/yarn \
  --buildpack paketo-buildpacks/yarn-install \
  --buildpack paketo-buildpacks/node-run-script \
  --buildpack paketo-buildpacks/nginx

docker tag www-vinnie-work www-vinnie-work:${BUILD_VERSION}

echo To run: docker run -e PORT=80 -p 3080:80 -ti --rm www-vinnie-work


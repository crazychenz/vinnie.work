#!/bin/bash

docker run --rm \
  -v /var/run/docker.sock:/var/run/docker.sock \
  -v $PWD:/workspace -w /workspace \
  buildpacksio/pack $@


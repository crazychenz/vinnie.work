#!/bin/bash

pushd website

yarn
yarn build
if [ $? -ne 0 ]; then
  echo "Failed to build the site."
  exit 1
fi

popd

echo "Successfully Compeleted."
exit 0

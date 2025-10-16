#!/bin/bash

set -e

if [ ! -f "context" ]; then
  mkdir -p context
fi

pushd context

if [ ! -f "openjdk-17.0.2_linux-x64_bin.tar.gz" ]; then
  OJDK_URL="https://download.java.net/java/GA/jdk17.0.2/dfd4a8d0985749f896bed50d7138ee7f/8/GPL/openjdk-17.0.2_linux-x64_bin.tar.gz"
  curl -LO ${OJDK_URL}
fi

if [ ! -f "commandlinetools-linux-13114758_latest.zip" ]; then
  CLIONLY_URL="https://dl.google.com/android/repository/commandlinetools-linux-13114758_latest.zip"
  curl -LO ${CLIONLY_URL}
fi

popd

docker build -t android-dev -f Dockerfile context


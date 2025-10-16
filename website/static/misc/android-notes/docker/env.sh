#!/usr/bin/env bash

export JAVA_HOME=/opt/jdk-17.0.2/
export ANDROID_HOME=$(realpath ~)/.android/
export PATH=${JAVA_HOME}bin:$PATH
export PATH=${ANDROID_HOME}cmdline-tools/latest/bin:$PATH
export PATH=${ANDROID_HOME}platform-tools:$PATH
export PATH=${ANDROID_HOME}build-tools/latest:$PATH
export PATH=${ANDROID_HOME}emulator:$PATH
export PATH=${ANDROID_HOME}scrcpy:$PATH
export PATH=${ANDROID_HOME}jadx/bin:$PATH
export PATH=${ANDROID_HOME}scripts:$PATH
export PATH=${ANDROID_HOME}ndk/latest/toolchains/llvm/prebuilt/linux-x86_64/bin:$PATH
export PATH=${ANDROID_HOME}ndk/latest:$PATH

export PS1_TAG="(adbenv) "
export PS1="${PS1_TAG}${PS1}"
exec bash -i


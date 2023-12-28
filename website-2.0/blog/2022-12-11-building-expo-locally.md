---
slug: 2022-12-02-building-expo-locally
title: 'Building Expo (SDK46) Locally'
draft: false
---

## Overview

I've been developing an app for the past couple years. Over that time I've seen some pretty drastic changes within the Expo eco-system and how they manage workflows (usually for the better). Following a recent update to Expo SDK 46, I simply could not escape an issue with the `react-native-gesture-handler` not being found. For all the amazing feats that Expo has accomplished to simplify mobile development, the attention to detail in their documentation leaves much to be desired.

<!-- truncate -->

## Preface

Following that overview paragraph, ironically, I wrote this article in a rush due to learning all of the new dev-client and EAS stuff twice because I didn't document it the first time. There are many omitted details that I'd be happy to clarify (if I'm able) if requested in the comments. Time permitting, I may go back and clean this up another day. But for now, here is something instead of nothing. :)

## Expo EAS

One of the major updates included with Expo recently was the replacement of the turtle build process with the EAS build process. I like the thought process and goals behind the EAS build process, but it seems to be doing a lot more than required to get the job done. 

Maybe I'll have my "ah ha" moment another day, but today I am here to explain how I build my development Expo project while omitting EAS in my workflow. I've gone through the whole process of using EAS before and it just created way to many artifacts in to many areas. Not only did this complicate my dockerization of the workflow, it also made tracking what to cache, what store, and what to revision control not obvious.

Takeaway: Skipping EAS builds for now ...

## Introducing `expo-dev-client`

Expo has long suffered the limitation that native code could not be easily integrated into its applications. Therefore you generally were stuck with what was provided in their template of code. This is a nice model for those of us that don't want to get into the Android Studio or XCode mess of it all, but also means that extensibility falls flat.

With recent releases of Expo, you can now build your own debug/loader client, just like it was your own custom Expo Go application. Expo documentation talks about EAS and how this makes everything good. Expo also talks up the EAS Cloud Building solution, but I'm a poor developer with no revenue, therefore I want to build all the things locally, quickly, and in a manner that just works. _But how?_

## Building Expo Dev Client

With Expo SDK 46, instead of _ejecting_ an Expo application to build natively (_unmanaged_), you can generate the native build directories with `yarn expo prebuild` and build the dev-client for a (_managed_) development workflow. **But what do we do from here?**

Expo documentation lists the various dependencies for building as if you were using their build servers. You are free to go find those and manually install them. But we live in 2022 and there is docker and containerization. The following are a set of files that build a Docker image suitable for building a dev-client.

<details>
<summary>Dockerfile</summary>

```Dockerfile
FROM node:16-buster-slim

# Setup for unattended install
ARG DEBIAN_FRONTEND=noninteractive
ENV DEBCONF_NONINTERACTIVE_SEEN=true
RUN { echo 'tzdata tzdata/Areas select Etc'; echo 'tzdata tzdata/Zones/Etc select UTC'; } | debconf-set-selections

RUN apt-get update
RUN DEBIAN_FRONTEND=noninteractive TZ=Etc/UTC apt-get -y install tzdata
RUN apt-get install -y apt-utils
RUN apt-get install -y git bash rsync openjdk-11-jre openjdk-11-jdk unzip

# Set default node ennvironment variables
ENV NODE_ENV development

# set default android environment variables
ARG arg_CLITOOLS_SDK_FNAME=commandlinetools-linux-8512546_latest.zip
ENV CLITOOLS_SDK_FNAME=${arg_CLITOOLS_SDK_FNAME}
ARG arg_ANDROID_HOME=/opt/android
ENV ANDROID_HOME=${arg_ANDROID_HOME}
ENV ANDROID_SDK_HOME=${ANDROID_HOME}
ENV ANDROID_PREFS_ROOT=${ANDROID_HOME}

ARG ANDROID_BUILD_VERSION=32
ARG ANDROID_TOOLS_VERSION=32.0.0
ARG NDK_VERSION=24.0.8215888
ARG CMAKE_VERSION=3.18.1
ARG ADB_INSTALL_TIMEOUT=10

ENV ANDROID_NDK=${ANDROID_HOME}/ndk/$NDK_VERSION
ENV ANDROID_NDK_HOME=${ANDROID_NDK}

# Build path
ENV PREV_PATH=${PATH}
ENV PATH=${ANDROID_NDK}:${ANDROID_HOME}/cmdline-tools/bin
ENV PATH=${PATH}:${ANDROID_HOME}/emulator:${ANDROID_HOME}/platform-tools
ENV PATH=${PATH}:${ANDROID_HOME}/tools:${ANDROID_HOME}/tools/bin
ENV PATH=${PATH}:${PREV_PATH}

ARG uid=1000
ARG gid=1000

# Setup android home in opt and owned by user.
RUN mkdir -p ${ANDROID_HOME} && chown $uid:$gid ${ANDROID_HOME}
RUN chown -R $uid:$gid ${ANDROID_HOME}

# This is our default expo project folder mount point
WORKDIR /opt/sayok/expo

RUN npm install -g pnpm
RUN chown $uid:$gid /opt/sayok/expo
COPY --chown=$uid:$gid ${CLITOOLS_SDK_FNAME} /tmp/
RUN unzip -q -d ${ANDROID_HOME} /tmp/${CLITOOLS_SDK_FNAME} \
  && rm -f /tmp/${CLITOOLS_SDK_FNAME}
RUN yes | sdkmanager --licenses --sdk_root=${ANDROID_HOME}
RUN yes | sdkmanager --sdk_root=${ANDROID_HOME} \
  "platform-tools" \
  "platforms;android-$ANDROID_BUILD_VERSION" \
  "build-tools;$ANDROID_TOOLS_VERSION" \
  "cmake;$CMAKE_VERSION" \
  "ndk;$NDK_VERSION"

USER $uid:$gid

# Set yarn defaults.
RUN yarn set version berry ; \
    sed -i '/^nodeLinker:/d' .yarnrc.yml ; \
    echo "nodeLinker: node-modules" >> .yarnrc.yml ; \
    yarn

```

</details>

<details>
<summary>build.sh</summary>

```sh
#!/bin/sh

CLITOOLS_SDK_FNAME=commandlinetools-linux-8512546_latest.zip
ANDROID_HOME=/opt/android

ANDROID_BUILD_VERSION=31
ANDROID_TOOLS_VERSION=30.0.3
NDK_VERSION=21.4.7075529
CMAKE_VERSION=3.18.1
ADB_INSTALL_TIMEOUT=10

# Fetch the Android sdkmanager for all android ndk installs.
# Full reference at https://dl.google.com/android/repository/repository2-1.xml
[ ! -d "context" ] && mkdir -p context
[ ! -f "context/${CLITOOLS_SDK_FNAME}" ] && \
  wget -P context https://dl.google.com/android/repository/${CLITOOLS_SDK_FNAME}

cat Dockerfile | docker build \
  --build-arg arg_CLITOOLS_SDK_FNAME="${CLITOOLS_SDK_FNAME}" \
  --build-arg arg_ANDROID_HOME="${ANDROID_HOME}" \
  --build-arg ANDROID_BUILD_VERSION="${ANDROID_BUILD_VERSION}" \
  --build-arg ANDROID_TOOLS_VERSION="${ANDROID_TOOLS_VERSION}" \
  --build-arg NDK_VERSION="${NDK_VERSION}" \
  --build-arg CMAKE_VERSION="${CMAKE_VERSION}" \
  --build-arg ADB_INSTALL_TIMEOUT="${ADB_INSTALL_TIMEOUT}" \
  -t crazychenz/eas -f - \
  context

```

</details>

You can drop those into a `docker` folder in your project, run `build.sh` and a `crazychenz/eas` docker image should pop out the other end. Once you have the docker image successfully built, the following script is a script I keep and run from the folder with the top level `package.json` file.

<details>
<summary>eas.sh</summary>

```sh
#!/bin/sh

mkdir -p \
  .build/expo/build \
  .build/expo/output \
  .build/node/cache \
  .build/node/npm \
  .build/yarn/berry/cache \
  .yarn/berry/cache \
  .build/gradle 

docker run -ti --rm \
  -w /opt/sayok/expo/android \
  -v $(pwd):/opt/sayok/expo \
  -e EAS_LOCAL_BUILD_SKIP_CLEANUP=1 \
  -e EAS_LOCAL_BUILD_WORKINGDIR=/home/node/.expo/build \
  -e EAS_LOCAL_BUILD_ARTIFACTS_DIR=/home/node/.expo/output \
  -v $(pwd)/.build/node/cache:/home/node/.cache \
  -v $(pwd)/.build/yarn:/home/node/.yarn \
  -v $(pwd)/.build/node/npm:/home/node/.npm \
  -v $(pwd)/.build/expo:/home/node/.expo \
  -v $(pwd)/.build/gradle:/home/node/.gradle \
  --network host \
  crazychenz/eas $@

```

</details>

With this script and the docker image, you should have everything you need to build a dev-client. From the top level `package.json` folder, run `yarn expo prebuild` to generate the `android` folder. Then run `./eas.sh ./gradlew app:assembleDebug` to build the dev-client. Once everything is built, you'll find the dev-client APK in `android/app/outputs/apk/debug`. I generally install the APK by hosting it on my network with `python3 -m http.server` and then accessing the APK directly from my mobile device or emulator (i.e. no adb required).

If you need to have your dev-client signed with your own certificate, you'll need to modify the android/app/gradle.build file to reference your keystore and certificate. Deep linking is performed by verification of the signing signature of the application. Therefore we need to track which certificates we sign the dev-client with for deep linking to work. `<project>/android/app/build.gradle` references `<project>/android/app/debug.keystore` as the keystore to use for the `dev-client`. You may update the verified fingerprint in `.well-known` or update dev-client with our own keystore and certificate to get it to match.

To see an APK's cert fingerprint:

```sh
keytool -printcert -jarfile app.apk
```

To see fingerprints in keystore:

```sh
keytool -list -keystore sayok-dev-keystore.jks
```

## Maintenance

When you install new dependencies into node_modules that contain native code or depend on new native code or APIs, you'll need to:

- Re-run the dev-client build: `eas.sh ./gradlew app:assembleDebug`.
- Uninstalling the previous version from the Android platform.
- Installing the new APK (via `python3 -m http.server`)
- Restarting the Expo server (`yarn expo start --dev-client`)
- Run the newly minted dev-client on Android.

## Comments

<Comments />

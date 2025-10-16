


## Building APKs

<!-- Fuck Gradle. -->



### Install SDK and Build Tools

Install newest cmake:

```sh
CMAKE_PKG_NAME=$(sdkmanager --list | grep cmake | sort -r | awk '{print $1}' | head -n 1)
sdkmanager $CMAKE_PKG_NAME
```

Install SDK33 to target Android 13:

```sh
sdkmanager "build-tools;33.0.0" "platforms;android-33" "sources;android-33"
```

### Build NDK Samples

```sh
git clone https://github.com/android/ndk-samples
cd ndk-samples
# android/ndk-samples is too dumb to use newer cmake
sdkmanager "cmake;4.1.0"
./gradlew :hello-jni:app:assembleRelease
```

`hello-jni/app/build/outputs/apk/release/app-release-unsigned.apk`


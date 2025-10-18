
<!-- 
TODO: Need to move the `~/apks` workspace convention to earlier in materal.
TODO: Need to move the build-tools earlier and include it in the env.sh.
TODO: Consider adding a `~/.android/latest/` folder to house symlinks for \$PATH so Gradle does whine.
 -->

## Building APKs

Often the analysis of an application we don't have the source code for is trivialized as reverse engineering. While software reverse engineering is a succinct description of what you might be doing, I prefer to describe it more as "learning how something works". With this kind of principle, it is highly recommended that as an engineer you put yourself in the shoes of the original developer. That is to say that you should have a general understanding or baseline of how to build an APK from source code.

As I said before, I don't mettle with Android Studio, I only work from command line. Therefore I won't be describing any Android Studio workflows for the time being. Instead, I'll walk through grabbing some APK source code and building it with Gradle.

Building an APK from scratch affords you several things:

- You get a feel (or at least a path to follow) for why the packages are built the way they are.
- You get a sandbox to add or remove different aspects of an application, build it, and learn what the output looks like.
- We get to build an example APK that we can use going forward without specifically picking on any deployed products.

## Gradle

I should start by saying I have a disdain for Gradle about as much as cats have for baths. Therefore I can not myself fairly describe what Gradle is. I'll leave that to others.

ChatGPT describes Grade as:

```
Gradle is a build automation tool—a system that automates compiling, testing, packaging, and deploying software. It’s most commonly used in Android development, but it’s also widely used for Java, Kotlin, Groovy, C/C++, and even Python or JavaScript projects.
```

Wikipedia further adds: 

```
Gradle builds on the concepts of Apache Ant and Apache Maven, and introduces a Groovy- and Kotlin-based domain-specific language contrasted with the XML-based project configuration used by Maven.
```

All I'll say for now is that all build systems have their challenges, and Gradle is at the top of my "list".

## Fetch A Gradle Project

The Native Development Kit (NDK) is the C/C++ compiler toolchain, supported by Google, to build native libaries or applications for Android. For example, if you wanted to build some C source code and have it be executable on Android, you'd use the `cc` compiler command from NDK to make that happen.

The plan is to grab example APK source code that includes NDK libraries. This way we'll be able to look at not only the Java side of the APK, but also the native libraries in the APK. 

Grab the set of NDK example code from `android/ndk-samples`'s Github repository:

```sh
git clone https://github.com/android/ndk-samples
cd ndk-samples
```

If you look in that directory, you should see the following files:

- build.gradle - The top-level Gradle definition file.
- gradle.properties - Gradle build configuration data. Not unlike usual Java properties files.
- gradlew / gradlew.bat - Gradle wrappers for *nix and Windows respectively.
- settings.gradle - Project structure and module inclusions.

The `gradlew` is the entry point for Gradle. When running `gradlew` for the first time, the wrapper will assume you have internet and attempt to reach out and install Gradle for you. It will attempt to install Gradle, not in the relavant project folder, but into a Gradle cache in your home folder. As you build Gradle projects you may find disk space disappearing and the project folder you are building not accounting for the disk lost. Yes, this is Gradle squirreling away artifacts in your home folder. (Note: Many other tools do this as well, and I sigh loudly everytime!)

You can of course use Docker to isolate all of this behavior, but you need to ensure you've setup a proper user with a home folder and provided all of the correct dependencies in the Dockerfile or a container state.

### Install SDK and Build Tools

In the particular Gradle project that we're building for, we know we're going to need an Android SDK and an NDK installed. I often grab the newest NDK since that should be independent of the SDK. The SDK can be anything from the minimally supported SDK that the project supports to the current SDK version for the target Android we'll be running on. The version range is because sometimes we want to build an application with an older SDK with the hopes it'll be compatible with all newer SDKs for the foreseeable future.

In our particular inspection and analysis use case, I don't need a range of versions to work so I'll target only Android 13 or what maps to Android SDK 33. Without regard to whether I need everything, I always install the build-tools, platforms, and sources packages for a target SDK version.

```sh
sdkmanager --install "build-tools;33.0.0" "platforms;android-33" "sources;android-33"
```

- build-tools - Applications responsible for bundling an APK (e.g. aapt, apksigner, zipalign)
- platforms - Android API SDK
- sources - Android SDK Source (Not required to build. For reference use only. Used by IDEs.)

In Gradle, you often can run `./gradlew tasks` to see a list of target build commands to run. We're building a subproject so our command with be a little different.

We'll now give the build a go. Before you begin though, I'd like to highlight to simplicity of the code. The hello-jni code's only real behavior is to get a string from native land into Java/Kotlin land. Knowing that, I want you to observe and understand the overhead added in by the build system! Ok, let's try to build the hello-jni subproject in the NDK samples project:

```
(adb-venv) $ ./gradlew :hello-jni:app:assembleRelease
Downloading https://services.gradle.org/distributions/gradle-8.13-bin.zip
.............10%.............20%.............30%.............40%.............50%.............60%.......
......70%.............80%.............90%.............100%

Welcome to Gradle 8.13!

Here are the highlights of this release:
 - Daemon JVM auto-provisioning
 - Enhancements for Scala plugin and JUnit testing
 - Improvements for build authors and plugin developers

For more details see https://docs.gradle.org/8.13/release-notes.html

Starting a Gradle Daemon, 1 stopped Daemon could not be reused, use --status for details

> Configure project :build-logic
w: file:///home/user/apks/source-projects/ndk-samples/build-logic/build.gradle.kts:15:5: 'kotlinOption
s(KotlinJvmOptionsDeprecated /* = KotlinJvmOptions */.() -> Unit): Unit' is deprecated. Please migrate
to the compilerOptions DSL. More details are here: https://kotl.in/u1r8ln

> Configure project :base
Checking the license for package NDK (Side by side) 28.2.13676358 in /home/user/.android/licenses
License for package NDK (Side by side) 28.2.13676358 accepted.
Preparing "Install NDK (Side by side) 28.2.13676358 v.28.2.13676358".
"Install NDK (Side by side) 28.2.13676358 v.28.2.13676358" ready.
Installing NDK (Side by side) 28.2.13676358 in /home/user/.android/ndk/28.2.13676358
"Install NDK (Side by side) 28.2.13676358 v.28.2.13676358" complete.
"Install NDK (Side by side) 28.2.13676358 v.28.2.13676358" finished.
Checking the license for package Android SDK Build-Tools 35 in /home/user/.android/licenses
License for package Android SDK Build-Tools 35 accepted.
Preparing "Install Android SDK Build-Tools 35 v.35.0.0".
"Install Android SDK Build-Tools 35 v.35.0.0" ready.
Installing Android SDK Build-Tools 35 in /home/user/.android/build-tools/35.0.0
"Install Android SDK Build-Tools 35 v.35.0.0" complete.
"Install Android SDK Build-Tools 35 v.35.0.0" finished.
Checking the license for package Android SDK Platform 35 in /home/user/.android/licenses
License for package Android SDK Platform 35 accepted.
Preparing "Install Android SDK Platform 35 (revision 2)".
"Install Android SDK Platform 35 (revision 2)" ready.
Installing Android SDK Platform 35 in /home/user/.android/platforms/android-35
"Install Android SDK Platform 35 (revision 2)" complete.
"Install Android SDK Platform 35 (revision 2)" finished.
[=========                              ] 25%
> Task :base:configureCMakeRelWithDebInfo[arm64-v8a] FAILED

[Incubating] Problems report is available at: file:///home/user/apks/source-projects/ndk-samples/build
/reports/problems/problems-report.html

FAILURE: Build failed with an exception.

* What went wrong:
Execution failed for task ':base:configureCMakeRelWithDebInfo[arm64-v8a]'.
> [CXX1300] CMake '4.1.0' was not found in SDK, PATH, or by cmake.dir property.

* Try:
> Run with --stacktrace option to get the stack trace.
> Run with --info or --debug option to get more log output.
> Run with --scan to get full insights.
> Get more help at https://help.gradle.org.

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come
 from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.13/userguide/command_line_interface.html#se
c:command_line_warnings in the Gradle documentation.

BUILD FAILED in 8m 40s
5 actionable tasks: 5 executed
```

Ok, wow. The `android/ndk-samples` developers and Gradle have automatically installed Gradle, an NDK, build-tools, and an SDK ... and still it has failed to build?! If you look at the actual error, its because of a missing `cmake` install. Totally confuddled as to why it installed everything but `cmake` ... whatever! Note: Do not install another version of `cmake` (e.g. 4.1.1), it will not work. Use the exact version `4.1.0`.

```sh
sdkmanager "cmake;4.1.0"
```

Before we being another build attempt, I want to highlight or reiterate the Gradle home directory caching:

```
(adb-venv) $ du -d 1 -h ~/.gradle/
1.5G    /home/user/.gradle/
```

Right, lets try the build again:

```
(adb-venv) $ ./gradlew :hello-jni:app:assembleRelease

[Incubating] Problems report is available at: file:///home/user/apks/source-projects/ndk-samples/build
/reports/problems/problems-report.html

Deprecated Gradle features were used in this build, making it incompatible with Gradle 9.0.

You can use '--warning-mode all' to show the individual deprecation warnings and determine if they come
 from your own scripts or plugins.

For more on this, please refer to https://docs.gradle.org/8.13/userguide/command_line_interface.html#se
c:command_line_warnings in the Gradle documentation.

BUILD SUCCESSFUL in 3m 9s
113 actionable tasks: 109 executed, 4 up-to-date
```

Not too painful ... although this was all to build a do-nothing APK. Sigh.

You can find the output of your labors in `./hello-jni/app/build/outputs/apk/release/app-release-unsigned.apk`. For simplicity, I want to analyze this APK from another base folder structure: `~/apks`.

```sh
mkdir -p ~/apks/hellojni/input
cp ./hello-jni/app/build/outputs/apk/release/app-release-unsigned.apk ~/apks/hellojni/input/
cd ~/apks/hellojni
```

## Signing And Installing an APK

At this point, I'd like to point out that the APK is not signed. For our purposes, this is not an issue, but if you were a serious developer that has intentions to deploy this application to the Playstore, you'd need to treat your signing keys like the PIN to your business bank accounts.

For giggles, lets attempt to install the unsigned APK into our emulator. I'm going to verify the emulator is still running:

```
(adb-venv) $ adb devices
List of devices attached
emulator-5554   device
```

Now lets install the APK (from `~/apks/hellojni/input`):

```
(adb-venv) $ adb install -r ./input/app-release-unsigned.apk
Performing Streamed Install
adb: failed to install ./input/app-release-unsigned.apk: Failure [INSTALL_PARSE_FAILED_NO_CERTIFICATES:
 Failed to collect certificates from /data/app/vmdl1917125948.tmp/base.apk: Attempt to get length of nu
ll array]

```

It didn't work because it wasn't signed. Create a simple and **insecure** keystore in `~/apks/keys`:

```sh
mkdir ~/apks/keys
keytool -genkey -v -keystore ~/apks/keys/my-release-key.jks \
  -keyalg RSA -keysize 2048 -validity 10000 -alias my-key-alias \
  -storepass password -keypass password \
  -dname "CN=Unknown, OU=Unknown, O=Unknown, L=Unknown, ST=Unknown, C=Unknown"
```

Now sign the _unsigned_ APK with our new `my-key-alias` key in the keystore:

```sh
cd ~/apks/hellojni
apksigner sign --ks ~/apks/keys/my-release-key.jks --ks-key-alias my-key-alias \
  --ks-pass pass:password --key-pass pass:password \
  --out ./input/app-release.apk ./input/app-release-unsigned.apk
```

Again, try to install the APK to the emulator again:

```
(adb-venv) $ adb install -r ./input/app-release.apk
Performing Incremental Install
Serving...
All files should be loaded. Notifying the device.
Success
Install command complete in 1316 ms
```

Yay! It worked. And we did it with our own key and keystore. No having to have a certificate or cert request or other nastiness required to be signed by upstream services. (Surprisingly.)

At this point, you can open `scrcpy` and launch "HelloJni". You'll see a simple application with a "HelloJni" banner and "Hello from JNI." in the center of the screen.

We can also see the app is installed by listing installed 3rd party packages with: `adb shell pm list packages -3`.

```
(adb-venv) $ adb shell pm list packages -3
package:com.example.hellojni
```



























<!-- ```
./gradlew :hello-jni:app:assembleRelease -PcompileSdk=35
``` -->


<!-- Install newest cmake:

```sh
CMAKE_PKG_NAME=$(sdkmanager --list | grep cmake | sort -r | awk '{print $1}' | head -n 1)
sdkmanager $CMAKE_PKG_NAME
```

Install SDK33 to target Android 13: -->


<!-- 
### Build NDK Samples

```sh
git clone https://github.com/android/ndk-samples
cd ndk-samples
# android/ndk-samples is too dumb to use newer cmake
sdkmanager "cmake;4.1.0"
./gradlew :hello-jni:app:assembleRelease
```

`hello-jni/app/build/outputs/apk/release/app-release-unsigned.apk` -->


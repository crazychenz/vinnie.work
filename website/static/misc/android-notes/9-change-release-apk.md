---
sidebar_position: 90
---
# APK Reconstruction

## APK Reconstruction

When you have a build system like Gradle and source code for your Android application all wired up, you are building an APK. When you have the already built APK and you want to make a change and you don't have the source code or build system, you are doing something else entirely. Let's call it reconstruction.

The general idea we want to discuss here is the idea of unziping or extracting all of the components of an APK and then putting all the peices back together again into an executable state. To make it more exciting, we want to also include some additional functionality when we do the rebuild.

### Minimal Extraction for Alteration

I believe that when you are extracting an APK with apktool, the tool does everything it can to dismantle the APK in such a way that it can put everything back together again. For simple applications, this works great. Personally, I've found that apktool struggles to reconstruct more large real world applications after they've been taken apart. The applications that it struggles with I'll call one-way extractions.

To fix the issue of a one-way extractions, there is a simple enough technique that you can you to make things more stable and repeatable. The idea is that you should only extract what you need to extract and leave the rest alone. 

- If all you want to do is modify something in the Android Manifest
  - `apktool d --no-res --no-src`
  - AXML2XML, make change, XML2AXML
  - `apktool b`, ZipAlign, ApkSign
- If all you want to do is modify a bytecode line (without size changes)
  - `apktool d --no-res --no-src`
  - Patch bytecode, update SHA1 in DEX, update Adler32 in DEX
  - `apktool b`, ZipAlign, ApkSign
- If all you want to do is modify a library shared object
  - `apktool d --no-res --no-src`
  - Add shared object file
  - `apktool b`, ZipAlign, ApkSign

There is no reason to do a full apktool extraction of the smali and resources if you don't need to. For most of the modifications that interest folks, a minimal change should suffice.

Note: I originally wanted to only use zip instead of apktool. Unfortunately its not that simple because there are manifests and other bits of accounting that need to occur and I didn't want to have to worry about that, so I lean on apktool to handle all of that work for me.

## Debuggable APK

Android has developed a policy and process for determining what applications are allowed to be debugged. If the application declares itself a debuggable application, it actually lightens up on several security measures. When an application is debuggable, you can ptrace it (i.e. gdb and frida) and you can run a proper Java debugger on it. This is all defined in the Android Runtime library we'll talk more about later.

Note: I've had many issues debugging anything after Android 13. For now, I always stick with Android 13 when debugging.

How do you make an Android application debuggable? There are two key things you need to do:

- The APK itself needs to declare that it is debuggable. The APK declares itself debuggable by adding a special attribute (`android:debuggable="true"`) to the `<application />` XML tag in the Android Manifest. It really is that simple. Add the attribute to the Manifest, wrap everything back up, reinstall and you should be good to go. For good measure, I also add `android:profileableFromShell="true"` for additional monitoring capabilities.

- The device user also needs to target the application for debugging. We'll talk about targetting applications for debugging in the next section. For now, it should suffice to know that you can target an application for debug via the Developer Tools or `adb`.

## Declaring The APK Debuggable

Below is a quick bash script that I've written to streamline the process of extracting an APK (minimally), modifying the AndroidManifest to make it debuggable, and then packaging it all back up again for install into our Android device or emulator.

Note: It does resign the APK with our keystore and key. If the application was already installed on the Android device from another developer, you'll have to uninstall the application to install the same APK signed by a different developer. **You may lose all of your application specific data in the process.** This is why I normally try to do all of this work on a stateless emulator whenever I can.

Create the file `${ANDROID_HOME}misc-tools/make-debuggable` and populate it with:

```sh
#!/usr/bin/env bash
set -e

# Check for dependencies
cmd_deps="apktool keytool apksigner zipalign java pyaxml"
cmd_deps_not_found=""
for cmd in keytool apksigner zipalign java pyaxml; do
  if [ -z "$(which $cmd 2>/dev/null)" ]; then
    echo "$cmd not found in \$PATH."
    cmd_deps_not_found="$cmd_deps_not_found $cmd"
  fi
done
if [ -n "$cmd_deps_not_found" ]; then
  echo "Missing depedencies found: $cmd_deps_not_found"
  echo "Stopping command."
  exit 1
fi

# Fetch arguments or exist with usage
script_name=$(basename $0)
if [ "$#" -ne 4 ]; then
    echo "Usage: $script_name <nodbg.apk> <output.apk> <keystore.jks> <keyname>"
    exit 1
fi
nodbg_apk=$1
output_apk=$2
keystore=$3
keyname=$4

# Create working folder.
tmpdir=$(mktemp -d)

# Extracting APK with apktool
apktool d --no-res --no-src -o $tmpdir/extraction $nodbg_apk

# Decoding axml AndroidManifest
pyaxml -i $tmpdir/extraction/AndroidManifest.xml -o $tmpdir/AndroidManifest.xml axml2xml

# Modify decoded AndroidManifest
sed -i '/<application/s/>/ android:profileableFromShell="true" android:debuggable="true">/' \
  $tmpdir/AndroidManifest.xml

# Encode AndroidManifest
pyaxml -i $tmpdir/AndroidManifest.xml -o $tmpdir/extraction/AndroidManifest.xml xml2axml

# Rebuild APK, zipalign, sign
APKSIGNER_FLAGS="--ks $keystore --ks-key-alias $keyname"
apktool b -o "$tmpdir/unaligned.apk" $tmpdir/extraction \
  && zipalign -f -v -p 4096 "$tmpdir/unaligned.apk" "$tmpdir/aligned.apk" \
  && apksigner sign ${APKSIGNER_FLAGS} --out $output_apk "$tmpdir/aligned.apk"

# Wipe the working folder
rm -rf $tmpdir
```

Make it executable with `chmod +x ${ANDROID_HOME}misc-tools/make-debuggable`.

An example run from `~/apks/hellojni` might look like:

```
(adb-venv) $ make-debuggable input/app-release-unsigned.apk output/app-release-dbg.apk ../keys/my-release-key.jks my-key-alias
I: Using Apktool 2.12.1 on app-release-unsigned.apk with 6 threads
I: Copying raw classes.dex file...
I: Copying raw resources...
I: Copying raw manifest...
I: Copying original files...
I: Copying assets...
I: Copying lib...
I: Copying unknown files...
I: Using Apktool 2.12.1 on app-release-unsigned.apk with 6 threads
I: Copying raw classes.dex file...
I: Checking whether resources have changed...
I: Copying raw resources...
I: Building apk file...
I: Importing assets...
I: Importing lib...
I: Importing unknown files...
I: Built apk into: /tmp/tmp.ukYQKw2MoY/unaligned.apk
Verifying alignment of /tmp/tmp.ukYQKw2MoY/aligned.apk (4096)...
      88 res/color-v31/m3_ref_palette_dynamic_neutral_variant98.xml (OK - compressed)
     394 res/color-v31/m3_ref_palette_dynamic_neutral_variant96.xml (OK - compressed)
... snip ...
 7516427 kotlin-tooling-metadata.json (OK - compressed)
 7516769 DebugProbesKt.bin (OK - compressed)
Verification succesful
Keystore password for signer #1:
(adb-venv) $ 
```

Note: It will asks you to enter a password for the keystore and maybe the key. If you used the suggestion that we did before, it'll likely be the super secure password: `password`.

Once that is done, you'll find the output in `~/apks/hellojni/output/app-release-dbg.apk`. You can partially verify things by installing the APK over the existing installation:

```
(adb-venv) $ adb install -r output/app-release-dbg.apk
Performing Incremental Install
Serving...
All files should be loaded. Notifying the device.
Success
Install command complete in 162 ms
(adb-venv) $
```



















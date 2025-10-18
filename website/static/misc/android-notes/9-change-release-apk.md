

<!-- 
- Altering APKs:
  - Two-way vs One-way extractions.
  - Minimal Extraction for reconstruction.
  - Reconstruct APK to include debuggable
    - pyaxml
    - Zipalign
    - Apksigner
  - TODO: Dex modification (updating CRC? updating signatures?)
    - 0x08 - Alder32 of everything except first 12 bytes.
    - 0x0C - Sha1 of everything except first 32 bytes.

- Make APK debuggable:
      - Complexities with reconstruction
      - Updating only manifest (axml vs xml)
      - zipalign page size 4096
      - apk signing
    - Install debuggable APK as application on emulator

   -->

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

I should probably streamline this script a bit better (and I probably will once I convert it to python or something). For now, this is the script that I have that I use to add the attributes to the XML element in `AndroidManifest.xml`.

Note: It does resign the APK with my key. If the application was already installed on the Android device from another developer, you'll have to uninstall it to install the same APK signed by a different developer. You'll also likely lose all of your application specific data in the process. This is why I normally try to do all of this work on a stateless emulator whenever I can.

```sh
#!/bin/bash

OUTPUT=./output/

APK_SRC_PATH=$1
APK_DST_PATH=${OUTPUT}$2

APKTOOL="java -jar jars/apktool_2.12.0.jar"
BAKSMALI="java -jar jars/baksmali-3.0.9-fat.jar"

CACHE=./cache/
XTR_APK=${CACHE}extracted-apk/
KS_PREFIX=./keys/
KEYSTORE=${KS_PREFIX}my-release-key.jks
KEYNAME=my-key-alias
KSPASS=password
APKSIGNER_FLAGS="--ks $KEYSTORE --ks-key-alias $KEYNAME"
APKSIGNER_FLAGS="$APKSIGNER_FLAGS --ks-pass pass:${KSPASS} --key-pass pass:${KSPASS}"

mkdir -p ${OUTPUT} ; mkdir -p ${KS_PREFIX}

for cmd in keytool apksigner zipalign java pyaxml; do
  if [ -z "$(which $cmd 2>/dev/null)" ]; then
    echo "Need $cmd in PATH."
    exit 1
  fi
done

if [ ! -e "${KS_PREFIX}" ]; then
  echo "Making keystore and signing key."
  mkdir ${KS_PREFIX} \
  && keytool -genkey -v -keystore ${KEYSTORE} -keyalg RSA \
    -keysize 2048 -validity 10000 -alias ${KEYNAME}
fi

if [ ! -e "${APK_DST_PATH}" ]; then
  rm -rf ${CACHE} ; mkdir -p ${CACHE}

  # Creating a resigned version of original.
  apksigner sign ${APKSIGNER_FLAGS} --out ${CACHE}original-signed.apk ${APK_SRC_PATH}

  echo "Extracting apk with apktool (without resources or sources)."
  rm -rf ${XTR_APK}
  ${APKTOOL} d --no-res --no-src -o ${XTR_APK} ${APK_SRC_PATH}

  echo "Decoding axml AndroidManifest"
  cp ${XTR_APK}AndroidManifest.xml ${CACHE}AndroidManifest.original.axml
  pyaxml -i ${CACHE}AndroidManifest.original.axml -o ${CACHE}AndroidManifest.xml axml2xml

  sed -i '/<application/s/>/ android:profileableFromShell="true" android:debuggable="true">/' ${CACHE}AndroidManifest.xml

  echo "Serializeing AndroidManifest xml to axml."
  pyaxml -i ${CACHE}AndroidManifest.xml -o ${XTR_APK}AndroidManifest.xml xml2axml

  echo "Rebuilding, aligning, and signing."
  ${APKTOOL} b -o ${CACHE}unaligned.apk ${XTR_APK} \
  && zipalign -f -v -p 4096 ${CACHE}unaligned.apk ${CACHE}aligned.apk \
  && apksigner sign ${APKSIGNER_FLAGS} --out ${APK_DST_PATH} ${CACHE}aligned.apk
fi

if [ ! -e "${CACHE}smali-src" ]; then
  echo "Extracting smali with byte code offsets."
  mkdir -p ${CACHE}smali-src
  ${BAKSMALI} d --code-offsets ${XTR_APK}build/apk/classes.dex -o ${CACHE}smali-src
  ${BAKSMALI} d --code-offsets ${XTR_APK}build/apk/classes2.dex -o ${CACHE}smali-src
fi

```

<!-- ## Modifications to the DEX

TODO: Write about modifications to the DEX 

-->


















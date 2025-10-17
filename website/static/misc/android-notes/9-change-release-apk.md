

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
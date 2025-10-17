

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
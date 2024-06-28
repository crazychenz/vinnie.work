Your advertising ID declaration in Play Console says that your app uses advertising ID. A manifest file in one of your active artifacts doesn't include the com.google.android.gms.permission.AD_ID permission.

Add `<uses-permission android:name="com.google.android.gms.permission.AD_ID" />` to AndroidManifest.xml
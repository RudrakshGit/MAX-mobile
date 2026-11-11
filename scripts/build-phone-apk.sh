#!/usr/bin/env bash
# Builds an APK for a REAL phone: arm64, pointing at the deployed server.
# (A build for the emulator must NOT be installed on a phone: it points at 10.0.2.2, which only exists inside the emulator.)
set -euo pipefail
cd "$(dirname "$0")/.."
URL="${EXPO_PUBLIC_API_URL:-https://max-companion.expo.app}"
case "$URL" in https://*) ;; *) echo "EXPO_PUBLIC_API_URL must be https:// for a phone build (got $URL)"; exit 1;; esac
export JAVA_HOME="${JAVA_HOME:-/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home}"
cd android
EXPO_PUBLIC_API_URL="$URL" ./gradlew assembleRelease -x lint -PreactNativeArchitectures=arm64-v8a
APK="app/build/outputs/apk/release/app-release.apk"
if unzip -p "$APK" assets/index.android.bundle | grep -a -q "10\.0\.2\.2"; then echo "APK still contains the emulator address, not shipping it"; exit 1; fi
echo "Phone APK ready: $(pwd)/$APK  (server: $URL)"

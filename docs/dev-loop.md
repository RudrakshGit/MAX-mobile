# MAX Dev Loop — Android Emulator

Environment setup:
```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
export PATH=$PATH:$ANDROID_HOME/platform-tools:$ANDROID_HOME/emulator
```

1. Start emulator & wait for boot:
```bash
emulator -avd max-test -no-snapshot -no-audio &
adb wait-for-device
```

2. Build and install dev client (native build):
```bash
npx expo run:android --no-bundler
```

3. Start Metro bundler & reverse port:
```bash
adb reverse tcp:8081 tcp:8081
npx expo start --dev-client
```

4. Launch app:
```bash
adb shell am start -n com.eg18.max/.MainActivity
```

5. Emulator controls & screenshots:
```bash
adb exec-out screencap -p > /tmp/max-shot.png
adb shell cmd overlay enable com.android.internal.systemui.navbar.threebutton
adb shell cmd uimode night yes
adb shell cmd uimode night no
adb shell settings put secure stylus_handwriting_enabled 0
```

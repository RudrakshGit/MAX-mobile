# Setup, from zero

Written for a first app project on a Mac. Every step is free and needs no credit card.

## 1. Tools on the Mac (one time)

| Tool | Why | Install |
| --- | --- | --- |
| Node.js 20+ | Runs Expo and the tests | `brew install node` |
| Watchman | Lets Expo notice file changes quickly | `brew install watchman` |
| JDK 17 | Only for building the APK on your own Mac | `brew install openjdk@17` |
| Android command-line tools | Only for building the APK on your own Mac | `brew install --cask android-commandlinetools` |

Check: `node -v` should print v20 or higher.

## 2. The phone

Install **Expo Go for SDK 57** on your Android phone from <https://expo.dev/go>. The Play Store copy can lag behind; the project only opens in the matching SDK. Keep the phone and Mac on the same Wi-Fi.

On iPhone, the App Store's Expo Go is stuck on an older SDK, so use the Android phone or the APK.

## 3. Run the app

```bash
npm install
cp .env.example .env.local
```

Open `.env.local` and paste your key from <https://console.groq.com/keys> after `GROQ_API_KEY=`. Never commit this file (it is in `.gitignore`), and never paste the key into a chat or a screenshot.

```bash
npx expo start
```

Scan the QR code with Expo Go. Edits appear on the phone as you save.

- Different networks, or the QR won't connect: `npx expo start --tunnel`
- Changes not showing: stop with Ctrl+C, run `npx expo start -c`. Don't set `CI=1`; it turns file watching off.

In Expo Go everything works except automatic screen time, which needs the APK.

## 4. Put the chat server online (EAS Hosting)

The phone talks to the API routes in `src/app/api/`. During development the Expo dev server runs them; for the APK they need a public address.

```bash
npm install -g eas-cli
eas login                      # free account at expo.dev
eas init                       # links this folder to an Expo project
eas env:create --environment production --name GROQ_API_KEY --value "<your key>" --visibility sensitive
npx expo export --platform web
eas deploy --prod --environment production
```

`eas deploy` prints a URL like `https://max-companion.expo.app`. Test it:

```bash
curl -X POST https://<your-url>/api/chat -H 'content-type: application/json' -d '{"messages":[{"role":"user","text":"hi"}]}'
```

Optional Google backup and college sharing: create a free database at <https://neon.tech>, then add `DATABASE_URL` the same way as the key, plus `GOOGLE_WEB_CLIENT_ID` (M11) and `ADMIN_EMAILS` (your Google email, to review college registrations; M15), and deploy again. Tables are created on first use.

## 5. Build the APK

Tell the app where the server lives. In `eas.json`, under `build.preview`, add:

```json
"env": { "EXPO_PUBLIC_API_URL": "https://<your-url>" }
```

**Option A, in the cloud (easiest):**

```bash
eas build -p android --profile preview
```

It finishes with a download link and a QR code. Share that link with classmates.

**Option B, on this Mac:**

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
EXPO_PUBLIC_API_URL=https://<your-url> npx expo prebuild --platform android --clean
cd android && EXPO_PUBLIC_API_URL=https://<your-url> ./gradlew assembleRelease
```

The APK lands in `android/app/build/outputs/apk/release/app-release.apk`. It is signed with a debug key: fine for sharing, not for the Play Store.

That APK carries both ARM architectures. To halve the download, build one per architecture and share the right one:

```bash
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a     # almost every phone from 2019 on
./gradlew assembleRelease -PreactNativeArchitectures=armeabi-v7a   # older 32-bit budget phones
```

Not sure which a phone needs? Install the arm64 one; if Android says the app isn't compatible, use the armeabi-v7a one.

Without `EXPO_PUBLIC_API_URL` the APK still works, but chat says it isn't connected. Bump `version` and `android.versionCode` in `app.json` for every APK you hand out, so the Settings footer shows which build someone is running.

## 6. Installing the APK on a phone

Send the `.apk` (WhatsApp, Drive, or the EAS link). On the phone, open it and allow "Install unknown apps" for the app you opened it from.

For automatic screen time: MAX → Explore → Settings → **Allow usage access** → find MAX → switch on "Permit usage access".

## Publishing

Google Play charges a one-time $25 registration, and new personal accounts must run a closed test with 12 testers for 14 days before going public. Sharing the APK directly is free.

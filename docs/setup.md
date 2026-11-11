# Setup

Everything here is free and needs no credit card. Written for a Mac.

## 1. Tools (one time)

| Tool | For | Install |
| --- | --- | --- |
| Node.js 20+ | Expo, tests | `brew install node` |
| JDK 17 | Building the APK | `brew install openjdk@17` |
| Android command-line tools | Emulator and APK | `brew install --cask android-commandlinetools` |

```bash
export JAVA_HOME=/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home
export ANDROID_HOME=/opt/homebrew/share/android-commandlinetools
```

## 2. Run it

```bash
npm install
cp .env.example .env.local     # add GROQ_API_KEY from https://console.groq.com/keys
```

- **Web (quickest):** `npx expo start --web`. This is the demo mode.
- **Android emulator:** `npx expo run:android` builds a dev build (MAX has its own native modules, so Expo Go is not
  enough) and starts the dev server; the API routes run locally.

On the emulator, check smoothness on a real phone instead: the emulator GPU is slow, and its mic gets no Mac audio.

## 3. Check before you commit

```bash
npm run verify     # must end with VERIFY: PASS
```

Optional server checks against a real Postgres: see the header of `scripts/college-server-check.mts` (in-process
PGlite, no Docker) and `scripts/m11-server-check.mts` (backup and sync). `npm run check-links` tests every resource link.

## 4. Deploy the API and web demo (EAS Hosting)

One time: `npm install -g eas-cli`, `eas login`, then add server secrets as EAS environment variables
(`eas env:create --environment production --name GROQ_API_KEY --visibility sensitive`, and the same for
`DATABASE_URL`, `GOOGLE_WEB_CLIENT_ID`, `ADMIN_EMAILS`). Type the values yourself; never put them in a file in the repo.

```bash
rm -rf dist && npx expo export --platform web
eas deploy --prod --environment production
```

It serves <https://max-companion.expo.app>. A new route can answer 404 for about 20 seconds while the CDN catches up.
Database tables are created on first use.

## 5. Build the phone APK

1. Bump the version in **both** `app.json` (`version`, `android.versionCode`) and `android/app/build.gradle`
   (`versionName`, `versionCode`). Settings shows it at the bottom.
2. Build:

```bash
bash scripts/build-phone-apk.sh
```

It builds a release arm64 APK pointed at the deployed server and refuses one that still points at the emulator. Output:
`android/app/build/outputs/apk/release/app-release.apk`. Copy it to `../apk/max-phone-<version>.apk`, and to the
website's `public/downloads/` when publishing it there.

The APK is signed with a debug key: fine for sharing, not for the Play Store. Cloud alternative:
`eas build -p android --profile preview`.

## 6. Install on a phone

Send the `.apk` (WhatsApp, Drive, the website). Open it and allow "Install unknown apps". For automatic screen time:
Settings → Privacy & lock → Allow usage access → switch on MAX.

Google sign-in needs the app's signing certificate (SHA-1) registered in the Google Cloud console for `com.eg18.max`.

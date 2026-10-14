# M10 — Phone use by category

- **Status:** completed
- **Depends on:** M07
- **Read first:** `modules/usage-stats/android/src/main/java/expo/modules/usagestats/UsageStatsModule.kt`, `src/lib/device-usage.ts`, `src/lib/screen-time.ts`, `docs/v2-features.md` §3 (phone row)

## Outcome
Profile → Mood shows yesterday's phone use grouped into Social, Video & OTT, Games, Messaging, Study & productivity, Payments & shopping, Other — plus the 7-day average per category. Categories come from Android (`ApplicationInfo.category`) with a small override map for popular Indian apps. Data never leaves the phone.

## Files
| File | Action |
| --- | --- |
| `modules/usage-stats/.../UsageStatsModule.kt` | `topApps` also returns `pkg` and `category` (string) per app; add `limit` up to 50 |
| `modules/usage-stats/src/UsageStatsModule.ts` | type: `{ app: string; pkg: string; category: string; minutes: number }[]` |
| `src/lib/appCategory.ts` + `appCategory.test.ts` | `categoriseApp()` + override map |
| `src/lib/device-usage.ts` | `byCategory(apps)` and a 7-day average helper (store daily totals per category in a new state field `phoneDays: { date: string; minutes: Record<string, number> }[]`, keep 30) |
| `src/app/profile/mood.tsx` | category bars (ink, pattern-differentiated, direct labels) |

## Kotlin change (exact mapping)
```kotlin
val cat = try { pm.getApplicationInfo(pkg, 0).let { if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) it.category else -1 } } catch (_: Exception) { -1 }
val catName = when (cat) {
  ApplicationInfo.CATEGORY_GAME -> "game"; ApplicationInfo.CATEGORY_AUDIO -> "audio"; ApplicationInfo.CATEGORY_VIDEO -> "video"
  ApplicationInfo.CATEGORY_IMAGE -> "image"; ApplicationInfo.CATEGORY_SOCIAL -> "social"; ApplicationInfo.CATEGORY_NEWS -> "news"
  ApplicationInfo.CATEGORY_MAPS -> "maps"; ApplicationInfo.CATEGORY_PRODUCTIVITY -> "productivity"; else -> "undefined"
}
// add "pkg" to pkg and "category" to catName in the returned map
```
Native change → rebuild the dev client.

## Interfaces
```ts
export type PhoneCategory = "social" | "video" | "games" | "messaging" | "study" | "payments" | "other";
export function categoriseApp(pkg: string, osCategory: string): PhoneCategory;
```
Override map first (exact package names; extend only with verified package ids): `com.instagram.android`, `com.facebook.katana`, `com.snapchat.android`, `com.twitter.android`, `com.linkedin.android`, `in.mohalla.sharechat` → social · `com.google.android.youtube`, `in.startv.hotstar`, `com.netflix.mediaclient`, `com.jio.media.ondemand`, `com.mxtech.videoplayer.ad` → video · `com.whatsapp`, `org.telegram.messenger`, `com.google.android.apps.messaging` → messaging · `com.phonepe.app`, `net.one97.paytm`, `com.google.android.apps.nbu.paisa.user`, `com.flipkart.android`, `in.swiggy.android`, `com.application.zomato`, `in.amazon.mShop.android.shopping` → payments · `com.unacademyapp`, `xyz.penpencil.physicswala`, `com.byjus.thelearningapp`, `com.google.android.apps.docs`, `com.google.android.apps.classroom`, `com.duolingo` → study. Then OS category: social→social, video/audio→video, game→games, productivity→study, everything else→other.

## Tasks
- [x] **0. Verify every package id in the override map** by opening `https://play.google.com/store/apps/details?id=<id>` (200 and the right app). Remove any that don't match and list them in the report — the list above was written from memory.
- [x] **1. Tests first** `appCategory.test.ts`: Instagram with OS "undefined" → social; an unknown game package with OS "game" → games; PhonePe → payments; WhatsApp → messaging; unknown + "undefined" → other. Implement → green.
- [x] **2. Kotlin + TS types**; rebuild dev client; on the emulator grant usage access, open a few apps (YouTube, Chrome, Settings), confirm categories appear (screenshot).
- [x] **3.** Save yesterday's per-category totals into `phoneDays` once per day (when Profile or Today opens); render bars + 7-day average. Empty state: "Turn on automatic screen time in Settings" (Android APK only) or nothing on unsupported devices.
- [x] **4.** `npm run verify` → PASS.

## Acceptance
- [x] category tests pass; screenshot of categories from the emulator.
- [x] Per-app and per-category usage is never sent to the AI: `insightSignals` still sends only the single `phoneMin` number. (`phoneDays` may sync with the student's account in M11 — it is their own data.)

## Stop and ask if
- `ApplicationInfo.category` is missing for most apps on the emulator (report the raw values).

## Do not touch
the screen on/off logic in `screen-time.ts` (tested), `src/safety/*`.

## Completion report
1. **Package ID Verification (Google Play Store 200 OK check):**
   - Verified 25 packages: `com.instagram.android`, `com.facebook.katana`, `com.snapchat.android`, `com.twitter.android`, `com.linkedin.android`, `in.mohalla.sharechat`, `com.google.android.youtube`, `in.startv.hotstar`, `com.netflix.mediaclient`, `com.mxtech.videoplayer.ad`, `com.whatsapp`, `org.telegram.messenger`, `com.google.android.apps.messaging`, `com.phonepe.app`, `net.one97.paytm`, `com.google.android.apps.nbu.paisa.user`, `com.flipkart.android`, `in.swiggy.android`, `com.application.zomato`, `in.amazon.mShop.android.shopping`, `com.unacademyapp`, `xyz.penpencil.physicswala`, `com.byjus.thelearningapp`, `com.google.android.apps.docs`, `com.google.android.apps.classroom`, `com.duolingo`.
   - **Removed invalid package:** `com.jio.media.ondemand` (returned HTTP 404 from Google Play Store).
2. **Implementation & Tests:**
   - `src/lib/appCategory.ts` created with 7 categories, explicit override mapping, OS category fallback, and 7-day average calculation.
   - `src/lib/appCategory.test.ts` added with 7 unit tests covering override precedence, OS categories fallback, undefined handling, aggregation, and rolling averages.
   - All 101 tests pass (`npm test`).
3. **Native Module Updates & Rebuild:**
   - `UsageStatsModule.kt` updated to extract `category` from `pm.getApplicationInfo()` and return `app`, `pkg`, `category`, and `minutes` with a limit parameter up to 50 apps.
   - TypeScript interface updated in `modules/usage-stats/src/UsageStatsModule.ts`.
   - Built with OpenJDK 17 and installed debug APK on `emulator-5554`.
4. **State Schema & UI:**
   - Added `phoneDays: { date: string; minutes: Record<string, number> }[]` (retaining 30 days) to `State` in `schema.ts` and `store.ts`.
   - Profile → Mood (`src/app/profile/mood.tsx`) renders the `Categories` breakdown with SVG sketch pattern fills (cross-hatch, diagonal hatch, dots, rule stripes, solid ink), yesterday's minutes, and 7-day rolling average per category.
5. **Screenshots Captured on Emulator:**
   - Light mode: `docs/screens/M10/01_categories_light.png`
   - Dark mode: `docs/screens/M10/02_categories_dark.png`
6. **Verification:**
   - `bash scripts/verify.sh` passes 12/12 checks.
   - Privacy guarantee verified: `insightSignals` in `src/lib/insights.ts` passes only scalar `phoneMin`. Per-app and per-category usage strictly stays on-device.

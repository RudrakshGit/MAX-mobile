// Groups apps into 7 student-relevant buckets for local screen-time insights.
// Pure logic: never touches network, never logs, runs entirely on-device.

export type PhoneCategory =
  | "social"
  | "video"
  | "games"
  | "messaging"
  | "study"
  | "payments"
  | "other";

export const CATEGORY_LABELS: Record<PhoneCategory, string> = {
  social: "Social",
  video: "Video & OTT",
  games: "Games",
  messaging: "Messaging",
  study: "Study & productivity",
  payments: "Payments & shopping",
  other: "Other",
};

// Verified against Google Play Store (200 OK) on 2026-10-13.
// Removed com.jio.media.ondemand (404 on Play Store).
const OVERRIDES: Record<string, PhoneCategory> = {
  // Social
  "com.instagram.android": "social",
  "com.facebook.katana": "social",
  "com.snapchat.android": "social",
  "com.twitter.android": "social",
  "com.linkedin.android": "social",
  "in.mohalla.sharechat": "social",

  // Video & OTT
  "com.google.android.youtube": "video",
  "in.startv.hotstar": "video",
  "com.netflix.mediaclient": "video",
  "com.mxtech.videoplayer.ad": "video",

  // Messaging
  "com.whatsapp": "messaging",
  "org.telegram.messenger": "messaging",
  "com.google.android.apps.messaging": "messaging",

  // Payments & shopping
  "com.phonepe.app": "payments",
  "net.one97.paytm": "payments",
  "com.google.android.apps.nbu.paisa.user": "payments",
  "com.flipkart.android": "payments",
  "in.swiggy.android": "payments",
  "com.application.zomato": "payments",
  "in.amazon.mShop.android.shopping": "payments",

  // Study & productivity
  "com.unacademyapp": "study",
  "xyz.penpencil.physicswala": "study",
  "com.byjus.thelearningapp": "study",
  "com.google.android.apps.docs": "study",
  "com.google.android.apps.classroom": "study",
  "com.duolingo": "study",
};

/**
 * Categorises an app by package name first (using curated Indian overrides),
 * then by Android OS category constant name, defaulting to "other".
 */
export function categoriseApp(pkg: string, osCategory = "undefined"): PhoneCategory {
  const override = OVERRIDES[pkg];
  if (override) return override;

  switch (osCategory) {
    case "social":
      return "social";
    case "video":
    case "audio":
      return "video";
    case "game":
      return "games";
    case "productivity":
      return "study";
    default:
      return "other";
  }
}

export function emptyCategoryTotals(): Record<PhoneCategory, number> {
  return {
    social: 0,
    video: 0,
    games: 0,
    messaging: 0,
    study: 0,
    payments: 0,
    other: 0,
  };
}

/**
 * Aggregates app foreground minutes by PhoneCategory.
 */
export function byCategory(
  apps: { pkg: string; category?: string; minutes: number }[]
): Record<PhoneCategory, number> {
  const totals = emptyCategoryTotals();
  for (const app of apps) {
    const cat = categoriseApp(app.pkg, app.category);
    totals[cat] = Math.round((totals[cat] + (app.minutes || 0)) * 10) / 10;
  }
  return totals;
}

/**
 * Computes 7-day average minutes per category across recorded phoneDays in the window.
 */
export function sevenDayCategoryAverage(
  phoneDays: { date: string; minutes: Record<string, number> }[],
  weekDates: string[]
): Record<PhoneCategory, number> {
  const totals = emptyCategoryTotals();
  const weekSet = new Set(weekDates);
  const daysInWeek = phoneDays.filter((d) => weekSet.has(d.date));

  if (daysInWeek.length === 0) return totals;

  for (const day of daysInWeek) {
    for (const [cat, mins] of Object.entries(day.minutes)) {
      if (cat in totals && typeof mins === "number" && Number.isFinite(mins)) {
        totals[cat as PhoneCategory] += mins;
      }
    }
  }

  const count = daysInWeek.length;
  for (const key of Object.keys(totals) as PhoneCategory[]) {
    totals[key] = Math.round((totals[key] / count) * 10) / 10;
  }
  return totals;
}

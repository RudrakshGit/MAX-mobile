import { Platform } from "react-native";
import UsageStats from "../../modules/usage-stats/src/UsageStatsModule";
import {
  byCategory,
  sevenDayCategoryAverage,
  emptyCategoryTotals,
  categoriseApp,
  CATEGORY_LABELS,
  type PhoneCategory,
} from "./appCategory";
import { lastNight, windows } from "./screen-time";
import { analyse } from "./usage-math";
import { update, type PhoneDay } from "./store";

// Only in the MAX APK on Android. Expo Go and iPhone get null and hide the feature.
export const usageSupported = Platform.OS === "android" && !!UsageStats;
export const hasUsageAccess = () => !!UsageStats?.hasAccess();
export const openUsageSettings = () => UsageStats?.openSettings();

export {
  byCategory,
  sevenDayCategoryAverage,
  emptyCategoryTotals,
  CATEGORY_LABELS,
  type PhoneCategory,
};

export type AppUsage = { app: string; pkg: string; category: string; group: PhoneCategory; minutes: number };

export type DayReport = {
  date: string;
  /** true for "today so far" */
  partial: boolean;
  screenOnMin: number;
  pickups: number;
  longestMin: number;
  nightMin: number;
  hourly: number[];
  /** apps a student would recognise (no launcher, no system parts), most used first */
  apps: AppUsage[];
  categories: Record<PhoneCategory, number>;
};

export type Measured = {
  sleepAt: number | null;
  beforeSleep: number | null;
  yesterday: number;
  topApps: AppUsage[];
  categories: Record<PhoneCategory, number>;
};

const LOOKBACK = 3 * 3600e3; // to know what was on screen when the window starts
const dateKey = (ms: number) => {
  const d = new Date(ms);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

/** Phone use for yesterday (whole day) or today so far, measured on this phone. */
export async function readDay(which: "yesterday" | "today", now = new Date()): Promise<DayReport | null> {
  if (!UsageStats || !UsageStats.hasAccess() || !UsageStats.appEvents) return null;
  const w = windows(now);
  const from = which === "yesterday" ? w.dayStart : w.dayEnd;
  const to = which === "yesterday" ? w.dayEnd : w.dayEnd + 24 * 3600e3;
  const { ev, pkgs } = await UsageStats.appEvents(from - LOOKBACK, Math.min(to, w.now));
  const u = analyse(ev, from, to, w.now);

  const apps: AppUsage[] = [];
  for (const [idx, minutes] of u.appMin) {
    const meta = pkgs[idx];
    if (!meta || meta.home || meta.self || !meta.launchable || minutes < 0.5) continue;
    apps.push({ app: meta.app, pkg: meta.pkg, category: meta.category, group: categoriseApp(meta.pkg, meta.category), minutes });
  }
  apps.sort((a, b) => b.minutes - a.minutes);

  const report: DayReport = {
    date: dateKey(from),
    partial: which === "today",
    screenOnMin: u.screenOnMin,
    pickups: u.pickups,
    longestMin: u.longestMin,
    nightMin: u.nightMin,
    hourly: u.hourly,
    apps,
    categories: byCategory(apps),
  };
  if (which === "yesterday") recordPhoneDay(report);
  return report;
}

/** Keeps a 30-day history of finished days for the trend chart and averages (on this phone only). */
export function recordPhoneDay(r: DayReport) {
  update((s) => ({
    phoneDays: [
      ...s.phoneDays.filter((d) => d.date !== r.date),
      { date: r.date, minutes: r.categories, screenOn: r.screenOnMin, pickups: r.pickups, v: 2 } satisfies PhoneDay,
    ]
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-30),
  }));
}

/** Days measured with the corrected method (earlier entries overcounted and are ignored). */
export const goodDays = (days: PhoneDay[]) => days.filter((d) => d.v === 2);

/** Summary used by Home and the check-in: last night's sleep time and yesterday's totals. */
export async function measure(now = new Date()): Promise<Measured | null> {
  if (!UsageStats || !UsageStats.hasAccess()) return null;
  const w = windows(now);
  const [ev, day] = await Promise.all([UsageStats.screenEvents(w.dayStart, w.now), readDay("yesterday", now)]);
  const night = lastNight(ev, now);
  return {
    ...night,
    yesterday: day?.screenOnMin ?? night.yesterday,
    topApps: day?.apps.slice(0, 5) ?? [],
    categories: day?.categories ?? emptyCategoryTotals(),
  };
}

export const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${Math.round(min % 60)} min` : `${Math.round(min)} min`);

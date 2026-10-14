import { Platform } from "react-native";
import UsageStats from "../../modules/usage-stats/src/UsageStatsModule";
import {
  byCategory,
  sevenDayCategoryAverage,
  emptyCategoryTotals,
  CATEGORY_LABELS,
  type PhoneCategory,
} from "./appCategory";
import { lastNight, windows } from "./screen-time";
import { update } from "./store";

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

export type AppUsage = { app: string; pkg: string; category: string; minutes: number };
export type Measured = {
  sleepAt: number | null;
  beforeSleep: number | null;
  yesterday: number;
  topApps: AppUsage[];
  categories: Record<PhoneCategory, number>;
};

export function recordPhoneDay(date: string, categories: Record<PhoneCategory, number>) {
  update((s) => {
    const existing = s.phoneDays.filter((d) => d.date !== date);
    return {
      ...s,
      phoneDays: [...existing, { date, minutes: categories }].slice(-30),
    };
  });
}

export async function measure(now = new Date()): Promise<Measured | null> {
  if (!UsageStats || !UsageStats.hasAccess()) return null;
  const w = windows(now);
  const [ev, allApps] = await Promise.all([
    UsageStats.screenEvents(w.dayStart, w.now),
    UsageStats.topApps(w.dayStart, w.dayEnd, 50),
  ]);
  const categories = byCategory(allApps);
  const yd = new Date(w.dayStart);
  const yesterdayDate = `${yd.getFullYear()}-${String(yd.getMonth() + 1).padStart(2, "0")}-${String(yd.getDate()).padStart(2, "0")}`;
  recordPhoneDay(yesterdayDate, categories);

  const topApps = allApps.slice(0, 5);
  return { ...lastNight(ev, now), topApps, categories };
}

export const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${Math.round(min % 60)} min` : `${Math.round(min)} min`);

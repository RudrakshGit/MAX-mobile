import { Platform } from "react-native";
import UsageStats from "../../modules/usage-stats/src/UsageStatsModule";
import { lastNight, windows } from "./screen-time";

// Only in the MAX APK on Android. Expo Go and iPhone get null and hide the feature.
export const usageSupported = Platform.OS === "android" && !!UsageStats;
export const hasUsageAccess = () => !!UsageStats?.hasAccess();
export const openUsageSettings = () => UsageStats?.openSettings();

export type Measured = { sleepAt: number | null; beforeSleep: number | null; yesterday: number; topApps: { app: string; minutes: number }[] };

export async function measure(now = new Date()): Promise<Measured | null> {
  if (!UsageStats || !UsageStats.hasAccess()) return null;
  const w = windows(now);
  const [ev, topApps] = await Promise.all([UsageStats.screenEvents(w.dayStart, w.now), UsageStats.topApps(w.dayStart, w.dayEnd, 3)]);
  return { ...lastNight(ev, now), topApps };
}

export const hm = (min: number) => (min >= 60 ? `${Math.floor(min / 60)} h ${Math.round(min % 60)} min` : `${Math.round(min)} min`);

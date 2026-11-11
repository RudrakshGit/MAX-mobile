import { NativeModule, requireOptionalNativeModule } from "expo";

export type AppMeta = { pkg: string; app: string; category: string; home: boolean; launchable: boolean; self: boolean };

declare class UsageStatsModule extends NativeModule<{}> {
  hasAccess(): boolean;
  openSettings(): void;
  screenEvents(start: number, end: number): Promise<[number, number][]>;
  appEvents(start: number, end: number): Promise<{ ev: number[]; pkgs: AppMeta[] }>;
  topApps(start: number, end: number, limit: number): Promise<{ app: string; pkg: string; category: string; minutes: number }[]>;
}

// Null in Expo Go and on iOS: the feature simply doesn't show there.
export default requireOptionalNativeModule<UsageStatsModule>("UsageStats");

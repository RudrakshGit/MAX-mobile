import { NativeModule, requireOptionalNativeModule } from "expo";

declare class UsageStatsModule extends NativeModule<{}> {
  hasAccess(): boolean;
  openSettings(): void;
  screenEvents(start: number, end: number): Promise<[number, number][]>;
  topApps(start: number, end: number, limit: number): Promise<{ app: string; minutes: number }[]>;
}

// Null in Expo Go and on iOS: the feature simply doesn't show there.
export default requireOptionalNativeModule<UsageStatsModule>("UsageStats");

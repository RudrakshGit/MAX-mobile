import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { patterns } from "./insights";
import type { State } from "./store";

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: false, shouldSetBadge: false }),
});

const at = (hhmm: string, minus = 0) => {
  const [h, m] = hhmm.split(":").map(Number);
  const total = (h * 60 + m - minus + 1440) % 1440;
  return { hour: Math.floor(total / 60), minute: total % 60 };
};

/**
 * Rebuilds both daily reminders from settings. Wording stays neutral on the
 * lock screen: nothing in a notification says "mental health".
 * Returns false if the student declined notification permission.
 */
export async function applyReminders(s: Pick<State, "remindAt" | "bedtime" | "checkins">): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!s.remindAt && !s.bedtime) return true;
  const perm = await Notifications.requestPermissionsAsync();
  if (!perm.granted) return false;
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("gentle", { name: "Gentle reminders", importance: Notifications.AndroidImportance.DEFAULT });
  }
  const daily = (hhmm: string, minus = 0) => ({ type: Notifications.SchedulableTriggerInputTypes.DAILY as const, channelId: "gentle", ...at(hhmm, minus) });

  if (s.remindAt) {
    await Notifications.scheduleNotificationAsync({ content: { title: "How was today?", body: "Four taps to check in with yourself." }, trigger: daily(s.remindAt) });
  }
  if (s.bedtime) {
    // Use the student's own pattern when we have one: it's more persuasive than advice.
    const own = patterns(s.checkins).find((p) => p.includes("phone before bed"));
    const body = own ? `${own} Phone down in 15?` : "Bedtime in 45 minutes. A good moment to put the phone away and wind down.";
    await Notifications.scheduleNotificationAsync({ content: { title: "Time to wind down", body }, trigger: daily(s.bedtime, 45) });
  }
  return true;
}

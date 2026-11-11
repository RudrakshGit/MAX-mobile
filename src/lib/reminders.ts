import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { planReminders } from "./reminder-plan";
import { getState } from "./store";
import { isWeb } from "./platform";

// Schedules the week's reminders from reminder-plan.ts as one-shot notifications, so a day the student has
// already checked in can be skipped. Re-run on every app open and after each check-in.

export const REMINDER_CHANNEL = "reminders";
export const TIMER_CHANNEL = "timer";
const PREFIX = "max-r-";

// Everything MAX notifies about is shown inside the app too, so nothing pops up while it's open.
if (!isWeb) Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: false, shouldShowList: false, shouldPlaySound: false, shouldSetBadge: false }),
});

let channelsReady: Promise<void> | null = null;
/** Channel settings can't change once created on Android, hence new ids instead of the old "gentle" one. */
export function ensureChannels() {
  if (Platform.OS !== "android") return Promise.resolve();
  channelsReady ??= (async () => {
    // Android ignores a lock-screen visibility set by the app on a channel (checked on Android 16: it stays
    // "no override"), so lock-screen privacy comes from the neutral wording in reminder-plan.ts.
    const quiet = { showBadge: false };
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNEL, {
      name: "Reminders",
      description: "At most one a day: check-in, wind-down, or the evening before an exam",
      importance: Notifications.AndroidImportance.DEFAULT,
      ...quiet,
    });
    await Notifications.setNotificationChannelAsync(TIMER_CHANNEL, {
      name: "Focus timer",
      description: "When a focus session you started ends",
      importance: Notifications.AndroidImportance.DEFAULT,
      ...quiet,
    });
    await Notifications.deleteNotificationChannelAsync("gentle").catch(() => {});
  })().catch(() => {
    channelsReady = null;
  });
  return channelsReady;
}

export type NotifyStatus = "on" | "ask" | "denied" | "channel-off";

export async function notifyStatus(): Promise<NotifyStatus> {
  if (isWeb) return "denied";
  const p = await Notifications.getPermissionsAsync();
  if (!p.granted) return p.canAskAgain ? "ask" : "denied";
  if (Platform.OS === "android") {
    const ch = await Notifications.getNotificationChannelAsync(REMINDER_CHANNEL).catch(() => null);
    if (ch && ch.importance === Notifications.AndroidImportance.NONE) return "channel-off";
  }
  return "on";
}

/** Asks for notification permission (Android 13+ shows the prompt only once a channel exists). */
export async function askPermission(): Promise<boolean> {
  if (isWeb) return false;
  await ensureChannels();
  const p = await Notifications.getPermissionsAsync();
  if (p.granted) return true;
  if (!p.canAskAgain) return false;
  return (await Notifications.requestPermissionsAsync()).granted;
}

let queue: Promise<void> = Promise.resolve();
/** Rebuilds the scheduled reminders from the current state. Never asks for permission itself. */
export function refreshReminders(): Promise<void> {
  queue = queue.then(rebuild).catch(() => {});
  return queue;
}

async function rebuild() {
  if (isWeb) return;
  const s = getState();
  const planned = s.onboarded ? planReminders(s, new Date()) : [];
  const old = await Notifications.getAllScheduledNotificationsAsync();
  // only our reminders: a running focus-session notification stays
  await Promise.all(old.filter((n) => n.identifier.startsWith(PREFIX)).map((n) => Notifications.cancelScheduledNotificationAsync(n.identifier)));
  if (!planned.length || !(await Notifications.getPermissionsAsync()).granted) return;
  await ensureChannels();
  for (const p of planned) {
    await Notifications.scheduleNotificationAsync({
      identifier: PREFIX + p.id,
      content: { title: p.title, body: p.body, data: { url: p.url } },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: new Date(p.at), channelId: REMINDER_CHANNEL },
    });
  }
}

export const cancelReminders = () => (isWeb ? Promise.resolve() : Notifications.cancelAllScheduledNotificationsAsync().catch(() => {}));

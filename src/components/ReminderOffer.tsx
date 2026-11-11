import React, { useEffect, useState } from "react";
import { View } from "react-native";
import { askPermission, notifyStatus, refreshReminders } from "@/lib/reminders";
import { update, useStore } from "@/lib/store";
import { space } from "@/lib/theme";
import { Button, T } from "@/lib/ui";

/** Evening times offered here match the choices in Settings → Reminders. */
function offerTime(now: Date) {
  const m = now.getHours() * 60 + now.getMinutes();
  return m >= 19 * 60 + 30 && m < 22 * 60 + 30 ? `${String(Math.round(m / 60)).padStart(2, "0")}:00` : "21:00";
}

/**
 * Asked once, right after a check-in, instead of a permission prompt on first launch: the student has just seen
 * what a check-in is, so the question makes sense. Either answer hides it; Settings can change it later.
 * Also shown when reminders are on (e.g. restored from a backup on a new phone) but this phone hasn't allowed
 * notifications yet.
 */
export function ReminderOffer() {
  const asked = useStore((s) => s.reminders.asked);
  const mode = useStore((s) => s.reminders.mode);
  const [note, setNote] = useState("");
  const [needsAllow, setNeedsAllow] = useState(false);
  const [busy, setBusy] = useState(false);
  // a "no" in Android's own prompt switches reminders off, so MAX doesn't ask again
  const permit = async () => {
    setBusy(true);
    const ok = await askPermission().catch(() => false);
    if (!ok) update((s) => ({ reminders: { ...s.reminders, mode: "off", asked: true } }));
    await refreshReminders();
    setNeedsAllow(false);
    setBusy(false);
    return ok;
  };
  useEffect(() => {
    if (mode === "off") return setNeedsAllow(false);
    notifyStatus().then((s) => setNeedsAllow(s === "ask"), () => {});
  }, [mode]);
  if (note) return <T v="small" soft>{note}</T>;
  if (busy) return null;
  if (needsAllow) {
    const allow = async () => {
      const ok = await permit();
      setNote(ok ? "Reminders will reach you on this phone now." : "No reminders for now. You can turn them on in Settings → Reminders.");
    };
    return (
      <View style={{ gap: space.sm, paddingTop: space.sm }}>
        <T>Your evening reminder is on, but this phone hasn't allowed notifications yet.</T>
        <Button kind="secondary" label="Allow notifications" onPress={allow} />
      </View>
    );
  }
  if (asked || mode !== "off") return null;

  const time = offerTime(new Date());
  const label = new Date(2000, 0, 1, Number(time.slice(0, 2))).toLocaleTimeString("en-IN", { hour: "numeric" });
  const yes = async () => {
    update((s) => ({ remindAt: time, reminders: { ...s.reminders, mode: "smart", asked: true } }));
    const ok = await permit();
    setNote(
      ok
        ? `Done. MAX will remind you around ${label} on days you haven't checked in. Change it any time in Settings → Reminders.`
        : "Notifications are off for MAX, so no reminders for now. You can turn them on in Settings → Reminders.",
    );
  };
  const no = () => update((s) => ({ reminders: { ...s.reminders, asked: true } }));

  return (
    <View style={{ gap: space.sm, paddingTop: space.sm }}>
      <T>Want a gentle reminder in the evenings?</T>
      <T v="small" soft>One a day at most, and none on days you've already checked in.</T>
      <Button kind="secondary" label={`Yes, around ${label}`} onPress={yes} />
      <Button kind="quiet" label="No thanks" onPress={no} />
    </View>
  );
}

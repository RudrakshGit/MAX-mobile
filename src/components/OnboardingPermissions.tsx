import React, { useEffect, useState } from "react";
import { AppState, Linking, PermissionsAndroid, Platform, View } from "react-native";
import { ensureMicPermission } from "@/features/voice/recorder";
import { hasUsageAccess, openUsageSettings, usageSupported } from "@/lib/device-usage";
import { askPermission, notifyStatus, refreshReminders } from "@/lib/reminders";
import { update } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, T } from "@/lib/ui";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";

// Onboarding: the phone permissions MAX's features use, asked up front with one line on why. Every one is optional
// and the feature still asks at the moment it's used if it was skipped here. Nothing else needs a prompt: app lock
// uses the phone's own screen lock, and songs are picked through Android's file picker.

type Status = "ask" | "on" | "blocked";

export function OnboardingPermissions() {
  const [notify, setNotify] = useState<Status>("ask");
  const [mic, setMic] = useState<Status>("ask");
  const [usage, setUsage] = useState<Status>(hasUsageAccess() ? "on" : "ask");

  const check = () => {
    notifyStatus().then((s) => setNotify(s === "on" ? "on" : s === "ask" ? "ask" : "blocked"), () => {});
    if (Platform.OS === "android") PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.RECORD_AUDIO).then((ok) => ok && setMic("on"), () => {});
    setUsage(hasUsageAccess() ? "on" : "ask");
  };
  // usage access and "blocked" ones are switched on in Android's own screens; re-check on the way back
  useEffect(() => {
    check();
    const sub = AppState.addEventListener("change", (s) => s === "active" && check());
    return () => sub.remove();
  }, []);

  const allowNotify = async () => {
    // same as saying yes to the reminder offer on Today: an evening nudge on days without a check-in
    update((s) => ({ remindAt: s.remindAt ?? "21:00", reminders: { ...s.reminders, mode: "smart", asked: true } }));
    const ok = await askPermission().catch(() => false);
    if (!ok) update((s) => ({ reminders: { ...s.reminders, mode: "off", asked: true } }));
    await refreshReminders();
    check();
    if (!ok) setNotify("blocked");
  };
  const allowMic = async () => setMic((await ensureMicPermission()) ? "on" : "blocked");

  return (
    <View style={{ gap: space.md }}>
      <Item
        icon="calendar"
        title="Notifications"
        why="A gentle evening reminder on days you haven't checked in (9 pm, change it in Settings)."
        status={notify}
        onAllow={allowNotify}
      />
      <Item icon="mic" title="Microphone" why="Voice notes in your journal. Only records when you tap record." status={mic} onAllow={allowMic} />
      {usageSupported ? (
        <Item
          icon="smartphone"
          title="Usage access"
          why="Measures your phone use, like scrolling before sleep, on this phone only. Opens Android settings: find MAX and switch it on."
          status={usage}
          onAllow={openUsageSettings}
        />
      ) : null}
    </View>
  );
}

function Item({ icon, title, why, status, onAllow }: { icon: DoodleIconName; title: string; why: string; status: Status; onAllow: () => void }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
      <DoodleIcon name={icon} size={22} color={t.ink} style={{ marginTop: 2 }} />
      <View style={{ flex: 1, gap: space.xs }}>
        <T v="heading">{title}</T>
        <T v="small" soft>{why}</T>
        {status === "on" ? (
          <View accessible accessibilityLabel={`${title} allowed`} style={{ flexDirection: "row", alignItems: "center", gap: 6, minHeight: 32 }}>
            <DoodleIcon name="check" size={16} color={t.ink} />
            <T style={{ fontWeight: "600" }}>Allowed</T>
          </View>
        ) : status === "blocked" ? (
          <>
            <T v="small" soft>Not allowed. You can switch it on in Android settings any time.</T>
            <Button kind="quiet" label="Open Android settings" onPress={() => void Linking.openSettings()} />
          </>
        ) : (
          <Button kind="secondary" label="Allow" onPress={onAllow} />
        )}
      </View>
    </View>
  );
}

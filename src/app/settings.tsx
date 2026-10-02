import { router } from "expo-router";
import { useEffect, useState } from "react";
import { Alert, AppState, Share, View } from "react-native";
import * as LocalAuthentication from "expo-local-authentication";
import { hasUsageAccess, openUsageSettings, usageSupported } from "@/lib/device-usage";
import Constants from "expo-constants";
import { applyReminders, cancelReminders } from "@/lib/reminders";
import { getState, resetAll, update, useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, Choice, Field, Page, Section, T } from "@/lib/ui";

export default function Settings() {
  const t = useTheme();
  const companion = useStore((s) => s.companion);
  const campus = useStore((s) => s.campus);
  const shareContext = useStore((s) => s.shareContext);
  const remindAt = useStore((s) => s.remindAt);
  const bedtime = useStore((s) => s.bedtime);
  const lock = useStore((s) => s.lock);
  const [note, setNote] = useState("");

  const setReminder = async (patch: { remindAt?: string; bedtime?: string }) => {
    update(() => patch);
    const ok = await applyReminders(getState()).catch(() => false);
    setNote(ok ? "" : "Notifications are off for MAX. Turn them on in Android settings to get reminders.");
  };

  const toggleLock = async () => {
    if (lock) return update(() => ({ lock: false }));
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    if (level === LocalAuthentication.SecurityLevel.NONE) return setNote("Set a screen lock (fingerprint, PIN or pattern) on your phone first.");
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: "Confirm to turn on app lock" });
    if (r.success) update(() => ({ lock: true }));
  };
  const [name, setName] = useState(companion);
  const [code, setCode] = useState(campus ?? "");
  const cleanName = name.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 20);
  const cleanCode = code.trim().toUpperCase();
  const codeOk = /^[A-Z0-9-]{2,20}$/.test(cleanCode);
  const [access, setAccess] = useState(hasUsageAccess());
  // Usage access is granted in a system screen; re-check when the student comes back.
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => s === "active" && setAccess(hasUsageAccess()));
    return () => sub.remove();
  }, []);

  const wipe = () =>
    Alert.alert("Delete everything?", "Check-ins, journal, chat, check-ups and tools will be erased from this phone. This can't be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete everything",
        style: "destructive",
        onPress: async () => {
          await cancelReminders();
          await resetAll();
          router.replace("/onboarding");
        },
      },
    ]);

  return (
    <Page>
      <Section title="Companion">
        <View style={{ gap: space.sm }}>
          <Field value={name} onChangeText={setName} maxLength={20} accessibilityLabel="Companion name" />
          <Button label="Save name" onPress={() => update(() => ({ companion: cleanName }))} disabled={!cleanName || cleanName === companion} />
        </View>
      </Section>

      <Section title="What your companion knows">
        <View style={{ gap: space.sm }}>
          <T soft>{`When on, ${companion} sees your last week's check-in averages, your latest check-up ranges and your if-then plans, so it can notice patterns and remind you of your own plans. It never sees your journal.`}</T>
          <Choice fill options={[{ label: "On", value: 1 }, { label: "Off", value: 0 }]} value={shareContext ? 1 : 0} onChange={(v) => update(() => ({ shareContext: v === 1 }))} />
        </View>
      </Section>

      <Section title="Reminders">
        <View style={{ gap: space.md }}>
          <View style={{ gap: space.sm }}>
            <T soft>Daily check-in</T>
            <Choice fill options={[{ label: "Off", value: "" }, { label: "8 pm", value: "20:00" }, { label: "9 pm", value: "21:00" }, { label: "10 pm", value: "22:00" }]} value={remindAt ?? ""} onChange={(v) => setReminder({ remindAt: v || undefined })} />
          </View>
          <View style={{ gap: space.sm }}>
            <T soft>Wind-down nudge, 45 minutes before your bedtime</T>
            <Choice fill options={[{ label: "Off", value: "" }, { label: "11 pm", value: "23:00" }, { label: "12 am", value: "00:00" }, { label: "1 am", value: "01:00" }]} value={bedtime ?? ""} onChange={(v) => setReminder({ bedtime: v || undefined })} />
          </View>
          {note ? <T v="small" style={{ color: t.help }}>{note}</T> : null}
        </View>
      </Section>

      <Section title="App lock">
        <View style={{ gap: space.sm }}>
          <T soft>Ask for your fingerprint or phone PIN when MAX opens. The Help button still works while locked.</T>
          <Choice fill options={[{ label: "On", value: 1 }, { label: "Off", value: 0 }]} value={lock ? 1 : 0} onChange={(v) => (v === 1) !== lock && toggleLock()} />
        </View>
      </Section>

      <Section title="Automatic screen time">
        <View style={{ gap: space.sm }}>
          {usageSupported ? (
            <>
              <T soft>MAX can read when your screen was on and which apps were open, to fill in “phone before sleep” and show yesterday's use. It never sees what's on screen, and this stays on your phone.</T>
              <T v="heading">{access ? "On" : "Off"}</T>
              <Button kind="quiet" icon="smartphone" label={access ? "Change in Android settings" : "Allow usage access"} onPress={openUsageSettings} />
              {access ? null : <T v="small" soft>In the list that opens, tap MAX and switch on “Permit usage access”.</T>}
            </>
          ) : (
            <T soft>Available in the MAX app for Android. It isn't available in Expo Go or on iPhone, so enter your phone time by hand.</T>
          )}
        </View>
      </Section>

      <Section title="Campus pulse">
        <View style={{ gap: space.sm }}>
          <T soft>Optional. If you add your college's code, each daily check-in also sends three numbers (mood, sleep, study pressure) with a random ID, never your name or anything you write. Your college only ever sees averages from 10 or more students.</T>
          <Field value={code} onChangeText={setCode} autoCapitalize="characters" placeholder="e.g. SVIIT" maxLength={20} accessibilityLabel="Campus code" />
          <Button label={campus ? "Update campus code" : "Join campus pulse"} onPress={() => update(() => ({ campus: cleanCode }))} disabled={!codeOk || cleanCode === campus} />
          {campus ? <Button kind="quiet" label="Stop sharing" onPress={() => { setCode(""); update(() => ({ campus: undefined })); }} /> : null}
        </View>
      </Section>

      <Section title="Your data">
        <View style={{ gap: space.sm }}>
          <T soft>Everything lives on this phone. Export a copy, or delete it all.</T>
          <Button kind="quiet" icon="download" label="Export my data" onPress={() => Share.share({ message: JSON.stringify(getState(), null, 2) })} />
          <Button kind="danger" icon="trash-2" label="Delete everything" onPress={wipe} />
        </View>
      </Section>
      <T v="small" soft style={{ marginTop: space.xl, textAlign: "center" }}>
        {`MAX ${Constants.expoConfig?.version ?? ""} · build ${Constants.expoConfig?.android?.versionCode ?? ""}`}
      </T>
    </Page>
  );
}

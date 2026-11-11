import React, { useEffect, useState } from "react";
import { AppState, Linking, Platform, View } from "react-native";
import { router } from "expo-router";
import * as LocalAuthentication from "expo-local-authentication";
import { showAlert } from "@/lib/dialog";
import { hasUsageAccess, openUsageSettings, usageSupported } from "@/lib/device-usage";
import { askPermission, cancelReminders, notifyStatus, refreshReminders, type NotifyStatus } from "@/lib/reminders";
import { checkinMinutes } from "@/lib/reminder-plan";
import { usualCheckinTime } from "@/lib/personal";
import { exportBackup, importBackup, wipeLocalFiles } from "@/lib/backup";
import { stopSound } from "@/features/sounds/player";
import { getState, resetAll, update, useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, Choice, Field, Section, T } from "@/lib/ui";
import { signOut } from "@/lib/cloud";
import { CollegeShare } from "@/components/CollegeShare";
import { leaveCollege } from "@/lib/college";
import { useFloatingMax, setFloatingMaxEnabled, triggerFloatingMaxDigExit } from "@/lib/max-store";
import { ThemeLamp, useThemeLamp } from "@/components/ThemeLamp";
import { TimeField } from "@/ui/sketch/Wheel";
import { isWeb, THIS_DEVICE } from "@/lib/platform";

// The pages behind Settings (owner, 11 Nov 2026: one topic per page instead of one long page).
// Each page is one of these; app/profile/settings/[section].tsx picks it by id.

const ONOFF = [
  { label: "On", value: 1 },
  { label: "Off", value: 0 },
];

export function CompanionSettings() {
  const companion = useStore((s) => s.companion);
  const shareContext = useStore((s) => s.shareContext);
  const floatingEnabled = useFloatingMax((s) => s.enabled);
  const [name, setName] = useState(companion);
  const cleanName = name.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 20);
  return (
    <>
      <Section title="Name">
        <View style={{ gap: space.sm }}>
          <Field value={name} onChangeText={setName} maxLength={20} accessibilityLabel="Companion name" />
          <Button label="Save name" onPress={() => update(() => ({ companion: cleanName }))} disabled={!cleanName || cleanName === companion} />
        </View>
      </Section>
      {isWeb ? null : <Section title={`Floating ${companion}`}>
        <View style={{ gap: space.sm }}>
          <T soft>{`${companion} on the other tabs. Drag to move, tap for shortcuts.`}</T>
          <Choice fill options={ONOFF} value={floatingEnabled ? 1 : 0} onChange={(v) => (v === 0 ? triggerFloatingMaxDigExit() : setFloatingMaxEnabled(true))} />
        </View>
      </Section>}
      <Section title={`What ${companion} knows`}>
        <View style={{ gap: space.sm }}>
          <T soft>Your check-in averages, check-up ranges, exams and plans, so replies fit your week. Never your journal.</T>
          <Choice fill options={ONOFF} value={shareContext ? 1 : 0} onChange={(v) => update(() => ({ shareContext: v === 1 }))} />
        </View>
      </Section>
    </>
  );
}

export function AiSettings() {
  const consents = useStore((s) => s.consents);
  return (
    <>
      <Section title="AI in the journal">
        <View style={{ gap: space.sm }}>
          <T soft>Sends an entry to the AI (Groq) for feeling tags and a short reflection.</T>
          <Choice fill options={ONOFF} value={consents.ai ? 1 : 0} onChange={(v) => update((s) => ({ consents: { ...s.consents, ai: v === 1 } }))} />
        </View>
      </Section>
      {isWeb ? null : <Section title="Voice to text">
        <View style={{ gap: space.sm }}>
          <T soft>Sends voice notes to the AI (Groq) to type them out. The recording stays on this phone.</T>
          <Choice fill options={ONOFF} value={consents.voice ? 1 : 0} onChange={(v) => update((s) => ({ consents: { ...s.consents, voice: v === 1 } }))} />
        </View>
      </Section>}
    </>
  );
}

export function ReminderSettings() {
  const t = useTheme();
  const remindAt = useStore((s) => s.remindAt);
  const bedtime = useStore((s) => s.bedtime);
  const reminders = useStore((s) => s.reminders);
  const checkins = useStore((s) => s.checkins);
  const hasExams = useStore((s) => s.exams.length > 0);
  const [notify, setNotify] = useState<NotifyStatus>("on");
  const [showHelp, setShowHelp] = useState(false);
  const checkNotify = () => notifyStatus().then(setNotify, () => {});
  const remindersOn = reminders.mode !== "off" || !!bedtime || (reminders.exams && hasExams);
  const usual = usualCheckinTime(checkins);
  const remindMin = checkinMinutes({ reminders, remindAt, checkins });
  useEffect(() => {
    checkNotify();
    const sub = AppState.addEventListener("change", (s) => s === "active" && checkNotify());
    return () => sub.remove();
  }, []);
  // after any change: ask only when something was switched on, then rebuild the week's reminders
  const afterChange = async (switchedOn: boolean) => {
    if (switchedOn) await askPermission().catch(() => false);
    await refreshReminders();
    checkNotify();
  };
  const setCheckinTime = (v: string) => {
    update((s) => ({
      ...(v ? { remindAt: v } : {}),
      reminders: { ...s.reminders, mode: !v ? "off" : s.reminders.mode === "off" ? "smart" : s.reminders.mode, asked: true },
    }));
    void afterChange(!!v);
  };
  const setBedtime = (v: string) => {
    update(() => ({ bedtime: v || undefined }));
    void afterChange(!!v);
  };
  const setPrefs = (patch: { mode?: "smart" | "fixed"; exams?: boolean }) => {
    update((s) => ({ reminders: { ...s.reminders, ...patch } }));
    void afterChange(patch.exams === true);
  };
  return (
    <>
      <T soft>At most one a day, never after you've checked in.</T>
      <Section title="Evening check-in">
        <View style={{ gap: space.sm }}>
          <Choice fill options={ONOFF} value={reminders.mode === "off" ? 0 : 1} onChange={(v) => setCheckinTime(v ? remindAt ?? "21:00" : "")} />
          {reminders.mode !== "off" ? (
            <>
              <TimeField label="Check-in reminder" value={remindAt ?? "21:00"} onChange={setCheckinTime} />
              <Choice
                fill
                options={[{ label: "Learn my time", value: "smart" as const }, { label: "Exactly then", value: "fixed" as const }]}
                value={reminders.mode}
                onChange={(mode) => setPrefs({ mode })}
              />
              <T v="small" soft>
                {reminders.mode === "fixed"
                  ? "Always at the time you picked."
                  : usual && remindMin != null
                  ? `You usually check in around ${clock(usual)}, so the reminder comes at ${clock(remindMin)}.`
                  : "Moves up to an hour toward when you usually check in."}
              </T>
            </>
          ) : null}
        </View>
      </Section>
      <Section title="Wind-down, an hour before bed">
        <View style={{ gap: space.sm }}>
          <Choice fill options={ONOFF} value={bedtime ? 1 : 0} onChange={(v) => setBedtime(v ? "23:00" : "")} />
          {bedtime ? <TimeField label="Bedtime" value={bedtime} onChange={setBedtime} /> : null}
        </View>
      </Section>
      <Section title="The evening before an exam">
        <View style={{ gap: space.sm }}>
          <Choice fill options={ONOFF} value={reminders.exams ? 1 : 0} onChange={(v) => setPrefs({ exams: v === 1 })} />
          <T v="small" soft>{hasExams ? "A brain-dump nudge." : "A brain-dump nudge. Add exams in Profile → Exams."}</T>
        </View>
      </Section>
      {remindersOn && notify !== "on" ? (
        <View style={{ gap: space.sm }}>
          <T style={{ color: t.help }}>
            {notify === "ask" ? "MAX needs your permission to send these reminders." : notify === "denied" ? "Notifications are turned off for MAX." : "MAX's reminders are switched off in Android settings."}
          </T>
          <Button
            kind="secondary"
            label={notify === "ask" ? "Allow notifications" : "Open Android settings"}
            onPress={() => (notify === "ask" ? afterChange(true) : Linking.openSettings().catch(() => {}))}
          />
        </View>
      ) : null}
      <Button kind="quiet" label={showHelp ? "Hide help" : "Not getting reminders?"} onPress={() => setShowHelp((v) => !v)} />
      {showHelp ? (
        <View style={{ gap: space.sm }}>
          <T soft>{batteryTip()}</T>
          <T v="small" soft>Also check that Do Not Disturb isn't hiding them.</T>
          <Button kind="secondary" icon="settings" label="Open MAX's app settings" onPress={() => Linking.openSettings().catch(() => {})} />
        </View>
      ) : null}
    </>
  );
}

export function AppearanceSettings() {
  const themePreference = useStore((s) => s.themePreference);
  const maxMotion = useStore((s) => s.maxMotion);
  const lamp = useThemeLamp();
  return (
    <>
      <Section title="Theme">
        <View style={{ gap: space.sm }}>
          <ThemeLamp tug={lamp.tug} lamp={lamp.lamp} bead={lamp.bead} />
          <Choice
            fill
            options={[
              { label: "System", value: "system" },
              { label: "Light", value: "light" },
              { label: "Dark", value: "dark" },
            ]}
            value={themePreference ?? "system"}
            // MAX tugs the lamp's cord, then the new theme spreads from the lamp
            onChange={(v) => lamp.pick(v as "system" | "light" | "dark")}
          />
        </View>
      </Section>
      <Section title="MAX moves">
        <Choice
          fill
          options={[
            { label: "Normal", value: "normal" },
            { label: "Calm", value: "calm" },
            { label: "Still", value: "still" },
          ]}
          value={maxMotion ?? "normal"}
          onChange={(v) => update(() => ({ maxMotion: v as "normal" | "calm" | "still" }))}
        />
      </Section>
    </>
  );
}

export function PrivacySettings() {
  const lock = useStore((s) => s.lock);
  const [note, setNote] = useState("");
  const [access, setAccess] = useState(hasUsageAccess());
  // usage access is granted in a system screen; re-check when the student comes back
  useEffect(() => {
    const sub = AppState.addEventListener("change", (s) => s === "active" && setAccess(hasUsageAccess()));
    return () => sub.remove();
  }, []);
  const toggleLock = async () => {
    if (lock) return update(() => ({ lock: false }));
    const level = await LocalAuthentication.getEnrolledLevelAsync();
    if (level === LocalAuthentication.SecurityLevel.NONE) return setNote("Set a screen lock (fingerprint, PIN or pattern) on your phone first.");
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: "Confirm to turn on app lock" });
    if (r.success) update(() => ({ lock: true }));
  };
  return (
    <>
      <Section title="App lock">
        <View style={{ gap: space.sm }}>
          <T soft>Fingerprint or PIN to open MAX. Help still works while locked.</T>
          <Choice fill options={ONOFF} value={lock ? 1 : 0} onChange={(v) => (setNote(""), (v === 1) !== lock && toggleLock())} />
          {note ? <T v="small">{note}</T> : null}
        </View>
      </Section>
      <Section title="Screen time">
        <View style={{ gap: space.sm }}>
          {usageSupported ? (
            <>
              <T soft>Fills in your phone use from Android. Stays on this phone; MAX never sees what's on screen.</T>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.xs }}>
                <T v="heading">{access ? "On" : "Off"}</T>
                <Button kind="quiet" icon="smartphone" label={access ? "Change in Android settings" : "Allow usage access"} onPress={openUsageSettings} />
              </View>
            </>
          ) : (
            <T soft>Only in the MAX app for Android. Enter phone time by hand here.</T>
          )}
        </View>
      </Section>
    </>
  );
}

export function CollegeSettings() {
  return (
    <Section title="Share stats with college">
      <CollegeShare />
    </Section>
  );
}

export function DataSettings() {
  const [wiping, setWiping] = useState(false);
  const wipe = () =>
    showAlert(
      "Delete everything?",
      `Check-ins, journal and voice recordings, chats, check-ups and tools will be erased from ${THIS_DEVICE}. This can't be undone.${
        getState().sync?.email ? " Your Google backup is kept; to delete it too, use Backup → Delete my account." : ""
      }`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete everything",
          style: "destructive",
          onPress: async () => {
            setWiping(true);
            await cancelReminders();
            try {
              stopSound();
            } catch {}
            // end this phone's session first, so the empty phone can't overwrite the backup
            if (getState().sync?.email) await signOut();
            // and take back what this phone shared with a college; say so if that didn't work (e.g. offline)
            const collegeLeft = getState().college ? await leaveCollege(true) : true;
            await wipeLocalFiles();
            await resetAll();
            router.replace("/onboarding");
            if (!collegeLeft) showAlert("College data not removed", "This phone is cleared, but MAX was offline, so what you shared with your college is still on the server.");
          },
        },
      ],
    );
  return (
    <View style={{ gap: space.sm }}>
      <T soft>{isWeb ? "Everything stays in this browser. Delete it all here." : "Everything stays on this phone. Export a copy (voice notes and songs aren't included), or delete it all."}</T>
      {isWeb ? null : <View style={{ flexDirection: "row", gap: space.sm }}>
        <View style={{ flex: 1 }}>
          <Button kind="quiet" icon="download" label="Export backup" onPress={exportBackup} />
        </View>
        <View style={{ flex: 1 }}>
          <Button
            kind="quiet"
            icon="upload"
            label="Import backup"
            onPress={async () => {
              if ((await importBackup()) === "imported") showAlert("Backup imported", "Your data has been restored.");
            }}
          />
        </View>
      </View>}
      <Button kind="danger" icon="trash-2" label={wiping ? "Deleting…" : "Delete everything"} onPress={wipe} disabled={wiping} />
    </View>
  );
}

const clock = (v: string | number) => {
  const m = typeof v === "number" ? v : Number(v.slice(0, 2)) * 60 + Number(v.slice(3));
  return new Date(2000, 0, 1, 0, m).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
};

/** Phone makers that stop background apps, and where their switch is (dontkillmyapp.com). */
function batteryTip() {
  const c = Platform.constants as { Manufacturer?: string; Brand?: string };
  const b = `${c.Manufacturer ?? ""} ${c.Brand ?? ""}`.toLowerCase();
  if (/xiaomi|redmi|poco/.test(b))
    return "On Xiaomi, Redmi and POCO phones: open MAX's app settings, turn on Autostart, and set Battery saver to \"No restrictions\". Locking MAX in recent apps (press and hold its card) also helps.";
  if (/oppo|realme|oneplus/.test(b)) return "On OPPO, realme and OnePlus phones: open MAX's app settings → Battery usage, and allow background activity and auto launch.";
  if (/vivo|iqoo/.test(b)) return "On vivo and iQOO phones: open Settings → Battery → Background power consumption management and allow MAX. Turn on Autostart for MAX too.";
  if (/samsung/.test(b)) return "On Samsung phones: open MAX's app settings → Battery and choose \"Unrestricted\". Also make sure MAX isn't in \"Sleeping apps\".";
  return "Open MAX's app settings → Battery and choose \"Unrestricted\" (or \"Don't optimise\").";
}

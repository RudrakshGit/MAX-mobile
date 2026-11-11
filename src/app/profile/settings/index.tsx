import React from "react";
import { Stack, router, type Href } from "expo-router";
import Constants from "expo-constants";
import { useStore } from "@/lib/store";
import { space } from "@/lib/theme";
import { openWebUrl, Page, Row, T } from "@/lib/ui";
import { DOWNLOAD_URL, isWeb } from "@/lib/platform";
import { clock12 } from "@/ui/sketch/Wheel";

// Settings is a short menu; each topic has its own page (owner, 11 Nov 2026).
export default function Settings() {
  const companion = useStore((s) => s.companion);
  const syncEmail = useStore((s) => s.sync?.email);
  const reminders = useStore((s) => s.reminders);
  const remindAt = useStore((s) => s.remindAt);
  const theme = useStore((s) => s.themePreference) ?? "system";
  const lock = useStore((s) => s.lock);
  const college = useStore((s) => s.college);
  const go = (section: string) => router.push(`/profile/settings/${section}` as Href);
  return (
    <Page>
      <Stack.Screen options={{ title: "Settings" }} />
      {/* on the web: only what works in a browser; backup, reminders, lock and college sharing are in the app */}
      {isWeb ? <Row icon="smartphone" title="Get the MAX app" sub="Reminders, backup, voice notes, no daily limit" onPress={() => openWebUrl(DOWNLOAD_URL)} /> : null}
      {isWeb ? null : <Row icon="cloud" title="Backup" sub={syncEmail ?? "Off"} onPress={() => router.push("/profile/account")} />}
      {/* the demo keeps only appearance and deleting its data (owner, 11 Nov 2026) */}
      {isWeb ? null : <Row icon="sparkles" title={companion} sub="Name, floating companion, what it knows" onPress={() => go("companion")} />}
      {isWeb ? null : <Row icon="pen" title="AI features" sub="Journal reflections, voice to text" onPress={() => go("ai")} />}
      {isWeb ? null : <Row icon="calendar" title="Reminders" sub={reminders.mode === "off" ? "Off" : `Check-in at ${clock12(remindAt ?? "21:00")}`} onPress={() => go("reminders")} />}
      <Row icon="sun" title="Appearance" sub={theme === "system" ? (isWeb ? "Same as device" : "Same as phone") : theme === "dark" ? "Dark" : "Light"} onPress={() => go("appearance")} />
      {isWeb ? null : <Row icon="lock" title="Privacy & lock" sub={lock ? "App lock on" : "App lock, screen time"} onPress={() => go("privacy")} />}
      {isWeb ? null : <Row icon="users" title="Share stats with college" sub={college ? college.name : "Off"} onPress={() => go("college")} />}
      <Row icon="download" title="Your data" sub={isWeb ? "Delete what's in this browser" : "Export, import, delete"} onPress={() => go("data")} last />
      <T v="small" soft style={{ marginTop: space.xl, textAlign: "center" }}>
        {isWeb ? `MAX ${Constants.expoConfig?.version ?? ""} on the web` : `MAX ${Constants.expoConfig?.version ?? ""} · build ${Constants.expoConfig?.android?.versionCode ?? ""}`}
      </T>
    </Page>
  );
}

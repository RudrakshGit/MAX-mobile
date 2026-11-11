import React from "react";
import { View } from "react-native";
import { Redirect, Stack, useLocalSearchParams } from "expo-router";
import { useStore } from "@/lib/store";
import { isWeb } from "@/lib/platform";
import { space } from "@/lib/theme";
import { Page } from "@/lib/ui";
import { AiSettings, AppearanceSettings, CollegeSettings, CompanionSettings, DataSettings, PrivacySettings, ReminderSettings } from "@/components/settings/sections";

const PAGES = {
  companion: { title: "", body: CompanionSettings },
  ai: { title: "AI features", body: AiSettings },
  reminders: { title: "Reminders", body: ReminderSettings },
  appearance: { title: "Appearance", body: AppearanceSettings },
  privacy: { title: "Privacy & lock", body: PrivacySettings },
  college: { title: "College", body: CollegeSettings },
  data: { title: "Your data", body: DataSettings },
} as const;

export default function SettingsPage() {
  const { section } = useLocalSearchParams<{ section: string }>();
  const companion = useStore((s) => s.companion);
  const page = PAGES[section as keyof typeof PAGES];
  // the app-only pages aren't on the web (see lib/platform.ts)
  if (!page || (isWeb && section !== "appearance" && section !== "data")) return <Redirect href="/profile/settings" />;
  const Body = page.body;
  return (
    <Page>
      <Stack.Screen options={{ title: page.title || companion }} />
      <View style={{ gap: space.md }}>
        <Body />
      </View>
    </Page>
  );
}

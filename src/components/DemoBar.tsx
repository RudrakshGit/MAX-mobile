import React from "react";
import { Pressable, View } from "react-native";
import { DOWNLOAD_URL } from "@/lib/platform";
import { space, useTheme } from "@/lib/theme";
import { openWebUrl, T } from "@/lib/ui";

// On the web the app is a demo (owner, 11 Nov 2026). The website's /try page already says so around it; opened on
// its own (max-companion.expo.app), this bar says it instead.
const framed = (() => {
  try {
    return typeof window !== "undefined" && window.self !== window.top;
  } catch {
    return true; // a cross-origin parent: we're inside the website's demo page
  }
})();

export function DemoBar() {
  const t = useTheme();
  if (framed) return null;
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: space.sm, paddingHorizontal: space.md, paddingVertical: 6, backgroundColor: t.tint.exam }}>
      <T v="small" style={{ flex: 1, color: t.characterInk }}>Demo · data stays in this browser</T>
      <Pressable accessibilityRole="link" onPress={() => openWebUrl(DOWNLOAD_URL)} hitSlop={8}>
        <T v="small" style={{ fontWeight: "600", textDecorationLine: "underline", color: t.characterInk }}>Get the app</T>
      </Pressable>
    </View>
  );
}

import React from "react";
import { Pressable, View } from "react-native";
import { Stack } from "expo-router";
import { instruments } from "@/content/instruments";
import { radius, space, useTheme } from "@/lib/theme";
import { Page, Section, T, openWebUrl } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";

export default function TestsAbout() {
  const t = useTheme();

  const openScience = async (url: string) => {
    if (url) {
      await openWebUrl(url);
    }
  };

  return (
    <Page>
      <Stack.Screen options={{ title: "About tests" }} />
      <View style={{ gap: space.md }}>
        <T v="title">Evidence & Licences</T>
        <T soft>
          MAX uses validated scientific scales to provide objective self-reflection ranges. These check-ups do not provide a medical diagnosis or clinical evaluation.
        </T>

        <Section title="Validated Instruments">
          {instruments.map((inst) => (
            <View
              key={inst.id}
              style={{
                gap: 4,
                paddingVertical: space.sm,
                borderBottomWidth: 1,
                borderBottomColor: t.rule,
              }}>
              <T v="heading">{inst.title}</T>
              <T soft v="small">{inst.source}</T>
              <T soft v="small">{`Licence: ${inst.licence}`}</T>
              {inst.scienceUrl ? (
                <Pressable
                  accessibilityRole="button"
                  onPress={() => openScience(inst.scienceUrl)}
                  style={{ flexDirection: "row", alignItems: "center", gap: 4, marginTop: 4 }}>
                  <DoodleIcon name="book" size={14} color={t.ink} />
                  <T v="small" style={{ textDecorationLine: "underline" }}>Read source paper</T>
                </Pressable>
              ) : null}
            </View>
          ))}
        </Section>

        <Section title="Clinical Safety Invariant">
          <T soft>
            Any expression of acute distress or suicidal ideation automatically presents immediate, confidential national helpline conduits (such as Tele-MANAS 14416 and National Emergency 112) prior to any scoring or conversation.
          </T>
        </Section>
      </View>
    </Page>
  );
}

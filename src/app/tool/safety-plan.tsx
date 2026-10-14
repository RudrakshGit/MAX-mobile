import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { update, useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, Field, Page, Section, T, call } from "@/lib/ui";

const DEFAULT_PROFESSIONALS =
  "Tele-MANAS (14416 / 1-800-891-4416) · Free, 24×7\nVandrevala Foundation (9999-666-555)\nNational Emergency: 112";

export default function SafetyPlanScreen() {
  const t = useTheme();
  const existing = useStore((s) => s.safetyPlan);

  const [warningSigns, setWarningSigns] = useState(existing?.warningSigns ?? "");
  const [coping, setCoping] = useState(existing?.coping ?? "");
  const [people, setPeople] = useState(existing?.people ?? "");
  const [places, setPlaces] = useState(existing?.places ?? "");
  const [professionals, setProfessionals] = useState(
    existing?.professionals ?? DEFAULT_PROFESSIONALS
  );
  const [reasons, setReasons] = useState(existing?.reasons ?? "");
  const [savedNotice, setSavedNotice] = useState(false);

  const save = () => {
    update((s) => ({
      safetyPlan: {
        warningSigns: warningSigns.trim(),
        coping: coping.trim(),
        people: people.trim(),
        places: places.trim(),
        professionals: professionals.trim(),
        reasons: reasons.trim(),
      },
    }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <Page>
      <Stack.Screen options={{ title: "My safety plan" }} />

      <View style={{ gap: space.md, paddingBottom: space.xl }}>
        <T v="title">Personal crisis safety plan</T>
        <T soft>
          A safety plan is a personalized list of coping strategies and sources of support that you can use when you are in a crisis or experiencing intense distress. Keep it updated.
        </T>

        <View style={[styles.card, { backgroundColor: t.raised, borderColor: t.rule }]}>
          <T v="heading" style={{ color: t.help }}>Need help immediately?</T>
          <T v="small" soft>If you feel unsafe right now, free confidential help is available 24×7.</T>
          <View style={{ flexDirection: "row", gap: space.sm, marginTop: 4 }}>
            <Button kind="danger" label="Call Tele-MANAS (14416)" onPress={() => call("14416")} />
            <Button kind="quiet" label="All Helplines" onPress={() => router.push("/help")} />
          </View>
        </View>

        <Section title="1. Warning signs">
          <T v="small" soft>Thoughts, feelings, or actions that show a storm is brewing:</T>
          <Field
            value={warningSigns}
            onChangeText={setWarningSigns}
            multiline
            placeholder="e.g. Can't sleep, isolating in room, thinking 'everyone is better off without me'..."
            style={{ minHeight: 70 }}
          />
        </Section>

        <Section title="2. Internal coping strategies">
          <T v="small" soft>Things you can do on your own without contacting anyone:</T>
          <Field
            value={coping}
            onChangeText={setCoping}
            multiline
            placeholder="e.g. One-minute cyclic sighing, walking around the quad, taking a cold shower..."
            style={{ minHeight: 70 }}
          />
        </Section>

        <Section title="3. People who can distract or support">
          <T v="small" soft>Friends, family, or batchmates you can talk to or be around:</T>
          <Field
            value={people}
            onChangeText={setPeople}
            multiline
            placeholder="e.g. Roommate Aryan, sister Pooja, calling my school friend..."
            style={{ minHeight: 70 }}
          />
        </Section>

        <Section title="4. Places that bring calm">
          <T v="small" soft>Safe environments that feel grounding or quiet:</T>
          <Field
            value={places}
            onChangeText={setPlaces}
            multiline
            placeholder="e.g. Central library 2nd floor, college ground at sunset, tea stall outside gate..."
            style={{ minHeight: 70 }}
          />
        </Section>

        <Section title="5. Professionals & helplines">
          <T v="small" soft>Trained counsellors, doctors, and round-the-clock crisis lines:</T>
          <Field
            value={professionals}
            onChangeText={setProfessionals}
            multiline
            placeholder="Helplines and trusted contacts..."
            style={{ minHeight: 80 }}
          />
        </Section>

        <Section title="6. My reasons for living">
          <T v="small" soft>What matters most to you, even when it feels buried right now:</T>
          <Field
            value={reasons}
            onChangeText={setReasons}
            multiline
            placeholder="e.g. My younger brother, my dream of building software, my pet back home, tomorrow's sunrise..."
            style={{ minHeight: 70 }}
          />
        </Section>

        <View style={{ marginTop: space.lg, gap: space.sm }}>
          <Button label="Save safety plan" onPress={save} />
          {savedNotice ? (
            <T v="small" style={{ color: t.ink, textAlign: "center" }}>
              ✓ Safety plan saved privately on this phone.
            </T>
          ) : null}
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.md,
    borderRadius: 8,
    borderWidth: 1,
    gap: space.xs,
  },
});

import React, { useState } from "react";
import { Pressable, ScrollView, View, StyleSheet } from "react-native";
import { Redirect, Stack, router } from "expo-router";
import { Max, type MaxState } from "@/components/max";
import { useReducedMotionSafe } from "@/components/max/useReducedMotionSafe";
import {
  WellnessFigure,
  GrowthFigure,
  PersonalityFigure,
  DigitalBalanceFigure,
  LearningFigure,
} from "@/ui/illustrations";
import { Avatar } from "@/ui/Avatar";
import { ALL_AVATARS } from "@/content/avatars";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, Page, Section, T } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";

const MAX_STATES: { state: MaxState; label: string; desc: string }[] = [
  { state: "idle", label: "Idle", desc: "Gentle breathing bob & periodic blink" },
  { state: "wave", label: "Wave", desc: "Greeting hand wave on app open" },
  { state: "thinking", label: "Thinking", desc: "Dots fade in sequence + head tilt" },
  { state: "listening", label: "Listening", desc: "Attentive forward tilt with pulse" },
  { state: "breathe", label: "Breathe", desc: "Smooth cyclic inhalation & exhalation" },
  { state: "cheer", label: "Cheer", desc: "Celebration hop with sparkles" },
  { state: "care", label: "Care", desc: "Warm empathetic sway with care heart" },
  { state: "sleep", label: "Sleep", desc: "Peaceful slumber with floating Zs" },
  { state: "empty", label: "Empty", desc: "Curious line-boil outline for zero states" },
];

import { useStore, update } from "@/lib/store";

export default function MaxDevScreen() {
  // Design gallery for development only; production builds bounce to Home.
  if (!__DEV__) return <Redirect href="/" />;
  return <MaxDevScreenDev />;
}

function MaxDevScreenDev() {
  const t = useTheme();
  const themePref = useStore((s) => s.themePreference);
  const reducedMotion = useReducedMotionSafe();
  const [selectedState, setSelectedState] = useState<MaxState>("wave");
  const [interactiveBounce, setInteractiveBounce] = useState(0);

  return (
    <Page>
      <Stack.Screen options={{ title: "MAX Character & Figures Dev" }} />

      <View style={{ gap: space.md, paddingBottom: space.xxl }}>
        {/* Header / Motion Banner */}
        <View style={{ gap: space.xs }}>
          <T v="display">MAX Character Lab</T>
          <T soft>
            Parametric SVG vector character, Open Peeps student avatars, and Serene hand-drawn figures.
          </T>
          <View style={{ flexDirection: "row", gap: space.sm, marginTop: space.xs, alignItems: "center" }}>
            <Button
              kind="quiet"
              icon="sun"
              label={`Theme: ${themePref === "dark" ? "Dark 🌙" : "Light ☀️"}`}
              onPress={() =>
                update((s) => ({
                  themePreference: s.themePreference === "dark" ? "light" : "dark",
                }))
              }
            />
          </View>
          <View
            style={[
              styles.infoBadge,
              { backgroundColor: t.raised, borderColor: t.rule },
            ]}
          >
            <DoodleIcon name={reducedMotion ? "lock" : "activity"} size={16} color={t.ink} />
            <T v="small" soft>
              {reducedMotion
                ? "Reduced motion active (animations frozen to static pose)"
                : "Reduced motion disabled (full Reanimated UI thread loops)"}
            </T>
          </View>
        </View>

        {/* Large Interactive Hero Showcase */}
        <Section title="Interactive Mascot">
          <View
            style={[
              styles.heroBox,
              { backgroundColor: t.raised, borderColor: t.rule },
            ]}
          >
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Tap to bounce Max"
              onPress={() => setInteractiveBounce((c) => c + 1)}
              style={styles.heroPressable}
            >
              <Max state={selectedState} size={150} />
            </Pressable>
            <T v="heading" style={{ marginTop: space.sm }}>
              {selectedState.toUpperCase()}
            </T>
            <T v="small" soft style={{ textAlign: "center", paddingHorizontal: space.md }}>
              Tap MAX for physics spring bounce feedback.
            </T>

            {/* State selector chips */}
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={{ gap: space.xs, paddingHorizontal: space.sm, marginTop: space.sm }}
            >
              {MAX_STATES.map((s) => {
                const isSelected = selectedState === s.state;
                return (
                  <Pressable
                    key={s.state}
                    onPress={() => setSelectedState(s.state)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: isSelected ? t.ink : t.paper,
                        borderColor: isSelected ? t.ink : t.rule,
                      },
                    ]}
                  >
                    <T
                      v="small"
                      style={{
                        color: isSelected ? t.paper : t.ink,
                        fontWeight: isSelected ? "700" : "500",
                      }}
                    >
                      {s.label}
                    </T>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>
        </Section>

        {/* 9 States Gallery Grid */}
        <Section title="All 9 Animation States">
          <View style={styles.gridContainer}>
            {MAX_STATES.map((item) => (
              <View
                key={item.state}
                style={[
                  styles.gridItem,
                  { backgroundColor: t.raised, borderColor: t.rule },
                ]}
              >
                <Max state={item.state} size={84} />
                <T v="small" style={{ fontWeight: "700", marginTop: 4 }}>
                  {item.label}
                </T>
                <T v="small" soft style={{ fontSize: 11, textAlign: "center" }}>
                  {item.desc}
                </T>
              </View>
            ))}
          </View>
        </Section>

        {/* Serene-Style Hand-Drawn Figures */}
        <Section title="Serene Figures (Hand-Drawn Vector)">
          <View style={{ gap: space.sm }}>
            <View
              style={[
                styles.figureRow,
                { backgroundColor: t.raised, borderColor: t.rule },
              ]}
            >
              <WellnessFigure size={90} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="heading">Wellness & Mood</T>
                <T v="small" soft>
                  Calm meditating student with mindful breath breeze.
                </T>
              </View>
            </View>

            <View
              style={[
                styles.figureRow,
                { backgroundColor: t.raised, borderColor: t.rule },
              ]}
            >
              <GrowthFigure size={90} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="heading">Growth & Resilience</T>
                <T v="small" soft>
                  Climbing toward shining stars with upward momentum.
                </T>
              </View>
            </View>

            <View
              style={[
                styles.figureRow,
                { backgroundColor: t.raised, borderColor: t.rule },
              ]}
            >
              <PersonalityFigure size={90} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="heading">Personality & Self</T>
                <T v="small" soft>
                  Serene-inspired expressive archetype faces.
                </T>
              </View>
            </View>

            <View
              style={[
                styles.figureRow,
                { backgroundColor: t.raised, borderColor: t.rule },
              ]}
            >
              <DigitalBalanceFigure size={90} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="heading">Digital Balance</T>
                <T v="small" soft>
                  Lounging with chai and phone set gently aside.
                </T>
              </View>
            </View>

            <View
              style={[
                styles.figureRow,
                { backgroundColor: t.raised, borderColor: t.rule },
              ]}
            >
              <LearningFigure size={90} />
              <View style={{ flex: 1, gap: 2 }}>
                <T v="heading">Learning & Skills</T>
                <T v="small" soft>
                  Student reading an open book with inspiration spark.
                </T>
              </View>
            </View>
          </View>
        </Section>

        {/* 24 Student Avatars Showcase */}
        <Section title={`Open Peeps Avatars (${ALL_AVATARS.length} variants)`}>
          <View
            style={[
              styles.avatarContainer,
              { backgroundColor: t.raised, borderColor: t.rule },
            ]}
          >
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, justifyContent: "center" }}>
              {ALL_AVATARS.map((av) => (
                <View
                  key={av.id}
                  style={[
                    styles.avatarItem,
                    { backgroundColor: t.paper, borderColor: t.rule },
                  ]}
                >
                  <Avatar id={av.id} size={46} />
                  <T v="small" soft style={{ fontSize: 9 }}>
                    {av.id.toUpperCase()}
                  </T>
                </View>
              ))}
            </View>
            <View style={{ marginTop: space.sm, alignItems: "center" }}>
              <Button
                kind="quiet"
                icon="user"
                label="Open Avatar Picker in Profile →"
                onPress={() => router.push("/profile/avatar")}
              />
            </View>
          </View>
        </Section>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: space.xs,
    padding: space.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    marginTop: space.xs,
  },
  heroBox: {
    paddingVertical: space.lg,
    paddingHorizontal: space.sm,
    borderRadius: radius.lg,
    borderWidth: 1,
    alignItems: "center",
  },
  heroPressable: {
    padding: space.xs,
  },
  chip: {
    paddingHorizontal: space.md,
    paddingVertical: 6,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: space.sm,
  },
  gridItem: {
    width: "31%",
    aspectRatio: 0.82,
    borderRadius: radius.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: space.xs,
  },
  figureRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: space.md,
    borderRadius: radius.md,
    borderWidth: 1,
    gap: space.md,
  },
  avatarContainer: {
    padding: space.md,
    borderRadius: radius.lg,
    borderWidth: 1,
  },
  avatarItem: {
    alignItems: "center",
    justifyContent: "center",
    padding: 4,
    borderRadius: radius.md,
    borderWidth: 1,
  },
});

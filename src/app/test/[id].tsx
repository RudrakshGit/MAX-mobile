import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { byId, score } from "@/content/instruments";
import { newId, update, type Result } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, CrisisCard, Page, Screen, Section, T, openWebUrl } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Frame } from "@/ui/sketch/Frame";
import { Max } from "@/components/max";

export default function TestRunner() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const instrument = byId[id ?? ""];

  const [started, setStarted] = useState(false);
  const [answers, setAnswers] = useState<(number | null)[]>([]);
  const [result, setResult] = useState<Result>();

  if (!instrument) {
    return (
      <Page>
        <T>Instrument not found.</T>
        <Button label="Back" onPress={() => router.back()} />
      </Page>
    );
  }

  const handleAnswer = (val: number | null) => {
    const next = [...answers, val];
    if (next.length < instrument.items.length) {
      setAnswers(next);
      return;
    }

    // Complete or finished: calculate score
    const res = score(instrument, next);
    const r: Result = {
      id: newId(),
      checkup: instrument.id,
      at: Date.now(),
      score: res.score,
      band: res.band,
      parts: res.parts,
      top: res.top,
      flag: res.flag,
      incomplete: res.incomplete,
    };
    update((st) => ({ results: [...st.results, r] }));
    setAnswers(next);
    setResult(r);
  };

  const openScience = async () => {
    if (instrument.scienceUrl) {
      await openWebUrl(instrument.scienceUrl);
    }
  };

  // --- 1. RESULT SCREEN ---
  if (result) {
    return (
      <Screen title={instrument.short}>
        <Stack.Screen options={{ title: instrument.title }} />
        <View style={{ gap: space.lg }}>
          {/* Order invariant: CrisisCard first if crisisItem triggered */}
          {result.flag ? <CrisisCard /> : null}

          {result.incomplete ? (
            <Frame id="incomplete-card" fill fillColor={t.raised} strokeColor={t.rule} style={{ gap: space.md, padding: space.md }}>
              <T v="title">Incomplete check-up</T>
              <T soft>You skipped some questions, so we can't score this accurately. Want to finish it or retake?</T>
              <Button
                label="Retake check-up"
                onPress={() => {
                  setAnswers([]);
                  setResult(undefined);
                  setStarted(true);
                }}
              />
              <Button kind="quiet" label="Done for now" onPress={() => router.back()} />
            </Frame>
          ) : (
            <View style={{ gap: space.md }}>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
                <View style={{ gap: space.xs, flex: 1 }}>
                  <T v="small" soft>{instrument.title}</T>
                  {result.band ? <T v="display">{result.band}</T> : null}
                  {result.top ? (
                    <View style={{ gap: 4, marginTop: 4 }}>
                      <T soft v="small">Top themes:</T>
                      <T v="title">{result.top.map((s) => s.charAt(0).toUpperCase() + s.slice(1)).join(" · ")}</T>
                    </View>
                  ) : null}
                  {result.score !== undefined && !result.top ? (
                    <T soft>{`Score: ${result.score}`}</T>
                  ) : null}
                </View>
                <Max state={instrument.clinical ? "care" : "idle"} size={68} />
              </View>

              {/* Subscale parts if available */}
              {result.parts ? (
                <Section title="Subscale breakdown">
                  {Object.entries(result.parts).map(([key, val]) => (
                    <View key={key} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 }}>
                      <T>{key.charAt(0).toUpperCase() + key.slice(1)}</T>
                      <T soft>{String(val)}</T>
                    </View>
                  ))}
                </Section>
              ) : null}

              {/* Clinical screener disclaimer & counsellor conduit */}
              {instrument.clinical ? (
                <Frame id="clinical-disclaimer" fill fillColor={t.raised} strokeColor={t.rule} style={{ gap: space.sm, padding: space.md }}>
                  <T v="small" soft style={{ fontWeight: "600" }}>This is a screening result, not a diagnosis.</T>
                  <T soft v="small">
                    Self-assessments offer reflection points. If you feel weighed down or want clarification, discussing your results with a campus counsellor or professional provides clarity.
                  </T>
                  <Button
                    icon="phone"
                    label="Talk to someone · Helplines"
                    onPress={() => router.push("/help")}
                  />
                </Frame>
              ) : null}

              {/* Next steps */}
              <Button kind="quiet" label="Talk it through with companion" onPress={() => router.replace("/talk")} />
              <Button kind="quiet" label="Done" onPress={() => router.back()} />

              <View style={{ marginTop: space.sm }}>
                <T v="small" soft>{instrument.source}</T>
                <T v="small" soft>{instrument.licence}</T>
              </View>
            </View>
          )}
        </View>
      </Screen>
    );
  }

  // --- 2. INTRO SCREEN ---
  if (!started) {
    return (
      <Screen title={instrument.short}>
        <Stack.Screen options={{ title: instrument.title }} />
        <View style={{ gap: space.lg }}>
          <View style={{ gap: space.xs }}>
            <T v="title">{instrument.title}</T>
            <T soft>{`About ${instrument.minutes} min · ${instrument.items.length} questions`}</T>
          </View>

          <T>{instrument.intro}</T>

          <Section title="What you get">
            {instrument.whatYouGet.map((pt, idx) => (
              <View key={idx} style={{ flexDirection: "row", alignItems: "flex-start", gap: space.sm }}>
                <T soft>•</T>
                <T style={{ flex: 1 }}>{pt}</T>
              </View>
            ))}
          </Section>

          {instrument.ageNote ? (
            <Frame id="age-note" fill fillColor={t.raised} strokeColor={t.rule} style={{ padding: space.sm }}>
              <T v="small" soft>{instrument.ageNote}</T>
            </Frame>
          ) : null}

          <View style={{ gap: space.sm, marginTop: space.md }}>
            <Button label="Begin check-up" onPress={() => setStarted(true)} />
            {instrument.scienceUrl ? (
              <Button kind="quiet" icon="book" label="The science & validation" onPress={openScience} />
            ) : null}
          </View>
        </View>
      </Screen>
    );
  }

  // --- 3. QUESTIONNAIRE RUNNER (One question per screen) ---
  const currentIdx = answers.length;
  const currentItem = instrument.items[currentIdx];
  const itemOptions = currentItem.options ?? instrument.options;
  const progressRatio = currentIdx / instrument.items.length;

  return (
    <Page>
      <Stack.Screen options={{ title: `${instrument.short} (${currentIdx + 1}/${instrument.items.length})` }} />
      <View style={{ gap: space.lg }}>
        {/* Progress line */}
        <View style={{ height: 4, borderRadius: 2, backgroundColor: t.rule, overflow: "hidden" }}>
          <View
            style={{
              height: 4,
              backgroundColor: t.ink,
              width: `${Math.round(progressRatio * 100)}%`,
            }}
          />
        </View>

        <T v="small" soft>{`Question ${currentIdx + 1} of ${instrument.items.length}`}</T>
        <T v="title">{currentItem.text}</T>

        {/* Options list */}
        <View style={{ gap: space.sm }}>
          {itemOptions.map((o) => (
            <Pressable
              key={`${o.label}-${o.value}`}
              accessibilityRole="button"
              onPress={() => handleAnswer(o.value)}
              style={({ pressed }) => ({
                opacity: pressed ? 0.75 : 1,
              })}>
              <Frame
                id={`opt-${o.value}-${o.label}`}
                fill
                fillColor={t.paper}
                strokeColor={t.rule}
                style={{
                  minHeight: 52,
                  justifyContent: "center",
                  paddingHorizontal: space.md,
                }}>
                <T>{o.label}</T>
              </Frame>
            </Pressable>
          ))}
        </View>

        {/* Controls: Skip & Back */}
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.md }}>
          {currentIdx > 0 ? (
            <Button
              kind="quiet"
              icon="arrow-left"
              label="Back"
              onPress={() => setAnswers(answers.slice(0, -1))}
            />
          ) : <View />}

          {/* The self-harm question is never skippable: a skipped answer would hide a person who needs help. */}
          {currentIdx === instrument.crisisItem ? (
            <View />
          ) : (
            <Button kind="quiet" label="Skip" onPress={() => handleAnswer(null)} />
          )}
        </View>
      </View>
    </Page>
  );
}

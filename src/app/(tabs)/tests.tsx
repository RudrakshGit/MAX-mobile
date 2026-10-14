import React, { useState } from "react";
import { Pressable, ScrollView, View, StyleSheet } from "react-native";
import { router } from "expo-router";
import { instruments, categories, type Instrument } from "@/content/instruments";
import { featured, filterInstruments } from "@/lib/tests";
import { useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, Field, Row, Screen, Section, T } from "@/lib/ui";
import { Frame } from "@/ui/sketch/Frame";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import {
  WellnessFigure,
  GrowthFigure,
  PersonalityFigure,
  DigitalBalanceFigure,
  LearningFigure,
  BreathingFigure,
  GroundingFigure,
  SpiralFigure,
  SafetyFigure,
  ReadingFigure,
  SleepFigure,
} from "@/ui/illustrations";

const instrumentIcons: Record<string, DoodleIconName> = {
  phq9: "cloud",
  gad7: "compass",
  cbi: "activity",
  who5: "heart",
  loneliness3: "user",
  asrs6: "checklist",
  aq10: "compass",
  sci: "moon",
  pswq: "activity",
  brs: "heart",
  rses: "heart",
  saps: "checklist",
  bas2: "compass",
  onetMiniIp: "book",
  miniIpip: "user",
  tech: "phone",
};

const categoryIcons: Record<string, DoodleIconName> = {
  wellness: "heart",
  growth: "heart",
  personality: "user",
  phone: "phone",
};

const instrumentFigures: Record<string, React.ComponentType<{ size?: number }>> = {
  phq9: WellnessFigure,
  gad7: SpiralFigure,
  cbi: BreathingFigure,
  who5: GrowthFigure,
  loneliness3: SafetyFigure,
  asrs6: GroundingFigure,
  aq10: PersonalityFigure,
  sci: SleepFigure,
  pswq: SpiralFigure,
  brs: SafetyFigure,
  rses: GrowthFigure,
  saps: LearningFigure,
  bas2: GroundingFigure,
  onetMiniIp: ReadingFigure,
  miniIpip: PersonalityFigure,
  tech: DigitalBalanceFigure,
};

const categoryFigures: Record<string, React.ComponentType<{ size?: number }>> = {
  wellness: WellnessFigure,
  growth: GrowthFigure,
  personality: PersonalityFigure,
  phone: DigitalBalanceFigure,
};

export default function TestsTab() {
  const t = useTheme();
  const results = useStore((s) => s.results);
  const [query, setQuery] = useState("");

  const hasTaken = (id: string) => results.some((r) => r.checkup === id);
  const lastResult = (id: string) => results.filter((r) => r.checkup === id).at(-1);

  const feat = featured({ results }, instruments);
  const filtered = filterInstruments(instruments, query);

  return (
    <Screen title="Self-tests">
      <View style={{ gap: space.md, marginBottom: space.sm }}>
        <Field
          value={query}
          onChangeText={setQuery}
          placeholder="Search self-tests..."
          accessibilityLabel="Search self-tests"
        />
      </View>

      {query.trim().length > 0 ? (
        <Section title={`Search results (${filtered.length})`}>
          {filtered.length === 0 ? (
            <T soft>No tests match your search.</T>
          ) : (
            filtered.map((inst, i) => {
              const r = lastResult(inst.id);
              return (
                <Row
                  key={inst.id}
                  icon={instrumentIcons[inst.id] ?? "checklist"}
                  title={inst.title}
                  sub={
                    r
                      ? `Last: ${r.band ?? `Score ${r.score}`} · ${new Date(r.at).toLocaleDateString("en-IN")}`
                      : `About ${inst.minutes} min · ${inst.items.length} questions`
                  }
                  onPress={() => router.push(`/test/${inst.id}`)}
                  last={i === filtered.length - 1}
                />
              );
            })
          )}
        </Section>
      ) : (
        <View style={{ gap: space.lg }}>
          {/* Featured Test Card */}
          {feat ? (
            <Pressable
              accessibilityRole="button"
              onPress={() => router.push(`/test/${feat.id}`)}>
              <Frame
                id="featured-test-frame"
                fill
                fillColor={t.raised}
                strokeColor={t.rule}
                style={{ padding: space.md, gap: space.xs }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" }}>
                  <View style={{ flex: 1, gap: space.xs, paddingRight: space.xs }}>
                    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                      <DoodleIcon name={instrumentIcons[feat.id] ?? "compass"} size={16} color={t.ink} />
                      <T v="small" soft style={{ fontWeight: "600", textTransform: "uppercase", letterSpacing: 0.5 }}>
                        Featured check-up
                      </T>
                    </View>
                    <T v="title">{feat.title}</T>
                    {feat.intro ? <T soft numberOfLines={2}>{feat.intro}</T> : null}
                  </View>
                  {(() => {
                    const FeatFigure = instrumentFigures[feat.id] ?? WellnessFigure;
                    return <FeatFigure size={68} />;
                  })()}
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.xs }}>
                  <T v="small" soft>{`~${feat.minutes} min · ${feat.items?.length ?? 0} questions`}</T>
                  <Button kind="quiet" label="Start →" onPress={() => router.push(`/test/${feat.id}`)} />
                </View>
              </Frame>
            </Pressable>
          ) : null}

          {/* Category Rows with Large Figure Cards */}
          {categories.map((cat) => {
            const inCategory = instruments.filter((inst) => inst.category === cat.id);
            if (inCategory.length === 0) return null;

            return (
              <View key={cat.id} style={{ gap: space.sm }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs }}>
                    <DoodleIcon name={categoryIcons[cat.id] ?? "checklist"} size={18} color={t.ink} />
                    <T v="heading">{cat.title}</T>
                  </View>
                  <T v="small" soft>{`${inCategory.length} check-ups`}</T>
                </View>

                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={{ gap: space.md, paddingRight: space.md }}>
                  {inCategory.map((inst) => {
                    const FigureComponent = instrumentFigures[inst.id] ?? categoryFigures[cat.id] ?? WellnessFigure;
                    const taken = hasTaken(inst.id);
                    const r = lastResult(inst.id);
                    return (
                      <Pressable
                        key={inst.id}
                        accessibilityRole="button"
                        accessibilityLabel={`${inst.title}. ${taken ? `Taken, last ${r?.band}` : `About ${inst.minutes} minutes`}`}
                        onPress={() => router.push(`/test/${inst.id}`)}
                        style={({ pressed }) => ({
                          width: 240,
                          minHeight: 275,
                          opacity: pressed ? 0.8 : 1,
                        })}>
                        <Frame
                          id={`test-card-${inst.id}`}
                          fill
                          fillColor={t.raised}
                          strokeColor={t.rule}
                          style={styles.testCard}>
                          {/* Top Figure Illustration Area */}
                          <View style={[styles.figureContainer, { backgroundColor: t.paper, borderColor: t.rule }]}>
                            <FigureComponent size={120} />
                          </View>

                          {/* Card Content Body */}
                          <View style={{ flex: 1, justifyContent: "space-between", gap: space.xs }}>
                            <View style={{ gap: 4 }}>
                              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                                <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                                  <DoodleIcon name={instrumentIcons[inst.id] ?? "checklist"} size={14} color={t.ink} />
                                  <T v="small" soft style={{ fontWeight: "600", fontSize: 11 }}>
                                    {inst.short}
                                  </T>
                                </View>
                                {taken ? (
                                  <View style={[styles.doneBadge, { borderColor: t.rule, backgroundColor: t.paper }]}>
                                    <DoodleIcon name="check" size={10} color={t.ink} />
                                    <T v="small" style={{ fontSize: 10, color: t.ink, fontWeight: "600" }}>Taken</T>
                                  </View>
                                ) : (
                                  <View style={[styles.badge, { borderColor: t.rule }]}>
                                    <T v="small" soft style={{ fontSize: 9 }}>{`~${inst.minutes} MIN`}</T>
                                  </View>
                                )}
                              </View>

                              <T v="heading" numberOfLines={2} style={{ fontSize: 15, lineHeight: 20 }}>
                                {inst.title}
                              </T>
                              <T v="small" soft numberOfLines={1} style={{ fontSize: 11 }}>
                                {`${inst.items.length} questions · Standardized`}
                              </T>
                            </View>

                            <View style={[styles.cardFooter, { borderTopColor: t.rule }]}>
                              <T v="small" soft style={{ fontSize: 11 }}>
                                {r?.band ? `Last: ${r.band}` : `Clinical screener`}
                              </T>
                              <DoodleIcon name="chevron-right" size={15} color={t.ink2} />
                            </View>
                          </View>
                        </Frame>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              </View>
            );
          })}
        </View>
      )}

      <View style={{ marginTop: space.xl, marginBottom: space.md }}>
        <Button
          kind="quiet"
          icon="book"
          label="About these tests & sources"
          onPress={() => router.push("/tests-about")}
        />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  testCard: {
    padding: space.sm,
    gap: space.xs,
    minHeight: 275,
  },
  figureContainer: {
    height: 105,
    borderRadius: radius.sm,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  cardFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: space.xs,
    borderTopWidth: 1,
    marginTop: space.xs,
  },
  badge: {
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 4,
    borderWidth: 1,
  },
  doneBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 3,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: radius.pill,
    borderWidth: 1,
  },
});

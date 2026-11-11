import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { instruments, categories } from "@/content/instruments";
import { featured, filterInstruments } from "@/lib/tests";
import { useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, Field, Row, Screen, Section, T } from "@/lib/ui";
import { Frame } from "@/ui/sketch/Frame";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import { SceneArt, SceneShelf, type ShelfItem } from "@/components/scenes/SceneArt";
import type { SceneName } from "@/components/scenes/scenes";
import { FocusScope } from "@/components/scenes/focus";

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

// Each check gets a picture of MAX's world that fits it (docs/history.md, M16), not a generic figure.
const instrumentScenes: Record<string, SceneName> = {
  phq9: "kind",
  gad7: "overthinking",
  cbi: "sigh",
  who5: "wellness",
  loneliness3: "waves",
  asrs6: "library",
  aq10: "personality",
  sci: "sleep",
  pswq: "spiral",
  brs: "getgoing",
  rses: "personality",
  saps: "exam",
  bas2: "breathe",
  onetMiniIp: "growth",
  miniIpip: "personality",
  tech: "phone",
};
const categoryScenes: Record<string, SceneName> = { wellness: "wellness", growth: "growth", personality: "personality", phone: "phone" };

export default function TestsTab() {
  const t = useTheme();
  const results = useStore((s) => s.results);
  const [query, setQuery] = useState("");

  const hasTaken = (id: string) => results.some((r) => r.checkup === id);
  const lastResult = (id: string) => results.filter((r) => r.checkup === id).at(-1);

  const feat = featured({ results }, instruments);
  const filtered = filterInstruments(instruments, query);

  return (
    <FocusScope>
      {(settle) => (
    <Screen title="Self-tests" onScrollSettled={settle}>
      <View style={{ gap: space.md, marginBottom: space.sm }}>
        <Field
          value={query}
          maxLength={80}
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
                  </View>
                  <SceneArt name={instrumentScenes[feat.id] ?? "wellness"} width={96} />
                </View>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: space.xs }}>
                  <T v="small" soft>{`~${feat.minutes} min · ${feat.items?.length ?? 0} questions`}</T>
                  <Button kind="quiet" label="Start →" onPress={() => router.push(`/test/${feat.id}`)} />
                </View>
              </Frame>
            </Pressable>
          ) : null}

          {/* One shelf of MAX scene cards per category */}
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

                {/* a picture, the name and one detail, like every other card (M16 decision 14); "screening, not a
                    diagnosis" is said on the result screen and in "About these tests". Built as the row scrolls. */}
                <SceneShelf
                  id={cat.id}
                  width={200}
                  items={inCategory.map((inst): ShelfItem => {
                    const taken = hasTaken(inst.id);
                    const r = lastResult(inst.id);
                    return {
                      key: inst.id,
                      scene: instrumentScenes[inst.id] ?? categoryScenes[cat.id] ?? "wellness",
                      title: inst.title,
                      meta: taken ? (r?.band ? `Last: ${r.band}` : "Taken") : `${inst.minutes} min · ${inst.items.length} questions`,
                      metaIcon: taken ? "check" : "clipboard",
                      onPress: () => router.push(`/test/${inst.id}`),
                    };
                  })}
                />
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
      )}
    </FocusScope>
  );
}


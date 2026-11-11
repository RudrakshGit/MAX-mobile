import { THIS_DEVICE } from "@/lib/platform";
import { showAlert } from "@/lib/dialog";
import React, { useCallback, useState } from "react";
import { Pressable, View } from "react-native";
import { router, useFocusEffect, type Href } from "expo-router";
import { FEELINGS, INFLUENCES } from "@/content/feelings";
import { moodWords } from "@/lib/insights";
import { tombstone, update, useStore, type Entry } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, Screen, T } from "@/lib/ui";
import { Frame } from "@/ui/sketch/Frame";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { deleteAudioFile } from "@/features/voice/recorder";
import { processPendingTranscripts } from "@/features/voice/queue";
import { Max } from "@/components/max";
import { classifyRisk } from "@/safety/classifier";

// The regex classifier is cheap but not free; a long journal re-renders often, so remember results per text.
const heavyCache = new Map<string, boolean>();
function soundsHeavy(e: Entry): boolean {
  const text = [e.text, e.transcript?.raw, e.transcript?.roman].filter(Boolean).join(" ");
  if (!text) return false;
  let v = heavyCache.get(text);
  if (v === undefined) {
    v = classifyRisk(text).level === "crisis";
    if (heavyCache.size > 500) heavyCache.clear();
    heavyCache.set(text, v);
  }
  return v;
}

const PAGE = 30;

function dateKey(timestamp: number): string {
  const d = new Date(timestamp);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function Journal() {
  const t = useTheme();
  const entries = useStore((s) => s.entries);
  const companion = useStore((s) => s.companion) || "Max";
  const allSorted = [...entries].sort((a, b) => b.at - a.at);
  // Draw the newest entries first; older ones load on request so a year of journaling stays fast.
  const [limit, setLimit] = useState(PAGE);
  const sorted = allSorted.slice(0, limit);

  useFocusEffect(
    useCallback(() => {
      processPendingTranscripts();
    }, [])
  );

  const now = new Date();
  const todayKey = dateKey(now.getTime());
  const yesterday = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
  const yesterdayKey = dateKey(yesterday.getTime());

  // Group entries by day
  const groups: { title: string; entries: Entry[] }[] = [];
  const groupMap = new Map<string, Entry[]>();

  for (const e of sorted) {
    const key = dateKey(e.at);
    const existing = groupMap.get(key);
    if (existing) {
      existing.push(e);
    } else {
      const arr = [e];
      groupMap.set(key, arr);
      let title = key;
      if (key === todayKey) {
        title = "Today";
      } else if (key === yesterdayKey) {
        title = "Yesterday";
      } else {
        const [y, m, d] = key.split("-").map(Number);
        title = new Date(y, m - 1, d).toLocaleDateString(undefined, {
          weekday: "short",
          day: "numeric",
          month: "short",
        });
      }
      groups.push({ title, entries: arr });
    }
  }

  const remove = (id: string) =>
    showAlert("Delete this entry?", "It will be removed permanently from your journal.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          const target = entries.find((e) => e.id === id);
          if (target?.audio?.uri) {
            deleteAudioFile(target.audio.uri).catch(() => {});
          }
          update((s) => ({ entries: s.entries.filter((e) => e.id !== id), tombstones: tombstone(s, id) }));
        },
      },
    ]);

  return (
    <Screen title="Journal">
      <Button
        kind="primary"
        icon="edit-3"
        label="New entry"
        onPress={() => router.push("/journal-new")}
      />
      {/* mood history, patterns and phone use moved here from the old Tools tab (M16, owner's answer 1) */}
      <Button kind="quiet" icon="activity" label="Your mood and patterns" onPress={() => router.push("/profile/mood")} />

      {allSorted.length === 0 ? (
        <View style={{ marginTop: space.xl, gap: space.sm, alignItems: "center" }}>
          <Max state="empty" size={120} boil interactive onPress={() => router.push("/talk" as Href)} />
          <T v="title">Nothing here yet.</T>
          <T soft style={{ textAlign: "center", paddingHorizontal: space.md }}>
            {`Writing down how you feel, even a few messy lines, often brings relief. Your words stay on ${THIS_DEVICE}.`}
          </T>
        </View>
      ) : (
        <View style={{ marginTop: space.lg, gap: space.lg }}>
          {groups.map((group) => (
            <View key={group.title} style={{ gap: space.sm }}>
              <T v="heading" soft>{group.title}</T>

              {group.entries.map((e) => {
                const moodIndex = (e.mood ?? 3) - 1;
                const moodWord = moodWords[moodIndex]
                  ? moodWords[moodIndex][0].toUpperCase() + moodWords[moodIndex].slice(1)
                  : "Okay";

                const timeStr = new Date(e.at).toLocaleTimeString(undefined, {
                  hour: "numeric",
                  minute: "2-digit",
                });

                const feelingLabels = e.feelings
                  .slice(0, 3)
                  .map((fid) => FEELINGS.find((f) => f.id === fid)?.label ?? fid);
                const influenceLabels = e.influences
                  .slice(0, 2)
                  .map((iid) => INFLUENCES.find((inf) => inf.id === iid)?.label ?? iid);

                const previewText =
                  e.text ||
                  e.transcript?.roman ||
                  e.transcript?.raw ||
                  (e.audio ? "Voice recording" : "");

                return (
                  <Pressable
                    key={e.id}
                    accessibilityRole="button"
                    accessibilityHint="Tap to open, long press to delete"
                    onPress={() => router.push(`/journal/${e.id}`)}
                    onLongPress={() => remove(e.id)}
                    style={({ pressed }) => [{ opacity: pressed ? 0.75 : 1 }]}>
                    <Frame style={{ padding: space.md, gap: space.xs }}>
                      {/* Card Header: Mood + Time + Audio Indicator + Reflection marker */}
                      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                          <DoodleIcon name="heart" size={14} color={t.ink} />
                          <T v="heading">{moodWord}</T>
                          <T v="small" soft>{`· ${timeStr}`}</T>
                          {e.audio ? <DoodleIcon name="mic" size={14} color={t.ink} /> : null}
                          {e.transcript?.status === "pending" ? (
                            <T v="small" soft style={{ fontStyle: "italic" }}>
                              (transcribing...)
                            </T>
                          ) : null}
                        </View>
                        {e.reflection ? (
                          <View style={{ flexDirection: "row", alignItems: "center", gap: 4 }}>
                            <DoodleIcon name="sparkles" size={14} color={t.ink} />
                            <T v="small" soft>Reflected</T>
                          </View>
                        ) : null}
                      </View>

                      {/* Text Preview */}
                      {previewText ? (
                        <T numberOfLines={2} style={{ marginVertical: 2, lineHeight: 20 }}>
                          {previewText}
                        </T>
                      ) : null}

                      {/* Chips: Feelings & Influences */}
                      {(feelingLabels.length > 0 || influenceLabels.length > 0) && (
                        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 4, marginTop: 4 }}>
                          {feelingLabels.map((lbl, i) => (
                            <View
                              key={`f-${i}`}
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: t.rule,
                                backgroundColor: t.raised,
                              }}>
                              <T v="small">{lbl}</T>
                            </View>
                          ))}
                          {influenceLabels.map((lbl, i) => (
                            <View
                              key={`inf-${i}`}
                              style={{
                                paddingHorizontal: 8,
                                paddingVertical: 2,
                                borderRadius: 10,
                                borderWidth: 1,
                                borderColor: t.rule,
                                backgroundColor: t.raised,
                              }}>
                              <T v="small" soft>{lbl}</T>
                            </View>
                          ))}
                        </View>
                      )}

                      {/* Gentle support line when the words sound heavy (typed or transcribed) */}
                      {soundsHeavy(e) ? (
                        <Pressable
                          accessibilityRole="button"
                          accessibilityLabel="Free support, Tele-MANAS 14416"
                          onPress={() => router.push("/help")}
                          style={{ marginTop: 4, alignSelf: "flex-start" }}>
                          <T v="small" style={{ color: t.help, textDecorationLine: "underline" }}>
                            This sounds heavy. Free help, any time: 14416 →
                          </T>
                        </Pressable>
                      ) : null}

                      {/* Quick link: Talk about this (only when there are words to talk about) */}
                      {previewText ? (
                      <Pressable
                        accessibilityRole="button"
                        onPress={() =>
                          router.push({
                            pathname: "/talk",
                            params: {
                              draft: `I wrote this in my journal: "${previewText.slice(0, 600)}"`,
                              n: String(Date.now()),
                            },
                          })
                        }
                        style={{ marginTop: 4, alignSelf: "flex-start" }}>
                        <T v="small" soft style={{ textDecorationLine: "underline" }}>
                          {`Talk to ${companion} about this →`}
                        </T>
                      </Pressable>
                      ) : null}
                    </Frame>
                  </Pressable>
                );
              })}
            </View>
          ))}
          {allSorted.length > limit ? (
            <Button
              kind="quiet"
              label={`Show older entries (${allSorted.length - limit} more)`}
              onPress={() => setLimit((n) => n + PAGE)}
            />
          ) : null}
        </View>
      )}
    </Screen>
  );
}

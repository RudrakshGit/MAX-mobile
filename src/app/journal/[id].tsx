import { showAlert } from "@/lib/dialog";
import React, { useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { FEELINGS, INFLUENCES } from "@/content/feelings";
import { askReflection } from "@/lib/api";
import { moodWords } from "@/lib/insights";
import { update, useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, CrisisCard, Page, Section, T } from "@/lib/ui";
import { classifyRisk } from "@/safety/classifier";
import { Balloon } from "@/ui/sketch/Balloon";
import { Frame } from "@/ui/sketch/Frame";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Max } from "@/components/max/Max";
import { Player } from "@/features/voice/Player";
import { deleteAudioFile } from "@/features/voice/recorder";
import { retryEntryTranscription } from "@/features/voice/queue";

export default function JournalDetail() {
  const t = useTheme();
  const { id } = useLocalSearchParams<{ id: string }>();
  const entries = useStore((s) => s.entries);
  const consents = useStore((s) => s.consents);
  const companion = useStore((s) => s.companion);

  const entry = entries.find((e) => e.id === id);

  const [loadingReflection, setLoadingReflection] = useState(false);
  const [reflectionCrisis, setReflectionCrisis] = useState(false);
  const [reflectionError, setReflectionError] = useState("");

  if (!entry) {
    return (
      <Page>
        <Stack.Screen options={{ title: "Journal Entry" }} />
        <View style={{ gap: space.md, alignItems: "center", paddingVertical: space.xl }}>
          <T v="title">Entry not found</T>
          <T soft>This journal entry might have been deleted.</T>
          <Button label="Back to Journal" onPress={() => router.back()} />
        </View>
      </Page>
    );
  }

  // Safety: An entry with crisis wording displays the crisis card and never requests/shows AI reflection
  const entryText = [entry.text, entry.transcript?.raw, entry.transcript?.roman].filter(Boolean).join(" ");
  const textRisk = classifyRisk(entryText);
  const hasCrisis = textRisk.level === "crisis" || reflectionCrisis;

  const moodIndex = (entry.mood ?? 3) - 1;
  const moodWord = moodWords[moodIndex]
    ? moodWords[moodIndex][0].toUpperCase() + moodWords[moodIndex].slice(1)
    : "Okay";

  const entryDate = new Date(entry.at);
  const dateFormatted = entryDate.toLocaleDateString(undefined, {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const timeFormatted = entryDate.toLocaleTimeString(undefined, {
    hour: "numeric",
    minute: "2-digit",
  });

  const feelingLabels = entry.feelings.map(
    (fid) => FEELINGS.find((f) => f.id === fid)?.label ?? fid
  );
  const influenceLabels = entry.influences.map(
    (iid) => INFLUENCES.find((inf) => inf.id === iid)?.label ?? iid
  );

  const handleGetReflection = async () => {
    if (hasCrisis) return;
    setLoadingReflection(true);
    setReflectionError("");
    try {
      const res = await askReflection(entryText);
      if (res.kind === "crisis") {
        setReflectionCrisis(true);
      } else if (res.kind === "reply") {
        update((s) => ({
          entries: s.entries.map((e) =>
            e.id === entry.id ? { ...e, reflection: res.text } : e
          ),
        }));
      }
    } catch {
      setReflectionError("Couldn't connect to AI right now. Take a breath and try again later.");
    } finally {
      setLoadingReflection(false);
    }
  };

  const handleDelete = () => {
    showAlert("Delete entry?", "This will permanently remove this journal entry.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: () => {
          if (entry.audio?.uri) {
            deleteAudioFile(entry.audio.uri).catch(() => {});
          }
          update((s) => ({
            entries: s.entries.filter((e) => e.id !== entry.id),
          }));
          router.back();
        },
      },
    ]);
  };

  return (
    <Page>
      <Stack.Screen
        options={{
          title: "Journal",
          headerRight: () => (
            <View style={{ flexDirection: "row", gap: space.sm, alignItems: "center" }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Edit entry"
                onPress={() => router.push(`/journal-new?id=${entry.id}`)}
                style={{ padding: space.xs }}>
                <DoodleIcon name="edit" size={20} color={t.ink} />
              </Pressable>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Delete entry"
                onPress={handleDelete}
                style={{ padding: space.xs }}>
                <DoodleIcon name="trash" size={20} color={t.ink2} />
              </Pressable>
            </View>
          ),
        }}
      />

      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        {/* Crisis Card if entry text or reflection triggers safety */}
        {hasCrisis ? (
          <View style={{ gap: space.sm }}>
            <CrisisCard />
          </View>
        ) : null}

        {/* Header: Big mood word and date */}
        <View style={{ gap: 4 }}>
          <T v="display">{moodWord}</T>
          <T soft v="small">{`${dateFormatted} · ${timeFormatted}`}</T>
        </View>

        {/* Feelings row */}
        {feelingLabels.length > 0 ? (
          <View style={{ gap: space.xs }}>
            <T v="small" soft>FEELINGS</T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
              {feelingLabels.map((lbl, i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: space.sm,
                    paddingVertical: 4,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: t.rule,
                    backgroundColor: t.raised,
                  }}>
                  <T v="small">{lbl}</T>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Influences row */}
        {influenceLabels.length > 0 ? (
          <View style={{ gap: space.xs }}>
            <T v="small" soft>INFLUENCED BY</T>
            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.xs }}>
              {influenceLabels.map((lbl, i) => (
                <View
                  key={i}
                  style={{
                    paddingHorizontal: space.sm,
                    paddingVertical: 4,
                    borderRadius: 14,
                    borderWidth: 1,
                    borderColor: t.rule,
                    backgroundColor: t.raised,
                  }}>
                  <T v="small">{lbl}</T>
                </View>
              ))}
            </View>
          </View>
        ) : null}

        {/* Voice Note Player */}
        {entry.audio?.uri ? (
          <View style={{ gap: space.xs }}>
            <T v="small" soft>VOICE NOTE</T>
            <Player uri={entry.audio.uri} ms={entry.audio.ms} levels={entry.audio.levels} />
          </View>
        ) : null}

        {/* Transcript Section */}
        {entry.transcript ? (
          <View style={{ gap: space.xs }}>
            <T v="small" soft>TRANSCRIPT</T>
            {entry.transcript.status === "done" ? (
              <Frame style={{ padding: space.md }}>
                <T style={{ lineHeight: 24 }}>
                  {entry.transcript.roman ?? entry.transcript.raw ?? "—"}
                </T>
              </Frame>
            ) : entry.transcript.status === "pending" ? (
              <View
                style={{
                  flexDirection: "row",
                  alignItems: "center",
                  gap: space.sm,
                  padding: space.md,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.hair,
                }}>
                <ActivityIndicator size="small" color={t.ink} />
                <T soft>Transcribing voice note...</T>
              </View>
            ) : (
              <View
                style={{
                  flexDirection: "row",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: space.md,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: t.hair,
                }}>
                <T soft>Transcription failed.</T>
                <Button label="Try again" onPress={() => retryEntryTranscription(entry.id)} />
              </View>
            )}
          </View>
        ) : null}

        {/* Writing prompt if one was used */}
        {entry.prompt ? (
          <T soft style={{ fontStyle: "italic" }}>
            {`“${entry.prompt}”`}
          </T>
        ) : null}

        {/* Main entry text */}
        {entry.text ? (
          <Frame style={{ padding: space.md }}>
            <T style={{ lineHeight: 24 }}>{entry.text}</T>
          </Frame>
        ) : null}

        {/* Reflection Section (blocked if crisis) */}
        {!hasCrisis && (
          <View style={{ gap: space.sm, marginTop: space.sm }}>
            {entry.reflection ? (
              <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.xs }}>
                <View style={{ flex: 1 }}>
                  <Balloon tail="right" id={`reflection-${entry.id}`}>
                    <View style={{ gap: space.xs }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <DoodleIcon name="sparkles" size={16} color={t.ink} />
                        <T v="heading">{`${companion || "MAX"}'s reflection`}</T>
                      </View>
                      <T style={{ lineHeight: 22 }}>{entry.reflection}</T>
                    </View>
                  </Balloon>
                </View>
                <View style={{ marginBottom: -4 }}>
                  <Max state="care" size={76} />
                </View>
              </View>
            ) : consents.ai ? (
              <View style={{ gap: space.xs }}>
                {loadingReflection ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm, paddingVertical: space.md }}>
                    <ActivityIndicator color={t.ink} />
                    <T soft>{`Asking ${companion || "MAX"} to reflect on this...`}</T>
                  </View>
                ) : (
                  <Button
                    kind="quiet"
                    icon="sparkles"
                    label="Get a reflection"
                    onPress={handleGetReflection}
                  />
                )}
                {reflectionError ? (
                  <T v="small" style={{ color: t.help }}>{reflectionError}</T>
                ) : null}
              </View>
            ) : null}
          </View>
        )}
      </View>
    </Page>
  );
}

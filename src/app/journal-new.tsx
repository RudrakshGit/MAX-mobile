import { showAlert } from "@/lib/dialog";
import React, { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, View } from "react-native";
import { router, useLocalSearchParams, useNavigation, type Href } from "expo-router";
import { journalBridge, type Action } from "@/lib/personal";
import { useAudioRecorder, useAudioRecorderState } from "expo-audio";
import { FEELINGS, INFLUENCES } from "@/content/feelings";
import { suggestTags, transcribeAudioFile } from "@/lib/api";
import { moodWords } from "@/lib/insights";
import { getState, logActivity, newId, update, useStore, type Entry } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, CrisisCard, Field, Page, Section, T } from "@/lib/ui";
import { classifyRisk } from "@/safety/classifier";
import { Chip } from "@/ui/sketch/Chip";
import { isWeb } from "@/lib/platform";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import {
  ensureMicPermission,
  normalizeDb,
  saveAudioToPermanentStorage,
  deleteAudioFile,
  VOICE_RECORDING_OPTIONS,
  MAX_RECORDING_MS,
} from "@/features/voice/recorder";
import { acceptRoman, downsample, isUsableClip } from "@/features/voice/transcript";
import { Player } from "@/features/voice/Player";
import { Waveform } from "@/features/voice/Waveform";
import { processPendingTranscripts } from "@/features/voice/queue";
import { Max } from "@/components/max";

// "Exam brain dump": three small questions that turn a pile of worry into one next step.
const BRAIN_DUMP = "What am I most worried about right now?\n\n\nWhich part of it is in my control, and which isn't?\n\n\nWhat is one small step I can take in the next 15 minutes?\n";

const PROMPTS = [
  "What's taking up the most space in my head?",
  "One thing that went okay today",
  "What would I tell a friend feeling this way?",
  "What am I avoiding, and why?",
  "What do I need right now?",
];

const MOOD_OPTIONS = moodWords.map((w, i) => ({
  value: i + 1,
  label: w[0].toUpperCase() + w.slice(1),
}));

export default function JournalNew() {
  const t = useTheme();
  const { id, template } = useLocalSearchParams<{ id?: string; template?: string }>();
  const entries = useStore((s) => s.entries);
  const consents = useStore((s) => s.consents);

  const existing = id ? entries.find((e) => e.id === id) : undefined;
  const entryIdRef = useRef<string>(existing?.id ?? newId());
  // Voice files made on this screen. Nothing is deleted until Save, so backing out never loses the saved note.
  const sessionFiles = useRef<string[]>([]);
  const savedRef = useRef(false);

  const [step, setStep] = useState(1);
  const [mood, setMood] = useState<number>(existing?.mood ?? 3);
  const [feelings, setFeelings] = useState<string[]>(existing?.feelings ?? []);
  const [influences, setInfluences] = useState<string[]>(existing?.influences ?? []);
  const [text, setText] = useState(existing?.text ?? (template === "braindump" ? BRAIN_DUMP : ""));
  const [prompt, setPrompt] = useState<string | undefined>(existing?.prompt ?? (template === "braindump" ? "Exam brain dump" : undefined));
  const [bridge, setBridge] = useState<Action | null>(null);
  const [loadingAi, setLoadingAi] = useState(false);
  const [showSupport, setShowSupport] = useState(false);

  // Voice state
  const [audioClip, setAudioClip] = useState<Entry["audio"]>(existing?.audio);
  const [transcriptState, setTranscriptState] = useState<Entry["transcript"]>(existing?.transcript);
  const [isRecording, setIsRecording] = useState(false);
  const [liveLevels, setLiveLevels] = useState<number[]>([]);
  const [audioNotice, setAudioNotice] = useState("");
  const [transcribing, setTranscribing] = useState(false);

  const recorder = useAudioRecorder(VOICE_RECORDING_OPTIONS);
  const recorderState = useAudioRecorderState(recorder, 200);

  useEffect(() => {
    if (existing) {
      setMood(existing.mood ?? 3);
      setFeelings(existing.feelings ?? []);
      setInfluences(existing.influences ?? []);
      setText(existing.text ?? "");
      setPrompt(existing.prompt);
      setAudioClip(existing.audio);
      setTranscriptState(existing.transcript);
    }
  }, [existing]);

  // Sample metering every ~200ms
  useEffect(() => {
    if (isRecording) {
      const lvl = normalizeDb(recorderState.metering);
      setLiveLevels((prev) => [...prev, lvl]);
      if (recorderState.durationMillis >= MAX_RECORDING_MS) {
        handleStopRecording();
      }
    }
  }, [recorderState.durationMillis, isRecording]);

  // Back (the phone's button or the header) steps back through the wizard; on the first step, unsaved words or a
  // recording get a "leave without saving?" first. Files recorded here are cleaned up if the entry isn't saved.
  const navigation = useNavigation();
  const startText = existing?.text ?? (template === "braindump" ? BRAIN_DUMP : "");
  const dirty = text.trim() !== startText.trim() || audioClip?.uri !== existing?.audio?.uri;
  useEffect(
    () =>
      navigation.addListener("beforeRemove", (e) => {
        if (savedRef.current) return;
        if (step > 1 && !bridge && !showSupport) {
          e.preventDefault();
          setStep(step - 1);
          return;
        }
        if (!dirty) return;
        e.preventDefault();
        showAlert("Leave without saving?", "What you wrote or recorded here will be lost.", [
          { text: "Keep writing", style: "cancel" },
          { text: "Leave", style: "destructive", onPress: () => navigation.dispatch(e.data.action) },
        ]);
      }),
    [navigation, step, dirty, bridge, showSupport],
  );
  useEffect(
    () => () => {
      if (!savedRef.current) for (const uri of sessionFiles.current) void deleteAudioFile(uri);
    },
    [],
  );

  const toggleFeeling = (fid: string) => {
    if (feelings.includes(fid)) {
      setFeelings(feelings.filter((f) => f !== fid));
    } else if (feelings.length < 3) {
      setFeelings([...feelings, fid]);
    }
  };

  const toggleInfluence = (iid: string) => {
    if (influences.includes(iid)) {
      setInfluences(influences.filter((i) => i !== iid));
    } else if (influences.length < 2) {
      setInfluences([...influences, iid]);
    }
  };

  const startVoiceRecording = async () => {
    const granted = await ensureMicPermission();
    if (!granted) {
      showAlert("Microphone Permission", "MAX needs microphone access to record voice journal entries.");
      return;
    }
    setAudioNotice("");
    setLiveLevels([]);
    try {
      await recorder.prepareToRecordAsync();
      recorder.record();
      setIsRecording(true);
    } catch (e) {
      console.warn("Failed to start voice recording:", e);
      setAudioNotice("Could not start recording. Try again.");
    }
  };

  const handleStopRecording = async () => {
    try {
      setIsRecording(false);
      await recorder.stop();
      const tempUri = recorder.uri;
      const ms = recorderState.durationMillis || 1500;
      if (!tempUri) return;

      const downsampled = downsample(liveLevels, 60);
      if (!isUsableClip(ms, downsampled)) {
        setAudioNotice("Didn't catch that — try again");
        return;
      }

      // a new file name per recording, so re-recording never overwrites the note already saved with the entry
      const saved = await saveAudioToPermanentStorage(tempUri, `${entryIdRef.current}-${Date.now().toString(36)}`, liveLevels, ms);
      if (saved) {
        sessionFiles.current.push(saved.uri);
        setAudioClip(saved);
        setAudioNotice("");
        if (consents.voice) {
          triggerTranscribe(saved.uri);
        } else {
          setTranscriptState({ status: "pending" });
        }
      }
    } catch (e) {
      console.warn("Failed to stop voice recording:", e);
    }
  };

  const discardAudio = async () => {
    // the file itself goes on Save (or when leaving without saving, if it was made here)
    setAudioClip(undefined);
    setTranscriptState(undefined);
    setLiveLevels([]);
  };

  const triggerTranscribe = async (fileUri: string) => {
    setTranscribing(true);
    setAudioNotice("");
    try {
      const rawText = await transcribeAudioFile(fileUri);
      if (rawText) {
        const raw = rawText.trim();
        const tagRes = await suggestTags(raw);
        const roman = acceptRoman(raw, tagRes.roman);
        setTranscriptState({ raw, roman, status: "done" });
        if (tagRes.feelings.length > 0) {
          setFeelings((prev) => Array.from(new Set([...prev, ...tagRes.feelings])).slice(0, 3));
        }
        if (tagRes.influences.length > 0) {
          setInfluences((prev) => Array.from(new Set([...prev, ...tagRes.influences])).slice(0, 2));
        }
      } else {
        setTranscriptState({ status: "pending" });
      }
    } catch {
      setTranscriptState({ status: "pending" });
    } finally {
      setTranscribing(false);
    }
  };

  const promptVoiceConsentAndTranscribe = (fileUri: string) => {
    if (consents.voice) {
      triggerTranscribe(fileUri);
      return;
    }

    showAlert(
      "Voice Transcription",
      "Your recording is sent through our server to Groq, the AI service, to turn it into text. Our server does not keep it. You can turn this off in Settings.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Agree & Transcribe",
          onPress: () => {
            update((s) => ({
              consents: { ...s.consents, voice: true },
            }));
            triggerTranscribe(fileUri);
          },
        },
      ]
    );
  };

  const doSave = (finalFeelings = feelings, finalInfluences = influences) => {
    // one save, however fast the button is tapped
    if (savedRef.current) return;
    savedRef.current = true;
    const keep = audioClip?.uri;
    for (const uri of [...sessionFiles.current, existing?.audio?.uri]) if (uri && uri !== keep) void deleteAudioFile(uri);
    sessionFiles.current = [];
    const now = Date.now();
    const entryId = existing?.id ?? entryIdRef.current;
    const entryData: Entry = {
      id: entryId,
      at: existing?.at ?? now,
      updatedAt: now,
      mood,
      feelings: finalFeelings,
      influences: finalInfluences,
      text: text.trim(),
      prompt,
      ...(audioClip ? { audio: audioClip } : {}),
      ...(transcriptState ? { transcript: transcriptState } : {}),
    };

    if (existing) {
      update((s) => ({
        entries: s.entries.map((e) => (e.id === existing.id ? entryData : e)),
      }));
    } else {
      update((s) => ({
        entries: [entryData, ...s.entries],
      }));
    }
    logActivity("journal", entryData.id);

    if (transcriptState?.status === "pending") {
      processPendingTranscripts();
    }

    // The entry is saved either way. If the words suggest danger, help comes before the screen closes.
    if (classifyRisk(entryData.text ?? "").level === "crisis") {
      setShowSupport(true);
      return;
    }
    // A gentle next step when the feelings picked suggest one (anxious → grounding, lonely → talk…).
    const next = journalBridge(entryData, getState());
    if (next && !existing) {
      setBridge(next);
      return;
    }
    router.back();
  };

  const handleNextFromText = async () => {
    const cleanText = text.trim();
    if (!cleanText && !audioClip) return;

    if (!cleanText || !consents.ai || cleanText.length < 15) {
      doSave();
      return;
    }

    setLoadingAi(true);
    let timedOut = false;
    const timer = setTimeout(() => {
      timedOut = true;
      setLoadingAi(false);
      doSave();
    }, 2500);

    try {
      const res = await suggestTags(cleanText);
      clearTimeout(timer);
      if (timedOut) return;

      setLoadingAi(false);
      if (res.feelings.length > 0 || res.influences.length > 0) {
        const mergedFeelings = Array.from(new Set([...feelings, ...res.feelings])).slice(0, 3);
        const mergedInfluences = Array.from(new Set([...influences, ...res.influences])).slice(0, 2);
        setFeelings(mergedFeelings);
        setInfluences(mergedInfluences);
        setStep(5);
      } else {
        doSave();
      }
    } catch {
      clearTimeout(timer);
      if (!timedOut) {
        setLoadingAi(false);
        doSave();
      }
    }
  };

  const canSave = text.trim().length > 0 || !!audioClip;

  if (bridge) {
    return (
      <Page>
        <View style={{ gap: space.lg, paddingBottom: space.xl }}>
          <View style={{ alignItems: "center" }}>
            <Max state="care" size={88} />
          </View>
          <T v="heading">Saved. Thank you for writing it down.</T>
          <T soft>{bridge.reason}</T>
          <Button
            kind="accent"
            label={bridge.title}
            onPress={() => {
              router.back();
              router.push(bridge.href as Href);
            }}
          />
          <Button kind="quiet" label="Not now" onPress={() => router.back()} />
        </View>
      </Page>
    );
  }

  if (showSupport) {
    return (
      <Page>
        <View style={{ gap: space.lg, paddingBottom: space.xl }}>
          <View style={{ alignItems: "center" }}>
            <Max state="care" size={96} />
          </View>
          <T v="heading">Saved. Thank you for writing that down.</T>
          <T soft>What you wrote sounds really heavy. You do not have to carry it alone tonight.</T>
          <CrisisCard />
          <Button kind="quiet" label="Close" onPress={() => router.back()} />
        </View>
      </Page>
    );
  }

  return (
    <Page>
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        {/* Step indicator */}
        <View style={{ flexDirection: "row", gap: space.xs, alignItems: "center" }}>
          {[1, 2, 3, 4].map((s) => (
            <View
              key={s}
              style={{
                flex: 1,
                height: 4,
                borderRadius: 2,
                backgroundColor: s <= step ? t.ink : t.hair,
              }}
            />
          ))}
        </View>

        {/* STEP 1: Mood */}
        {step === 1 && (
          <View style={{ gap: space.md }}>
            <View style={{ gap: 2 }}>
              <T v="title">How are you feeling right now?</T>
              <T soft>Pick the baseline for this moment</T>
            </View>

            <View style={{ gap: space.sm, marginTop: space.sm }}>
              {MOOD_OPTIONS.map((opt) => (
                <Pressable
                  key={opt.value}
                  accessibilityRole="button"
                  accessibilityLabel={`Mood ${opt.label}`}
                  onPress={() => setMood(opt.value)}
                  style={{
                    padding: space.md,
                    borderRadius: 14,
                    borderWidth: 1.5,
                    borderColor: mood === opt.value ? t.ink : t.hair,
                    backgroundColor: mood === opt.value ? t.raised : t.paper,
                    flexDirection: "row",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}>
                  <T style={mood === opt.value ? { fontWeight: "600" } : undefined}>{opt.label}</T>
                  {mood === opt.value ? <DoodleIcon name="check" size={18} color={t.ink} /> : null}
                </Pressable>
              ))}
            </View>

            <View style={{ marginTop: space.md }}>
              <Button label="Next" onPress={() => setStep(2)} />
            </View>
          </View>
        )}

        {/* STEP 2: Feelings */}
        {step === 2 && (
          <View style={{ gap: space.md }}>
            <View style={{ gap: 2 }}>
              <T v="title">What words fit best?</T>
              <T soft>{`Select up to 3 (${feelings.length}/3 selected)`}</T>
            </View>

            <Section title="Good & Energised">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {FEELINGS.filter((f) => f.q === "yellow").map((f) => (
                  <Chip
                    key={f.id}
                    label={f.label}
                    selected={feelings.includes(f.id)}
                    role="checkbox"
                    onPress={() => toggleFeeling(f.id)}
                  />
                ))}
              </View>
            </Section>

            <Section title="Good & Calm">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {FEELINGS.filter((f) => f.q === "green").map((f) => (
                  <Chip
                    key={f.id}
                    label={f.label}
                    selected={feelings.includes(f.id)}
                    role="checkbox"
                    onPress={() => toggleFeeling(f.id)}
                  />
                ))}
              </View>
            </Section>

            <Section title="Tough & Intense">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {FEELINGS.filter((f) => f.q === "red").map((f) => (
                  <Chip
                    key={f.id}
                    label={f.label}
                    selected={feelings.includes(f.id)}
                    role="checkbox"
                    onPress={() => toggleFeeling(f.id)}
                  />
                ))}
              </View>
            </Section>

            <Section title="Tough & Low">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {FEELINGS.filter((f) => f.q === "blue").map((f) => (
                  <Chip
                    key={f.id}
                    label={f.label}
                    selected={feelings.includes(f.id)}
                    role="checkbox"
                    onPress={() => toggleFeeling(f.id)}
                  />
                ))}
              </View>
            </Section>

            <View style={{ marginTop: space.sm }}>
              <Button label="Next" onPress={() => setStep(3)} />
              <Button kind="quiet" label="Back" onPress={() => setStep(1)} />
            </View>
          </View>
        )}

        {/* STEP 3: Influences */}
        {step === 3 && (
          <View style={{ gap: space.md }}>
            <View style={{ gap: 2 }}>
              <T v="title">What influenced this?</T>
              <T soft>{`Select up to 2 (${influences.length}/2 selected)`}</T>
            </View>

            <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: space.sm }}>
              {INFLUENCES.map((inf) => (
                <Chip
                  key={inf.id}
                  label={inf.label}
                  selected={influences.includes(inf.id)}
                  role="checkbox"
                  onPress={() => toggleInfluence(inf.id)}
                />
              ))}
            </View>

            <View style={{ marginTop: space.md }}>
              <Button label="Next" onPress={() => setStep(4)} />
              <Button kind="quiet" label="Back" onPress={() => setStep(2)} />
            </View>
          </View>
        )}

        {/* STEP 4: Write or Speak */}
        {step === 4 && (
          <View style={{ gap: space.md }}>
            <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
              <T v="title">Write or speak</T>
              {/* voice notes need the app (microphone and files on the phone) */}
              {!isWeb && !audioClip && !isRecording ? (
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Record voice note"
                  onPress={startVoiceRecording}
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    gap: 6,
                    paddingHorizontal: space.sm,
                    paddingVertical: 6,
                    borderRadius: 12,
                    borderWidth: 1.5,
                    borderColor: t.hair,
                    backgroundColor: t.raised,
                  }}>
                  <DoodleIcon name="mic" size={16} color={t.ink} />
                  <T v="small" style={{ fontWeight: "600" }}>Voice</T>
                </Pressable>
              ) : null}
            </View>

            {/* Live Recording Panel */}
            {isRecording ? (
              <View
                style={{
                  borderWidth: 1.5,
                  borderColor: t.ink,
                  borderRadius: 14,
                  padding: space.md,
                  gap: space.sm,
                  backgroundColor: t.raised,
                }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
                    <Max state="listening" size={54} />
                    <View style={{ gap: 2 }}>
                      <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
                        <View
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: 4,
                            backgroundColor: t.help,
                          }}
                        />
                        <T style={{ fontWeight: "600" }}>Recording...</T>
                      </View>
                      <T v="small" soft>Listening to your voice</T>
                    </View>
                  </View>
                  <T v="small" soft>
                    {`${Math.floor((recorderState.durationMillis || 0) / 1000)}s / 120s`}
                  </T>
                </View>

                <Waveform levels={liveLevels.slice(-30)} live height={36} />

                <View style={{ marginTop: space.xs }}>
                  <Button label="Stop & save audio" onPress={handleStopRecording} />
                </View>
              </View>
            ) : null}

            {/* Recorded Audio Preview */}
            {audioClip && !isRecording ? (
              <View style={{ gap: space.xs }}>
                <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                  <T v="small" style={{ fontWeight: "600" }}>VOICE NOTE</T>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel="Discard audio recording"
                    onPress={discardAudio}
                    hitSlop={12}
                    style={{ padding: 4 }}>
                    <DoodleIcon name="trash" size={16} color={t.ink2} />
                  </Pressable>
                </View>

                <Player uri={audioClip.uri} ms={audioClip.ms} levels={audioClip.levels} />

                {transcriptState?.status === "done" && (transcriptState.roman || transcriptState.raw) ? (
                  <View
                    style={{
                      marginTop: space.xs,
                      padding: space.sm,
                      borderRadius: 10,
                      backgroundColor: t.raised,
                      borderWidth: 1,
                      borderColor: t.hair,
                    }}>
                    <T v="small" soft style={{ fontStyle: "italic" }}>
                      {`"${transcriptState.roman ?? transcriptState.raw}"`}
                    </T>
                  </View>
                ) : transcribing ? (
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.xs, marginTop: 4 }}>
                    <ActivityIndicator size="small" color={t.ink} />
                    <T v="small" soft>Transcribing voice note...</T>
                  </View>
                ) : (
                  <Pressable
                    accessibilityRole="button"
                    hitSlop={12}
                    onPress={() => promptVoiceConsentAndTranscribe(audioClip.uri)}
                    style={{ marginTop: 4, alignSelf: "flex-start" }}>
                    <T v="small" style={{ fontWeight: "600", textDecorationLine: "underline" }}>
                      Transcribe voice note
                    </T>
                  </Pressable>
                )}
              </View>
            ) : null}

            {audioNotice ? (
              <T v="small" style={{ color: t.help }}>
                {audioNotice}
              </T>
            ) : null}

            <View style={{ gap: space.sm }}>
              <T soft>Start freely or tap a prompt:</T>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                keyboardShouldPersistTaps="handled"
                contentContainerStyle={{ gap: space.sm, paddingRight: space.md }}
                style={{ marginHorizontal: -space.md, paddingHorizontal: space.md }}>
                <Chip
                  label="Exam brain dump"
                  selected={prompt === "Exam brain dump"}
                  onPress={() => {
                    if (prompt === "Exam brain dump") return setPrompt(undefined);
                    setPrompt("Exam brain dump");
                    if (!text.trim()) setText(BRAIN_DUMP);
                  }}
                />
                {PROMPTS.map((p) => (
                  <Chip
                    key={p}
                    label={p}
                    selected={prompt === p}
                    onPress={() => setPrompt(prompt === p ? undefined : p)}
                  />
                ))}
              </ScrollView>
            </View>

            <Field
              value={text}
              maxLength={5000}
              onChangeText={setText}
              multiline
              placeholder={prompt ?? "What is happening right now? How does it feel in your body?"}
              style={{ minHeight: 130 }}
              accessibilityLabel="Journal entry content"
            />

            {loadingAi ? (
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: space.sm, paddingVertical: space.md }}>
                <ActivityIndicator color={t.ink} />
                <T soft>Understanding your entry...</T>
              </View>
            ) : (
              <Button
                label={consents.ai && text.trim().length >= 15 ? "Next" : "Save entry"}
                onPress={handleNextFromText}
                disabled={!canSave}
              />
            )}
            {!loadingAi && !isRecording ? <Button kind="quiet" label="Back" onPress={() => setStep(3)} /> : null}
          </View>
        )}

        {/* STEP 5: Looks right? (AI Tag review) */}
        {step === 5 && (
          <View style={{ gap: space.md }}>
            <View style={{ gap: 2 }}>
              <T v="title">Looks right?</T>
              <T soft>We noticed these feelings and themes in your writing. You can change them before saving.</T>
            </View>

            <Section title="Feelings (up to 3)">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {FEELINGS.map((f) => (
                  <Chip
                    key={f.id}
                    label={f.label}
                    selected={feelings.includes(f.id)}
                    role="checkbox"
                    onPress={() => toggleFeeling(f.id)}
                  />
                ))}
              </View>
            </Section>

            <Section title="Influenced by (up to 2)">
              <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm }}>
                {INFLUENCES.map((inf) => (
                  <Chip
                    key={inf.id}
                    label={inf.label}
                    selected={influences.includes(inf.id)}
                  role="checkbox"
                    onPress={() => toggleInfluence(inf.id)}
                  />
                ))}
              </View>
            </Section>

            <View style={{ marginTop: space.sm }}>
              <Button label="Save entry" onPress={() => doSave()} />
              <Button kind="quiet" label="Back" onPress={() => setStep(4)} />
            </View>
          </View>
        )}
      </View>
    </Page>
  );
}

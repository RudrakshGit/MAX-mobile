import React, { useEffect, useState } from "react";
import { Pressable, View } from "react-native";
import { Redirect, Stack } from "expo-router";
import { Max, type MaxState } from "@/components/max";
import { MaxRig } from "@/components/max/rig/MaxRig";
import { BLINK_CLIP, CLIPS, type ClipName } from "@/components/max/rig/clips";
import { DEFAULT_FACE, NO_MARKS, REST, clipLength, type Clip } from "@/components/max/rig/pose";
import { sampleFace, sampleMarks, samplePose } from "@/components/max/rig/sample";
import { useRigPlayer, useRigValues } from "@/components/max/rig/useRigPlayer";
import { space, useTheme } from "@/lib/theme";
import { Page, Section, T } from "@/lib/ui";

// Developer builds only: MAX's clips, played live and frozen as a filmstrip (six moments), so motion can be checked from
// screenshots (docs/history.md, "How an agent checks motion"). Release builds redirect home.

const STATES: MaxState[] = ["idle", "wave", "thinking", "listening", "breathe", "cheer", "care", "empty", "sleep"];
const NAMES = [...(Object.keys(CLIPS) as ClipName[]), "blink" as const];
const clipOf = (n: ClipName | "blink"): Clip => (n === "blink" ? BLINK_CLIP : CLIPS[n]);

export default function MaxLab() {
  if (!__DEV__) return <Redirect href="/" />;
  return <Lab />;
}

function Lab() {
  const t = useTheme();
  const [clip, setClip] = useState<ClipName | "blink">("wave");
  const [run, setRun] = useState(0);
  // one MAX per section: every SVG element sends a layout event when first drawn, and dozens of MAXes at once
  // stall a debug build
  const [state, setState] = useState<MaxState>("idle");
  return (
    <Page>
      <Stack.Screen options={{ title: "MAX lab" }} />
      <View style={{ gap: space.lg, paddingBottom: space.xxl }}>
        {/* buttons and the filmstrip first, so one screenshot shows a whole clip */}
        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
          {NAMES.map((n) => (
            <Pressable
              key={n}
              accessibilityRole="button"
              accessibilityLabel={`Play ${n}`}
              onPress={() => {
                setClip(n);
                setRun((r) => r + 1);
              }}
              style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: n === clip ? t.ink : t.rule }}>
              <T v="small">{n}</T>
            </Pressable>
          ))}
        </View>
        <Section title={`Filmstrip: ${clip} (${clipLength(clipOf(clip))} ms)`}>
          <Filmstrip clip={clipOf(clip)} />
        </Section>
        <Section title="Live">
          <View style={{ alignItems: "center", paddingVertical: space.xl }}>
            <LiveRig clip={clip} run={run} />
          </View>
        </Section>
        <Section title="A state as screens use it">
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 6 }}>
            {STATES.map((s) => (
              <Pressable key={s} accessibilityRole="button" onPress={() => setState(s)} style={{ paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, borderWidth: 1, borderColor: s === state ? t.ink : t.rule }}>
                <T v="small">{s}</T>
              </Pressable>
            ))}
          </View>
          <View style={{ alignItems: "center", paddingVertical: space.xl }}>
            <Max key={state} state={state} size={120} />
          </View>
        </Section>
      </View>
    </Page>
  );
}

function LiveRig({ clip, run }: { clip: ClipName | "blink"; run: number }) {
  const t = useTheme();
  const player = useRigPlayer({ still: false, blinking: true });
  const { play } = player;
  useEffect(() => {
    const c = clipOf(clip);
    play(c, c.kind === "action" ? { onDone: () => play(CLIPS.idle) } : {});
  }, [clip, run, play]);
  return (
    <MaxRig size={180} values={player.values} face={player.face} marks={player.marks} ink={t.characterInk} paper={t.characterPaper} foot={t.characterFoot} markInk={t.ink} blush blushColor={t.characterBlush} still={false} />
  );
}

/** Eight frozen moments of a clip, evenly spaced, each its own rig with the sampled pose. */
function Filmstrip({ clip }: { clip: Clip }) {
  const len = clipLength(clip);
  const times = Array.from({ length: 6 }, (_, i) => Math.round((len * i) / 5));
  return (
    <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: space.lg, paddingVertical: space.lg }}>
      {times.map((ms) => (
        <View key={`${clip.name}-${ms}`} style={{ alignItems: "center", gap: 2, width: "32%", paddingTop: 12 }}>
          <Frame clip={clip} ms={ms} />
          <T v="small" soft>{`${ms}`}</T>
        </View>
      ))}
    </View>
  );
}

function Frame({ clip, ms }: { clip: Clip; ms: number }) {
  const t = useTheme();
  const v = useRigValues(samplePose(clip, ms, REST));
  return (
    <MaxRig
      size={64}
      values={v}
      face={sampleFace(clip, ms, DEFAULT_FACE)}
      marks={sampleMarks(clip, ms, NO_MARKS)}
      ink={t.characterInk}
      paper={t.characterPaper}
      foot={t.characterFoot}
      markInk={t.ink}
      blush
      blushColor={t.characterBlush}
      still
    />
  );
}

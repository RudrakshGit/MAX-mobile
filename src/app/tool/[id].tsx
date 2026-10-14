import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";
import { traps } from "@/content/learn";
import { logActivity, newId, update, useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, Choice, Field, Page, T } from "@/lib/ui";
import { Max } from "@/components/max";
import { Frame } from "@/ui/sketch/Frame";

const titles: Record<string, string> = { breathe: "One-minute reset", ground: "5-4-3-2-1", reframe: "Thought reframe", spiral: "Spiral breaker" };

export default function Tool() {
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) logActivity("do", id);
  }, [id]);

  const Body = { breathe: Breathe, ground: Ground, reframe: ReframeTool, spiral: Spiral }[id ?? ""];
  return (
    <Page>
      <Stack.Screen options={{ title: titles[id ?? ""] ?? "Tool" }} />
      {Body ? <Body /> : <T>Tool not found.</T>}
    </Page>
  );
}

type BreathPattern = "sigh" | "box" | "478";

const patterns: Record<
  BreathPattern,
  {
    label: string;
    sub: string;
    desc: string;
    phases: { label: string; to: number; ms: number }[];
  }
> = {
  sigh: {
    label: "Cyclic sigh",
    sub: "Two breaths in, one long breath out",
    desc: "Stanford protocol (Balban et al., 2023): two quick inhales, slow exhale. Fastest nervous system reset.",
    phases: [
      { label: "Breathe in through your nose", to: 0.85, ms: 2000 },
      { label: "A little more", to: 1, ms: 1000 },
      { label: "Slowly out through your mouth", to: 0.55, ms: 6000 },
    ],
  },
  box: {
    label: "Box (4-4-4-4)",
    sub: "4s in, 4s hold, 4s out, 4s hold",
    desc: "Equal duration pacing. Steadies focus and quiets adrenaline spikes before stressful events.",
    phases: [
      { label: "Breathe in slowly", to: 1, ms: 4000 },
      { label: "Hold your breath", to: 1, ms: 4000 },
      { label: "Breathe out smoothly", to: 0.55, ms: 4000 },
      { label: "Hold empty", to: 0.55, ms: 4000 },
    ],
  },
  "478": {
    label: "4-7-8 breath",
    sub: "4s in, 7s hold, 8s out",
    desc: "Parasympathetic brake (Weil protocol). Extended exhale slows the heart rate before sleep.",
    phases: [
      { label: "Breathe in through nose", to: 1, ms: 4000 },
      { label: "Hold gently", to: 1, ms: 7000 },
      { label: "Slowly exhale through mouth", to: 0.55, ms: 8000 },
    ],
  },
};
const TOTAL_MS = 60_000;

function Breathe() {
  const t = useTheme();
  const [pattern, setPattern] = useState<BreathPattern>("sigh");
  const currentPattern = patterns[pattern];
  const phases = currentPattern.phases;

  const scale = useRef(new Animated.Value(0.55)).current;
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(60);

  useEffect(() => {
    if (!running) return;
    let alive = true;
    const start = Date.now();
    let still = false;
    AccessibilityInfo.isReduceMotionEnabled().then((r) => (still = r));
    const step = (i: number) => {
      if (!alive) return;
      if (Date.now() - start >= TOTAL_MS) return setRunning(false);
      setPhase(i);
      const p = phases[i];
      Animated.timing(scale, {
        toValue: still ? 0.8 : p.to,
        duration: p.ms,
        easing: Easing.inOut(Easing.sin),
        useNativeDriver: true,
      }).start(() => step((i + 1) % phases.length));
    };
    step(0);
    const tick = setInterval(
      () => setLeft(Math.max(0, Math.ceil((TOTAL_MS - (Date.now() - start)) / 1000))),
      500
    );
    return () => {
      alive = false;
      clearInterval(tick);
      scale.stopAnimation();
    };
  }, [running, scale, phases]);

  return (
    <View style={{ alignItems: "center", gap: space.md, paddingTop: space.md }}>
      {!running ? (
        <View style={{ width: "100%", gap: space.sm, alignItems: "center" }}>
          <Choice
            options={[
              { label: "Cyclic sigh", value: "sigh" },
              { label: "Box (4-4-4-4)", value: "box" },
              { label: "4-7-8", value: "478" },
            ]}
            value={pattern}
            onChange={(val) => setPattern(val as BreathPattern)}
          />
          <T v="small" soft style={{ textAlign: "center", paddingHorizontal: space.md }}>
            {currentPattern.desc}
          </T>
        </View>
      ) : null}

      <View style={{ width: 250, height: 250, alignItems: "center", justifyContent: "center", marginVertical: space.md }}>
        {/* Outer breathing aura ring */}
        <Animated.View
          style={{
            position: "absolute",
            width: 250,
            height: 250,
            borderRadius: 125,
            borderWidth: 1.5,
            borderColor: t.rule,
            backgroundColor: t.raised,
            opacity: running ? 0.5 : 0.25,
            transform: [{ scale }],
          }}
        />
        {/* Middle breathing ring */}
        <Animated.View
          style={{
            position: "absolute",
            width: 205,
            height: 205,
            borderRadius: 102.5,
            borderWidth: 1.5,
            borderColor: t.rule,
            borderStyle: "dashed",
            backgroundColor: t.hair,
            opacity: running ? 0.7 : 0.35,
            transform: [{ scale }],
          }}
        />
        {/* Inner pulse ring */}
        <Animated.View
          style={{
            position: "absolute",
            width: 165,
            height: 165,
            borderRadius: 82.5,
            borderWidth: 1.5,
            borderColor: t.ink,
            opacity: running ? 0.35 : 0.15,
            transform: [{ scale }],
          }}
        />
        {/* Static MAX character resting peacefully in center (does NOT scale) */}
        <View
          style={{
            width: 135,
            height: 135,
            borderRadius: 67.5,
            backgroundColor: t.paper,
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10,
          }}>
          <Max state="breathe" size={120} boil />
        </View>
      </View>
      <T v="title" style={{ textAlign: "center", minHeight: 56 }}>
        {running
          ? phases[phase].label
          : left === 0
          ? "Well done. Notice how your body feels now."
          : currentPattern.sub}
      </T>
      {running ? <T soft>{`${left} seconds left`}</T> : null}
      <Button
        kind={running ? "quiet" : "primary"}
        label={running ? "Stop" : left === 0 ? "Go again" : "Start one minute"}
        onPress={() => {
          setLeft(60);
          setRunning(!running);
        }}
      />
      <T v="small" soft style={{ textAlign: "center", paddingHorizontal: space.md }}>
        The long exhale is what triggers your parasympathetic brake. If you feel lightheaded, pause and breathe normally.
      </T>
    </View>
  );
}

const senses = [
  { n: 5, text: "things you can see. Look for small details: a crack, a colour, a shadow." },
  { n: 4, text: "things you can feel. Your feet on the floor, your clothes, the air on your skin." },
  { n: 3, text: "things you can hear. Near and far." },
  { n: 2, text: "things you can smell. Or two smells you like, if nothing's around." },
  { n: 1, text: "thing you can taste. Or one kind thing you can say to yourself." },
];

function Ground() {
  const t = useTheme();
  const [i, setI] = useState(0);
  const done = i >= senses.length;
  return (
    <View style={{ gap: space.lg, paddingTop: space.md }}>
      <T soft>When your mind is racing, pulling attention into your senses gives it something steady to hold. Go slowly. Say them out loud if you can.</T>
      {done ? (
        <T v="title">You're here. Take one more slow breath before you go on.</T>
      ) : (
        <View style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
          <T v="display" style={{ fontSize: 64, lineHeight: 72, color: t.ink }}>{String(senses[i].n)}</T>
          <T v="title" style={{ flex: 1, paddingTop: space.sm }}>{senses[i].text}</T>
        </View>
      )}
      <Button label={done ? "Start again" : i === senses.length - 1 ? "Finish" : "Next"} onPress={() => setI(done ? 0 : i + 1)} />
    </View>
  );
}

function ReframeTool() {
  const t = useTheme();
  const saved = useStore((s) => s.reframes);
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [trap, setTrap] = useState<string>();
  const [balanced, setBalanced] = useState("");
  const ok = situation.trim() && thought.trim() && trap && balanced.trim();

  const save = () => {
    update((s) => ({ reframes: [...s.reframes, { id: newId(), at: Date.now(), situation: situation.trim(), thought: thought.trim(), trap: trap!, balanced: balanced.trim() }] }));
    setSituation(""); setThought(""); setTrap(undefined); setBalanced("");
  };

  return (
    <View style={{ gap: space.lg }}>
      <Step n={1} q="What happened?"><Field value={situation} onChangeText={setSituation} multiline placeholder="Just the facts, like a camera would see it" style={{ minHeight: 80 }} /></Step>
      <Step n={2} q="What went through your mind?"><Field value={thought} onChangeText={setThought} multiline placeholder="The thought that stung the most" style={{ minHeight: 80 }} /></Step>
      <Step n={3} q="Does it fall into a thinking trap?"><Choice options={traps.map((x) => ({ label: x, value: x }))} value={trap} onChange={setTrap} /></Step>
      <Step n={4} q="What's a fairer way to see it?">
        <T v="small" soft>What's the evidence for and against it? What would you tell a friend? Will this matter in a year?</T>
        <Field value={balanced} onChangeText={setBalanced} multiline placeholder="Not forced positive, just more balanced" style={{ minHeight: 80 }} />
      </Step>
      <Button label="Save reframe" onPress={save} disabled={!ok} />
      {saved.length ? (
        <View style={{ gap: space.md, marginTop: space.lg }}>
          <T v="title">Your reframes</T>
          {[...saved].reverse().slice(0, 10).map((r) => (
            <View key={r.id} style={{ gap: 4, paddingBottom: space.md, borderBottomWidth: 1, borderBottomColor: t.rule }}>
              <T v="small" soft>{`${r.trap} · ${new Date(r.at).toLocaleDateString("en-IN")}`}</T>
              <T soft style={{ textDecorationLine: "line-through" }}>{r.thought}</T>
              <T v="voice">{r.balanced}</T>
            </View>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Spiral() {
  const t = useTheme();
  const saved = useStore((s) => s.plans);
  const [trigger, setTrigger] = useState("");
  const [usual, setUsual] = useState("");
  const [instead, setInstead] = useState("");
  const ok = trigger.trim() && usual.trim() && instead.trim();

  const save = () => {
    update((s) => ({ plans: [...s.plans, { id: newId(), at: Date.now(), trigger: trigger.trim(), usual: usual.trim(), instead: instead.trim() }] }));
    setTrigger(""); setUsual(""); setInstead("");
  };

  return (
    <View style={{ gap: space.lg }}>
      <T soft>Pick one loop that keeps pulling you back. Deciding in advance what you'll do makes it far easier to do it when the moment comes.</T>
      <Step n={1} q="What sets it off?"><Field value={trigger} onChangeText={setTrigger} placeholder="e.g. a bad mark, a silent group chat, 1 a.m." /></Step>
      <Step n={2} q="What do you usually do?"><Field value={usual} onChangeText={setUsual} placeholder="e.g. scroll for hours, skip dinner, shut everyone out" /></Step>
      <Step n={3} q="What small thing will you try instead?"><Field value={instead} onChangeText={setInstead} placeholder="e.g. text one friend, walk for 10 minutes" /></Step>
      <Button label="Save my plan" onPress={save} disabled={!ok} />
      {saved.length ? (
        <View style={{ gap: space.md, marginTop: space.lg }}>
          <T v="title">My if-then plans</T>
          {[...saved].reverse().map((p) => (
            <Frame key={p.id} id={`plan-${p.id}`} fill fillColor={t.paper} strokeColor={t.rule} style={{ padding: space.md, gap: 4 }}>
              <T v="voice">{`If ${p.trigger}, then I will ${p.instead}.`}</T>
              <T v="small" soft>{`Instead of: ${p.usual}`}</T>
            </Frame>
          ))}
        </View>
      ) : null}
    </View>
  );
}

function Step({ n, q, children }: { n: number; q: string; children: React.ReactNode }) {
  const t = useTheme();
  return (
    <View style={{ gap: space.sm }}>
      <View style={{ flexDirection: "row", gap: space.sm, alignItems: "baseline" }}>
        <T v="title" style={{ color: t.ink }}>{String(n)}</T>
        <T v="title" style={{ flex: 1 }}>{q}</T>
      </View>
      {children}
    </View>
  );
}

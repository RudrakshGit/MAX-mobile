import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { AccessibilityInfo, Animated, Easing, View } from "react-native";
import { traps } from "@/content/learn";
import { newId, update, useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, Choice, Field, Page, T } from "@/lib/ui";

const titles: Record<string, string> = { breathe: "One-minute reset", ground: "5-4-3-2-1", reframe: "Thought reframe", spiral: "Spiral breaker" };

export default function Tool() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const Body = { breathe: Breathe, ground: Ground, reframe: ReframeTool, spiral: Spiral }[id ?? ""];
  return (
    <Page>
      <Stack.Screen options={{ title: titles[id ?? ""] ?? "Tool" }} />
      {Body ? <Body /> : <T>Tool not found.</T>}
    </Page>
  );
}

// Cyclic sighing (Balban et al., 2023): inhale, short top-up inhale, long exhale.
const phases = [
  { label: "Breathe in through your nose", to: 0.85, ms: 2000 },
  { label: "A little more", to: 1, ms: 1000 },
  { label: "Slowly out through your mouth", to: 0.55, ms: 6000 },
];
const TOTAL_MS = 60_000;

function Breathe() {
  const t = useTheme();
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
      Animated.timing(scale, { toValue: still ? 0.8 : p.to, duration: p.ms, easing: Easing.inOut(Easing.sin), useNativeDriver: true }).start(() => step((i + 1) % phases.length));
    };
    step(0);
    const tick = setInterval(() => setLeft(Math.max(0, Math.ceil((TOTAL_MS - (Date.now() - start)) / 1000))), 500);
    return () => {
      alive = false;
      clearInterval(tick);
      scale.stopAnimation();
    };
  }, [running, scale]);

  return (
    <View style={{ alignItems: "center", gap: space.lg, paddingTop: space.lg }}>
      <View style={{ width: 240, height: 240, alignItems: "center", justifyContent: "center" }}>
        <Animated.View style={{ position: "absolute", width: 240, height: 240, borderRadius: 120, backgroundColor: t.accentSoft, transform: [{ scale }] }} />
        <Animated.View style={{ width: 150, height: 150, borderRadius: 75, backgroundColor: t.accent, opacity: 0.9, transform: [{ scale }] }} />
      </View>
      <T v="title" style={{ textAlign: "center", minHeight: 60 }}>{running ? phases[phase].label : left === 0 ? "Well done. Notice how you feel now." : "Two breaths in, one long breath out."}</T>
      {running ? <T soft>{`${left} seconds left`}</T> : null}
      <Button kind={running ? "quiet" : "primary"} label={running ? "Stop" : left === 0 ? "Go again" : "Start one minute"} onPress={() => { setLeft(60); setRunning(!running); }} />
      <T v="small" soft style={{ textAlign: "center" }}>The long exhale is what slows your heart rate. If you feel dizzy, stop and breathe normally.</T>
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
          <T v="display" style={{ fontSize: 64, lineHeight: 72, color: t.accent }}>{String(senses[i].n)}</T>
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
            <View key={r.id} style={{ gap: 4, paddingBottom: space.md, borderBottomWidth: 1, borderBottomColor: t.line }}>
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
            <View key={p.id} style={{ padding: space.md, borderRadius: radius.md, backgroundColor: t.paper, borderWidth: 1, borderColor: t.line, gap: 4 }}>
              <T v="voice">{`If ${p.trigger}, then I will ${p.instead}.`}</T>
              <T v="small" soft>{`Instead of: ${p.usual}`}</T>
            </View>
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
        <T v="title" style={{ color: t.accent }}>{String(n)}</T>
        <T v="title" style={{ flex: 1 }}>{q}</T>
      </View>
      {children}
    </View>
  );
}

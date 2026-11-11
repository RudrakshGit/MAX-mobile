import { Stack, useLocalSearchParams } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import Animated, { cancelAnimation, Easing, useAnimatedStyle, useSharedValue, withTiming } from "react-native-reanimated";
import * as Haptics from "expo-haptics";
import { useReducedMotionSafe } from "@/components/max/useReducedMotionSafe";
import { traps } from "@/content/learn";
import { logActivity, newId, update, useStore } from "@/lib/store";
import { radius, space, useTheme } from "@/lib/theme";
import { Button, Choice, CrisisCard, Field, Page, T } from "@/lib/ui";
import { classifyRisk } from "@/safety/classifier";
import { Max } from "@/components/max";
import { Frame } from "@/ui/sketch/Frame";
import { HelpedPrompt } from "@/components/HelpedPrompt";

const titles: Record<string, string> = { breathe: "Reset", ground: "5-4-3-2-1", reframe: "Reframe", spiral: "Spiral breaker" };

export default function Tool() {
  const { id } = useLocalSearchParams<{ id: string }>();

  // counts as done after a real go (20 s on the tool), not when it is opened and closed straight away
  useEffect(() => {
    if (!id) return;
    const t = setTimeout(() => logActivity("do", id), 20_000);
    return () => clearTimeout(t);
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
    /** `to`: how full the lungs are at the end of the phase, 0 (empty) to 1 (full) */
    phases: { label: string; kind: "in" | "hold" | "out"; to: number; ms: number }[];
  }
> = {
  sigh: {
    label: "Cyclic sigh",
    sub: "Two breaths in, one long breath out",
    desc: "Good when you feel tense right now.",
    phases: [
      { label: "Breathe in through your nose", kind: "in", to: 0.7, ms: 2000 },
      { label: "A little more", kind: "in", to: 1, ms: 1000 },
      { label: "Slowly out through your mouth", kind: "out", to: 0, ms: 6000 },
    ],
  },
  box: {
    label: "Box (4-4-4-4)",
    sub: "4s in, 4s hold, 4s out, 4s hold",
    desc: "Good before an exam or a hard talk.",
    phases: [
      { label: "Breathe in slowly", kind: "in", to: 1, ms: 4000 },
      { label: "Hold your breath", kind: "hold", to: 1, ms: 4000 },
      { label: "Breathe out smoothly", kind: "out", to: 0, ms: 4000 },
      { label: "Hold empty", kind: "hold", to: 0, ms: 4000 },
    ],
  },
  "478": {
    label: "4-7-8 breath",
    sub: "4s in, 7s hold, 8s out",
    desc: "Good before sleep.",
    phases: [
      { label: "Breathe in through nose", kind: "in", to: 1, ms: 4000 },
      { label: "Hold gently", kind: "hold", to: 1, ms: 7000 },
      { label: "Slowly exhale through mouth", kind: "out", to: 0, ms: 8000 },
    ],
  },
};
const TOTAL_MS = 60_000;

function Breathe() {
  const t = useTheme();
  const params = useLocalSearchParams<{ pattern?: string }>();
  // A suggestion can open a pattern directly (4-7-8 at night); otherwise 4-7-8 after 10 pm, cyclic sigh by day.
  const hour = new Date().getHours();
  const initial: BreathPattern =
    params.pattern === "478" || params.pattern === "box" || params.pattern === "sigh" ? params.pattern : hour >= 22 || hour < 5 ? "478" : "sigh";
  const [pattern, setPattern] = useState<BreathPattern>(initial);
  const [finished, setFinished] = useState(false);
  const currentPattern = patterns[pattern];
  const phases = currentPattern.phases;

  // One value drives the rings and MAX: how full the lungs are (0 empty, 1 full), on the UI thread.
  const lungs = useSharedValue(0);
  const still = useReducedMotionSafe();
  const [running, setRunning] = useState(false);
  const [phase, setPhase] = useState(0);
  const [left, setLeft] = useState(60);
  const [phaseLeft, setPhaseLeft] = useState(0);

  useEffect(() => {
    if (!running) {
      cancelAnimation(lungs);
      lungs.value = withTiming(0, { duration: 600 });
      return;
    }
    let alive = true;
    const start = Date.now();
    let phaseEnd = 0;
    let timer: ReturnType<typeof setTimeout>;
    const step = (i: number) => {
      if (!alive) return;
      // finish on a full cycle, so it never stops mid-breath
      if (i === 0 && Date.now() - start >= TOTAL_MS) {
        setFinished(true);
        return setRunning(false);
      }
      const p = phases[i];
      setPhase(i);
      phaseEnd = Date.now() + p.ms;
      // a light tap on the phone at each step (turn, hold, second sip): a cue to follow with your eyes closed
      Haptics.selectionAsync().catch(() => {});
      lungs.value = still ? 0.5 : withTiming(p.to, { duration: p.ms, easing: Easing.inOut(Easing.sin) });
      timer = setTimeout(() => step((i + 1) % phases.length), p.ms);
    };
    step(0);
    const tick = setInterval(() => {
      setLeft(Math.max(0, Math.ceil((TOTAL_MS - (Date.now() - start)) / 1000)));
      setPhaseLeft(Math.max(0, Math.ceil((phaseEnd - Date.now()) / 1000)));
    }, 250);
    return () => {
      alive = false;
      clearTimeout(timer);
      clearInterval(tick);
      cancelAnimation(lungs);
    };
  }, [running, phases, still]);

  const ringScale = useAnimatedStyle(() => ({ transform: [{ scale: 0.55 + 0.45 * lungs.value }] }));
  const p = phases[phase];

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
        {/* Three rings grow as the lungs fill and shrink as they empty */}
        <Animated.View style={[{ position: "absolute", width: 250, height: 250, borderRadius: 125, borderWidth: 1.5, borderColor: t.rule, backgroundColor: t.raised, opacity: running ? 0.5 : 0.25 }, ringScale]} />
        <Animated.View style={[{ position: "absolute", width: 205, height: 205, borderRadius: 102.5, borderWidth: 1.5, borderColor: t.rule, borderStyle: "dashed", backgroundColor: t.hair, opacity: running ? 0.7 : 0.35 }, ringScale]} />
        <Animated.View style={[{ position: "absolute", width: 165, height: 165, borderRadius: 82.5, borderWidth: 1.5, borderColor: t.ink, opacity: running ? 0.35 : 0.15 }, ringScale]} />
        {/* MAX breathes with you: fills up on the in-breath, holds, lets the air out of an "o" on the out-breath */}
        <View style={{ width: 135, height: 135, borderRadius: 67.5, backgroundColor: t.paper, alignItems: "center", justifyContent: "center", zIndex: 10 }}>
          <Max state="breathe" size={110} boil={!running} breath={running ? lungs : undefined} breathPhase={running ? p.kind : undefined} />
        </View>
      </View>
      <T v="title" style={{ textAlign: "center", minHeight: 56 }}>
        {running
          ? p.label
          : left === 0
          ? "Well done. Notice how your body feels now."
          : currentPattern.sub}
      </T>
      {running ? (
        <View style={{ alignItems: "center", gap: 2 }}>
          <T v="display" style={{ fontSize: 40, lineHeight: 48 }}>{String(Math.max(1, phaseLeft))}</T>
          <T soft>{left > 0 ? `${left} seconds left` : "Finishing this breath…"}</T>
        </View>
      ) : null}
      <Button
        kind={running ? "quiet" : "primary"}
        label={running ? "Stop" : left === 0 ? "Go again" : "Start one minute"}
        onPress={() => {
          setLeft(60);
          setRunning(!running);
        }}
      />
      {finished && !running ? <HelpedPrompt key={`b-${pattern}`} tool={pattern === "478" ? "breathe478" : "breathe"} /> : null}
      <T v="small" soft style={{ textAlign: "center", paddingHorizontal: space.md }}>
        Feeling dizzy? Stop and breathe normally.
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
        <View style={{ gap: space.lg }}>
          <T v="title">You're here. Take one more slow breath before you go on.</T>
          <HelpedPrompt tool="ground" />
        </View>
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
  const [savedAtOpen] = useState(saved.length);
  const [situation, setSituation] = useState("");
  const [thought, setThought] = useState("");
  const [trap, setTrap] = useState<string>();
  const [balanced, setBalanced] = useState("");
  const ok = situation.trim() && thought.trim() && trap && balanced.trim();
  const [support, setSupport] = useState(false);

  const save = () => {
    // Saved either way; if the words sound unsafe, help shows right here instead of a silent save.
    setSupport(classifyRisk(`${situation} ${thought} ${balanced}`).level === "crisis");
    update((s) => ({ reframes: [...s.reframes, { id: newId(), at: Date.now(), situation: situation.trim(), thought: thought.trim(), trap: trap!, balanced: balanced.trim() }] }));
    setSituation(""); setThought(""); setTrap(undefined); setBalanced("");
  };

  return (
    <View style={{ gap: space.lg }}>
      <Step n={1} q="What happened?"><Field value={situation} maxLength={1000} onChangeText={setSituation} multiline placeholder="Just the facts, like a camera would see it" style={{ minHeight: 80 }} /></Step>
      <Step n={2} q="What went through your mind?"><Field value={thought} maxLength={1000} onChangeText={setThought} multiline placeholder="The thought that stung the most" style={{ minHeight: 80 }} /></Step>
      <Step n={3} q="Does it fall into a thinking trap?"><Choice options={traps.map((x) => ({ label: x, value: x }))} value={trap} onChange={setTrap} /></Step>
      <Step n={4} q="What's a fairer way to see it?">
        <T v="small" soft>What's the evidence for and against it? What would you tell a friend? Will this matter in a year?</T>
        <Field value={balanced} maxLength={1000} onChangeText={setBalanced} multiline placeholder="Not forced positive, just more balanced" style={{ minHeight: 80 }} />
      </Step>
      <Button label="Save reframe" onPress={save} disabled={!ok} />
      {support ? <CrisisCard /> : saved.length > savedAtOpen ? <HelpedPrompt tool="reframe" /> : null}
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
  const [savedAtOpen] = useState(saved.length);
  const [trigger, setTrigger] = useState("");
  const [usual, setUsual] = useState("");
  const [instead, setInstead] = useState("");
  const ok = trigger.trim() && usual.trim() && instead.trim();
  const [support, setSupport] = useState(false);

  const save = () => {
    setSupport(classifyRisk(`${trigger} ${usual} ${instead}`).level === "crisis");
    update((s) => ({ plans: [...s.plans, { id: newId(), at: Date.now(), trigger: trigger.trim(), usual: usual.trim(), instead: instead.trim() }] }));
    setTrigger(""); setUsual(""); setInstead("");
  };

  return (
    <View style={{ gap: space.lg }}>
      <T soft>Pick one loop that keeps pulling you back. Deciding in advance what you'll do makes it far easier to do it when the moment comes.</T>
      <Step n={1} q="What sets it off?"><Field value={trigger} maxLength={200} onChangeText={setTrigger} placeholder="e.g. a bad mark, a silent group chat, 1 a.m." /></Step>
      <Step n={2} q="What do you usually do?"><Field value={usual} maxLength={200} onChangeText={setUsual} placeholder="e.g. scroll for hours, skip dinner, shut everyone out" /></Step>
      <Step n={3} q="What small thing will you try instead?"><Field value={instead} maxLength={200} onChangeText={setInstead} placeholder="e.g. text one friend, walk for 10 minutes" /></Step>
      <Button label="Save my plan" onPress={save} disabled={!ok} />
      {support ? <CrisisCard /> : saved.length > savedAtOpen ? <HelpedPrompt tool="spiral" /> : null}
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

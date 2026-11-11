import { isWeb } from "@/lib/platform";
import { router, useIsFocused, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { PixelRatio, Pressable, View, type LayoutChangeEvent } from "react-native";
import { CARDS } from "@/content/cards";
import { todaysCard } from "@/lib/cards";
import { consistency, moodWords, nextStep } from "@/lib/insights";
import { dailyPlan } from "@/lib/plan";
import {
  getState,
  logActivity,
  today,
  update,
  useStore,
  useToday,
  type CheckIn,
} from "@/lib/store";
import { font, radius, space, useTheme } from "@/lib/theme";
import { Button, Choice, Field, Row, Screen, Section, T } from "@/lib/ui";
import { Balloon } from "@/ui/sketch/Balloon";
import { Checkbox } from "@/ui/sketch/Checkbox";
import { Frame } from "@/ui/sketch/Frame";
import { getSketchPath, seedFrom } from "@/ui/sketch/sketch";
import Svg, { Path } from "react-native-svg";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import { NumberField, type WheelItem } from "@/ui/sketch/Wheel";
import { sendPulse } from "@/lib/api";
import { refreshReminders } from "@/lib/reminders";
import { ReminderOffer } from "@/components/ReminderOffer";
import { afterCheckin, dateKey, rankActions } from "@/lib/personal";
import { hasUsageAccess, measure, usageSupported } from "@/lib/device-usage";
import { Avatar } from "@/ui/Avatar";
import { useReducedMotionSafe } from "@/components/max/useReducedMotionSafe";
import { Max } from "@/components/max";
import { TIRED_WALK_CYCLE_MS, WALK_CYCLE_MS, walkSpeed } from "@/components/max/Max";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { bucket } from "@/lib/screen-time";

/** MAX beside the thought balloon on Home, in dp. */
const HOME_MAX_SIZE = 96;
const sleepWords = ["badly", "poorly", "okay", "well", "deeply"];
const stressWords = ["calm", "light", "some", "heavy", "intense"];
/** Minutes of phone in the hour before sleep, in steps of 5, on a wheel. */
const PHONE_MINUTES: WheelItem<number>[] = Array.from({ length: 13 }, (_, i) => ({ label: i === 0 ? "None" : `${i * 5} min`, value: i * 5 }));
const toFive = (min: number) => Math.min(60, Math.max(0, Math.round(min / 5) * 5));
const words = (w: string[]) => w.map((label, i) => ({ label, value: i + 1 }));

function greetingText(name?: string, h = new Date().getHours()) {
  let timeStr = "Good evening";
  if (h < 5) timeStr = "Still up";
  else if (h < 12) timeStr = "Good morning";
  else if (h < 17) timeStr = "Good afternoon";

  const cleanName = name?.trim();
  return cleanName ? `${timeStr}, ${cleanName}` : `${timeStr}.`;
}

function isReturningUser(s: ReturnType<typeof getState>, todayDate: string): boolean {
  const all = [
    ...(s.checkins ?? []).map((c) => c.date),
    ...(s.activity ?? []).map((a) => a.date),
    ...(s.entries ?? []).map((e) => dateKey(new Date(e.at))), // local day, not UTC
  ];
  // the offer is for the first moment back: once they've checked in or done something today, it goes
  if (all.includes(todayDate)) return false;
  const dates = all.filter((d) => d < todayDate).sort();

  if (dates.length === 0) return false;
  const latestPastDate = dates[dates.length - 1];
  const diffDays =
    (new Date(todayDate + "T12:00:00").getTime() -
      new Date(latestPastDate + "T12:00:00").getTime()) /
    864e5;
  return diffDays >= 3;
}

export default function Today() {
  const t = useTheme();
  const date = useToday();
  const state = useStore((s) => s);
  const { checkins, companion, results, cardHistory, displayName } = state;

  const isFocused = useIsFocused();
  const reduceMotion = useReducedMotionSafe();
  const [cardOffset, setCardOffset] = useState(0);
  const wasFocusedRef = useRef(isFocused);
  const [thoughtDismissed, setThoughtDismissed] = useState(false);

  // MAX's own little story on Home (owner, 7 Nov 2026): after "Show me less" MAX goes for a stroll, turns round,
  // slows down on the way back, worn out; half-way it sits down, lets out a long breath, lies down on the spot and
  // falls asleep. A tap on MAX (or "Thought") wakes it and it walks back home.
  type Story = "idle" | "walking" | "tired" | "sitting" | "sighing" | "lying" | "waking" | "returning";
  const [story, setStory] = useState<Story>("idle");
  const storyRef = useRef<Story>("idle");
  storyRef.current = story;
  const storyTimers = useRef<ReturnType<typeof setTimeout>[]>([]);
  // the deep breath before sleep: 0 = lungs empty, 1 = full
  const homeBreath = useSharedValue(0);
  const [breathPhase, setBreathPhase] = useState<"in" | "hold" | "out">("in");
  const [reaction, setReaction] = useState<"none" | "cheer" | "nod" | "comfort">("none");

  const [stageWidth, setStageWidth] = useState(320);
  const balloonScale = useSharedValue(1);
  const balloonOpacity = useSharedValue(1);
  // MAX starts at 0 on the right, facing left towards the open floor
  const walkX = useSharedValue(0);
  const walkFacing = useSharedValue(-1);

  // MAX moves exactly as fast as its planted feet push back, so the steps grip the ground instead of sliding.
  const pace = walkSpeed(HOME_MAX_SIZE, WALK_CYCLE_MS);
  const tiredPace = walkSpeed(HOME_MAX_SIZE, TIRED_WALK_CYCLE_MS);
  const stroll = Math.min(150, Math.max(60, stageWidth - 140));

  const onStageLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - stageWidth) > 5) setStageWidth(w);
  };

  const clearStory = () => {
    storyTimers.current.forEach(clearTimeout);
    storyTimers.current = [];
    cancelAnimation(homeBreath);
    homeBreath.value = 0;
  };

  // MAX's thought balloon goes while it strolls (it would walk over the words) and comes back when it is home.
  const hiddenByStory = useRef(false);
  const startStory = () => {
    if (reduceMotion) return;
    clearStory();
    cancelAnimation(walkX);
    const at = (ms: number, fn: () => void) => storyTimers.current.push(setTimeout(fn, ms));
    const from = walkX.value;
    const leg1 = Math.round((Math.abs(-stroll - from) / pace) * 1000);
    const back = Math.round(stroll * 0.5);
    const leg2 = Math.round((back / tiredPace) * 1000);
    setStory("walking");
    walkFacing.value = -1;
    walkX.value = withSequence(
      withTiming(-stroll, { duration: leg1, easing: Easing.linear }),
      // a short pause to turn round
      withTiming(-stroll, { duration: 450 }),
      // worn out: slower steps, half the way back, then a stop (no easing, or the feet would skid)
      withTiming(-stroll + back, { duration: leg2, easing: Easing.linear }),
    );
    at(leg1, () => (walkFacing.value = 1));
    at(leg1 + 450, () => setStory("tired"));
    const stop = leg1 + 450 + leg2;
    // sits down on the spot (the rig plays the sitting down)
    at(stop, () => setStory("sitting"));
    // one long breath out: in, a short hold, a long sigh out, then a smaller one that settles
    const breathe = (phase: "in" | "hold" | "out", to: number, ms: number) => {
      setBreathPhase(phase);
      if (phase !== "hold") homeBreath.value = withTiming(to, { duration: ms, easing: Easing.inOut(Easing.sin) });
    };
    const sigh = stop + 1700;
    at(sigh, () => {
      setStory("sighing");
      breathe("in", 1, 2200);
    });
    at(sigh + 2200, () => breathe("hold", 1, 500));
    at(sigh + 2700, () => breathe("out", 0, 4200));
    at(sigh + 6900, () => breathe("in", 0.45, 1500));
    at(sigh + 8400, () => breathe("out", 0, 2600));
    // lies down right there and falls asleep (the rig plays the lying down)
    at(sigh + 11200, () => {
      cancelAnimation(homeBreath);
      homeBreath.value = 0;
      setStory("lying");
    });
  };

  /** Walk back to MAX's spot at the normal pace, facing the way it goes. */
  const goHome = () => {
    clearStory();
    const from = walkX.value;
    if (Math.abs(from) < 2) {
      walkFacing.value = -1;
      backHome();
      return;
    }
    walkFacing.value = from < 0 ? 1 : -1;
    setStory("returning");
    walkX.value = withTiming(0, { duration: Math.round((Math.abs(from) / pace) * 1000), easing: Easing.linear }, (fin) => {
      if (fin) {
        walkFacing.value = -1;
        // a state setter, not a function that closes over refs (worklets freeze what they capture)
        runOnJS(setArrived)(Date.now());
      }
    });
  };
  const [arrived, setArrived] = useState(0);
  useEffect(() => {
    if (arrived) backHome();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [arrived]);
  const backHome = () => {
    setStory("idle");
    if (hiddenByStory.current) {
      hiddenByStory.current = false;
      handleRestoreThought();
    }
  };

  const wake = () => {
    const from = storyRef.current;
    clearStory();
    // the rig rolls MAX back up (if lying) and plays the stretch and yawn, then MAX walks home
    setStory("waking");
    storyTimers.current.push(setTimeout(goHome, from === "lying" ? 3800 : 2200));
  };
  /** Stop the story wherever it is and bring MAX home. */
  const interrupt = () => {
    const now = storyRef.current;
    if (now === "lying" || now === "sitting" || now === "sighing") wake();
    else if (now === "walking" || now === "tired") goHome();
  };

  // Coming back to Home: a new thought, and MAX back on its spot.
  useEffect(() => {
    if (isFocused && !wasFocusedRef.current) {
      setCardOffset((c) => c + 1);
      setThoughtDismissed(false);
      balloonScale.value = 1;
      balloonOpacity.value = 1;
    }
    if (!isFocused) {
      clearStory();
      cancelAnimation(walkX);
      walkX.value = 0;
      walkFacing.value = -1;
      setStory("idle");
    }
    wasFocusedRef.current = isFocused;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isFocused]);
  useEffect(() => () => clearStory(), []);

  const done = checkins.find((c) => c.date === date);
  const [editing, setEditing] = useState(false);
  // One clear next step after the check-in, chosen from today's answers, exams, and what has helped before.
  const personalStep = done && !editing ? afterCheckin(state, new Date()) : null;
  // the reason alone ("Exam in 2 days."): the button already names the step (M16 decision 15)
  const step = personalStep
    ? { text: `${personalStep.reason}.`, label: personalStep.title, href: personalStep.href }
    : done && !editing
    ? nextStep(done)
    : null;
  const rightNow = rankActions(state, new Date(), 3);
  // not the step the check-in card already offers
  const forYou = rightNow.find((a) => a.href !== step?.href);
  const days = consistency(checkins);

  const returning = isReturningUser(state, date);
  const card = todaysCard(CARDS, cardHistory, date, cardOffset);
  const plan = dailyPlan(state, date);

  // Record card in history if not recorded yet
  useEffect(() => {
    const existingEntry = cardHistory.find((h) => h.date === date);
    if (!existingEntry) {
      update((s) => ({
        ...s,
        cardHistory: [...s.cardHistory, { id: card.id, date }],
      }));
    }
  }, [card.id, date, cardHistory]);

  const handleShowLess = () => {
    update((s) => {
      const filtered = s.cardHistory.filter((h) => h.id !== card.id);
      return {
        ...s,
        cardHistory: [...filtered, { id: card.id, date, less: true }],
      };
    });
    // The thought shrinks back into MAX's head, then MAX sets off on its stroll.
    balloonScale.value = withTiming(0.01, { duration: 220 });
    balloonOpacity.value = withTiming(0, { duration: 180 }, (fin) => {
      if (fin) runOnJS(setThoughtDismissed)(true);
    });
    storyTimers.current.push(setTimeout(startStory, 320));
  };

  const handleRestoreThought = () => {
    interrupt();
    setThoughtDismissed(false);
    setCardOffset((c) => c + 1);
    balloonScale.value = withTiming(1, { duration: 240, easing: Easing.out(Easing.quad) });
    balloonOpacity.value = withTiming(1, { duration: 200 });
  };

  const balloonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: balloonOpacity.value,
    transform: [{ scale: balloonScale.value }],
  }));

  const maxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: walkX.value }, { scaleX: walkFacing.value }],
  }));

  const avatarCirclePath = getSketchPath("circle", 44, 44, seedFrom("user-avatar-header"));
  const avatarButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Profile"
      onPress={() => router.push("/profile" as Href)}
      hitSlop={6}
      style={{
        width: 44,
        height: 44,
        alignItems: "center",
        justifyContent: "center",
        marginRight: space.xs,
      }}>
      <Svg
        pointerEvents="none"
        width={44}
        height={44}
        style={{ position: "absolute", top: 0, left: 0 }}>
        <Path
          d={avatarCirclePath}
          fill={t.raised}
          stroke={t.ink}
          strokeWidth={1.8}
        />
      </Svg>
      <View style={{ width: 34, height: 34, borderRadius: 17, overflow: "hidden", alignItems: "center", justifyContent: "center" }}>
        <Avatar size={34} />
      </View>
    </Pressable>
  );

  const settingsButton = (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Settings"
      onPress={() => router.push("/profile/settings" as Href)}
      hitSlop={14}
      style={{
        padding: space.xs,
        alignItems: "center",
        justifyContent: "center",
      }}>
      <DoodleIcon name="settings" size={22} color={t.ink} />
    </Pressable>
  );

  return (
    // any touch on Home restarts MAX's wait before its stroll
    <View style={{ flex: 1 }}>
    <Screen title={greetingText(displayName)} left={avatarButton} right={settingsButton}>
      <T soft style={{ marginTop: space.xs, marginBottom: space.sm }}>
        {new Date().toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })}
      </T>

      {/* Returning user reset prompt (>= 3 days away) */}
      {returning ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Welcome back — 2-minute reset?"
          onPress={() => router.push("/tool/breathe")}
          style={{ marginTop: space.sm }}>
          <Frame
            id="returning-reset"
            fill
            fillColor={t.raised}
            strokeColor={t.rule}
            style={{
              padding: space.md,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "space-between",
            }}>
            <View style={{ flex: 1, gap: 2 }}>
              <T v="heading" style={{ fontSize: 16 }}>
                Welcome back — 2-minute reset?
              </T>
              <T soft v="small">
                Take a slow pause to settle back into your rhythm.
              </T>
            </View>
            <DoodleIcon name="compass" size={20} color={t.ink} />
          </Frame>
        </Pressable>
      ) : null}

      {/* Today's Card Balloon + Walking/Static Max container */}
      <View
        onLayout={onStageLayout}
        style={{
          marginTop: space.md,
          position: "relative",
          minHeight: 110,
          justifyContent: "flex-end",
        }}>
        {/* Restore Thought Pill Button when dismissed */}
        {thoughtDismissed ? (
          <View style={{ position: "absolute", top: -8, right: 0, zIndex: 10 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Show daily thought"
              onPress={handleRestoreThought}
              hitSlop={14}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: 4,
                paddingVertical: 4,
                paddingHorizontal: 8,
                borderRadius: 12,
                backgroundColor: t.paper,
                borderWidth: 1,
                borderColor: t.rule,
                opacity: pressed ? 0.7 : 1,
              })}>
              <DoodleIcon name="message-circle" size={13} color={t.ink} />
              <T soft v="small" style={{ fontSize: 11, color: t.ink }}>
                Thought
              </T>
            </Pressable>
          </View>
        ) : null}

        <View style={{ flexDirection: "row", alignItems: "flex-end", gap: space.xs }}>
          {/* Balloon that pops out from Max's head */}
          <Animated.View
            pointerEvents={thoughtDismissed ? "none" : "auto"}
            style={[
              { flex: 1, transformOrigin: "bottom right" },
              balloonAnimatedStyle,
            ]}>
            <Balloon tail="right" id={`card-${card.id}`}>
              <View style={{ gap: space.sm }}>
                <T style={{ fontSize: 15, lineHeight: 22 }}>{card.text}</T>
                <View
                  style={{
                    flexDirection: "row",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: space.xs,
                    marginTop: space.xs,
                  }}>
                  {card.action ? (
                    <Button
                      kind="accent"
                      label={card.action.label}
                      onPress={() => router.push(card.action!.href as Href)}
                    />
                  ) : <View />}
                  <View style={{ flexDirection: "row", alignItems: "center", flexWrap: "wrap", columnGap: space.sm, flexShrink: 1, minWidth: 0 }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Another thought"
                      onPress={() => setCardOffset((c) => c + 1)}
                      hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                      style={{ flexDirection: "row", alignItems: "center", gap: 4, paddingVertical: 4 }}>
                      <DoodleIcon name="refresh-cw" size={12} color={t.ink2} />
                      <T soft v="small">
                        Another thought
                      </T>
                    </Pressable>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Show me less of this"
                      onPress={handleShowLess}
                      hitSlop={{ top: 12, bottom: 12, left: 4, right: 4 }}
                      style={{ paddingVertical: 4 }}>
                      <T soft v="small" style={{ textDecorationLine: "underline" }}>
                        Show me less
                      </T>
                    </Pressable>
                  </View>
                </View>
              </View>
            </Balloon>
          </Animated.View>

          {/* Max: sits static on right when thought is showing; walks, slows, and sleeps when dismissed! */}
          <Animated.View style={[{ marginBottom: -4, zIndex: 5 }, maxAnimatedStyle]}>
            <Max
              initialBehavior={
                new Date().getHours() >= 23 || new Date().getHours() < 5
                  ? "sleep"
                  : new Date().getHours() < 11
                  ? "greeting"
                  : "idle"
              }
              size={HOME_MAX_SIZE}
              walking={story === "walking" || story === "tired" || story === "returning"}
              whistling={story === "walking"}
              tired={story === "tired"}
              sweating={story === "tired"}
              sitting={story === "sitting" || story === "sighing"}
              breath={story === "sighing" ? homeBreath : undefined}
              breathPhase={story === "sighing" ? breathPhase : undefined}
              sleeping={story === "lying"}
              lying={story === "lying"}
              action={reaction}
              interactive
              onPress={() => {
                if (story !== "idle" && story !== "waking" && story !== "returning") interrupt();
                else if (story === "idle") router.push("/talk" as Href);
              }}
            />
          </Animated.View>
        </View>
      </View>

      {/* Daily Plan: 3 derived goals */}
      <Section title="Daily plan">
        <Frame
          id="daily-plan-frame"
          fill
          fillColor={t.paper}
          strokeColor={t.rule}
          style={{
            padding: space.sm,
            gap: space.sm,
          }}>
          {plan.map((item) => (
            <Pressable
              key={item.id}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: item.done }}
              accessibilityLabel={`${item.title}, ${item.done ? "done" : "to do"}`}
              onPress={() => {
                if (item.href === "/") {
                  setEditing(true);
                } else {
                  router.push(item.href as Href);
                }
              }}
              style={({ pressed }) => ({
                flexDirection: "row",
                alignItems: "center",
                gap: space.sm,
                paddingVertical: space.xs,
                paddingHorizontal: space.xs,
                opacity: pressed ? 0.7 : 1,
              })}>
              <Checkbox
                decorative
                id={`plan-${item.id}`}
                checked={item.done}
                onPress={() => {
                  if (item.href === "/") setEditing(true);
                  else router.push(item.href as Href);
                }}
              />
              <T
                style={{
                  flex: 1,
                  fontSize: 15,
                  textDecorationLine: item.done ? "line-through" : "none",
                  color: item.done ? t.ink2 : t.ink,
                }}>
                {item.title}
              </T>
            </Pressable>
          ))}
        </Frame>
      </Section>

      {/* Check-in Section */}
      <Section title="Today's check-in">
        {done && !editing ? (
          <Frame
            id="today-checkin-summary"
            fill
            fillColor={t.paper}
            strokeColor={t.rule}
            style={{
              padding: space.md,
              gap: space.md,
            }}>
            <CheckinFacts c={done} />
            {step ? (
              <View style={{ gap: space.sm, paddingTop: space.sm }}>
                <T>{step.text}</T>
                <Button kind="accent" label={step.label} onPress={() => router.push(step.href as Href)} />
              </View>
            ) : null}
            {isWeb ? null : <ReminderOffer />}
            <T v="small" soft>{`${days} of the last 7 days checked in.`}</T>
            <Button kind="quiet" label="Change today's check-in" onPress={() => setEditing(true)} />
          </Frame>
        ) : (
          <CheckInForm
            initial={done}
            onCancel={done ? () => setEditing(false) : undefined}
            onSaved={(c) => {
              setEditing(false);
              // MAX answers the check-in: a small hop for a good day, a nod for an okay one, comfort for a hard one
              setReaction(c.mood >= 4 ? "cheer" : c.mood === 3 ? "nod" : "comfort");
              setTimeout(() => setReaction("none"), 3000);
            }}
          />
        )}
      </Section>

      {/* One short "for you" list instead of four blocks (M16 decisions 14–15): today's reflection and the one action
          that fits right now. Patterns live in Journal → Mood; the self-checks live in Explore. */}
      <Section title="For you">
        <Row icon="sparkles" title="Today's reflection" sub="Three short parts about you" onPress={() => router.push("/insight" as Href)} last={!forYou} />
        {forYou ? (
          <Row icon={forYou.icon} title={forYou.title} sub={forYou.reason ?? forYou.sub} onPress={() => router.push(forYou.href as Href)} last />
        ) : null}
      </Section>
    </Screen>
    </View>
  );
}

/** Today's answers as four small pictures with a word each, instead of a 35-word sentence (M16 decision 15). A screen
 *  reader still hears the whole sentence. */
function CheckinFacts({ c }: { c: CheckIn }) {
  const t = useTheme();
  const phone = c.screen ? (c.screen === 60 ? "1 hr+" : `${c.screen} min`) : "none";
  const facts: { icon: DoodleIconName; label: string; value: string }[] = [
    { icon: "sun", label: "Mood", value: moodWords[c.mood - 1] },
    { icon: "moon", label: "Sleep", value: sleepWords[c.sleep - 1] },
    { icon: "smartphone", label: "Phone", value: phone },
    { icon: "activity", label: "Stress", value: stressWords[c.stress - 1] },
  ];
  const sentence = `Today you feel ${moodWords[c.mood - 1]}. You slept ${sleepWords[c.sleep - 1]}, with ${
    c.screen ? `about ${c.screen === 60 ? "an hour or more" : `${c.screen} minutes`} of` : "no"
  } phone before bed, and study pressure feels ${stressWords[c.stress - 1]}.`;
  return (
    <View accessible accessibilityLabel={sentence} style={{ flexDirection: "row", flexWrap: "wrap", rowGap: space.sm }}>
      {facts.map((f) => (
        // two columns with large text, so a word never breaks in the middle
        <View key={f.label} style={{ width: PixelRatio.getFontScale() > 1.15 ? "50%" : "25%", alignItems: "center", gap: 2 }}>
          <DoodleIcon name={f.icon} size={22} color={t.ink} />
          <T style={{ fontSize: 15, lineHeight: 20, textAlign: "center" }}>{f.value}</T>
          <T v="small" soft style={{ textAlign: "center" }}>
            {f.label}
          </T>
        </View>
      ))}
    </View>
  );
}

function CheckInForm({ initial, onSaved, onCancel }: { initial?: CheckIn; onSaved: (c: CheckIn) => void; onCancel?: () => void }) {
  const t = useTheme();
  const [mood, setMood] = useState(initial?.mood);
  const [sleep, setSleep] = useState(initial?.sleep);
  // the wheel starts at today's answer, or the last check-in's (habits carry over), and moves to the measured value
  const last = useStore((s) => s.checkins.at(-1));
  const [phoneMin, setPhoneMin] = useState(() => toFive(initial?.screenMin ?? initial?.screen ?? last?.screenMin ?? last?.screen ?? 0));
  const touched = useRef(initial != null);
  const [stress, setStress] = useState(initial?.stress);
  const [measured, setMeasured] = useState<{ min: number; sleepAt: number }>();
  const [win, setWin] = useState(initial?.win ?? "");
  const ready = mood && sleep && stress;

  useEffect(() => {
    measure().then((m) => {
      if (m?.beforeSleep == null || m.sleepAt == null) return;
      setMeasured({ min: m.beforeSleep, sleepAt: m.sleepAt });
      if (!touched.current) setPhoneMin(toFive(m.beforeSleep));
    });
  }, []);

  const save = () => {
    if (!ready) return;
    const cleanWin = win.trim().slice(0, 140);
    const c: CheckIn = {
      date: today(),
      mood,
      sleep,
      screen: bucket(phoneMin),
      stress,
      screenMin: phoneMin,
      at: initial?.at ?? Date.now(),
      ...(cleanWin ? { win: cleanWin } : {}),
    };
    logActivity("log");
    update((s) => ({ checkins: [...s.checkins.filter((x) => x.date !== c.date), c] }));
    sendPulse(c);
    // today's check-in reminder is no longer needed; the bedtime nudge may use tonight's data
    void refreshReminders();
    onSaved(c);
  };

  return (
    <View style={{ gap: space.md }}>
      <Frame
        id="today-checkin-form"
        fill
        fillColor={t.paper}
        strokeColor={t.rule}
        style={{
          padding: space.md,
          gap: space.md,
        }}>
        <Q label="Today I feel">
          <Choice options={words(moodWords)} value={mood} onChange={setMood} fill />
        </Q>
        <Q label="Last night I slept">
          <Choice options={words(sleepWords)} value={sleep} onChange={setSleep} fill />
        </Q>
        <Q label="Phone in the hour before sleep">
          <NumberField
            label="Phone in the hour before sleep"
            items={PHONE_MINUTES}
            value={phoneMin}
            onChange={(m) => ((touched.current = true), setPhoneMin(m))}
          />
          {measured ? (
            <T v="small" soft>{`Measured on this phone: ${measured.min} min of screen time in the hour before you slept at ${new Date(
              measured.sleepAt
            ).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}.`}</T>
          ) : usageSupported && !hasUsageAccess() ? (
            <T v="small" soft>Tip: MAX can measure this for you. Turn it on in Settings.</T>
          ) : null}
        </Q>
        <Q label="Study pressure today">
          <Choice options={words(stressWords)} value={stress} onChange={setStress} fill />
        </Q>
        <View style={{ gap: space.sm }}>
          <T v="title">One small thing that went okay (optional)</T>
          <Field value={win} onChangeText={setWin} maxLength={140} placeholder="e.g. submitted the assignment, had a proper lunch" accessibilityLabel="One small thing that went okay today" />
        </View>
      </Frame>
      <Button kind="accent" label="Save today's check-in" onPress={save} disabled={!ready} />
      {onCancel ? <Button kind="quiet" label="Cancel" onPress={onCancel} /> : null}
    </View>
  );
}

function Q({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }} accessibilityRole="radiogroup" accessibilityLabel={label}>
      <T v="title">{label}</T>
      {children}
    </View>
  );
}

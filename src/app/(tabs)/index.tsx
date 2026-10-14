import { router, useIsFocused, type Href } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Pressable, View, type LayoutChangeEvent } from "react-native";
import { CARDS } from "@/content/cards";
import { todaysCard } from "@/lib/cards";
import { consistency, moodWords, nextStep, patterns } from "@/lib/insights";
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
import { Button, Choice, Row, Screen, Section, T } from "@/lib/ui";
import { Balloon } from "@/ui/sketch/Balloon";
import { Checkbox } from "@/ui/sketch/Checkbox";
import { Frame } from "@/ui/sketch/Frame";
import { getSketchPath, seedFrom } from "@/ui/sketch/sketch";
import Svg, { Path } from "react-native-svg";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { sendPulse } from "@/lib/api";
import { applyReminders } from "@/lib/reminders";
import { hasUsageAccess, measure, usageSupported } from "@/lib/device-usage";
import { Avatar } from "@/ui/Avatar";
import { Max } from "@/components/max";
import Animated, {
  cancelAnimation,
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { bucket } from "@/lib/screen-time";

const sleepWords = ["badly", "poorly", "okay", "well", "deeply"];
const stressWords = ["calm", "light", "some", "heavy", "intense"];
const screenOpts = [
  { label: "None", value: 0 },
  { label: "~15 min", value: 15 },
  { label: "~30 min", value: 30 },
  { label: "An hour+", value: 60 },
];
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
  const dates = [
    ...(s.checkins ?? []).map((c) => c.date),
    ...(s.activity ?? []).map((a) => a.date),
    ...(s.entries ?? []).map((e) => new Date(e.at).toISOString().slice(0, 10)),
  ]
    .filter((d) => d < todayDate)
    .sort();

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
  const [cardOffset, setCardOffset] = useState(0);
  const wasFocusedRef = useRef(isFocused);
  const [thoughtDismissed, setThoughtDismissed] = useState(false);

  // Stage width for seamless walking corridor across row
  const [stageWidth, setStageWidth] = useState(320);

  // Animation values for balloon pop
  const balloonScale = useSharedValue(1);
  const balloonOpacity = useSharedValue(1);

  // Walking MAX animation values (MAX starts at 0 on the right, walks across to left)
  const walkX = useSharedValue(0);
  const walkFacing = useSharedValue(1); // 1 = facing left / forward, -1 = facing right
  const walkBobY = useSharedValue(0);

  const walkRange = Math.max(60, stageWidth - 110);

  const onStageLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - stageWidth) > 5) {
      setStageWidth(w);
    }
  };

  // Start walking cycle when thoughtDismissed is true, or smoothly settle back when false
  useEffect(() => {
    if (!thoughtDismissed) {
      cancelAnimation(walkX);
      cancelAnimation(walkBobY);
      cancelAnimation(walkFacing);
      walkX.value = withSpring(0, { damping: 14, stiffness: 140 });
      walkBobY.value = withTiming(0, { duration: 150 });
      walkFacing.value = withTiming(1, { duration: 150 });
      return;
    }

    const durationPerLeg = 2800;

    // Stepping vertical bob
    walkBobY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 240, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 240, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );

    // Seamless walking loop: starts from right (0), walks to left (-walkRange), turns, walks back to right (0)
    walkX.value = withRepeat(
      withSequence(
        // Walk left towards -walkRange
        withTiming(-walkRange, { duration: durationPerLeg, easing: Easing.inOut(Easing.sin) }, (fin) => {
          if (fin) walkFacing.value = -1; // Turn around to face right
        }),
        // Brief pause at left edge
        withTiming(-walkRange, { duration: 260 }),
        // Walk back right towards 0
        withTiming(0, { duration: durationPerLeg, easing: Easing.inOut(Easing.sin) }, (fin) => {
          if (fin) walkFacing.value = 1; // Turn around to face left
        }),
        // Brief pause at right edge
        withTiming(0, { duration: 260 })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(walkX);
      cancelAnimation(walkBobY);
      cancelAnimation(walkFacing);
    };
  }, [thoughtDismissed, walkRange]);

  // Rotate thought every time student navigates away and returns to Home
  useEffect(() => {
    if (isFocused && !wasFocusedRef.current) {
      setCardOffset((c) => c + 1);
      setThoughtDismissed(false);
      balloonScale.value = 1;
      balloonOpacity.value = 1;
    }
    wasFocusedRef.current = isFocused;
  }, [isFocused]);

  const done = checkins.find((c) => c.date === date);
  const [editing, setEditing] = useState(false);
  const noticed = patterns(checkins)[0];
  const step = done && !editing ? nextStep(done) : null;
  const days = consistency(checkins);
  const lastTech = results.filter((r) => r.checkup === "tech").at(-1);
  const techDue = !lastTech || Date.now() - lastTech.at > 7 * 864e5;

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
    // Shrink thought balloon into Max's head
    balloonScale.value = withTiming(0.01, { duration: 220 });
    balloonOpacity.value = withTiming(0, { duration: 180 }, (fin) => {
      if (fin) {
        runOnJS(setThoughtDismissed)(true);
      }
    });
  };

  const handleRestoreThought = () => {
    setThoughtDismissed(false);
    setCardOffset((c) => c + 1);
    // Pop thought balloon out from Max's head
    balloonScale.value = withSpring(1, { damping: 14, stiffness: 140 });
    balloonOpacity.value = withTiming(1, { duration: 200 });
  };

  const balloonAnimatedStyle = useAnimatedStyle(() => ({
    opacity: balloonOpacity.value,
    transform: [{ scale: balloonScale.value }],
  }));

  const maxAnimatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: walkX.value },
      { translateY: walkBobY.value },
      { scaleX: walkFacing.value },
    ],
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
      hitSlop={8}
      style={{
        padding: space.xs,
        alignItems: "center",
        justifyContent: "center",
      }}>
      <DoodleIcon name="settings" size={22} color={t.ink} />
    </Pressable>
  );

  return (
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
                  <View style={{ flexDirection: "row", alignItems: "center", gap: space.sm }}>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel="Another thought"
                      onPress={() => setCardOffset((c) => c + 1)}
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

          {/* Max: sits static on right when thought is showing; walks right-to-left across when dismissed! */}
          <Animated.View style={[{ marginBottom: -4, zIndex: 5 }, maxAnimatedStyle]}>
            <Max
              initialBehavior={
                new Date().getHours() >= 23 || new Date().getHours() < 5
                  ? "sleep"
                  : new Date().getHours() < 11
                  ? "greeting"
                  : "idle"
              }
              size={96}
              boil
              walking={thoughtDismissed}
              whistling={thoughtDismissed}
              interactive={true}
              onPress={() => router.push("/talk" as Href)}
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
            <T v="voice">
              {`Today you feel ${moodWords[done.mood - 1]}. You slept ${sleepWords[done.sleep - 1]}, with ${
                done.screen
                  ? `about ${done.screen === 60 ? "an hour or more" : `${done.screen} minutes`} of`
                  : "no"
              } phone before bed, and study pressure feels ${stressWords[done.stress - 1]}.`}
            </T>
            {step ? (
              <View style={{ gap: space.sm, paddingTop: space.sm }}>
                <T>{step.text}</T>
                <Button kind="accent" label={step.label} onPress={() => router.push(step.href as Href)} />
              </View>
            ) : null}
            <T v="small" soft>{`${days} of the last 7 days checked in.`}</T>
            <Button kind="quiet" label="Change today's check-in" onPress={() => setEditing(true)} />
          </Frame>
        ) : (
          <CheckInForm initial={done} onSaved={() => setEditing(false)} />
        )}
      </Section>

      {/* Personal Insight entry */}
      <Section title="Today's reflection">
        <Row
          icon="sparkles"
          title="Daily personal reflection"
          sub="3 short sections on your patterns and mindset"
          onPress={() => router.push("/insight" as Href)}
        />
      </Section>

      {noticed ? (
        <Section title="Noticed">
          <T>{noticed}</T>
          <View style={{ marginTop: space.sm }}>
            <Button kind="quiet" label="See all patterns" onPress={() => router.push("/profile/mood")} />
          </View>
        </Section>
      ) : null}

      <Section title="Right now">
        <Row
          icon="wind"
          title="Breathe for one minute"
          sub="A slow reset when everything's too much"
          onPress={() => router.push("/tool/breathe")}
        />
        <Row
          icon="edit-3"
          title="Write it down"
          sub="Get it out of your head and onto the page"
          onPress={() => router.push("/journal-new")}
        />
        <Row
          icon="message-circle"
          title={`Talk to ${companion}`}
          sub="Think it through together"
          onPress={() => router.push("/talk")}
          last={!techDue}
        />
        {techDue ? (
          <Row
            icon="smartphone"
            title="Weekly tech-stress check"
            sub="Eight quick questions about your phone and apps"
            onPress={() => router.push("/test/tech")}
            last
          />
        ) : null}
      </Section>
    </Screen>
  );
}

function CheckInForm({ initial, onSaved }: { initial?: CheckIn; onSaved: () => void }) {
  const t = useTheme();
  const [mood, setMood] = useState(initial?.mood);
  const [sleep, setSleep] = useState(initial?.sleep);
  const [screen, setScreen] = useState(initial?.screen);
  const [stress, setStress] = useState(initial?.stress);
  const [measured, setMeasured] = useState<{ min: number; sleepAt: number }>();
  const ready = mood && sleep && screen !== undefined && stress;

  useEffect(() => {
    measure().then((m) => {
      if (m?.beforeSleep == null || m.sleepAt == null) return;
      setMeasured({ min: m.beforeSleep, sleepAt: m.sleepAt });
      setScreen((s) => s ?? bucket(m.beforeSleep!));
    });
  }, []);

  const save = () => {
    if (!ready) return;
    const c: CheckIn = { date: today(), mood, sleep, screen, stress, screenMin: measured?.min };
    logActivity("log");
    update((s) => ({ checkins: [...s.checkins.filter((x) => x.date !== c.date), c] }));
    sendPulse(c);
    if (getState().bedtime) applyReminders(getState()).catch(() => {});
    onSaved();
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
          <Choice options={screenOpts} value={screen} onChange={setScreen} fill />
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
      </Frame>
      <Button kind="accent" label="Save today's check-in" onPress={save} disabled={!ready} />
    </View>
  );
}

function Q({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: space.sm }}>
      <T v="title">{label}</T>
      {children}
    </View>
  );
}

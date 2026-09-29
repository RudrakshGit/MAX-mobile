import { router, type Href } from "expo-router";
import { useEffect, useState } from "react";
import { View } from "react-native";
import { consistency, moodWords, nextStep, patterns } from "@/lib/insights";
import { today, update, useStore, type CheckIn } from "@/lib/store";
import { space } from "@/lib/theme";
import { Button, Choice, Row, Screen, Section, T } from "@/lib/ui";
import { sendPulse } from "@/lib/api";
import { applyReminders } from "@/lib/reminders";
import { getState } from "@/lib/store";
import { hasUsageAccess, measure, usageSupported } from "@/lib/device-usage";
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

function greeting(h = new Date().getHours()) {
  if (h < 5) return "Still up?";
  if (h < 12) return "Good morning.";
  if (h < 17) return "Good afternoon.";
  return "Good evening.";
}

export default function Today() {
  const date = today();
  const checkins = useStore((s) => s.checkins);
  const companion = useStore((s) => s.companion);
  const results = useStore((s) => s.results);
  const done = checkins.find((c) => c.date === date);
  const [editing, setEditing] = useState(false);
  const noticed = patterns(checkins)[0];
  const step = done && !editing ? nextStep(done) : null;
  const days = consistency(checkins);
  const lastTech = results.filter((r) => r.checkup === "tech").at(-1);
  const techDue = !lastTech || Date.now() - lastTech.at > 7 * 864e5;

  return (
    <Screen title={greeting()}>
      <T soft style={{ marginTop: -space.sm }}>
        {new Date().toLocaleDateString("en-IN", { weekday: "long", day: "numeric", month: "long" })}
      </T>

      {done && !editing ? (
        <View style={{ marginTop: space.lg, gap: space.md }}>
          <T v="voice">
            {`Today you feel ${moodWords[done.mood - 1]}. You slept ${sleepWords[done.sleep - 1]}, with ${done.screen ? `about ${done.screen === 60 ? "an hour or more" : `${done.screen} minutes`} of` : "no"} phone before bed, and study pressure feels ${stressWords[done.stress - 1]}.`}
          </T>
          {step ? (
            <View style={{ gap: space.sm, paddingTop: space.sm }}>
              <T>{step.text}</T>
              <Button kind="accent" label={step.label} onPress={() => router.push(step.href as Href)} />
            </View>
          ) : null}
          <T v="small" soft>{`${days} of the last 7 days checked in. Every one makes your Insights sharper.`}</T>
          <Button kind="quiet" label="Change today's check-in" onPress={() => setEditing(true)} />
        </View>
      ) : (
        <CheckInForm initial={done} onSaved={() => setEditing(false)} />
      )}

      {noticed ? (
        <Section title="Noticed">
          <T>{noticed}</T>
          <View style={{ marginTop: space.sm }}>
            <Button kind="quiet" label="See all patterns" onPress={() => router.push("/insights")} />
          </View>
        </Section>
      ) : null}

      <Section title="Right now">
        <Row icon="wind" title="Breathe for one minute" sub="A slow reset when everything's too much" onPress={() => router.push("/tool/breathe")} />
        <Row icon="edit-3" title="Write it down" sub="Get it out of your head and onto the page" onPress={() => router.push("/journal-new")} />
        <Row icon="message-circle" title={`Talk to ${companion}`} sub="Think it through together" onPress={() => router.push("/talk")} last={!techDue} />
        {techDue ? <Row icon="smartphone" title="Weekly tech-stress check" sub="Eight quick questions about your phone and apps" onPress={() => router.push("/checkup/tech")} last /> : null}
      </Section>
    </Screen>
  );
}

function CheckInForm({ initial, onSaved }: { initial?: CheckIn; onSaved: () => void }) {
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
    update((s) => ({ checkins: [...s.checkins.filter((x) => x.date !== c.date), c] }));
    sendPulse(c);
    if (getState().bedtime) applyReminders(getState()).catch(() => {});
    onSaved();
  };

  return (
    <View style={{ marginTop: space.lg, gap: space.lg }}>
      <Q label="Today I feel">
        <Choice options={words(moodWords)} value={mood} onChange={setMood} fill />
      </Q>
      <Q label="Last night I slept">
        <Choice options={words(sleepWords)} value={sleep} onChange={setSleep} fill />
      </Q>
      <Q label="Phone in the hour before sleep">
        <Choice options={screenOpts} value={screen} onChange={setScreen} fill />
        {measured ? (
          <T v="small" soft>{`Measured on this phone: ${measured.min} min of screen time in the hour before you slept at ${new Date(measured.sleepAt).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" })}.`}</T>
        ) : usageSupported && !hasUsageAccess() ? (
          <T v="small" soft>Tip: MAX can measure this for you. Turn it on in Settings.</T>
        ) : null}
      </Q>
      <Q label="Study pressure today">
        <Choice options={words(stressWords)} value={stress} onChange={setStress} fill />
      </Q>
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

import { THIS_DEVICE } from "@/lib/platform";
import { PHONE } from "@/lib/schema";
import React, { useState } from "react";
import { View, StyleSheet } from "react-native";
import { Stack, router } from "expo-router";
import { logActivity, update, useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, Field, Page, Section, T, call } from "@/lib/ui";

const DEFAULT_PROFESSIONALS =
  "Tele-MANAS (14416 / 1-800-891-4416) · Free, 24×7\nVandrevala Foundation (9999-666-555)\nNational Emergency: 112";

export default function SafetyPlanScreen() {
  const t = useTheme();
  const existing = useStore((s) => s.safetyPlan);
  const savedCounsellor = useStore((s) => s.counsellor);
  const backedUp = useStore((s) => !!s.sync?.email);

  const [warningSigns, setWarningSigns] = useState(existing?.warningSigns ?? "");
  const [coping, setCoping] = useState(existing?.coping ?? "");
  const [people, setPeople] = useState(existing?.people ?? "");
  const [places, setPlaces] = useState(existing?.places ?? "");
  const [professionals, setProfessionals] = useState(
    existing?.professionals ?? DEFAULT_PROFESSIONALS
  );
  const [reasons, setReasons] = useState(existing?.reasons ?? "");
  const [callName, setCallName] = useState(existing?.callName ?? "");
  const [callPhone, setCallPhone] = useState(existing?.callPhone ?? "");
  const phoneOk = !callPhone.trim() || PHONE.test(callPhone.trim());
  const [cName, setCName] = useState(savedCounsellor?.name ?? "");
  const [cPhone, setCPhone] = useState(savedCounsellor?.phone ?? "");
  const cPhoneOk = !cPhone.trim() || PHONE.test(cPhone.trim());
  const [savedNotice, setSavedNotice] = useState(false);
  // a half-filled or undialable contact would be dropped on save, so Save waits until it's complete or empty
  const callOk = (!callName.trim() && !callPhone.trim()) || (!!callName.trim() && PHONE.test(callPhone.trim()));
  const counsellorOk = (!cName.trim() && !cPhone.trim()) || (!!cName.trim() && !!cPhone.trim() && cPhoneOk);
  const canSave = callOk && counsellorOk;

  const save = () => {
    if (!canSave) return;
    logActivity("do", "safety-plan");
    update((s) => ({
      safetyPlan: {
        warningSigns: warningSigns.trim(),
        coping: coping.trim(),
        people: people.trim(),
        places: places.trim(),
        professionals: professionals.trim(),
        reasons: reasons.trim(),
        // Kept only when both are filled and the number is dialable (the Help screen turns it into a call button).
        ...(callName.trim() && callPhone.trim() && PHONE.test(callPhone.trim())
          ? { callName: callName.trim().slice(0, 40), callPhone: callPhone.trim() }
          : {}),
      },
      // the campus counsellor gets its own call button on the Help screen; cleared when either field is emptied
      counsellor:
        cName.trim() && cPhone.trim() && PHONE.test(cPhone.trim()) ? { name: cName.trim().slice(0, 40), phone: cPhone.trim() } : undefined,
    }));
    setSavedNotice(true);
    setTimeout(() => setSavedNotice(false), 3000);
  };

  return (
    <Page>
      <Stack.Screen options={{ title: "My safety plan" }} />

      <View style={{ gap: space.md, paddingBottom: space.xl }}>
        <T v="title">Personal crisis safety plan</T>
        <T soft>
          A safety plan is a personalized list of coping strategies and sources of support that you can use when you are in a crisis or experiencing intense distress. Keep it updated.
        </T>

        <View style={[styles.card, { backgroundColor: t.raised, borderColor: t.rule }]}>
          <T v="heading" style={{ color: t.help }}>Need help immediately?</T>
          <T v="small" soft>If you feel unsafe right now, free confidential help is available 24×7.</T>
          <View style={{ flexDirection: "row", flexWrap: "wrap", gap: space.sm, marginTop: 4 }}>
            <Button kind="danger" label="Call Tele-MANAS (14416)" onPress={() => call("14416")} />
            <Button kind="quiet" label="All Helplines" onPress={() => router.push("/help")} />
          </View>
        </View>

        <Section title="1. Warning signs">
          <T v="small" soft>Thoughts, feelings, or actions that show a storm is brewing:</T>
          <Field
            value={warningSigns}
            maxLength={1000}
            onChangeText={setWarningSigns}
            multiline
            placeholder="e.g. Can't sleep, isolating in room, thinking 'everyone is better off without me'..."
            style={{ minHeight: 70 }}
          />
        </Section>

        <Section title="2. Internal coping strategies">
          <T v="small" soft>Things you can do on your own without contacting anyone:</T>
          <Field
            value={coping}
            maxLength={1000}
            onChangeText={setCoping}
            multiline
            placeholder="e.g. One-minute cyclic sighing, walking around the quad, taking a cold shower..."
            style={{ minHeight: 70 }}
          />
        </Section>

        <Section title="3. People who can distract or support">
          <T v="small" soft>Friends, family, or batchmates you can talk to or be around:</T>
          <Field
            value={people}
            maxLength={1000}
            onChangeText={setPeople}
            multiline
            placeholder="e.g. Roommate Aryan, sister Pooja, calling my school friend..."
            style={{ minHeight: 70 }}
          />
          <T v="small" soft>One person I can call right now (shows as a call button on the Help screen):</T>
          <Field value={callName} onChangeText={setCallName} maxLength={40} placeholder="Name, e.g. Didi" accessibilityLabel="Name of the person to call" />
          <Field
            value={callPhone}
            onChangeText={setCallPhone}
            keyboardType="phone-pad"
            maxLength={20}
            placeholder="Their phone number"
            accessibilityLabel="Phone number of the person to call"
          />
          {!phoneOk ? <T v="small" style={{ color: t.help }}>That doesn't look like a phone number yet.</T> : null}
        </Section>

        <Section title="4. Places that bring calm">
          <T v="small" soft>Safe environments that feel grounding or quiet:</T>
          <Field
            value={places}
            maxLength={1000}
            onChangeText={setPlaces}
            multiline
            placeholder="e.g. Central library 2nd floor, college ground at sunset, tea stall outside gate..."
            style={{ minHeight: 70 }}
          />
        </Section>

        <Section title="5. Professionals & helplines">
          <T v="small" soft>Trained counsellors, doctors, and round-the-clock crisis lines:</T>
          <Field
            value={professionals}
            maxLength={1000}
            onChangeText={setProfessionals}
            multiline
            placeholder="Helplines and trusted contacts..."
            style={{ minHeight: 80 }}
          />
          <T v="small" soft>My college counsellor or mentor (shows as a call button on the Help screen):</T>
          <Field value={cName} onChangeText={setCName} maxLength={40} placeholder="e.g. Student counsellor, Block A" accessibilityLabel="Counsellor's name" />
          <Field
            value={cPhone}
            onChangeText={setCPhone}
            keyboardType="phone-pad"
            maxLength={20}
            placeholder="Their phone number"
            accessibilityLabel="Counsellor's phone number"
          />
          {!cPhoneOk ? <T v="small" style={{ color: t.help }}>That doesn't look like a phone number yet.</T> : null}
          <T v="small" soft>Don't know it? Your department office or college website usually lists the student counsellor.</T>
        </Section>

        <Section title="6. My reasons for living">
          <T v="small" soft>What matters most to you, even when it feels buried right now:</T>
          <Field
            value={reasons}
            maxLength={1000}
            onChangeText={setReasons}
            multiline
            placeholder="e.g. My younger brother, my dream of building software, my pet back home, tomorrow's sunrise..."
            style={{ minHeight: 70 }}
          />
        </Section>

        <View style={{ marginTop: space.lg, gap: space.sm }}>
          <Button label="Save safety plan" onPress={save} disabled={!canSave} />
          {!canSave ? (
            <T v="small" soft style={{ textAlign: "center" }}>
              Add both a name and a phone number for each contact, or leave both empty.
            </T>
          ) : null}
          {savedNotice ? (
            <T v="small" style={{ color: t.ink, textAlign: "center" }}>
              {backedUp ? "✓ Saved on this phone and in your backup." : `✓ Saved privately on ${THIS_DEVICE}.`}
            </T>
          ) : null}
        </View>
      </View>
    </Page>
  );
}

const styles = StyleSheet.create({
  card: {
    padding: space.md,
    borderRadius: 8,
    borderWidth: 1,
    gap: space.xs,
  },
});

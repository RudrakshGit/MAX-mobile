import React, { useEffect, useState } from "react";
import { BackHandler, Pressable, View } from "react-native";
import { router } from "expo-router";
import { Button, Choice, Field, Screen, T } from "@/lib/ui";
import { getState, update } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import { Checkbox } from "@/ui/sketch/Checkbox";
import { Max } from "@/components/max";

// Three short screens: hello, names + look, and an honest consent. Everything said on the consent
// screen must be true of the build it ships in. Update it when sync or sign-in actually exist.
export default function Onboarding() {
  const t = useTheme();
  const [step, setStep] = useState(0);
  const [userName, setUserName] = useState("");
  const [companionName, setCompanionName] = useState("Max");
  const [theme, setTheme] = useState<"system" | "light" | "dark">(getState().themePreference ?? "light");
  const [aiTags, setAiTags] = useState(false);
  const [agreed, setAgreed] = useState(false);

  const cleanUser = userName.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 30);
  const cleanCompanion = companionName.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 20);
  const companion = cleanCompanion || "Max";

  // Android back goes one step back instead of leaving the app halfway through setup.
  useEffect(() => {
    const sub = BackHandler.addEventListener("hardwareBackPress", () => {
      if (step === 0) return false;
      setStep((s) => s - 1);
      return true;
    });
    return () => sub.remove();
  }, [step]);

  const pickTheme = (v: "system" | "light" | "dark") => {
    setTheme(v);
    update(() => ({ themePreference: v }));
  };

  const finish = () => {
    update((s) => ({
      onboarded: true,
      displayName: cleanUser || "Friend",
      companion,
      consentAt: Date.now(),
      consents: { ...s.consents, ai: aiTags },
    }));
    router.replace("/");
  };

  return (
    <Screen>
      <View style={{ paddingTop: space.lg, gap: space.lg }}>
        <View style={{ flexDirection: "row", gap: space.xs }}>
          {[0, 1, 2].map((i) => (
            <View
              key={i}
              accessibilityElementsHidden
              style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? t.ink : t.rule }}
            />
          ))}
        </View>
        <T v="small" soft>{`Step ${step + 1} of 3`}</T>

        {step === 0 && (
          <>
            <View style={{ alignItems: "center", paddingVertical: space.md }}>
              <Max state="wave" size={150} />
            </View>
            <T v="display">Hi, I'm {companion}.</T>
            <T soft>
              A private place for college life. Check in on sleep, stress and mood in 30 seconds, write things down, try a calming tool, or just talk.
            </T>
            <T soft>If things ever feel too heavy, the red Help button is one tap away on every main screen.</T>
            <Button label="Continue" onPress={() => setStep(1)} />
          </>
        )}

        {step === 1 && (
          <>
            <T v="display">A little about you.</T>
            <T soft>Both are optional and you can change them later in Settings.</T>
            <View style={{ gap: space.xs }}>
              <T v="small" soft>What should I call you?</T>
              <Field
                value={userName}
                onChangeText={setUserName}
                placeholder="Your name or nickname"
                maxLength={30}
                returnKeyType="done"
              />
            </View>
            <View style={{ gap: space.xs }}>
              <T v="small" soft>What should you call me?</T>
              <Field
                value={companionName}
                onChangeText={setCompanionName}
                placeholder="Max"
                maxLength={20}
                returnKeyType="done"
                onSubmitEditing={() => cleanCompanion && setStep(2)}
              />
            </View>
            <View style={{ gap: space.xs }}>
              <T v="small" soft>Look</T>
              <Choice
                fill
                options={[
                  { label: "Phone", value: "system" as const },
                  { label: "Light", value: "light" as const },
                  { label: "Dark", value: "dark" as const },
                ]}
                value={theme}
                onChange={pickTheme}
              />
            </View>
            <Button label="Continue" onPress={() => setStep(2)} disabled={!cleanCompanion} />
          </>
        )}

        {step === 2 && (
          <>
            <T v="display">Before we start.</T>
            <View style={{ gap: space.md }}>
              <Point icon="lock" text="On your phone: check-ins, journal, check-up results and tools are saved only on this phone. Export a backup or delete everything any time in Settings." />
              <Point icon="send" text={`When you talk to ${companion}: your messages go through our server to an AI service (Groq) that writes the reply. We don't keep your chats on the server. By default ${companion} also gets your last week's check-in averages (never your journal); you can switch that off in Settings. Please don't share names, phone numbers or addresses.`} />
              <Point icon="phone" text="If your words sound unsafe, MAX shows helplines first. It can miss things, so if you are in danger call 112 or Tele-MANAS 14416 yourself." />
            </View>
            <View style={{ gap: space.xs }}>
              <T v="title">AI help in the journal (optional)</T>
              <T soft>Suggest feeling tags and a gentle reflection for entries you write. Needs sending that entry to the AI service. You can change this later in Settings.</T>
              <Choice
                fill
                options={[{ label: "Off", value: 0 }, { label: "On", value: 1 }]}
                value={aiTags ? 1 : 0}
                onChange={(v) => setAiTags(v === 1)}
              />
            </View>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              onPress={() => setAgreed(!agreed)}
              style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
              <Checkbox checked={agreed} onPress={() => setAgreed(!agreed)} />
              <T style={{ flex: 1 }}>I understand MAX is an AI companion, not a counsellor or doctor, and I'm okay with how my data is handled.</T>
            </Pressable>
            <Button label="Start" onPress={finish} disabled={!agreed} />
          </>
        )}

        {step > 0 && <Button kind="quiet" label="Back" onPress={() => setStep(step - 1)} />}
      </View>
    </Screen>
  );
}

function Point({ icon, text }: { icon: DoodleIconName | string; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: space.md }}>
      <DoodleIcon name={icon as DoodleIconName} size={20} color={t.ink} style={{ marginTop: 2 }} />
      <T style={{ flex: 1 }}>{text}</T>
    </View>
  );
}

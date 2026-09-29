import Feather from "@expo/vector-icons/Feather";
import { router } from "expo-router";
import { useState } from "react";
import { Pressable, View } from "react-native";
import { Button, Field, Screen, T } from "@/lib/ui";
import { update } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";

export default function Onboarding() {
  const t = useTheme();
  const [step, setStep] = useState(0);
  const [name, setName] = useState("Max");
  const [agreed, setAgreed] = useState(false);
  const clean = name.replace(/[^\p{L}\p{N} ]/gu, "").trim().slice(0, 20);

  const finish = () => {
    update(() => ({ onboarded: true, companion: clean || "Max", consentAt: Date.now() }));
    router.replace("/");
  };

  return (
    <Screen>
      <View style={{ paddingTop: space.xl, gap: space.lg }}>
        <T v="small" soft>{`Step ${step + 1} of 3`}</T>

        {step === 0 && (
          <>
            <T v="display">A quiet place to think out loud.</T>
            <T v="voice">MAX is a companion for college life: check in with yourself, write things down, notice your patterns, and talk things through at any hour.</T>
            <View style={{ gap: space.md }}>
              <Point icon="cpu" text="The companion is an AI. It is not a counsellor, doctor or therapist, and it can't handle emergencies." />
              <Point icon="phone" text="The red Help button is on every screen. It connects you to free helplines run by real people, day and night." />
              <Point icon="smartphone" text="No account, no email, no phone number. What you write stays on this phone." />
            </View>
            <Button label="Continue" onPress={() => setStep(1)} />
          </>
        )}

        {step === 1 && (
          <>
            <T v="display">Name your companion.</T>
            <T soft>Call it anything you like. You can change it later in Settings.</T>
            <Field value={name} onChangeText={setName} maxLength={20} autoFocus placeholder="Max" accessibilityLabel="Companion name" />
            <Button label="Continue" onPress={() => setStep(2)} disabled={!clean} />
          </>
        )}

        {step === 2 && (
          <>
            <T v="display">Before we start.</T>
            <View style={{ gap: space.md }}>
              <Point icon="lock" text="Check-ins, journal, check-up results and tools are stored only on this phone. Deleting the app deletes them." />
              <Point icon="send" text={`When you talk to ${clean || "Max"}, your messages go to our server and to Groq, the AI provider, to write a reply. Groq does not train on them. Don't share names, numbers or addresses.`} />
              <Point icon="bar-chart-2" text={`${clean || "Max"} also sees your weekly check-in averages and your own coping plans, never your journal. You can switch this off in Settings.`} />
              <Point icon="alert-triangle" text="If a message sounds like you may be in danger, the AI is skipped and you'll see helplines instead." />
            </View>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              onPress={() => setAgreed(!agreed)}
              style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
              <Feather name={agreed ? "check-square" : "square"} size={24} color={agreed ? t.primary : t.inkSoft} />
              <T style={{ flex: 1 }}>I understand MAX is an AI companion, not professional help, and I agree to how my data is handled.</T>
            </Pressable>
            <Button label="Start" onPress={finish} disabled={!agreed} />
          </>
        )}

        {step > 0 && <Button kind="quiet" label="Back" onPress={() => setStep(step - 1)} />}
      </View>
    </Screen>
  );
}

function Point({ icon, text }: { icon: keyof typeof Feather.glyphMap; text: string }) {
  const t = useTheme();
  return (
    <View style={{ flexDirection: "row", gap: space.md }}>
      <Feather name={icon} size={20} color={t.primary} style={{ marginTop: 2 }} />
      <T style={{ flex: 1 }}>{text}</T>
    </View>
  );
}

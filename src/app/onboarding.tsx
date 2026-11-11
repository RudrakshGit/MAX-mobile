import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { googleConfigured } from "@/features/account/google";
import { signIn } from "@/lib/cloud";
import React, { useEffect, useState } from "react";
import { ActivityIndicator, BackHandler, Pressable, View } from "react-native";
import { router, type Href } from "expo-router";
import { Button, Choice, Field, Screen, T } from "@/lib/ui";
import { getState, update } from "@/lib/store";
import { isDarkTheme, space, useTheme } from "@/lib/theme";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import { Checkbox } from "@/ui/sketch/Checkbox";
import { Max } from "@/components/max";
import { OnboardingPermissions } from "@/components/OnboardingPermissions";
import { COLLEGE_NOTE, cleanCollegeId, lookupMessage } from "@/components/CollegeShare";
import { joinCollege, lookupCollege } from "@/lib/college";
import { showAlert } from "@/lib/dialog";
import { isWeb } from "@/lib/platform";

type Found = Extract<Awaited<ReturnType<typeof lookupCollege>>, { ok: true }>["college"];

// Short screens: hello, names + look, an honest consent, the phone permissions features use, then the optional backup. Everything said on the consent
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
  // the Google backup step only exists when sign-in is set up in this build
  // on the web there's no permissions step and no backup step (googleConfigured is false there)
  const steps = isWeb ? 3 : googleConfigured ? 5 : 4;

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

  const [signingIn, setSigningIn] = useState(false);
  const [signInNote, setSignInNote] = useState("");
  const backUp = async () => {
    setSigningIn(true);
    setSignInNote("");
    const r = await signIn();
    setSigningIn(false);
    if (!r.ok) {
      if (r.reason !== "cancelled") setSignInNote(r.reason === "offline" ? "Couldn't reach the internet. You can do this later in Settings." : "Sign-in didn't work. You can try again later in Settings.");
      return;
    }
    // A returning student's backup has been restored (it was already set up): go straight in.
    if (getState().onboarded) {
      if (college && !getState().college) joinCollege(college);
      return router.replace("/");
    }
    finish();
  };

  // Optional College ID: checked when leaving the step, joined when set-up finishes (that's the consent).
  const [collegeId, setCollegeId] = useState("");
  const [college, setCollege] = useState<Found>();
  const [collegeNote, setCollegeNote] = useState("");
  const [checking, setChecking] = useState(false);
  const aboutDone = async () => {
    const code = cleanCollegeId(collegeId);
    if (!collegeId.trim() || (college && code === collegeCode)) return setStep(2);
    if (!code) return setCollegeNote("A College ID has 8 letters and numbers, like K7QX-29MD.");
    setChecking(true);
    setCollegeNote("");
    const r = await lookupCollege({ code });
    setChecking(false);
    if (r.ok) {
      setCollege(r.college);
      setCollegeCode(code);
      return setStep(2);
    }
    setCollege(undefined);
    // offline: don't block set-up; it can be added in Settings later
    if (r.reason !== "unknown") {
      setCollegeId("");
      setCollegeNote("");
      showAlert("Couldn't check the College ID", "You can add it later in Settings → Share stats with college.");
      return setStep(2);
    }
    setCollegeNote(lookupMessage(r.reason));
  };
  const [collegeCode, setCollegeCode] = useState<string | null>(null);

  const finish = () => {
    if (college) joinCollege(college);
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
          {Array.from({ length: steps }, (_, i) => i).map((i) => (
            <View
              key={i}
              accessibilityElementsHidden
              style={{ flex: 1, height: 4, borderRadius: 2, backgroundColor: i <= step ? t.ink : t.rule }}
            />
          ))}
        </View>
        <T v="small" soft>{`Step ${Math.min(step, steps - 1) + 1} of ${steps}`}</T>

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
            <T soft>All optional. You can change them later in Settings.</T>
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
              />
            </View>
            {isWeb ? null : <View style={{ gap: space.xs }}>
              <T v="small" soft>College ID (optional)</T>
              <Field
                value={collegeId}
                onChangeText={(v) => (setCollegeId(v), setCollegeNote(""))}
                autoCapitalize="characters"
                placeholder="From your college, e.g. K7QX-29MD"
                maxLength={12}
                accessibilityLabel="College ID, optional"
              />
              <T v="small" soft>{college && cleanCollegeId(collegeId) === collegeCode ? `${college.name}. ${COLLEGE_NOTE}` : COLLEGE_NOTE}</T>
              {collegeNote ? <T v="small" style={{ color: t.ink2 }}>{collegeNote}</T> : null}
            </View>}
            <View style={{ gap: space.xs }}>
              <T v="small" soft>Look</T>
              <Choice
                fill
                options={[
                  { label: isWeb ? "Device" : "Phone", value: "system" as const },
                  { label: "Light", value: "light" as const },
                  { label: "Dark", value: "dark" as const },
                ]}
                value={theme}
                onChange={pickTheme}
              />
            </View>
            {checking ? <ActivityIndicator color={t.ink} /> : <Button label="Continue" onPress={aboutDone} />}
          </>
        )}

        {step === 2 && (
          <>
            <T v="display">Before we start.</T>
            <View style={{ gap: space.md }}>
              <Point icon="lock" text={isWeb ? "In this browser: check-ins, journal and check-up results stay in this browser only. Clearing the browser's data deletes them. The MAX app keeps them on your phone, with an optional backup." : "On your phone: check-ins, journal, check-up results and tools are saved on this phone. Export a copy or delete everything any time in Settings. A Google backup is optional and off unless you sign in."} />
              <Point icon="send" text={`When you talk to ${companion}: your messages go through our server to an AI service (Groq) that writes the reply. We don't keep your chats on the server. By default ${companion} also gets your last week's check-in averages (never your journal); you can switch that off in Settings. Please don't share names, phone numbers or addresses.`} />
              <Point icon="phone" text="If your words sound unsafe, MAX shows helplines first. It can miss things, so if you are in danger call 112 or Tele-MANAS 14416 yourself." />
            </View>
            <View style={{ gap: space.xs }}>
              <T v="title">AI help in the journal (optional)</T>
              <T soft>Suggest feeling tags and a gentle reflection for entries you write. Needs sending that entry to the AI service. You can change this later in Settings.</T>
              <Choice
                fill
                options={[{ label: "On", value: 1 }, { label: "Off", value: 0 }]}
                value={aiTags ? 1 : 0}
                onChange={(v) => setAiTags(v === 1)}
              />
            </View>
            <Pressable
              accessibilityRole="checkbox"
              accessibilityState={{ checked: agreed }}
              onPress={() => setAgreed(!agreed)}
              style={{ flexDirection: "row", gap: space.md, alignItems: "flex-start" }}>
              <Checkbox decorative checked={agreed} onPress={() => setAgreed(!agreed)} />
              <T style={{ flex: 1 }}>I understand MAX is an AI companion, not a counsellor or doctor, and I'm okay with how my data is handled.</T>
            </Pressable>
            <Button label={isWeb ? "Start" : "Continue"} onPress={isWeb ? finish : () => setStep(3)} disabled={!agreed} />
          </>
        )}

        {step === 3 && (
          <>
            <T v="display">What MAX can use.</T>
            <T soft>All optional. Skip any of them now; MAX asks again only when you use that feature.</T>
            <OnboardingPermissions />
            <Button label={googleConfigured ? "Continue" : "Start"} onPress={googleConfigured ? () => setStep(4) : finish} />
          </>
        )}

        {step === 4 && (
          <>
            <T v="display">Keep a backup?</T>
            <T soft>
              Optional. Sign in with Google and MAX keeps a copy of your check-ins, journal text, chats and settings on our
              server, so a new phone gets everything back. Already used MAX before? Sign in to bring your data back.
            </T>
            <T v="small" soft>Voice recordings and songs from your phone stay on this phone. You can switch this on or off later in Settings → Backup.</T>
            {signingIn ? (
              <ActivityIndicator color={t.ink} />
            ) : (
              <GoogleSigninButton
                size={GoogleSigninButton.Size.Wide}
                color={isDarkTheme(t) ? GoogleSigninButton.Color.Dark : GoogleSigninButton.Color.Light}
                onPress={backUp}
                style={{ alignSelf: "center", width: 280, height: 52 }}
              />
            )}
            {signInNote ? <T style={{ color: t.help }}>{signInNote}</T> : null}
            <Button kind="secondary" label="Not now" onPress={finish} />
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

import { router } from "expo-router";
import { View } from "react-native";
import { useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, call, Page, T } from "@/lib/ui";
import { Max } from "@/components/max";

// Numbers verified against the issuing bodies; re-check before each release.
const lines = [
  { name: "Tele-MANAS", number: "14416", note: "Government of India national mental health helpline. Free, 24×7, English and 20 Indian languages." },
  { name: "Tele-MANAS (toll-free)", number: "1-800-891-4416", note: "The same service on a regular toll-free number, if 14416 doesn't connect. The old KIRAN line now routes here too." },
  { name: "Vandrevala Foundation", number: "9999666555", note: "24×7 crisis support by call or WhatsApp." },
  { name: "iCall (TISS)", number: "9152987821", note: "Free counselling by trained psychologists. Not 24×7: Monday to Saturday, 8 am to 9 pm (icallhelpline.org, checked Oct 2026)." },
];

export default function Help() {
  const t = useTheme();
  const plan = useStore((s) => s.safetyPlan);
  const counsellor = useStore((s) => s.counsellor);
  const college = useStore((s) => s.college);
  return (
    <Page>
      <View style={{ gap: space.lg }}>
        <View style={{ alignItems: "center", gap: space.sm }}>
          <Max state="care" size={88} />
          <T v="title" style={{ textAlign: "center" }}>You don't have to handle this alone.</T>
          <T soft style={{ textAlign: "center" }}>These are free and confidential, with trained people on the other end. You don't need to be in crisis to call.</T>
        </View>
        <Button kind="danger" icon="alert-circle" label="In immediate danger: call 112" onPress={() => call("112")} />
        {plan?.callName && plan.callPhone ? (
          <Button kind="primary" icon="phone" label={`Call ${plan.callName}`} onPress={() => call(plan.callPhone!)} />
        ) : null}
        {counsellor ? <Button kind="secondary" icon="phone" label={`Call ${counsellor.name}`} onPress={() => call(counsellor.phone)} /> : null}
        {college?.counsellor && college.counsellor.phone !== counsellor?.phone ? (
          <View style={{ gap: 4 }}>
            <Button kind="secondary" icon="phone" label={`Call ${college.counsellor.name}`} onPress={() => call(college.counsellor!.phone)} />
            <T v="small" soft style={{ textAlign: "center" }}>{`${college.name}${college.counsellor.hours ? ` · ${college.counsellor.hours}` : ""}`}</T>
          </View>
        ) : null}
        <Button kind="secondary" icon="shield" label="Open my safety plan" onPress={() => router.push("/tool/safety-plan")} />
        {lines.map((l) => (
          <View key={l.name} style={{ gap: space.sm, paddingTop: space.md, borderTopWidth: 1, borderTopColor: t.rule }}>
            <T v="heading">{l.name}</T>
            <T v="small" soft>{l.note}</T>
            <Button kind="quiet" icon="phone" label={`Call ${l.number}`} onPress={() => call(l.number)} />
          </View>
        ))}
        <T v="small" soft>
          {plan?.callName && counsellor
            ? "You can change these contacts in your safety plan."
            : plan?.callName
            ? "If your college has a counsellor, add their number in your safety plan (step 5) and it will appear here too."
            : "Add one person you can call right now, and your college counsellor, in your safety plan. They will appear here."}
        </T>
      </View>
    </Page>
  );
}

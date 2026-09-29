import { View } from "react-native";
import { space, useTheme } from "@/lib/theme";
import { Button, call, Page, T } from "@/lib/ui";

// Numbers verified against the issuing bodies; re-check before each release.
const lines = [
  { name: "Tele-MANAS", number: "14416", note: "Government of India national mental health helpline. Free, 24×7, English and 20 Indian languages." },
  { name: "Tele-MANAS (toll-free)", number: "1-800-891-4416", note: "The same service on a regular toll-free number, if 14416 doesn't connect. The old KIRAN line now routes here too." },
  { name: "Vandrevala Foundation", number: "9999666555", note: "24×7 crisis support by call or WhatsApp." },
];

export default function Help() {
  const t = useTheme();
  return (
    <Page>
      <View style={{ gap: space.lg }}>
        <View style={{ gap: space.sm }}>
          <T v="title">You don't have to handle this alone.</T>
          <T soft>These are free and confidential, with trained people on the other end. You don't need to be in crisis to call.</T>
        </View>
        <Button kind="danger" icon="alert-circle" label="In immediate danger: call 112" onPress={() => call("112")} />
        {lines.map((l) => (
          <View key={l.name} style={{ gap: space.sm, paddingTop: space.md, borderTopWidth: 1, borderTopColor: t.line }}>
            <T v="heading">{l.name}</T>
            <T v="small" soft>{l.note}</T>
            <Button kind="quiet" icon="phone" label={`Call ${l.number}`} onPress={() => call(l.number)} />
          </View>
        ))}
        <T v="small" soft>If your college has a counsellor, their number belongs here too. Ask your department for it and save it in your contacts.</T>
      </View>
    </Page>
  );
}

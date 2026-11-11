import React, { useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { joinCollege, leaveCollege, lookupCollege } from "@/lib/college";
import { showAlert } from "@/lib/dialog";
import { useStore } from "@/lib/store";
import { space, useTheme } from "@/lib/theme";
import { Button, Field, T } from "@/lib/ui";

// Settings → Share stats with college (docs/plan/M15, simplified 11 Nov 2026). The College ID comes from the college;
// entering it and tapping Share is the consent. Stopping deletes what was shared.

export const COLLEGE_NOTE = "Your daily check-in numbers are added to your college's anonymous totals. Never your name, journal or chats.";

/** "k7qx 29md" → "K7QX-29MD"; null until it has the 8 letters and digits an ID needs. */
export const cleanCollegeId = (s: string) => {
  const raw = s.toUpperCase().replace(/[^A-Z0-9]/g, "");
  return raw.length === 8 ? `${raw.slice(0, 4)}-${raw.slice(4)}` : null;
};

export const lookupMessage = (reason: "unknown" | "offline" | "not-configured") =>
  reason === "unknown" ? "No college has this ID. Check it with your college." : reason === "offline" ? "Couldn't check it right now. Try again when you're online." : "College sharing isn't switched on in this copy of MAX.";

export function CollegeShare() {
  const t = useTheme();
  const college = useStore((s) => s.college);
  const [id, setId] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState("");

  const share = async () => {
    const code = cleanCollegeId(id);
    if (!code) return;
    setBusy(true);
    setNote("");
    const r = await lookupCollege({ code });
    setBusy(false);
    if (!r.ok) return setNote(lookupMessage(r.reason));
    joinCollege(r.college);
    setId("");
  };

  const stop = () =>
    showAlert("Stop sharing?", "Nothing more is sent, and what you shared is deleted.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Stop sharing",
        style: "destructive",
        onPress: async () => {
          const ok = await leaveCollege(true);
          setNote(ok ? "" : "Stopped. The delete didn't reach the server; it will need to be done again when you're online.");
        },
      },
    ]);

  if (college)
    return (
      <View style={{ gap: space.sm }}>
        <T>{college.gone ? `${college.name} no longer takes check-ins, so nothing is sent.` : `Sharing with ${college.name}.`}</T>
        <T v="small" soft>{COLLEGE_NOTE}</T>
        <Button kind="secondary" label="Stop sharing" onPress={stop} />
        {note ? <T v="small" soft>{note}</T> : null}
      </View>
    );

  return (
    <View style={{ gap: space.sm }}>
      <T v="small" soft>{COLLEGE_NOTE}</T>
      <Field value={id} onChangeText={setId} autoCapitalize="characters" maxLength={12} placeholder="College ID, e.g. K7QX-29MD" accessibilityLabel="College ID" />
      {busy ? <ActivityIndicator color={t.ink} /> : <Button kind="secondary" label="Share" onPress={share} disabled={!cleanCollegeId(id)} />}
      {note ? <T v="small" style={{ color: t.ink2 }}>{note}</T> : null}
    </View>
  );
}

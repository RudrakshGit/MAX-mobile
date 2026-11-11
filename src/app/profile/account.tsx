import React, { useState } from "react";
import { ActivityIndicator, Linking, View } from "react-native";
import { Stack, router } from "expo-router";
import { GoogleSigninButton } from "@react-native-google-signin/google-signin";
import { deleteAccount, signIn, signOut, syncNow, type SignInResult, type SyncResult } from "@/lib/cloud";
import { googleConfigured } from "@/features/account/google";
import { wipeLocalFiles } from "@/lib/backup";
import { cancelReminders } from "@/lib/reminders";
import { showAlert } from "@/lib/dialog";
import { getState, resetAll, useStore } from "@/lib/store";
import { leaveCollege } from "@/lib/college";
import { isDarkTheme, space, useTheme } from "@/lib/theme";
import { Button, Page, Section, T } from "@/lib/ui";
import { serverHost } from "@/lib/api";

const SIGN_IN_ERRORS: Record<Exclude<SignInResult, { ok: true }>["reason"], string | null> = {
  cancelled: null,
  "not-configured": "Google sign-in isn't set up correctly for this copy of MAX yet. Your data is safe on this phone.",
  offline: "Couldn't reach the internet. Try again when you're online.",
  failed: "Sign-in didn't work this time. Please try again.",
};
const SYNC_ERRORS: Partial<Record<SyncResult, string>> = {
  offline: "Couldn't reach the server. MAX will try again by itself.",
  "too-large": "Your data is too large to back up in one go. Deleting old chats you don't need will help.",
  failed: "The last backup didn't finish. MAX will try again by itself.",
};

function ago(ms?: number) {
  if (!ms) return "not yet";
  const m = Math.round((Date.now() - ms) / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : new Date(ms).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function Account() {
  const t = useTheme();
  const sync = useStore((s) => s.sync);
  const [busy, setBusy] = useState<"signin" | "sync" | "delete" | null>(null);
  const [note, setNote] = useState("");

  const doSignIn = async () => {
    setBusy("signin");
    setNote("");
    const r = await signIn();
    setBusy(null);
    if (!r.ok) setNote(SIGN_IN_ERRORS[r.reason] ?? "");
  };

  const doSync = async () => {
    setBusy("sync");
    const r = await syncNow();
    setBusy(null);
    setNote(SYNC_ERRORS[r] ?? (r === "ok" ? "Backed up." : ""));
  };

  const confirmSignOut = () =>
    showAlert("Sign out on this phone?", "Your backup stays safe on the server and your data stays on this phone. You can sign in again any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Sign out", onPress: () => void signOut() },
    ]);

  const confirmDelete = () =>
    showAlert(
      "Delete your account and backup?",
      "Your backup on the server is deleted for good, and everything on this phone is erased too. This can't be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Continue",
          style: "destructive",
          onPress: () =>
            showAlert("Are you sure?", "Journal, check-ins, chats and test results will be gone from the server and this phone.", [
              { text: "Keep my account", style: "cancel" },
              {
                text: "Delete everything",
                style: "destructive",
                onPress: async () => {
                  setBusy("delete");
                  const r = await deleteAccount();
                  if (r !== "ok") {
                    setBusy(null);
                    setNote(r === "offline" ? "Couldn't reach the server, so nothing was deleted. Try again when you're online." : "Deleting didn't work. Nothing was deleted; please try again.");
                    return;
                  }
                  await cancelReminders();
                  if (getState().college) await leaveCollege(true);
                  await wipeLocalFiles();
                  await resetAll();
                  router.replace("/onboarding");
                },
              },
            ]),
        },
      ],
    );

  return (
    <Page>
      <Stack.Screen options={{ title: "Backup" }} />
      <View style={{ gap: space.lg, paddingBottom: space.xl }}>
        {!sync?.email ? (
          <>
            <T v="title">Back up with Google</T>
            <T soft>
              Optional. Sign in and MAX keeps a copy of your check-ins, journal text, chats, test results and settings on our
              server, so a new phone gets everything back. Without it, everything stays only on this phone.
            </T>
            <Section title="What is and isn't backed up">
              <T soft>{"Backed up: check-ins, journal text, chats, test results, safety plan, courses, your music links and settings.\nNot backed up: voice recordings and songs added from your phone (they stay on this phone), and app lock."}</T>
              <T v="small" soft>{`Stored on our server (${serverHost}) in a database that encrypts data at rest. Only your Google account can open it. Delete it any time from this page.`}</T>
            </Section>
            {googleConfigured ? (
              busy === "signin" ? (
                <ActivityIndicator color={t.ink} />
              ) : (
                <GoogleSigninButton
                  size={GoogleSigninButton.Size.Wide}
                  color={isDarkTheme(t) ? GoogleSigninButton.Color.Dark : GoogleSigninButton.Color.Light}
                  onPress={doSignIn}
                  style={{ alignSelf: "center", width: 280, height: 52 }}
                />
              )
            ) : (
              <T soft>Backup isn't switched on in this copy of MAX yet. Your data is safe on this phone; use Settings → Export backup to keep a copy.</T>
            )}
          </>
        ) : (
          <>
            <T v="title">Backed up with Google</T>
            <View style={{ gap: 4 }}>
              <T>{sync.email}</T>
              <T soft>{`Last backup: ${ago(sync.lastAt)}`}</T>
              {sync.error && SYNC_ERRORS[sync.error as SyncResult] ? <T style={{ color: t.ink }}>{SYNC_ERRORS[sync.error as SyncResult]}</T> : null}
            </View>
            <T v="small" soft>MAX backs up by itself a little after you change something and when you leave the app.</T>
            <Button kind="secondary" icon="refresh-cw" label={busy === "sync" ? "Backing up…" : "Back up now"} disabled={!!busy} onPress={doSync} />
            <Button kind="quiet" label="Sign out on this phone" onPress={confirmSignOut} />
            <Section title="Delete account">
              <T soft>Deletes your backup from our server and erases this phone. This can't be undone.</T>
              <Button kind="danger" icon="trash-2" label={busy === "delete" ? "Deleting…" : "Delete my account and backup"} disabled={!!busy} onPress={confirmDelete} />
            </Section>
          </>
        )}
        {note ? <T style={{ color: t.ink }}>{note}</T> : null}
        <Button kind="quiet" label="Delete without the app (web page)" onPress={() => Linking.openURL("https://max-companion.expo.app/api/delete-account").catch(() => {})} />
      </View>
    </Page>
  );
}

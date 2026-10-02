// Deep imports: the package index would bundle all 16 weights (~4 MB).
import { Literata_400Regular_Italic } from "@expo-google-fonts/literata/400Regular_Italic";
import { Literata_500Medium } from "@expo-google-fonts/literata/500Medium";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useRef, useState } from "react";
import { AppState, View } from "react-native";
import { getState, hydrate } from "@/lib/store";
import { Button, call, T } from "@/lib/ui";
import { serif, space, useTheme } from "@/lib/theme";

SplashScreen.preventAutoHideAsync();

export default function Root() {
  const t = useTheme();
  const [fonts] = useFonts({ Literata_500Medium, Literata_400Regular_Italic });
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const leftAt = useRef(0);

  useEffect(() => {
    hydrate().then(() => {
      setLocked(getState().lock);
      setReady(true);
    });
    // Re-lock after a minute in the background, not on every quick app switch.
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "background") leftAt.current = Date.now();
      if (s === "active" && getState().lock && leftAt.current && Date.now() - leftAt.current > 60_000) setLocked(true);
    });
    return () => sub.remove();
  }, []);

  const unlock = async () => {
    const r = await LocalAuthentication.authenticateAsync({ promptMessage: "Unlock MAX" });
    if (r.success) setLocked(false);
  };

  useEffect(() => {
    if (ready && fonts && locked) unlock();
  }, [ready, fonts, locked]);

  useEffect(() => {
    if (ready && fonts) SplashScreen.hideAsync();
  }, [ready, fonts]);

  if (!ready || !fonts) return null;

  if (locked)
    return (
      <View style={{ flex: 1, backgroundColor: t.bg, justifyContent: "center", padding: space.lg, gap: space.md }}>
        <StatusBar style="auto" />
        <NavigationBar style="auto" />
        <T v="display">MAX is locked.</T>
        <T soft>Your journal and check-ins stay private until you unlock.</T>
        <Button label="Unlock" icon="unlock" onPress={unlock} />
        <Button kind="danger" icon="phone" label="Need help now? Call 14416" onPress={() => call("14416")} />
      </View>
    );

  return (
    <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
      <StatusBar style="auto" />
      {/* Icon colour follows light/dark, so back/home/recents stay visible on 3-button phones. */}
      <NavigationBar style="auto" />
      <Stack
        screenOptions={{
          headerShadowVisible: false,
          headerStyle: { backgroundColor: t.bg },
          headerTintColor: t.ink,
          headerTitleStyle: { fontFamily: serif, fontSize: 20 },
          contentStyle: { backgroundColor: t.bg },
          headerBackButtonDisplayMode: "minimal",
        }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
        <Stack.Screen name="help" options={{ title: "Get help now" }} />
        <Stack.Screen name="settings" options={{ title: "Settings" }} />
        <Stack.Screen name="campus" options={{ title: "Campus pulse" }} />
        <Stack.Screen name="journal-new" options={{ title: "New entry" }} />
      </Stack>
    </KeyboardProvider>
  );
}

// Deep imports: loading only the required weights to keep bundles small.
import { ThemeSwitchHost } from "@/lib/theme-switch";
import { HelpPill } from "@/lib/ui";
import { DialogHost } from "@/lib/dialog";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Kalam_400Regular } from "@expo-google-fonts/kalam/400Regular";
import { Kalam_700Bold } from "@expo-google-fonts/kalam/700Bold";
import { AtkinsonHyperlegibleNext_400Regular } from "@expo-google-fonts/atkinson-hyperlegible-next/400Regular";
import { AtkinsonHyperlegibleNext_600SemiBold } from "@expo-google-fonts/atkinson-hyperlegible-next/600SemiBold";
import { useFonts } from "expo-font";
import { Stack } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useRef, useState } from "react";
import { AppState, View, LogBox } from "react-native";
import { getState, hydrate, useStore } from "@/lib/store";
import { Button, call, T } from "@/lib/ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FloatingMax } from "@/components/max/FloatingMax";
import { MaxPeekingIntro, MaxLogoIntro } from "@/components/max";
import { recordGlobalTouch, setTouchPos } from "@/lib/max-store";
import { font, space, useTheme } from "@/lib/theme";

LogBox.ignoreLogs([
  "Failed to activate lock screen controls",
  "Failed to start the expo-audio playback service",
]);

SplashScreen.preventAutoHideAsync();

export default function Root() {
  const t = useTheme();
  const [fonts] = useFonts({
    Inter_400Regular,
    Inter_600SemiBold,
    Kalam_400Regular,
    Kalam_700Bold,
    AtkinsonHyperlegibleNext_400Regular,
    AtkinsonHyperlegibleNext_600SemiBold,
  });
  const [ready, setReady] = useState(false);
  const [locked, setLocked] = useState(false);
  const onboarded = useStore((s) => s.onboarded);
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
      <View style={{ flex: 1, backgroundColor: t.paper, justifyContent: "center", padding: space.lg, gap: space.md }}>
        <StatusBar style="auto" />
        <NavigationBar style="auto" />
        <T v="display">MAX is locked.</T>
        <T soft>Your journal and check-ins stay private until you unlock.</T>
        <Button label="Unlock" icon="unlock" onPress={unlock} />
        <Button kind="danger" icon="phone" label="Need help now? Call 14416" onPress={() => call("14416")} />
      </View>
    );

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <View
        style={{ flex: 1 }}
        onStartShouldSetResponderCapture={(e) => {
          recordGlobalTouch(e.nativeEvent.pageX, e.nativeEvent.pageY);
          return false;
        }}
        onMoveShouldSetResponderCapture={(e) => {
          recordGlobalTouch(e.nativeEvent.pageX, e.nativeEvent.pageY);
          return false;
        }}
        onTouchStart={(e) => setTouchPos(e.nativeEvent.pageX, e.nativeEvent.pageY)}
        onTouchMove={(e) => setTouchPos(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
          <StatusBar style="auto" />
          {/* Icon colour follows light/dark, so back/home/recents stay visible on 3-button phones. */}
          <NavigationBar style="auto" />
          <Stack
            screenOptions={{
              headerShadowVisible: false,
              headerStyle: { backgroundColor: t.paper },
              headerTintColor: t.ink,
              headerTitleStyle: { fontFamily: font.headline, fontSize: 20 },
              contentStyle: { backgroundColor: t.paper },
              headerBackButtonDisplayMode: "minimal",
              // Help is one tap from every pushed screen too (audit F23).
              headerRight: () => <HelpPill />,
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="help" options={{ title: "Get help now", headerRight: () => null }} />
            <Stack.Screen name="settings" options={{ title: "Settings" }} />
            <Stack.Screen name="profile/settings" options={{ title: "Settings" }} />
            <Stack.Screen name="profile/mood" options={{ title: "Mood & check-ins" }} />
            <Stack.Screen name="profile/insights" options={{ title: "Past reflections" }} />
            <Stack.Screen name="campus" options={{ title: "Campus pulse" }} />
            <Stack.Screen name="journal-new" options={{ title: "New entry" }} />
            <Stack.Screen name="chats" options={{ presentation: "modal", title: "Conversations" }} />
          </Stack>
          <FloatingMax />
          <DialogHost />
          <ThemeSwitchHost />
          {!onboarded ? <MaxPeekingIntro /> : <MaxLogoIntro />}
        </KeyboardProvider>
      </View>
    </GestureHandlerRootView>
  );
}

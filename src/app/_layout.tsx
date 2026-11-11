import { DemoBar } from "@/components/DemoBar";
import { isWeb } from "@/lib/platform";
// Deep imports: loading only the required weights to keep bundles small.
import { startAutoSync } from "@/lib/cloud";
import { refreshReminders } from "@/lib/reminders";
import { refreshCollege } from "@/lib/college";
import { markThemeCommitted, useBarsDark } from "@/lib/theme-switch";
import { HelpPill } from "@/lib/ui";
import { DialogHost } from "@/lib/dialog";
import { Inter_400Regular } from "@expo-google-fonts/inter/400Regular";
import { Inter_600SemiBold } from "@expo-google-fonts/inter/600SemiBold";
import { Kalam_400Regular } from "@expo-google-fonts/kalam/400Regular";
import { Kalam_700Bold } from "@expo-google-fonts/kalam/700Bold";
import { AtkinsonHyperlegibleNext_400Regular } from "@expo-google-fonts/atkinson-hyperlegible-next/400Regular";
import { AtkinsonHyperlegibleNext_600SemiBold } from "@expo-google-fonts/atkinson-hyperlegible-next/600SemiBold";
import { useFonts } from "expo-font";
import { Stack, router, useRootNavigationState, type Href } from "expo-router";
import * as Notifications from "expo-notifications";
import * as SplashScreen from "expo-splash-screen";
import { NavigationBar } from "expo-navigation-bar";
import { StatusBar } from "expo-status-bar";
import { KeyboardProvider } from "react-native-keyboard-controller";
import * as LocalAuthentication from "expo-local-authentication";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { AppState, View, LogBox } from "react-native";
import { getState, hydrate, update, useStore } from "@/lib/store";
import { Button, call, T } from "@/lib/ui";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { FloatingMax } from "@/components/max/FloatingMax";
import { MaxPeekingIntro, MaxLogoIntro } from "@/components/max";
import { setTouchPos } from "@/lib/max-store";
import { font, isDarkTheme, space, useTheme } from "@/lib/theme";
import ThemeReveal from "../../modules/theme-reveal/src/ThemeRevealModule";

LogBox.ignoreLogs([
  "Failed to activate lock screen controls",
  "Failed to start the expo-audio playback service",
]);

SplashScreen.preventAutoHideAsync();

export default function Root() {
  const t = useTheme();
  // The theme switch waits for this: the whole app has re-rendered with the new theme (M16, decision 8).
  useLayoutEffect(() => markThemeCommitted(), [t]);
  // Bar icons follow MAX's own theme ("auto" follows the phone's, so a dark MAX on a light phone got dark icons on
  // dark); during a theme switch they keep the old theme until the circle passes them.
  const bars = useBarsDark(isDarkTheme(t)) ? "light" : "dark";
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
  const [openUrl, setOpenUrl] = useState<string>();
  const navReady = !!useRootNavigationState()?.key;

  // A tap on a reminder opens its screen, after the app lock. The tap that launched the app is kept by the OS.
  useEffect(() => {
    if (isWeb) return; // no reminders on the web
    const take = (r: Notifications.NotificationResponse | null) => {
      const url = r?.notification.request.content.data?.url;
      if (typeof url === "string" && url.startsWith("/")) setOpenUrl(url);
    };
    take(Notifications.getLastNotificationResponse());
    const sub = Notifications.addNotificationResponseReceivedListener(take);
    return () => sub.remove();
  }, []);
  useEffect(() => {
    if (isWeb || !openUrl || !ready || !fonts || locked || !onboarded || !navReady) return;
    Notifications.clearLastNotificationResponse();
    setOpenUrl(undefined);
    router.navigate(openUrl as Href);
  }, [openUrl, ready, fonts, locked, onboarded, navReady]);

  useEffect(() => {
    hydrate().then(() => {
      // the web demo skips set-up (owner, 11 Nov 2026): the website's demo page explains it instead
      if (isWeb && !getState().onboarded) update((s) => ({ onboarded: true, displayName: s.displayName || "Friend", consentAt: Date.now() }));
      setLocked(!isWeb && getState().lock);
      setReady(true);
      startAutoSync();
      // reminders depend on the day's state (already checked in? exam soon? back after a gap?)
      update(() => ({ lastOpenAt: Date.now() }));
      void refreshReminders();
      void refreshCollege();
    });
    // Re-lock after a minute in the background, not on every quick app switch.
    const sub = AppState.addEventListener("change", (s) => {
      if (s === "background") leftAt.current = Date.now();
      if (s === "active" && getState().onboarded) {
        update(() => ({ lastOpenAt: Date.now() }));
        void refreshReminders();
      }
      if (!isWeb && s === "active" && getState().lock && leftAt.current && Date.now() - leftAt.current > 60_000) setLocked(true);
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
    if (!ready || !fonts) return;
    SplashScreen.hideAsync();
    // once the first screen has drawn, the window's own background is only overdraw (M16 follow-up)
    const id = setTimeout(() => ThemeReveal?.dropWindowBackground?.(), 1500);
    return () => clearTimeout(id);
  }, [ready, fonts]);

  if (!ready || !fonts) return null;

  if (locked)
    return (
      <View style={{ flex: 1, backgroundColor: t.paper, justifyContent: "center", padding: space.lg, gap: space.md }}>
        <StatusBar style={bars} />
        <NavigationBar style={bars} />
        <T v="display">MAX is locked.</T>
        <T soft>Your journal and check-ins stay private until you unlock.</T>
        <Button label="Unlock" icon="unlock" onPress={unlock} />
        <Button kind="danger" icon="phone" label="Need help now? Call 14416" onPress={() => call("14416")} />
      </View>
    );

  return (
    // on a wide browser window MAX keeps a phone-width column, on the paper colour
    <GestureHandlerRootView style={isWeb ? { flex: 1, alignItems: "center", backgroundColor: t.raised } : { flex: 1 }}>
      <View style={isWeb ? { flex: 1, width: "100%", maxWidth: 480, backgroundColor: t.paper } : { flex: 1 }}>
        {isWeb ? <DemoBar /> : null}
      {/* The floating MAX glances toward a touch: touch-down only. Tracking every finger move re-rendered MAX many
          times a second while scrolling (M16 finding 3). */}
      <View style={{ flex: 1 }} onTouchStart={(e) => setTouchPos(e.nativeEvent.pageX, e.nativeEvent.pageY)}>
        <KeyboardProvider statusBarTranslucent navigationBarTranslucent>
          <StatusBar style={bars} />
          {/* Icon colour follows light/dark, so back/home/recents stay visible on 3-button phones. */}
          <NavigationBar style={bars} />
          <Stack
            screenOptions={{
              // screens under the top one don't re-render until they're back in view (M16 speed)
              freezeOnBlur: true,
              headerShadowVisible: false,
              headerStyle: { backgroundColor: t.paper },
              headerTintColor: t.ink,
              headerTitleStyle: { fontFamily: font.headline, fontSize: 20 },
              contentStyle: { backgroundColor: t.paper },
              headerBackButtonDisplayMode: "minimal",
              // Help is one tap from every pushed screen too (audit F23).
              headerRight: () => (isWeb ? <View style={{ marginRight: 12 }}><HelpPill /></View> : <HelpPill />),
            }}>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="onboarding" options={{ headerShown: false, gestureEnabled: false }} />
            <Stack.Screen name="help" options={{ title: "Get help now", headerRight: () => null }} />
            <Stack.Screen name="settings" options={{ title: "Settings" }} />
            <Stack.Screen name="profile/settings/index" options={{ title: "Settings" }} />
            <Stack.Screen name="profile/mood" options={{ title: "Mood" }} />
            <Stack.Screen name="profile/insights" options={{ title: "Past reflections" }} />
            <Stack.Screen name="check-yourself" options={{ title: "Check yourself" }} />
            <Stack.Screen name="journal-new" options={{ title: "New entry" }} />
            <Stack.Screen name="chats" options={{ presentation: "modal", title: "Conversations" }} />
          </Stack>
          <FloatingMax />
          <DialogHost />
          {!onboarded ? <MaxPeekingIntro /> : <MaxLogoIntro />}
        </KeyboardProvider>
      </View>
      </View>
    </GestureHandlerRootView>
  );
}

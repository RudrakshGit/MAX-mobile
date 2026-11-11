import { Platform } from "react-native";
import React from "react";
import { View, Text, Animated, Easing } from "react-native";
import { Redirect, Tabs } from "expo-router";
import Svg, { Path } from "react-native-svg";
import { useStore } from "@/lib/store";
import { font, useTheme } from "@/lib/theme";
import { DoodleIcon, type DoodleIconName } from "@/ui/icons/DoodleIcon";
import { getSketchPath, seedFrom } from "@/ui/sketch/sketch";
import { useReducedMotionSafe } from "@/components/max/useReducedMotionSafe";

import { useSafeAreaInsets } from "react-native-safe-area-context";

// Four tabs (docs/history.md, owner's answer 1): Today, Explore (tools, courses, reading, sounds, self-checks), Talk and
// Journal. Profile and Settings open from the avatar on Today; Help sits in the same place on every screen.
const tabs: { name: string; title: string; icon: DoodleIconName }[] = [
  { name: "index", title: "Today", icon: "home" },
  { name: "explore", title: "Explore", icon: "compass" },
  { name: "talk", title: "Talk", icon: "chat" },
  { name: "journal", title: "Journal", icon: "pen" },
];

const AnimatedPath = Animated.createAnimatedComponent(Path);

function TabBarIcon({
  name,
  focused,
  color,
  seed,
}: {
  name: DoodleIconName;
  focused: boolean;
  color: string;
  seed: number;
}) {
  const t = useTheme();
  const prefersReduced = useReducedMotionSafe();
  const circleD = getSketchPath("circle", 36, 32, seed);
  const circleLen = 240;

  const animProgress = React.useRef(new Animated.Value(prefersReduced || !focused ? 0 : 1)).current;

  React.useEffect(() => {
    if (!focused) {
      animProgress.setValue(1);
      return;
    }
    if (prefersReduced) {
      animProgress.setValue(0);
      return;
    }
    animProgress.setValue(1);
    Animated.timing(animProgress, {
      toValue: 0,
      duration: 280,
      easing: Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
  }, [focused, prefersReduced]);

  const dashOffset = animProgress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, circleLen],
  });

  return (
    <View style={{ width: 40, height: 32, alignItems: "center", justifyContent: "center" }}>
      {focused ? (
        <Svg
          pointerEvents="none"
          width={40}
          height={36}
          style={{ position: "absolute", top: 0 }}>
          <AnimatedPath
            d={circleD}
            fill="none"
            stroke={t.ink}
            strokeWidth={1.5}
            strokeDasharray={`${circleLen}, ${circleLen}`}
            strokeDashoffset={dashOffset}
            transform="translate(2, 2)"
          />
        </Svg>
      ) : null}
      <DoodleIcon name={name} size={22} color={color} />
    </View>
  );
}

export default function TabsLayout() {
  const t = useTheme();
  const insets = useSafeAreaInsets();
  const onboarded = useStore((s) => s.onboarded);
  const simpleFont = useStore((s) => s.simpleFont);

  if (!onboarded) return <Redirect href="/onboarding" />;

  const bottomInset = Math.max(insets.bottom, 8);

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        // tabs out of view don't re-render on every store change or theme switch (M16 speed)
        freezeOnBlur: true,
        tabBarHideOnKeyboard: true,
        tabBarActiveTintColor: t.ink,
        tabBarInactiveTintColor: t.ink2,
        tabBarStyle: {
          backgroundColor: t.paper,
          borderTopColor: t.rule,
          borderTopWidth: 1,
          height: 52 + bottomInset,
          paddingBottom: bottomInset,
          paddingTop: 6,
        },
        // the stack screen under the tabs already paints paper; a second coat here is pure overdraw
        // (on the web inactive tabs stay in the page, so each scene keeps its own paper there)
        sceneStyle: { backgroundColor: Platform.OS === "web" ? t.paper : "transparent" },
      }}>
      {tabs.map((x) => {
        const seed = seedFrom(`tab-${x.name}`);
        return (
          <Tabs.Screen
            key={x.name}
            name={x.name}
            options={{
              title: x.title,
              tabBarIcon: ({ color, focused }) => (
                <TabBarIcon
                  name={x.icon}
                  focused={focused}
                  color={focused ? t.ink : t.ink2}
                  seed={seed}
                />
              ),
              tabBarLabel: ({ focused, children }) => (
                <Text
                  style={{
                    fontSize: 12,
                    fontFamily: focused
                      ? simpleFont
                        ? font.bodyBold
                        : font.handwrittenBold
                      : font.body,
                    color: focused ? t.ink : t.ink2,
                  }}>
                  {children}
                </Text>
              ),
            }}
          />
        );
      })}
      {/* old tabs, kept only so old links still resolve */}
      <Tabs.Screen name="learn" options={{ href: null }} />
      <Tabs.Screen name="tools" options={{ href: null }} />
      <Tabs.Screen name="tests" options={{ href: null }} />
    </Tabs>
  );
}

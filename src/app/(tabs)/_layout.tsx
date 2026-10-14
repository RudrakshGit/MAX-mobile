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

const tabs: { name: string; title: string; icon: DoodleIconName }[] = [
  { name: "index", title: "Home", icon: "home" },
  { name: "learn", title: "Learn", icon: "book" },
  { name: "tools", title: "Tools", icon: "compass" },
  { name: "journal", title: "Journal", icon: "pen" },
  { name: "tests", title: "Tests", icon: "checklist" },
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
        sceneStyle: { backgroundColor: t.paper },
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
      <Tabs.Screen name="talk" options={{ href: null }} />
    </Tabs>
  );
}

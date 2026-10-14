import React, { useEffect, useState } from "react";
import { View, Pressable, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  cancelAnimation,
  Easing,
} from "react-native-reanimated";
import { useTheme, space } from "@/lib/theme";
import { T } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Max } from "./Max";
import { useReducedMotionSafe } from "./useReducedMotionSafe";

export interface WalkingMaxCorridorProps {
  onRestoreThought: () => void;
  style?: StyleProp<ViewStyle>;
}

export function WalkingMaxCorridor({ onRestoreThought, style }: WalkingMaxCorridorProps) {
  const t = useTheme();
  const prefersReduced = useReducedMotionSafe();
  const [stageWidth, setStageWidth] = useState(260);

  // Animation values
  const walkX = useSharedValue(0);
  const facing = useSharedValue(1); // 1 = facing right, -1 = facing left
  const bobY = useSharedValue(0);

  const maxRange = Math.max(40, (stageWidth - 110) / 2);

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (w > 0 && Math.abs(w - stageWidth) > 5) {
      setStageWidth(w);
    }
  };

  useEffect(() => {
    if (prefersReduced) {
      cancelAnimation(walkX);
      cancelAnimation(bobY);
      cancelAnimation(facing);
      walkX.value = 0;
      bobY.value = 0;
      facing.value = 1;
      return;
    }

    const durationPerLeg = 2800;

    // Rhythmic stepping bob (300ms step cycle)
    bobY.value = withRepeat(
      withSequence(
        withTiming(-4, { duration: 260, easing: Easing.out(Easing.quad) }),
        withTiming(0, { duration: 260, easing: Easing.in(Easing.quad) })
      ),
      -1,
      true
    );

    // Back-and-forth walking cycle
    walkX.value = withRepeat(
      withSequence(
        // Walk to right edge
        withTiming(maxRange, { duration: durationPerLeg, easing: Easing.inOut(Easing.sin) }, (fin) => {
          if (fin) facing.value = -1;
        }),
        // Pause briefly at the turn
        withTiming(maxRange, { duration: 250 }),
        // Walk back to left edge
        withTiming(-maxRange, { duration: durationPerLeg, easing: Easing.inOut(Easing.sin) }, (fin) => {
          if (fin) facing.value = 1;
        }),
        // Pause briefly at the turn
        withTiming(-maxRange, { duration: 250 })
      ),
      -1,
      false
    );

    return () => {
      cancelAnimation(walkX);
      cancelAnimation(bobY);
      cancelAnimation(facing);
    };
  }, [maxRange, prefersReduced]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: walkX.value },
      { translateY: bobY.value },
      { scaleX: facing.value },
    ],
  }));

  return (
    <View onLayout={onLayout} style={[{ width: "100%", marginTop: space.sm, minHeight: 110, position: "relative" }, style]}>
      {/* Restore thought pill button at top right */}
      <View style={{ position: "absolute", top: 0, right: 0, zIndex: 10 }}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Show daily thought"
          onPress={onRestoreThought}
          style={({ pressed }) => ({
            flexDirection: "row",
            alignItems: "center",
            gap: 4,
            paddingVertical: 4,
            paddingHorizontal: 8,
            borderRadius: 12,
            backgroundColor: t.paper,
            borderWidth: 1,
            borderColor: t.rule,
            opacity: pressed ? 0.7 : 1,
          })}>
          <DoodleIcon name="message-circle" size={13} color={t.ink} />
          <T soft v="small" style={{ fontSize: 11, color: t.ink }}>
            Thought
          </T>
        </Pressable>
      </View>

      {/* Walking MAX container */}
      <View style={{ width: "100%", alignItems: "center", justifyContent: "center", paddingTop: space.md }}>
        <Animated.View style={animatedStyle}>
          <Max
            size={88}
            boil
            walking
            whistling
          />
        </Animated.View>
      </View>
    </View>
  );
}

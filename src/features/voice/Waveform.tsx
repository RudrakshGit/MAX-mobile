import React from "react";
import { GestureResponderEvent, LayoutChangeEvent, Pressable, View } from "react-native";
import { useTheme } from "@/lib/theme";

type WaveformProps = {
  levels: number[];
  progress?: number; // 0 to 1 for playback
  onSeek?: (ratio: number) => void;
  height?: number;
  live?: boolean;
};

export function Waveform({
  levels,
  progress = 0,
  onSeek,
  height = 42,
  live = false,
}: WaveformProps) {
  const t = useTheme();
  const [width, setWidth] = React.useState(0);

  const handleLayout = (e: LayoutChangeEvent) => {
    setWidth(e.nativeEvent.layout.width);
  };

  const handlePress = (e: GestureResponderEvent) => {
    if (!onSeek || width <= 0) return;
    const x = e.nativeEvent.locationX;
    const ratio = Math.max(0, Math.min(1, x / width));
    onSeek(ratio);
  };

  const displayLevels = levels.length > 0 ? levels : Array.from({ length: 30 }, () => 0.1);
  const activeCount = Math.round(progress * displayLevels.length);

  return (
    <Pressable
      onLayout={handleLayout}
      onPress={onSeek ? handlePress : undefined}
      disabled={!onSeek}
      accessibilityRole={onSeek ? "adjustable" : undefined}
      accessibilityLabel="Audio waveform"
      style={{
        height,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 2,
        paddingVertical: 2,
      }}>
      {displayLevels.map((lvl, idx) => {
        const clamped = Math.max(0.08, Math.min(1, lvl));
        const barHeight = Math.max(4, Math.round(clamped * (height - 4)));
        const isActive = live || idx < activeCount;
        const color = isActive ? t.ink : t.hair;

        return (
          <View
            key={idx}
            style={{
              flex: 1,
              height: barHeight,
              backgroundColor: color,
              borderRadius: 2,
              opacity: isActive ? (live ? 0.9 : 1) : 0.45,
            }}
          />
        );
      })}
    </Pressable>
  );
}

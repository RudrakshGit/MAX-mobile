import React from "react";
import { Pressable, View } from "react-native";
import { useAudioPlayer, useAudioPlayerStatus } from "expo-audio";
import { space, useTheme } from "@/lib/theme";
import { T } from "@/lib/ui";
import { DoodleIcon } from "@/ui/icons/DoodleIcon";
import { Waveform } from "./Waveform";

type PlayerProps = {
  uri: string;
  ms?: number;
  levels?: number[];
};

function formatTime(seconds: number): string {
  if (!Number.isFinite(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s < 10 ? "0" : ""}${s}`;
}

export function Player({ uri, ms = 0, levels = [] }: PlayerProps) {
  const t = useTheme();
  const player = useAudioPlayer(uri);
  const status = useAudioPlayerStatus(player);

  const totalDuration = status.duration > 0 ? status.duration : Math.max(1, ms / 1000);
  const currentPos = status.currentTime || 0;
  const progress = totalDuration > 0 ? Math.max(0, Math.min(1, currentPos / totalDuration)) : 0;

  const togglePlayback = () => {
    if (status.playing) {
      player.pause();
    } else {
      if (currentPos >= totalDuration - 0.2) {
        player.seekTo(0);
      }
      player.play();
    }
  };

  const handleSeek = (ratio: number) => {
    const targetSeconds = ratio * totalDuration;
    player.seekTo(targetSeconds);
  };

  return (
    <View
      style={{
        flexDirection: "row",
        alignItems: "center",
        backgroundColor: t.raised,
        borderWidth: 1.5,
        borderColor: t.rule,
        borderRadius: 14,
        paddingHorizontal: space.sm,
        paddingVertical: space.xs,
        gap: space.sm,
      }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={status.playing ? "Pause voice note" : "Play voice note"}
        onPress={togglePlayback}
        style={{
          width: 36,
          height: 36,
          borderRadius: 18,
          backgroundColor: t.paper,
          borderWidth: 1,
          borderColor: t.hair,
          alignItems: "center",
          justifyContent: "center",
        }}>
        <DoodleIcon
          name={status.playing ? "pause" : "play"}
          size={18}
          color={t.ink}
        />
      </Pressable>

      <View style={{ flex: 1, gap: 2 }}>
        <Waveform
          levels={levels}
          progress={progress}
          onSeek={handleSeek}
          height={32}
        />
        <View style={{ flexDirection: "row", justifyContent: "space-between" }}>
          <T v="small" soft>
            {formatTime(currentPos)}
          </T>
          <T v="small" soft>
            {formatTime(totalDuration)}
          </T>
        </View>
      </View>
    </View>
  );
}

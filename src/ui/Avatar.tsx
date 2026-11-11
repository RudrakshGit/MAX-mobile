import React from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import { SvgXml } from "react-native-svg";
import { useTheme } from "@/lib/theme";
import { defaultAvatarFor, getAvatarXml, type AvatarId } from "@/content/avatars";
import { useStore } from "@/lib/store";

export interface AvatarProps {
  id?: string;
  size?: number;
  style?: StyleProp<ViewStyle>;
}

export function Avatar({ id, size = 44, style }: AvatarProps) {
  const t = useTheme();
  const anonId = useStore((s) => s.anonId);
  const userAvatar = useStore((s) => s.avatar);

  const effectiveId = (id || userAvatar || defaultAvatarFor(anonId)) as AvatarId;
  // like MAX, an avatar keeps its light-theme ink and paper in dark mode: a paper cut-out, never inverted (owner)
  const xml = getAvatarXml(effectiveId, t.characterInk, t.characterPaper);

  return (
    <View
      style={[
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          overflow: "hidden",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: t.characterPaper,
        },
        style,
      ]}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

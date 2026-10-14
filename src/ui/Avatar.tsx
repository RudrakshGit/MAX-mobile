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
  const xml = getAvatarXml(effectiveId, t.ink, t.paper);

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
          backgroundColor: t.paper,
        },
        style,
      ]}>
      <SvgXml xml={xml} width={size} height={size} />
    </View>
  );
}

import React, { useState } from "react";
import { View, useWindowDimensions, type LayoutChangeEvent, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Circle, Defs, Line, Pattern, Rect } from "react-native-svg";
import { CATEGORY_LABELS, type PhoneCategory, hm } from "@/lib/device-usage";
import { radius, space, type Theme } from "@/lib/theme";
import { T } from "@/lib/ui";

export const ALL_CATEGORIES: PhoneCategory[] = [
  "social",
  "video",
  "games",
  "messaging",
  "study",
  "payments",
  "other",
];

export const CATEGORY_PATTERN_CONFIG: Record<
  PhoneCategory,
  { patternId?: string; fillColor?: (t: Theme) => string }
> = {
  social: { fillColor: (t) => t.ink },
  video: { patternId: "pat-video" },
  games: { patternId: "pat-games" },
  messaging: { fillColor: (t) => t.ink2 },
  study: { patternId: "pat-study" },
  payments: { patternId: "pat-payments" },
  other: { fillColor: (t) => t.rule },
};

export interface CategoryBreakdownProps {
  categories: Record<PhoneCategory, number>;
  avg7: Record<PhoneCategory, number>;
  t: Theme;
  title?: string;
  style?: StyleProp<ViewStyle>;
}

export function CategoryBreakdown({
  categories,
  avg7,
  t,
  title = "Categories",
  style,
}: CategoryBreakdownProps) {
  const { width: screenW } = useWindowDimensions();
  const [trackW, setTrackW] = useState<number>(() => Math.max(screenW - space.md * 4, 240));
  const barH = 12;

  // Sort categories: highest yesterday minutes first, preserving category order on ties
  const sorted = [...ALL_CATEGORIES].sort((a, b) => {
    const diff = (categories[b] || 0) - (categories[a] || 0);
    if (diff !== 0) return diff;
    return ALL_CATEGORIES.indexOf(a) - ALL_CATEGORIES.indexOf(b);
  });

  const maxMin = Math.max(...ALL_CATEGORIES.map((c) => categories[c] || 0), 1);

  return (
    <View
      style={[
        {
          marginTop: space.sm,
          padding: space.md,
          borderRadius: radius.md,
          backgroundColor: t.paper,
          borderWidth: 1,
          borderColor: t.rule,
          gap: space.sm,
        },
        style,
      ]}
    >
      {title ? (
        <T v="heading" style={{ fontSize: 14 }}>
          {title}
        </T>
      ) : null}

      <View
        onLayout={(e: LayoutChangeEvent) => {
          const w = e.nativeEvent.layout.width;
          if (w > 0 && Math.abs(w - trackW) > 1) {
            setTrackW(w);
          }
        }}
        style={{ width: "100%", gap: space.sm }}
      >
        {sorted.map((cat) => {
          const mins = categories[cat] || 0;
          const avg = avg7[cat] || 0;
          const label = CATEGORY_LABELS[cat];
          const cfg = CATEGORY_PATTERN_CONFIG[cat];
          const pct = mins > 0 ? Math.min(mins / maxMin, 1) : 0;
          const barW = Math.round(pct * trackW);

          return (
            <View key={cat} style={{ gap: 2 }}>
              <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
                <T style={{ fontSize: 13, fontWeight: "600" }}>{label}</T>
                <T v="small" soft>
                  {hm(mins)}
                  {avg > 0 ? ` · 7d avg ${hm(avg)}` : ""}
                </T>
              </View>
              <View
                style={{
                  width: trackW,
                  height: barH,
                  borderRadius: radius.sm / 2,
                  backgroundColor: t.raised,
                  borderWidth: 1,
                  borderColor: t.rule,
                  overflow: "hidden",
                }}>
                {barW > 0 ? (
                  <Svg width={barW} height={barH}>
                    <Defs>
                      <Pattern id="pat-video" width="6" height="6" patternUnits="userSpaceOnUse">
                        <Line x1="0" y1="6" x2="6" y2="0" stroke={t.ink} strokeWidth="1.5" />
                      </Pattern>
                      <Pattern id="pat-games" width="6" height="6" patternUnits="userSpaceOnUse">
                        <Line x1="0" y1="0" x2="6" y2="6" stroke={t.ink} strokeWidth="1" />
                        <Line x1="0" y1="6" x2="6" y2="0" stroke={t.ink} strokeWidth="1" />
                      </Pattern>
                      <Pattern id="pat-study" width="6" height="6" patternUnits="userSpaceOnUse">
                        <Circle cx="3" cy="3" r="1.5" fill={t.ink} />
                      </Pattern>
                      <Pattern id="pat-payments" width="6" height="6" patternUnits="userSpaceOnUse">
                        <Line x1="0" y1="3" x2="6" y2="3" stroke={t.ink} strokeWidth="1.5" />
                      </Pattern>
                    </Defs>
                    <Rect
                      x={0}
                      y={0}
                      width={barW}
                      height={barH}
                      fill={cfg.fillColor ? cfg.fillColor(t) : `url(#${cfg.patternId})`}
                      stroke={t.ink}
                      strokeWidth={0.5}
                    />
                  </Svg>
                ) : null}
              </View>
            </View>
          );
        })}
      </View>
    </View>
  );
}

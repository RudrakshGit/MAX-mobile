import React from "react";
import Svg, { Path, Rect } from "react-native-svg";

export interface CalendarIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function CalendarIcon({ size = 24, color = "currentColor", stroke }: CalendarIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      {/* Calendar body outline */}
      <Rect
        x={3}
        y={4}
        width={18}
        height={17}
        rx={3}
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Top hanger loops */}
      <Path d="M16 2v4M8 2v4" stroke={s} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      {/* Header divider line */}
      <Path d="M3 10h18" stroke={s} strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" />
      {/* Calendar date marks */}
      <Path d="M8 14h.01M12 14h.01M16 14h.01M8 17h.01M12 17h.01M16 17h.01" stroke={s} strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

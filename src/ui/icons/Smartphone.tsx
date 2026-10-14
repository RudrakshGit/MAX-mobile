import React from "react";
import Svg, { Rect, Line } from "react-native-svg";

export interface SmartphoneIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function SmartphoneIcon({ size = 24, color = "currentColor", stroke }: SmartphoneIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect
        x={5}
        y={2}
        width={14}
        height={20}
        rx={3}
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1={11.5} y1={18} x2={12.5} y2={18} stroke={s} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

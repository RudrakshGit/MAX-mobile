import React from "react";
import Svg, { Circle, Line } from "react-native-svg";

export interface AlertCircleIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function AlertCircleIcon({ size = 24, color = "currentColor", stroke }: AlertCircleIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={9.5} stroke={s} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" />
      <Line x1={12} y1={7.5} x2={12} y2={12.5} stroke={s} strokeWidth={2} strokeLinecap="round" />
      <Line x1={12} y1={16.5} x2={12.01} y2={16.5} stroke={s} strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

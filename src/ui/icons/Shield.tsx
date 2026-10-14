import React from "react";
import Svg, { Path } from "react-native-svg";

export interface ShieldIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function ShieldIcon({ size = 24, color = "currentColor", stroke }: ShieldIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.5L4 6V11.5C4 16.5 7.5 21 12 22.5C16.5 21 20 16.5 20 11.5V6L12 2.5Z"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

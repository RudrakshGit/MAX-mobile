import React from "react";
import Svg, { Path, Circle } from "react-native-svg";

export interface UsersIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function UsersIcon({ size = 24, color = "currentColor", stroke }: UsersIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={9} cy={7} r={4} stroke={s} strokeWidth={1.8} strokeLinecap="round" />
      <Path
        d="M2 19C2 15.5 5 13 9 13C13 13 16 15.5 16 19"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M16 3.5C17.5 4.5 18.5 6 18.5 8C18.5 10 17.5 11.5 16 12.5"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
      <Path
        d="M18.5 14C20.5 15 22 16.5 22 19"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
      />
    </Svg>
  );
}

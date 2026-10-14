import React from "react";
import Svg, { Path } from "react-native-svg";

export interface CloudIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function CloudIcon({ size = 24, color = "currentColor", stroke }: CloudIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M6.5 19H17.5C20 19 22 17 22 14.5C22 12.2 20.3 10.3 18.1 10.1C17.6 6.8 14.7 4.5 11.5 4.5C8.8 4.5 6.4 6.1 5.4 8.6C3.4 9.1 2 10.9 2 13C2 15.8 4.2 19 6.5 19Z"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

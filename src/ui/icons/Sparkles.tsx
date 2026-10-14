import React from "react";
import Svg, { Path } from "react-native-svg";

export interface SparklesIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function SparklesIcon({ size = 24, color = "currentColor", stroke }: SparklesIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 2.8C12 7 9 10 4.8 10C9 10 12 13 12 17.2C12 13 15 10 19.2 10C15 10 12 7 12 2.8Z"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M18.5 15.5C18.5 17.5 17 19 15 19C17 19 18.5 20.5 18.5 22.5C18.5 20.5 20 19 22 19C20 19 18.5 17.5 18.5 15.5Z"
        stroke={s}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

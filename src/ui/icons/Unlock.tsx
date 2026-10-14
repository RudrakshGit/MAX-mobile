import React from "react";
import Svg, { Path } from "react-native-svg";

export interface UnlockIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function UnlockIcon({ size = 24, color = "currentColor", stroke }: UnlockIconProps) {
  const fill = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 110 156" fill="none">
      <Path
        d="M21.5 56V32a32 32 0 0 1 64 0v12"
        fill="none"
        stroke={fill}
        strokeWidth={14}
        strokeLinecap="round"
      />
      <Path
        d="M8.2 56h93.6c4.5 0 8.2 3.7 8.2 8.2v75.6c0 4.5-3.7 8.2-8.2 8.2H8.2c-4.5 0-8.2-3.7-8.2-8.2V64.2C0 59.7 3.7 56 8.2 56z"
        fill={fill}
      />
    </Svg>
  );
}

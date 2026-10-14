import React from "react";
import Svg, { Path } from "react-native-svg";

export interface UploadIconProps {
  size?: number;
  color?: string;
  stroke?: string;
}

export function UploadIcon({ size = 24, color = "currentColor", stroke }: UploadIconProps) {
  const s = stroke || color;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 15V3m0 0l-4 4m4-4l4 4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
        stroke={s}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

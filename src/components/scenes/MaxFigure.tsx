import React from "react";
import { ClipPath, Defs, Ellipse, G, Path } from "react-native-svg";
import { BODY_PAPER_FILL, BODY_PATH, MaxBlush, MaxBrows, MaxEyes, MaxMouth, WALK_BOTTOM_FILL, WALK_BOTTOM_LINE } from "@/components/max/parts";
import { ARM, FEET, FLANK_FILL, FLANK_LEFT, FLANK_RIGHT } from "@/components/max/rig/geometry";
import type { BrowsKind, EyesKind, MouthKind } from "@/components/max/rig/pose";

// MAX as one still drawing for card pictures (docs/history.md, M16): the same parts as the rig, in a pose, inside
// the scene's own Svg. A full rig per card would be ten drawings per card; a scene stays one drawing plus at most a
// couple of small moving marks.

export interface FigurePose {
  armL?: number;
  armR?: number;
  eyes?: EyesKind;
  mouth?: MouthKind;
  brows?: BrowsKind;
  /** Leaning, degrees, from the feet. */
  lean?: number;
  /** Sitting down: a little lower and wider. */
  sit?: boolean;
  /** Feet hidden (behind a desk or a blanket). */
  noFeet?: boolean;
}

export interface FigureColors {
  ink: string;
  paper: string;
  foot: string;
  blush: string;
}

/** MAX drawn in its own 180×172 space at (x, y), scaled by s. `id` keeps the clip path unique within one Svg. */
export function MaxFigure({ id, x, y, s, pose = {}, c }: { id: string; x: number; y: number; s: number; pose?: FigurePose; c: FigureColors }) {
  const sx = pose.sit ? 1.06 : 1;
  const sy = pose.sit ? 0.93 : 1;
  return (
    <G transform={`translate(${x} ${y}) scale(${s}) translate(90 172) rotate(${pose.lean ?? 0}) scale(${sx} ${sy}) translate(-90 -172)`}>
      <Defs>
        <ClipPath id={`maxHead-${id}`}>
          <Path d="M-10,-10 H190 V96 H-10 Z" />
        </ClipPath>
      </Defs>
      {pose.noFeet ? null : (
        <>
          <Ellipse cx={FEET.left} cy={FEET.y} rx={FEET.rx} ry={FEET.ry} fill={c.foot} />
          <Ellipse cx={FEET.right} cy={FEET.y} rx={FEET.rx} ry={FEET.ry} fill={c.foot} />
        </>
      )}
      <Path d={FLANK_FILL} fill={c.paper} />
      <G clipPath={`url(#maxHead-${id})`}>
        <Path d={BODY_PAPER_FILL} fill={c.paper} />
        <Path d={BODY_PATH} fill={c.ink} />
      </G>
      <Path d={WALK_BOTTOM_LINE} fill="none" stroke={c.paper} strokeWidth={8} strokeLinecap="round" />
      <Path d={WALK_BOTTOM_FILL} fill={c.paper} />
      <Path d={WALK_BOTTOM_LINE} fill="none" stroke={c.ink} strokeWidth={3.6} strokeLinecap="round" />
      <Path d={FLANK_LEFT} fill="none" stroke={c.ink} strokeWidth={3.6} strokeLinecap="round" />
      <Path d={FLANK_RIGHT} fill="none" stroke={c.ink} strokeWidth={3.6} strokeLinecap="round" />
      <MaxBlush ink={c.blush} visible={pose.eyes !== "sleep"} opacity={0.75} />
      <MaxBrows kind={pose.brows ?? "default"} ink={c.ink} />
      <MaxEyes kind={pose.eyes ?? "default"} ink={c.ink} />
      <MaxMouth kind={pose.mouth ?? "smile"} ink={c.ink} />
      <Arm side="left" rot={pose.armL ?? 0} c={c} />
      <Arm side="right" rot={pose.armR ?? 0} c={c} />
    </G>
  );
}

function Arm({ side, rot, c }: { side: "left" | "right"; rot: number; c: FigureColors }) {
  const a = ARM[side];
  return (
    <G transform={`rotate(${rot} ${a.pivot.x} ${a.pivot.y})`}>
      <Path d={a.fill} fill={c.paper} />
      <Path d={Math.abs(rot) > 15 ? a.full : a.rest} fill="none" stroke={c.ink} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
    </G>
  );
}

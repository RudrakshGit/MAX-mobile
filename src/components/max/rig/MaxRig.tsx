// MAX drawn as a rig: every part is its own small drawing on its own layer, moved only by view transforms on the
// UI thread, so a blink or a wave never redraws the rest of MAX (react-native-svg redraws a whole drawing on any
// animated prop change). docs/plan/M16-motion-cards-ia.md, decisions 2 and 4a.
import React, { memo } from "react";
import { View } from "react-native";
import Animated, { useAnimatedStyle, type SharedValue } from "react-native-reanimated";
import Svg, { ClipPath, Defs, Ellipse, G, Path } from "react-native-svg";
import { BODY_PAPER_FILL, BODY_PATH, MaxBlush, MaxBrows, MaxEyes, MaxMouth, WALK_BOTTOM_FILL, WALK_BOTTOM_LINE } from "../parts";
import { ARM, EYE_CENTRE, FEET, FLANK_FILL, FLANK_LEFT, FLANK_RIGHT, GROUND, VIEW, layer } from "./geometry";
import { WALK } from "./motion";
import type { Face, Marks } from "./pose";
import type { RigValues } from "./useRigPlayer";
import { RigMarks } from "./Marks";

/** One walk cycle (two steps) moves each planted foot back 4 × STRIDE drawing units. */
export const STRIDE = 12;
const LIFT = 5;
const TOE = 12;
const ARM_SWING = 7;
/** Ground speed of a planted foot in dp per second: move MAX at this speed and its feet don't slide. */
export const walkSpeed = (size: number, cycleMs: number) => (4 * STRIDE * (size / 180) * 1000) / cycleMs;

export interface RigProps {
  size: number;
  values: RigValues;
  face: Face;
  marks: Marks;
  ink: string;
  paper: string;
  foot: string;
  markInk: string;
  blush: boolean;
  /** MAX's cheeks (design sheet pink). */
  blushColor: string;
  /** 0→1 per walk cycle while walking; undefined when standing. */
  walkClock?: SharedValue<number>;
  /** Breathing along with the student: 0 = empty, 1 = full. */
  breath?: SharedValue<number>;
  /** Pauses the comic marks (off screen, reduce motion). */
  still: boolean;
}

export function MaxRig(p: RigProps) {
  const { size, values: v, walkClock, breath } = p;
  const width = size;
  const height = Math.round(size * (172 / 180));
  const k = size / 180;
  const walking = !!walkClock;

  // Whole MAX: moves, leans and squashes from the feet; walking bob and breathing along are added here.
  const body = useAnimatedStyle(() => {
    let sx = v.bsx.value;
    let sy = v.bsy.value;
    let rot = v.br.value;
    let ty = v.by.value;
    if (walkClock) {
      const ws = Math.sin(walkClock.value * Math.PI * 2);
      ty += -WALK.bob * Math.abs(ws);
      rot += WALK.lean + WALK.sway * ws;
    }
    if (breath) {
      const b = Math.min(1, Math.max(0, breath.value));
      sx *= 1 + 0.03 * b;
      sy *= 1 + 0.07 * b;
    }
    return {
      transform: [
        { translateX: v.bx.value * k },
        { translateY: ty * k + height / 2 },
        { rotate: `${rot}deg` },
        { scaleX: sx },
        { scaleY: sy },
        { translateY: -height / 2 },
      ],
    };
  });

  // Lying down, the marks layer turns back upright around the head, so Zs still drift up, not sideways.
  const upright = useAnimatedStyle(() => {
    const r = v.br.value;
    const c = r * Math.min(1, Math.max(0, (Math.abs(r) - 20) / 30));
    const px = 140 * k - width / 2;
    const py = 40 * k - height / 2;
    return { transform: [{ translateX: px }, { translateY: py }, { rotate: `${-c}deg` }, { translateX: -px }, { translateY: -py }] };
  });

  const arms = (
    <>
      <Arm side="left" {...p} />
      <Arm side="right" {...p} />
    </>
  );

  return (
    <Animated.View pointerEvents="none" style={[{ width, height }, body]}>
      <Foot side="left" {...p} />
      <Foot side="right" {...p} />
      {walking ? <Arm side="left" {...p} /> : null}
      <BodyLayer size={size} ink={p.ink} paper={p.paper} blush={p.blush} blushColor={p.blushColor} />
      <Eyes {...p} />
      <Brows {...p} />
      <Mouth {...p} />
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width, height }, upright]}>
        <RigMarks size={size} marks={p.marks} ink={p.markInk} paper={p.paper} still={p.still} />
      </Animated.View>
      {walking ? <Arm side="right" {...p} /> : arms}
    </Animated.View>
  );
}

const BodyLayer = memo(function BodyLayer({ size, ink, paper, blush, blushColor }: { size: number; ink: string; paper: string; blush: boolean; blushColor: string }) {
  const L = layer(size);
  return (
    <View pointerEvents="none" style={L.style}>
      <Svg width={L.style.width} height={L.style.height} viewBox={VIEW}>
        <Defs>
          <ClipPath id="maxRigHead">
            {/* the traced head and shoulders; below them the arms, flanks and round bottom take over */}
            <Path d="M-10,-10 H190 V96 H-10 Z" />
          </ClipPath>
        </Defs>
        <Path d={FLANK_FILL} fill={paper} />
        <G clipPath="url(#maxRigHead)">
          <Path d={BODY_PAPER_FILL} fill={paper} />
          <Path d={BODY_PATH} fill={ink} />
        </G>
        <Path d={WALK_BOTTOM_LINE} fill="none" stroke={paper} strokeWidth={8} strokeLinecap="round" />
        <Path d={WALK_BOTTOM_FILL} fill={paper} />
        <Path d={WALK_BOTTOM_LINE} fill="none" stroke={ink} strokeWidth={3.6} strokeLinecap="round" />
        <Path d={FLANK_LEFT} fill="none" stroke={ink} strokeWidth={3.6} strokeLinecap="round" />
        <Path d={FLANK_RIGHT} fill="none" stroke={ink} strokeWidth={3.6} strokeLinecap="round" />
        <MaxBlush ink={blushColor} visible={blush} opacity={0.75} />
      </Svg>
    </View>
  );
});

function Foot({ side, size, values: v, walkClock, foot, paper }: RigProps & { side: "left" | "right" }) {
  const L = layer(size);
  const x = FEET[side];
  const { dx, dy } = L.pivot(x, FEET.y);
  const k = L.k;
  const offset = side === "left" ? 0 : Math.PI;
  const style = useAnimatedStyle(() => {
    let sx = side === "left" ? v.flx.value : v.frx.value;
    let sy = side === "left" ? v.fly.value : v.fry.value;
    let angle = 0;
    if (walkClock) {
      const ph = walkClock.value * Math.PI * 2 + offset;
      const swing = Math.sin(ph); // > 0 while this foot steps forward in the air
      const p = ((ph % (Math.PI * 2)) + Math.PI * 2) % (Math.PI * 2);
      // air: eases from behind to in front; ground: straight back at a constant speed, so a planted foot doesn't skid
      sx += (p < Math.PI ? -Math.cos(p) : 1 - (2 * (p - Math.PI)) / Math.PI) * STRIDE;
      sy += -LIFT * Math.max(0, swing);
      angle = -TOE * swing;
    }
    return {
      transform: [{ translateX: sx * k + dx }, { translateY: sy * k + dy }, { rotate: `${angle}deg` }, { translateX: -dx }, { translateY: -dy }],
    };
  });
  return (
    <Animated.View pointerEvents="none" style={[L.style, style]}>
      <Svg width={L.style.width} height={L.style.height} viewBox={VIEW}>
        {/* a thin paper rim keeps the charcoal foot readable on the dark theme */}
        <Ellipse cx={x} cy={FEET.y} rx={FEET.rx + 1.5} ry={FEET.ry + 1.5} fill={paper} />
        <Ellipse cx={x} cy={FEET.y} rx={FEET.rx} ry={FEET.ry} fill={foot} />
      </Svg>
    </Animated.View>
  );
}

function Arm({ side, size, values: v, walkClock, breath, ink, paper }: RigProps & { side: "left" | "right" }) {
  const L = layer(size);
  const right = side === "right";
  const art = ARM[side];
  const { dx, dy } = L.pivot(art.pivot.x, art.pivot.y);
  const style = useAnimatedStyle(() => {
    let rot = right ? v.arr.value : v.alr.value;
    if (walkClock) rot += ARM_SWING * Math.sin(walkClock.value * Math.PI * 2) * (right ? 1 : -1);
    if (breath) rot += (right ? -10 : 10) * Math.min(1, Math.max(0, breath.value));
    return { transform: [{ translateX: dx }, { translateY: dy }, { rotate: `${rot}deg` }, { translateX: -dx }, { translateY: -dy }] };
  });
  // the whole outline appears as the arm leaves the body (10°–25° lifted)
  const full = useAnimatedStyle(() => {
    const rot = Math.abs(right ? v.arr.value : v.alr.value);
    return { opacity: Math.min(1, Math.max(0, (rot - 10) / 15)) };
  });
  return (
    <Animated.View pointerEvents="none" style={[L.style, style]}>
      <ArmArt size={size} side={side} part="rest" ink={ink} paper={paper} />
      <Animated.View pointerEvents="none" style={[{ position: "absolute", left: 0, top: 0, width: L.style.width, height: L.style.height }, full]}>
        <ArmArt size={size} side={side} part="full" ink={ink} paper={paper} />
      </Animated.View>
    </Animated.View>
  );
}
const ArmArt = memo(function ArmArt({ size, side, part, ink, paper }: { size: number; side: "left" | "right"; part: "rest" | "full"; ink: string; paper: string }) {
  const L = layer(size);
  const art = ARM[side];
  return (
    <Svg width={L.style.width} height={L.style.height} viewBox={VIEW}>
      {part === "rest" ? <Path d={art.fill} fill={paper} /> : null}
      <Path d={part === "rest" ? art.rest : art.full} fill="none" stroke={ink} strokeWidth={3.6} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
});

function Eyes({ size, values: v, face, ink }: RigProps) {
  const L = layer(size);
  const k = L.k;
  const { dy } = L.pivot(EYE_CENTRE.x, EYE_CENTRE.y);
  const style = useAnimatedStyle(() => ({
    transform: [
      { translateX: (v.fx.value + v.gx.value) * k },
      { translateY: (v.fy.value + v.gy.value) * k + dy },
      { scaleY: 1 - 0.88 * v.lid.value },
      { translateY: -dy },
    ],
  }));
  return (
    <Animated.View pointerEvents="none" style={[L.style, style]}>
      <EyesArt size={size} kind={face.eyes} ink={ink} />
    </Animated.View>
  );
}
const EyesArt = memo(function EyesArt({ size, kind, ink }: { size: number; kind: Face["eyes"]; ink: string }) {
  const L = layer(size);
  return (
    <Svg width={L.style.width} height={L.style.height} viewBox={VIEW}>
      <MaxEyes kind={kind} ink={ink} />
    </Svg>
  );
});

function Brows({ size, values: v, face, ink }: RigProps) {
  const L = layer(size);
  const k = L.k;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: 0.8 * (v.fx.value + v.gx.value) * k }, { translateY: 0.8 * (v.fy.value + v.gy.value) * k }],
  }));
  if (face.brows === "default") return null;
  return (
    <Animated.View pointerEvents="none" style={[L.style, style]}>
      <BrowsArt size={size} kind={face.brows} ink={ink} />
    </Animated.View>
  );
}
const BrowsArt = memo(function BrowsArt({ size, kind, ink }: { size: number; kind: Face["brows"]; ink: string }) {
  const L = layer(size);
  return (
    <Svg width={L.style.width} height={L.style.height} viewBox={VIEW}>
      <MaxBrows kind={kind} ink={ink} />
    </Svg>
  );
});

function Mouth({ size, values: v, face, ink }: RigProps) {
  const L = layer(size);
  const k = L.k;
  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: 0.6 * (v.fx.value + v.gx.value) * k }, { translateY: 0.6 * (v.fy.value + v.gy.value) * k }],
  }));
  return (
    <Animated.View pointerEvents="none" style={[L.style, style]}>
      <MouthArt size={size} kind={face.mouth} ink={ink} />
    </Animated.View>
  );
}
const MouthArt = memo(function MouthArt({ size, kind, ink }: { size: number; kind: Face["mouth"]; ink: string }) {
  const L = layer(size);
  return (
    <Svg width={L.style.width} height={L.style.height} viewBox={VIEW}>
      <MaxMouth kind={kind} ink={ink} />
    </Svg>
  );
});

export { GROUND };
